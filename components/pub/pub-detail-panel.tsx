'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, MapPin, PoundSterling, Calendar } from 'lucide-react';
import { ScoreRing, ScoreBreakdown } from './score-display';
import { RatingBadge } from './rating-badge';
import { usePubDetail } from '@/hooks/use-pub-detail';
import { ReviewerAvatar } from './reviewer-avatar';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { RankBadges } from './rank-badge';
import type { PubWithLatestImage, ReviewWithReviewer } from '@/types';

interface PubDetailPanelProps {
  pub: PubWithLatestImage | null;
  onClose: () => void;
}

export function PubDetailPanel({ pub, onClose }: PubDetailPanelProps) {
  const { review, loading } = usePubDetail(pub?.id ?? null);
  const isOpen = pub !== null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/70 z-40 md:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Desktop: absolute slide-over within map container */}
      <div
        className={cn(
          'absolute top-0 right-0 bottom-0 w-[360px] bg-[#0f0f0f] border-l border-border/60 z-20',
          'shadow-[-16px_0_40px_rgba(0,0,0,0.6)]',
          'transition-transform duration-300 ease-in-out will-change-transform',
          'hidden md:flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {pub && (
          <PanelContent pub={pub} review={review} loading={loading} onClose={onClose} />
        )}

      </div>

      {/* Mobile: fixed bottom sheet */}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 bg-[#0f0f0f] border-t border-border/60 z-50 md:hidden',
          'rounded-t-3xl flex flex-col',
          'max-h-[85vh]',
          'transition-transform duration-300 ease-in-out will-change-transform',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-9 h-[3px] rounded-full bg-white/20" />
        </div>

        {pub ? (
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <PanelContent pub={pub} review={review} loading={loading} onClose={onClose} />
          </div>
        ) : null}
      </div>
    </>
  );
}

function PanelContent({
  pub,
  review,
  loading,
  onClose,
}: {
  pub: PubWithLatestImage;
  review: ReviewWithReviewer | null;
  loading: boolean;
  onClose: () => void;
}) {
  const [heroError, setHeroError] = useState(false);
  const [pintImgError, setPintImgError] = useState(false);

  // Hero = venue/pub photo only. Review/pint photo appears in the content section below.
  const heroSrc = !heroError ? (pub.hero_image_url ?? null) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-3 pb-3 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-[1.25rem] font-bold text-cream leading-snug">
            {pub.name}
          </h2>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 flex-shrink-0 text-gold/50" />
            <span className="text-xs text-cream-muted/50">{pub.area}</span>
            {pub.address && (
              <span className="text-xs text-cream-muted/30 truncate"> · {pub.address}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-cream-muted/50 hover:text-cream transition-colors mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Hero image — venue photo only */}
        <div className="relative h-44 mx-4 rounded-xl overflow-hidden bg-gradient-to-br from-surface-2 to-surface-3">
          {heroSrc ? (
            <>
              <Image
                src={heroSrc}
                alt={pub.name}
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className="object-cover"
                onError={() => setHeroError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl opacity-[0.07]">🍺</span>
            </div>
          )}
        </div>

        <div className="px-4 pt-4 pb-8 space-y-5">
          {/* Score + meta */}
          {pub.current_score > 0 ? (
            <div className="flex items-center gap-4">
              <ScoreRing score={pub.current_score} size="default" />
              <div className="space-y-2 flex-1 min-w-0">
                <RatingBadge score={pub.current_score} />
                {(pub.city_rank != null || pub.country_rank != null) && (
                  <RankBadges
                    cityRank={pub.city_rank}
                    countryRank={pub.country_rank}
                    area={pub.area}
                    size="md"
                  />
                )}
                <div className="space-y-1.5">
                  {pub.guinness_price_gbp && (
                    <div className="flex items-center gap-1.5 text-sm text-cream-muted/70">
                      <PoundSterling className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>£{Number(pub.guinness_price_gbp).toFixed(2)}</span>
                    </div>
                  )}
                  {review?.visited_at && (
                    <div className="flex items-center gap-1.5 text-xs text-cream-muted/40">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>Reviewed {formatDate(review.visited_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 py-1">
              <div className="space-y-1.5">
                <p className="text-sm text-cream-muted/40">Not yet reviewed</p>
                {pub.guinness_price_gbp && (
                  <div className="flex items-center gap-1.5 text-sm text-cream-muted/60">
                    <PoundSterling className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>£{Number(pub.guinness_price_gbp).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score breakdown */}
          {loading ? (
            <BreakdownSkeleton />
          ) : review ? (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-cream-muted/30 mb-3">
                Score Breakdown
              </p>
              <ScoreBreakdown review={review} />
            </div>
          ) : pub.current_score === 0 ? (
            <div className="py-4 text-center border border-dashed border-border/40 rounded-xl">
              <p className="text-sm text-cream-muted/30">No review yet</p>
            </div>
          ) : null}

          {/* Verdict */}
          {review?.verdict && (
            <div
              className="rounded-xl px-4 py-3.5 border"
              style={{
                backgroundColor: review.reviewer
                  ? `${review.reviewer.accent_color}0d`
                  : 'rgba(201,168,76,0.06)',
                borderColor: review.reviewer
                  ? `${review.reviewer.accent_color}25`
                  : 'rgba(201,168,76,0.15)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-gold/50">Verdict</p>
                {review.reviewer?.avatar_url && (
                  <ReviewerAvatar reviewer={review.reviewer} size={24} />
                )}
              </div>
              <p className="font-serif italic text-cream text-[0.9rem] leading-relaxed">
                &ldquo;{review.verdict}&rdquo;
              </p>
            </div>
          )}

          {/* Notes */}
          {review?.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-cream-muted/30 mb-2">
                Tasting Notes
              </p>
              <p className="text-sm text-cream-muted/60 leading-relaxed line-clamp-5">
                {review.notes}
              </p>
            </div>
          )}

          {/* Pint photo — shown in review content, separate from the pub hero above */}
          {review?.image_url && !pintImgError && (
            <div className="relative h-36 rounded-xl overflow-hidden">
              <Image
                src={review.image_url}
                alt="Pint photo"
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className="object-cover"
                onError={() => setPintImgError(true)}
              />
            </div>
          )}

          {/* CTA */}
          <Link
            href={`/pub/${pub.slug}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gold text-black text-sm font-bold hover:bg-gold-light active:bg-gold-dark transition-colors"
          >
            View full pub page
          </Link>
        </div>
      </div>
    </div>
  );
}

function BreakdownSkeleton() {
  return (
    <div className="space-y-3.5">
      <div className="h-2.5 bg-surface-2 rounded w-28 animate-pulse" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <div
              className="h-3.5 bg-surface-2 rounded animate-pulse"
              style={{ width: `${42 + i * 8}%`, animationDelay: `${i * 60}ms` }}
            />
            <div className="h-3.5 bg-surface-2 rounded w-8 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          </div>
          <div className="h-2 bg-surface-2 rounded animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        </div>
      ))}
    </div>
  );
}
