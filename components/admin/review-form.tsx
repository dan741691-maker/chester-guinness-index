'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { RatingBadge } from '@/components/pub/rating-badge';
import { SCORE_CATEGORIES } from '@/lib/constants';
import { getRatingTier, formatScore } from '@/lib/utils';
import type { Pub, Review } from '@/types';

interface ReviewFormProps {
  pubs: Pub[];
  review?: Review;
  defaultPubId?: string;
  onSuccess?: () => void;
  successRedirectUrl?: string;
}

const DEFAULT_SCORES = {
  pub_look_cleanliness: 5.0,
  staff: 5.0,
  glass_pour: 5.0,
  taste_quality: 5.0,
  price_score: 5.0,
};

function extractError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export function ReviewForm({
  pubs,
  review,
  defaultPubId,
  onSuccess,
  successRedirectUrl,
}: ReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const addAnotherRef = useRef(false);

  const [pubId, setPubId] = useState(review?.pub_id ?? defaultPubId ?? '');
  const [price, setPrice] = useState(review?.guinness_price_gbp?.toString() ?? '');
  const [notes, setNotes] = useState(review?.notes ?? '');
  const [verdict, setVerdict] = useState(review?.verdict ?? '');
  const [visitedAt, setVisitedAt] = useState(review?.visited_at ?? '');
  const [isOfficial, setIsOfficial] = useState(review?.is_official ?? true);
  const [isPublished, setIsPublished] = useState(review?.is_published ?? true);

  const [imageUrl, setImageUrl] = useState<string | null>(review?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [scores, setScores] = useState({
    pub_look_cleanliness:
      review?.pub_look_cleanliness ?? DEFAULT_SCORES.pub_look_cleanliness,
    staff: review?.staff ?? DEFAULT_SCORES.staff,
    glass_pour: review?.glass_pour ?? DEFAULT_SCORES.glass_pour,
    taste_quality: review?.taste_quality ?? DEFAULT_SCORES.taste_quality,
    price_score: review?.price_score ?? DEFAULT_SCORES.price_score,
  });

  const total = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) * 10) / 10;
  const tier = useMemo(() => getRatingTier(total), [total]);

  const setScore = useCallback((key: keyof typeof scores, value: number) => {
    const rounded = Math.round(value * 10) / 10;
    setScores((s) => ({ ...s, [key]: Math.min(10, Math.max(0, rounded)) }));
  }, []);

  // Auto-calculate price score: £7.00 = 6.0, every 10p cheaper = +0.1, every 10p dearer = -0.1
  function calcPriceScore(priceStr: string): number | null {
    const p = parseFloat(priceStr);
    if (isNaN(p) || p <= 0) return null;
    const raw = 13.0 - p; // equivalent to 6.0 + (7.0 - p) / 0.10 * 0.1
    return Math.round(Math.max(1.0, Math.min(10.0, raw)) * 10) / 10;
  }

  function handlePriceChange(val: string) {
    setPrice(val);
    const calculated = calcPriceScore(val);
    if (calculated !== null) {
      setScore('price_score', calculated);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadReviewImage(reviewId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `reviews/${reviewId}/${Date.now()}.${ext}`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('path', path);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Image upload failed');
    return json.url as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const addAnother = addAnotherRef.current;
    addAnotherRef.current = false;

    if (!pubId) {
      toast({ title: 'Select a pub first', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = imageUrl;
      const selectedPub = pubs.find((p) => p.id === pubId);

      if (review) {
        // ── Update existing review ──
        if (imageFile) {
          try {
            finalImageUrl = await uploadReviewImage(review.id, imageFile);
          } catch (uploadErr) {
            throw new Error('Photo upload failed: ' + extractError(uploadErr));
          }
        }

        console.log('[ReviewForm update] image_url being saved:', finalImageUrl);

        const res = await fetch(`/api/admin/reviews/${review.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...scores,
            guinness_price_gbp: price ? parseFloat(price) : null,
            notes: notes.trim() || null,
            verdict: verdict.trim() || null,
            visited_at: visitedAt || null,
            is_official: isOfficial,
            is_published: isPublished,
            image_url: finalImageUrl,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error('Review update failed: ' + (json.error ?? `HTTP ${res.status}`));
        }

        toast({ title: 'Review updated', variant: 'success' });
      } else {
        // ── Create new review ──
        const res = await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pub_id: pubId,
            ...scores,
            guinness_price_gbp: price ? parseFloat(price) : null,
            notes: notes.trim() || null,
            verdict: verdict.trim() || null,
            visited_at: visitedAt || null,
            is_official: isOfficial,
            is_published: isPublished,
            image_url: null,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error('Review create failed: ' + (json.error ?? `HTTP ${res.status}`));
        }

        const newReviewId = json.data?.id as string | undefined;
        console.log('[ReviewForm create] newReviewId:', newReviewId, 'imageFile:', !!imageFile);

        if (!newReviewId) {
          throw new Error('Review create failed: no id returned from server');
        }

        // Upload image using the real review ID, then PATCH to persist the URL
        if (imageFile) {
          try {
            finalImageUrl = await uploadReviewImage(newReviewId, imageFile);
          } catch (uploadErr) {
            throw new Error('Photo upload failed: ' + extractError(uploadErr));
          }

          console.log('[ReviewForm create] uploading pint photo, url:', finalImageUrl);

          const patchRes = await fetch(`/api/admin/reviews/${newReviewId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: finalImageUrl }),
          });
          const patchJson = await patchRes.json();
          if (!patchRes.ok) {
            throw new Error('Photo save failed: ' + (patchJson.error ?? `HTTP ${patchRes.status}`));
          }
        }

        toast({ title: 'Review saved', variant: 'success' });
      }

      // Flush ISR cache (fire-and-forget)
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: selectedPub?.slug }),
      }).catch(() => {});

      onSuccess?.();

      if (addAnother) {
        // Redirect to new review for same pub
        router.push(`/admin/reviews/new${pubId ? `?pub=${pubId}` : ''}`);
      } else if (successRedirectUrl) {
        router.push(successRedirectUrl);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      console.error('[ReviewForm save]', err);
      toast({
        title: 'Save failed',
        description: extractError(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const displayImage = imagePreview ?? imageUrl;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Live score strip */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface-2 sticky top-0 z-10">
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-serif text-4xl font-bold leading-none tabular-nums"
            style={{ color: tier.color }}
          >
            {formatScore(total)}
          </span>
          <span className="text-cream-muted/40 text-sm">/50</span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <RatingBadge score={total} size="lg" />
          <p className="text-[10px] uppercase tracking-widest text-cream-muted/30">live score</p>
        </div>
      </div>

      {/* Pub selection (new review only) */}
      {!review && (
        <div className="space-y-1.5">
          <Label>Pub *</Label>
          <Select value={pubId} onValueChange={setPubId}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select a pub…" />
            </SelectTrigger>
            <SelectContent>
              {pubs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Score inputs */}
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-cream-muted/30">Scores (0–10)</p>
        {SCORE_CATEGORIES.map(({ key, label, icon }) => {
          const isPrice = key === 'price_score';
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={key} className="flex items-center gap-2 text-sm">
                  <span className="text-base leading-none">{icon}</span>
                  {label}
                </Label>
                {!isPrice && (
                  <span
                    className="text-xl font-bold font-serif tabular-nums"
                    style={{ color: tier.color }}
                  >
                    {formatScore(scores[key])}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScore(key, scores[key] - 0.1)}
                  className="w-12 h-12 rounded-full border border-border/80 text-cream-muted hover:border-gold/50 hover:text-gold active:bg-gold/10 transition-colors flex items-center justify-center text-xl font-bold flex-shrink-0"
                  aria-label={`Decrease ${label}`}
                >
                  −
                </button>
                <input
                  id={key}
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={scores[key]}
                  onChange={(e) => setScore(key, parseFloat(e.target.value))}
                  className="flex-1 h-3 appearance-none bg-surface-3 rounded-full accent-gold cursor-pointer"
                />
                {isPrice && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex items-center rounded-md border border-border/80 bg-surface-2 overflow-hidden h-9 w-[82px]">
                      <span className="pl-2 pr-1 text-sm text-cream-muted/60 select-none">£</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        placeholder="7.00"
                        className="w-full bg-transparent text-sm text-cream placeholder-cream-muted/30 focus:outline-none pr-1 tabular-nums"
                        aria-label="Guinness price in pounds"
                      />
                    </div>
                    <span
                      className="text-xl font-bold font-serif tabular-nums w-10 text-right"
                      style={{ color: tier.color }}
                    >
                      {formatScore(scores[key])}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setScore(key, scores[key] + 0.1)}
                  className="w-12 h-12 rounded-full border border-border/80 text-cream-muted hover:border-gold/50 hover:text-gold active:bg-gold/10 transition-colors flex items-center justify-center text-xl font-bold flex-shrink-0"
                  aria-label={`Increase ${label}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Date visited */}
      <div className="space-y-1.5">
        <Label htmlFor="visited_at">Date visited</Label>
        <Input
          id="visited_at"
          type="date"
          value={visitedAt}
          onChange={(e) => setVisitedAt(e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the experience…"
          rows={3}
          className="text-base resize-none"
        />
      </div>

      {/* Verdict */}
      <div className="space-y-1.5">
        <Label htmlFor="verdict">Verdict</Label>
        <Textarea
          id="verdict"
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          placeholder="One-line verdict…"
          rows={2}
          className="text-base resize-none"
        />
      </div>

      {/* Pint photo */}
      <div className="space-y-1.5">
        <Label>Pint Photo</Label>
        {displayImage ? (
          <div className="relative rounded-lg overflow-hidden h-40 bg-surface-2">
            <Image
              src={displayImage}
              alt="Review"
              fill
              className="object-cover"
              unoptimized={!!imagePreview}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-lg border border-dashed border-border hover:border-gold/40 text-cream-muted/40 hover:text-cream-muted transition-colors bg-surface-2"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Upload pint photo</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Official toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2">
        <div>
          <p className="text-sm font-medium text-cream">Official review</p>
          <p className="text-xs text-cream-muted/50 mt-0.5">
            Updates pub score · generates social draft
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isOfficial}
          onClick={() => setIsOfficial((v) => !v)}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            isOfficial ? 'bg-gold' : 'bg-surface-3'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isOfficial ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Published toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2">
        <div>
          <p className="text-sm font-medium text-cream">Published</p>
          <p className="text-xs text-cream-muted/50 mt-0.5">Visible on the public pub page</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublished}
          onClick={() => setIsPublished((v) => !v)}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            isPublished ? 'bg-gold' : 'bg-surface-3'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isPublished ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        {successRedirectUrl && (
          <Button
            type="button"
            variant="ghost"
            size="xl"
            className="flex-1"
            onClick={() => router.push(successRedirectUrl)}
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
        )}
        {!review && (
          <Button
            type="button"
            variant="outline"
            size="xl"
            className="flex-1"
            disabled={loading}
            onClick={() => {
              addAnotherRef.current = true;
              formRef.current?.requestSubmit();
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save & Add Another
          </Button>
        )}
        <Button type="submit" size="xl" className="flex-1" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {loading ? 'Saving…' : review ? 'Update Review' : 'Save Review'}
        </Button>
      </div>
    </form>
  );
}
