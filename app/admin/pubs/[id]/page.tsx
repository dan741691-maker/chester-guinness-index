import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Plus } from 'lucide-react';
import { getPubById } from '@/services/pubs';
import { getReviewsForPub } from '@/services/reviews';
import { PubForm } from '@/components/admin/pub-form';
import { DeleteButton } from '@/components/admin/delete-button';
import { RatingBadge } from '@/components/pub/rating-badge';
import { ScoreRing } from '@/components/pub/score-display';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pub = await getPubById(id);
  return { title: pub ? `Edit ${pub.name}` : 'Pub not found' };
}

export const revalidate = 0;

export default async function EditPubPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const roleRes = user
    ? await supabase.from('reviewer_profiles').select('role').eq('user_id', user.id).single()
    : null;
  const role = roleRes?.data?.role ?? 'reviewer';
  const isAdmin = role === 'admin';
  const currentUserId = user?.id ?? null;

  const [pub, reviews] = await Promise.all([getPubById(id), getReviewsForPub(id)]);

  if (!pub) notFound();

  return (
    <div className="space-y-6 pb-8">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/pubs"
          className="flex items-center gap-1.5 text-sm text-cream-muted/60 hover:text-cream transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pubs
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold text-cream truncate">{pub.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-sm text-cream-muted/60">
              {pub.area} · {pub.address}
            </p>
            <Link
              href={`/pub/${pub.slug}`}
              target="_blank"
              className="text-cream-muted/30 hover:text-cream-muted"
              aria-label="View public page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        {pub.current_score > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <RatingBadge score={pub.current_score} size="sm" />
            <ScoreRing score={pub.current_score} size="sm" />
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <PubForm pub={pub} successRedirectUrl="/admin/pubs" />
      </div>

      {/* Reviews for this pub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-cream">
            Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}
          </h2>
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <Link href={`/admin/reviews/new?pub=${pub.id}`}>
              <Plus className="h-3.5 w-3.5" />
              Add review
            </Link>
          </Button>
        </div>

        {reviews.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border/40 rounded-lg">
            <p className="text-sm text-cream-muted/40">No reviews yet for this pub.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RatingBadge score={review.total_score} size="sm" />
                    <span className="font-serif font-semibold text-cream text-sm tabular-nums">
                      {review.total_score}/50
                    </span>
                    {!review.is_official && (
                      <span className="text-[10px] border border-cream-muted/20 text-cream-muted/40 rounded px-1 py-0.5">
                        unofficial
                      </span>
                    )}
                    {review.is_published === false && (
                      <span className="text-[10px] border border-amber-500/30 text-amber-500/60 rounded px-1 py-0.5">
                        unpublished
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cream-muted/50 mt-0.5">
                    {review.visited_at
                      ? `Visited ${formatDate(review.visited_at)}`
                      : `Added ${formatDate(review.created_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {(isAdmin || review.reviewer_id === currentUserId) && (
                    <Link
                      href={`/admin/reviews/${review.id}`}
                      className="text-xs text-cream-muted hover:text-cream px-3 py-1.5 rounded hover:bg-surface-2 transition-colors border border-transparent hover:border-border"
                    >
                      Edit
                    </Link>
                  )}
                  {(isAdmin || review.reviewer_id === currentUserId) && (
                    <DeleteButton
                      table="reviews"
                      id={review.id}
                      pubSlug={pub.slug}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone — admin only for pub delete */}
      {isAdmin && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h3>
          <p className="text-xs text-cream-muted/50 mb-3">
            Deleting this pub is permanent and will remove it from the public map.
          </p>
          <DeleteButton
            table="pubs"
            id={pub.id}
            redirectAfterDelete="/admin/pubs"
          />
        </div>
      )}
    </div>
  );
}
