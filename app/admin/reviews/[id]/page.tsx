import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAllPubs } from '@/services/pubs';
import { ReviewForm } from '@/components/admin/review-form';
import { DeleteButton } from '@/components/admin/delete-button';
import { RatingBadge } from '@/components/pub/rating-badge';
import { formatDate } from '@/lib/utils';
import type { Review } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function EditReviewPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const [reviewRes, pubs] = await Promise.all([
    supabase.from('reviews').select('*, pub:pubs(name, slug)').eq('id', id).single(),
    getAllPubs(),
  ]);

  if (reviewRes.error || !reviewRes.data) notFound();

  const reviewData = reviewRes.data;

  // Safely extract the joined pub without unsafe casting
  const rawPub = Array.isArray(reviewData.pub) ? reviewData.pub[0] : reviewData.pub;
  const pub =
    rawPub && typeof rawPub === 'object' && 'name' in rawPub && 'slug' in rawPub
      ? (rawPub as { name: string; slug: string })
      : null;

  // Construct a clean Review object (strip the joined pub field)
  const review: Review = {
    id: reviewData.id,
    pub_id: reviewData.pub_id,
    pub_look_cleanliness: reviewData.pub_look_cleanliness,
    staff: reviewData.staff,
    glass_pour: reviewData.glass_pour,
    taste_quality: reviewData.taste_quality,
    price_score: reviewData.price_score,
    total_score: reviewData.total_score,
    guinness_price_gbp: reviewData.guinness_price_gbp,
    notes: reviewData.notes,
    verdict: reviewData.verdict,
    is_official: reviewData.is_official,
    is_published: reviewData.is_published ?? true,
    image_url: reviewData.image_url ?? null,
    visited_at: reviewData.visited_at,
    created_at: reviewData.created_at,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/reviews"
          className="flex items-center gap-1.5 text-sm text-cream-muted/60 hover:text-cream transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reviews
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Edit Review</h1>
          {pub && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm text-cream-muted/60">{pub.name}</p>
              <Link
                href={`/pub/${pub.slug}`}
                target="_blank"
                className="text-cream-muted/30 hover:text-cream-muted"
                aria-label="View public page"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
          <p className="text-xs text-cream-muted/40 mt-0.5">
            {review.visited_at
              ? `Visited ${formatDate(review.visited_at)}`
              : `Added ${formatDate(review.created_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <RatingBadge score={review.total_score} size="sm" />
          <span className="font-serif font-bold text-xl text-cream tabular-nums">
            {review.total_score}
            <span className="text-xs text-cream-muted/40">/50</span>
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <ReviewForm
          pubs={pubs}
          review={review}
          defaultPubId={review.pub_id}
          successRedirectUrl="/admin/reviews"
        />
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <h3 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h3>
        <p className="text-xs text-cream-muted/50 mb-3">
          Deleting this review is permanent. If it was the latest official review, the pub score
          will be recalculated from the next most recent official review.
        </p>
        <DeleteButton
          table="reviews"
          id={review.id}
          pubSlug={pub?.slug}
          redirectAfterDelete="/admin/reviews"
        />
      </div>
    </div>
  );
}
