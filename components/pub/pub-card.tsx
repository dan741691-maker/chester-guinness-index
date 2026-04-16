import Image from 'next/image';
import { MapPin, PoundSterling } from 'lucide-react';
import { ScoreRing } from './score-display';
import { RatingBadge } from './rating-badge';
import { RankBadges } from './rank-badge';
import { cn } from '@/lib/utils';
import type { PubWithLatestImage } from '@/types';

interface PubCardProps {
  pub: PubWithLatestImage;
  rank?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PubCard({ pub, rank, isSelected, onClick }: PubCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none',
        'active:scale-[0.985] active:opacity-90',
        isSelected
          ? 'border-gold/50 bg-gold/5 shadow-[inset_2px_0_0_#c9a84c]'
          : 'border-border/60 hover:border-border hover:bg-surface-2/60'
      )}
    >

      {/* Rank */}
      {rank !== undefined && (
        <div className="flex-shrink-0 w-5 text-center">
          <span
            className={cn(
              'text-xs font-bold font-serif tabular-nums',
              rank === 1
                ? 'text-yellow-400'
                : rank === 2
                ? 'text-slate-400'
                : rank === 3
                ? 'text-amber-700'
                : 'text-cream-muted/25'
            )}
          >
            {rank}
          </span>
        </div>
      )}

      {/* Thumbnail — priority: pub cover → latest review image → placeholder */}
      <div className="flex-shrink-0 w-[52px] h-[52px] rounded-lg overflow-hidden bg-surface-3">
        {pub.hero_image_url || pub.latest_review_image_url ? (
          <Image
            src={(pub.hero_image_url ?? pub.latest_review_image_url)!}
            alt={pub.name}
            width={52}
            height={52}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xl opacity-20">🍺</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'font-serif font-semibold text-[0.8125rem] leading-snug truncate transition-colors',
                isSelected ? 'text-gold' : 'text-cream group-hover:text-cream/90'
              )}
            >
              {pub.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-cream-muted/30" />
              <span className="text-[0.6875rem] text-cream-muted/40 truncate">{pub.area}</span>
            </div>
          </div>
          {pub.current_score > 0 && (
            <ScoreRing score={pub.current_score} size="sm" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {pub.current_score > 0 && <RatingBadge score={pub.current_score} size="sm" />}
          {pub.guinness_price_gbp && (
            <span className="flex items-center gap-0.5 text-[0.6875rem] text-cream-muted/40">
              <PoundSterling className="h-2.5 w-2.5" />
              {Number(pub.guinness_price_gbp).toFixed(2)}
            </span>
          )}
        </div>
        {(pub.city_rank != null || pub.country_rank != null) && (
          <div className="mt-1">
            <RankBadges
              cityRank={pub.city_rank}
              countryRank={pub.country_rank}
              area={pub.area}
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
