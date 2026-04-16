'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Upload,
  X,
  RefreshCw,
  Search,
  Link2,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { slugify } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import type { Pub } from '@/types';

interface PubFormProps {
  pub?: Pub;
  onSuccess?: () => void;
  successRedirectUrl?: string;
}

function extractError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat?: number;
  lng?: number;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  fullFormattedAddress?: string;
  lat?: number | null;
  lng?: number | null;
  postcode?: string | null;
  sublocality?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  googleUrl?: string | null;
  photoRef?: string | null;
  error?: string;
  hint?: string;
}

export function PubForm({ pub, onSuccess, successRedirectUrl }: PubFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!pub?.slug);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const addAnotherRef = useRef(false);

  // Google autofill state
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [autofillMsg, setAutofillMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [googlePhotoRef, setGooglePhotoRef] = useState<string | null>(null);
  const [googlePhotoLoading, setGooglePhotoLoading] = useState(false);

  // Nearby places state
  interface NearbyResult {
    placeId: string;
    name: string;
    address: string;
    lat?: number;
    lng?: number;
    distanceMetres: number | null;
  }
  const [nearbyResults, setNearbyResults] = useState<NearbyResult[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const [form, setForm] = useState({
    name: pub?.name ?? '',
    slug: pub?.slug ?? '',
    address: pub?.address ?? '',
    postcode: pub?.postcode ?? '',
    area: pub?.area ?? '',
    lat: pub?.lat?.toString() ?? '',
    lng: pub?.lng?.toString() ?? '',
    guinness_price_gbp: pub?.guinness_price_gbp?.toString() ?? '',
    description: pub?.description ?? '',
  });

  const [isActive, setIsActive] = useState(pub?.is_active ?? true);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(pub?.hero_image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Auto-generate slug from name when not manually edited
  useEffect(() => {
    if (!slugManuallyEdited && form.name) {
      setForm((f) => ({ ...f, slug: slugify(form.name) }));
    }
  }, [form.name, slugManuallyEdited]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManuallyEdited(true);
    setSlugError(null);
    set('slug', slugify(e.target.value));
  }

  function resetSlug() {
    setSlugManuallyEdited(false);
    setSlugError(null);
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
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
    setHeroImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ---- Google autofill ----

  function applyAutofill(details: PlaceDetails) {
    const filled: string[] = [];
    const next: Partial<typeof form> = {};

    if (details.name) {
      next.name = details.name;
      filled.push('name');
    }
    if (details.formattedAddress) {
      next.address = details.formattedAddress;
      filled.push('address');
    }
    if (details.lat != null) {
      next.lat = String(details.lat);
      filled.push('latitude');
    }
    if (details.lng != null) {
      next.lng = String(details.lng);
      filled.push('longitude');
    }
    if (details.postcode) {
      next.postcode = details.postcode;
      filled.push('postcode');
    }

    // Populate area: prefer sublocality/neighbourhood (e.g. Hoole, Temple Bar)
    // over city (e.g. Chester, Dublin) — works for both local and international pubs
    const inferredArea = details.sublocality || details.city;
    if (inferredArea) {
      next.area = inferredArea;
      filled.push('area');
    }

    setForm((f) => ({ ...f, ...next }));
    if (details.name) setSlugManuallyEdited(false); // re-derive slug from name
    setSearchResults([]);
    setGoogleQuery('');
    setGoogleUrl('');
    setGooglePhotoRef(details.photoRef ?? null);
    setAutofillMsg({
      type: 'success',
      text: `Auto-filled: ${filled.join(', ')}${details.photoRef ? ' · Google photo available below' : ''}. Review and adjust before saving.`,
    });
  }

  async function useGooglePhoto() {
    if (!googlePhotoRef) return;
    setGooglePhotoLoading(true);
    try {
      const res = await fetch(`/api/admin/google-photo?ref=${encodeURIComponent(googlePhotoRef)}`);
      if (!res.ok) throw new Error('Failed to fetch photo');
      const blob = await res.blob();
      const file = new File([blob], 'google-photo.jpg', { type: blob.type || 'image/jpeg' });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(blob));
      setGooglePhotoRef(null);
    } catch {
      toast({ title: 'Could not load Google photo', variant: 'destructive' });
    } finally {
      setGooglePhotoLoading(false);
    }
  }

  async function handleGoogleSearch() {
    const q = googleQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchResults([]);
    setAutofillMsg(null);
    try {
      const res = await fetch(
        `/api/admin/google-place?type=search&q=${encodeURIComponent(q)}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setAutofillMsg({
          type: 'error',
          text: json.hint ?? json.error ?? 'Search failed',
        });
        return;
      }
      if (!json.results?.length) {
        setAutofillMsg({ type: 'error', text: 'No results found. Try a more specific name.' });
        return;
      }
      setSearchResults(json.results);
    } catch {
      setAutofillMsg({ type: 'error', text: 'Search failed. Check your connection.' });
    } finally {
      setSearchLoading(false);
    }
  }

  async function applyPlaceDetails(placeId: string) {
    setSearchLoading(true);
    setAutofillMsg(null);
    try {
      const res = await fetch(
        `/api/admin/google-place?type=details&placeId=${encodeURIComponent(placeId)}`,
      );
      const json: PlaceDetails = await res.json();
      if (!res.ok) {
        setAutofillMsg({
          type: 'error',
          text: json.hint ?? json.error ?? 'Failed to get place details',
        });
        return;
      }
      applyAutofill(json);
    } catch {
      setAutofillMsg({ type: 'error', text: 'Failed to get place details.' });
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleUrlParse() {
    const url = googleUrl.trim();
    if (!url) return;
    setAutofillMsg(null);
    setSearchLoading(true);

    try {
      // Delegate all URL resolution to the server — handles shortened share links
      // (share.google/..., maps.app.goo.gl/..., goo.gl/...) and full Maps URLs alike.
      const res = await fetch(
        `/api/admin/google-place?type=resolve-url&url=${encodeURIComponent(url)}`,
      );
      const json = await res.json();

      if (!res.ok) {
        setAutofillMsg({
          type: 'error',
          text: json.hint ?? json.error ?? 'Could not resolve this link. Try searching by pub name instead.',
        });
        return;
      }

      // Server returned full place details → apply autofill
      if (json.name) {
        applyAutofill(json as PlaceDetails);
        return;
      }

      // Server returned coords only
      if (json.lat != null && json.lng != null) {
        setForm((f) => ({ ...f, lat: String(json.lat), lng: String(json.lng) }));
        setGoogleUrl('');
        setAutofillMsg({
          type: 'success',
          text: `Coordinates filled: ${(json.lat as number).toFixed(6)}, ${(json.lng as number).toFixed(6)}. Fill remaining fields manually.`,
        });
      }
    } catch {
      setAutofillMsg({ type: 'error', text: 'Failed to parse link. Check your connection.' });
    } finally {
      setSearchLoading(false);
    }
  }

  // ---- Nearby places ----

  async function handleNearby() {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported by your browser', variant: 'destructive' });
      return;
    }
    setNearbyLoading(true);
    setNearbyResults([]);
    setAutofillMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `/api/admin/google-place?type=nearby&lat=${latitude}&lng=${longitude}`,
          );
          const json = await res.json();
          if (!res.ok) {
            toast({
              title: json.hint ?? json.error ?? 'Could not find nearby pubs',
              variant: 'destructive',
            });
            return;
          }
          if (!json.results?.length) {
            setAutofillMsg({ type: 'error', text: 'No pubs found nearby — try searching manually' });
            return;
          }
          setNearbyResults(json.results);
          trackEvent('nearby_search', {
            latitude: latitude,
            longitude: longitude,
            results_count: json.results.length,
          });
        } catch {
          toast({ title: 'Failed to find nearby pubs', variant: 'destructive' });
        } finally {
          setNearbyLoading(false);
        }
      },
      () => {
        setNearbyLoading(false);
        toast({
          title: 'Location access denied — please search manually',
          variant: 'destructive',
        });
      },
      { timeout: 10000 },
    );
  }

  // ---- Image upload ----

  async function uploadImage(pubId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${pubId}/hero.${ext}`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('path', path);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Image upload failed');
    return json.url as string;
  }

  // ---- Save ----

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const addAnother = addAnotherRef.current;
    addAnotherRef.current = false;

    if (!form.slug) {
      toast({ title: 'Slug is required', variant: 'destructive' });
      return;
    }
    if (!form.area) {
      toast({ title: 'Please select an area', variant: 'destructive' });
      return;
    }
    if (!form.lat || !form.lng || isNaN(parseFloat(form.lat)) || isNaN(parseFloat(form.lng))) {
      toast({ title: 'Valid latitude and longitude are required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setSlugError(null);

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        address: form.address,
        postcode: form.postcode.trim() || null,
        area: form.area,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        guinness_price_gbp: form.guinness_price_gbp
          ? parseFloat(form.guinness_price_gbp)
          : null,
        description: form.description.trim() || null,
        hero_image_url: heroImageUrl,
        is_active: isActive,
      };

      let pubId: string;

      if (pub) {
        const res = await fetch(`/api/admin/pubs/${pub.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          if (json.code === '23505') {
            setSlugError('This slug is already in use. Please choose a different one.');
            return;
          }
          throw new Error(json.error ?? `Save failed (HTTP ${res.status})`);
        }
        pubId = pub.id;
        toast({ title: 'Pub updated', variant: 'success' });
      } else {
        const res = await fetch('/api/admin/pubs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          if (json.code === '23505') {
            setSlugError('This slug is already in use. Please choose a different one.');
            return;
          }
          throw new Error(json.error ?? `Save failed (HTTP ${res.status})`);
        }
        pubId = json.data.id as string;
        toast({ title: 'Pub created', variant: 'success' });
      }

      // Upload hero image if one was selected
      if (imageFile) {
        try {
          const url = await uploadImage(pubId, imageFile);
          await fetch(`/api/admin/pubs/${pubId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hero_image_url: url }),
          });
        } catch (imgErr) {
          console.error('[PubForm] image upload failed:', imgErr);
          toast({
            title: 'Pub saved — but image upload failed',
            description: extractError(imgErr),
            variant: 'destructive',
          });
        }
      }

      // Flush ISR cache (fire-and-forget)
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: form.slug }),
      }).catch(() => {});

      onSuccess?.();

      if (addAnother) {
        router.push('/admin/pubs/new');
      } else if (successRedirectUrl) {
        router.push(successRedirectUrl);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      console.error('[PubForm save]', err);
      toast({
        title: 'Save failed',
        description: extractError(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const displayImage = imagePreview ?? heroImageUrl;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 pb-4">
      {/* ── Google autofill ── */}
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-gold/60 font-medium">
            Find via Google — auto-fill form
          </p>
          {/* Pubs Near Me */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNearby}
            disabled={nearbyLoading}
            className="h-8 px-3 shrink-0 border-gold/40 text-gold hover:bg-gold/10 text-xs gap-1.5"
          >
            {nearbyLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MapPin className="h-3.5 w-3.5" />
            )}
            {nearbyLoading ? 'Finding pubs…' : 'Pubs Near Me'}
          </Button>
        </div>

        {/* Nearby results */}
        {nearbyResults.length > 0 && (
          <div>
            <p className="text-[10px] text-cream-muted/50 mb-1.5 uppercase tracking-widest">
              Nearby pubs — tap to auto-fill
            </p>
            <ul className="rounded-lg overflow-hidden border border-border max-h-64 overflow-y-auto">
              {nearbyResults.map((r) => (
                <li key={r.placeId}>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('nearby_pub_selected', {
                        pub_name: r.name,
                        metadata: { placeId: r.placeId },
                      });
                      applyPlaceDetails(r.placeId);
                      setNearbyResults([]);
                    }}
                    disabled={searchLoading}
                    className="w-full text-left px-3 py-2.5 bg-surface-2 hover:bg-gold/10 transition-colors border-b border-border/50 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-cream truncate">{r.name}</p>
                        <p className="text-xs text-cream-muted/50 truncate mt-0.5">{r.address}</p>
                      </div>
                      {r.distanceMetres !== null && (
                        <span className="text-xs text-gold/70 shrink-0 font-mono">
                          {r.distanceMetres < 1000
                            ? `${r.distanceMetres}m`
                            : `${(r.distanceMetres / 1000).toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Name search */}
        <div className="flex gap-2">
          <Input
            value={googleQuery}
            onChange={(e) => setGoogleQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGoogleSearch();
              }
            }}
            placeholder="Search pub name…"
            className="h-10 text-sm flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGoogleSearch}
            disabled={searchLoading || !googleQuery.trim()}
            className="h-10 px-4 shrink-0 border-gold/30 text-gold hover:bg-gold/10"
          >
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <ul className="rounded-lg overflow-hidden border border-border">
            {searchResults.map((r) => (
              <li key={r.placeId}>
                <button
                  type="button"
                  onClick={() => applyPlaceDetails(r.placeId)}
                  disabled={searchLoading}
                  className="w-full text-left px-3 py-2.5 bg-surface-2 hover:bg-gold/10 transition-colors border-b border-border/50 last:border-b-0"
                >
                  <p className="text-sm font-medium text-cream truncate">{r.name}</p>
                  <p className="text-xs text-cream-muted/50 truncate mt-0.5">
                    {r.formattedAddress}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* URL paste */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream-muted/40 pointer-events-none" />
            <Input
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              placeholder="Paste Google Maps or share link…"
              className="h-10 text-sm pl-8"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUrlParse}
            disabled={searchLoading || !googleUrl.trim()}
            className="h-10 px-4 shrink-0 border-gold/30 text-gold hover:bg-gold/10"
          >
            {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Parse'}
          </Button>
        </div>

        {/* Status message */}
        {autofillMsg && (
          <div
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed ${
              autofillMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {autofillMsg.type === 'success' && (
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            )}
            {autofillMsg.text}
          </div>
        )}

        {/* Google photo option */}
        {googlePhotoRef && !displayImage && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gold/70 font-medium shrink-0">📸 Google venue photo available</span>
              <span className="text-[10px] text-cream-muted/40 truncate">Use as venue photo?</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={useGooglePhoto}
              disabled={googlePhotoLoading}
              className="h-8 px-3 shrink-0 border-gold/30 text-gold hover:bg-gold/10 text-xs"
            >
              {googlePhotoLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Use photo'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ── Pub Name ── */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Pub Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. The Old Harkers Arms"
          required
          className="h-12 text-base"
        />
      </div>

      {/* ── Slug ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="slug">URL Slug *</Label>
          {slugManuallyEdited && (
            <button
              type="button"
              onClick={resetSlug}
              className="flex items-center gap-1 text-xs text-cream-muted/50 hover:text-gold transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Auto-generate
            </button>
          )}
        </div>
        <Input
          id="slug"
          value={form.slug}
          onChange={handleSlugChange}
          placeholder="the-old-harkers-arms"
          required
          className={`text-base font-mono text-sm ${slugError ? 'border-red-500' : ''}`}
        />
        {slugError && <p className="text-xs text-red-400">{slugError}</p>}
        {!slugError && form.slug && (
          <p className="text-xs text-cream-muted/40">/pub/{form.slug}</p>
        )}
      </div>

      {/* ── Address ── */}
      <div className="space-y-1.5">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="e.g. 1 Russell Street, Chester"
          required
        />
      </div>

      {/* ── Postcode ── */}
      <div className="space-y-1.5">
        <Label htmlFor="postcode">Postcode</Label>
        <Input
          id="postcode"
          value={form.postcode}
          onChange={(e) => set('postcode', e.target.value)}
          placeholder="e.g. CH1 2AB, D02 Y754, 08001…"
        />
      </div>

      {/* ── Area ── */}
      <div className="space-y-1.5">
        <Label htmlFor="area">Area *</Label>
        <Input
          id="area"
          value={form.area}
          onChange={(e) => set('area', e.target.value)}
          placeholder="e.g. City Centre, Hoole, Dublin, Barcelona…"
          required
        />
      </div>

      {/* ── Lat / Lng ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lat">Latitude *</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={form.lat}
            onChange={(e) => set('lat', e.target.value)}
            placeholder="53.1935"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lng">Longitude *</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={form.lng}
            onChange={(e) => set('lng', e.target.value)}
            placeholder="-2.8953"
            required
          />
        </div>
      </div>

      {/* ── Guinness price ── */}
      <div className="space-y-1.5">
        <Label htmlFor="price">Guinness Price (£)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={form.guinness_price_gbp}
          onChange={(e) => set('guinness_price_gbp', e.target.value)}
          placeholder="4.90"
        />
      </div>

      {/* ── Description ── */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="A brief description of the pub…"
          rows={3}
          className="resize-none"
        />
      </div>

      {/* ── Venue photo ── */}
      <div className="space-y-1.5">
        <Label>Venue Photo</Label>
        {displayImage ? (
          <div className="relative rounded-lg overflow-hidden h-36 bg-surface-2">
            <Image
              src={displayImage}
              alt="Hero"
              fill
              className="object-cover"
              unoptimized={!!imagePreview}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-lg border border-dashed border-border hover:border-gold/40 text-cream-muted/40 hover:text-cream-muted transition-colors bg-surface-2"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Upload venue photo</span>
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

      {/* ── Active toggle ── */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2">
        <div>
          <p className="text-sm font-medium text-cream">Active</p>
          <p className="text-xs text-cream-muted/50 mt-0.5">
            Inactive pubs are hidden from the public map
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((v) => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            isActive ? 'bg-gold' : 'bg-surface-3'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* ── Action buttons ── */}
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
        {!pub && (
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
          {loading ? 'Saving…' : pub ? 'Update Pub' : 'Save Pub'}
        </Button>
      </div>
    </form>
  );
}
