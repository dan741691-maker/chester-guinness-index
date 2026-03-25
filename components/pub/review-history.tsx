import { formatDate } from '@/lib/utils';
import { RatingBadge } from './rating-badge';
import { ScoreBreakdown } from './score-display';
import { ReviewImage } from './review-image';
import { ReviewerAvatar } from './reviewer-avatar';
import { Separator } from '@/components/ui/separator';
import type { ReviewWithReviewer } from '@/types';

interface ReviewHistoryProps {
  reviews: ReviewWithReviewer[];
}

export function ReviewHistory({ reviews }: ReviewHistoryProps) {
  if (!reviews.length) {
    return (
      <div className="py-8 text-center text-cream-muted/40 text-sm">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review, idx) => {
        const accentColor = review.reviewer?.accent_color ?? '#C9A84C';
        return (
          <div key={review.id}>
            {idx > 0 && <Separator className="mb-6" />}
            <div
              className="space-y-4 pl-3 border-l-2"
              style={{ borderColor: `${accentColor}40` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-xl text-cream">
                      {review.total_score}
                      <span className="text-cream-muted/40 text-sm font-sans font-normal">/50</span>
                    </span>
                    <RatingBadge score={review.total_score} size="sm" />
                    {idx === 0 && (
                      <span className="text-xs text-gold border border-gold/30 rounded-sm px-1.5 py-0.5 uppercase tracking-wider">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cream-muted/50 mt-0.5">
                    {review.visited_at
                      ? `Visited ${formatDate(review.visited_at)}`
                      : `Reviewed ${formatDate(review.created_at)}`}
                  </p>
                </div>
                {review.guinness_price_gbp && (
                  <span className="text-sm text-cream-muted">
                    £{Number(review.guinness_price_gbp).toFixed(2)}
                  </span>
                )}
              </div>

              <ScoreBreakdown review={review} />

              {review.notes && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-cream-muted/40 mb-1">Notes</p>
                  <p className="text-sm text-cream-muted leading-relaxed">{review.notes}</p>
                </div>
              )}

              {review.verdict && (
                <div className="border-l-2 border-gold/50 pl-3">
                  <p className="text-xs uppercase tracking-widest text-gold/60 mb-1">Verdict</p>
                  <p className="text-sm text-cream font-serif italic leading-relaxed">
                    &ldquo;{review.verdict}&rdquo;
                  </p>
                </div>
              )}

              {review.image_url && (
                <ReviewImage src={review.image_url} />
              )}

              {review.reviewer?.avatar_url && (
                <div className="flex items-center gap-2 pt-1">
                  <ReviewerAvatar reviewer={review.reviewer} size={24} />
                  <span className="text-[10px] uppercase tracking-widest text-cream-muted/30">
                    {review.reviewer.display_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
