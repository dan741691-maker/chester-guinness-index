import { cn } from '@/lib/utils';

interface RankBadgeProps {
  cityRank?: number | null;
  countryRank?: number | null;
  area?: string | null;
  /** Visual size — 'sm' for pub cards, 'md' for detail panels */
  size?: 'sm' | 'md';
}

const TOP_N = 10;
const COUNTRY_LABEL = 'England';

/**
 * Renders "#N in Chester" and/or "#N in England" pill badges.
 * Only shown when rank ≤ TOP_N.
 */
export function RankBadges({ cityRank, countryRank, area, size = 'sm' }: RankBadgeProps) {
  const showCity = typeof cityRank === 'number' && cityRank <= TOP_N;
  const showCountry = typeof countryRank === 'number' && countryRank <= TOP_N;

  if (!showCity && !showCountry) return null;

  const textSize = size === 'md' ? 'text-[0.6875rem]' : 'text-[0.5875rem]';
  const px = size === 'md' ? 'px-2 py-0.5' : 'px-1.5 py-0.5';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {showCity && area && (
        <span
          className={cn(
            'inline-flex items-center rounded-full border border-gold/25 bg-black/50',
            'font-bold text-gold/90 tracking-wide leading-none',
            px,
            textSize,
          )}
        >
          #{cityRank} in {area}
        </span>
      )}
      {showCountry && (
        <span
          className={cn(
            'inline-flex items-center rounded-full border border-gold/15 bg-black/50',
            'font-bold text-gold/60 tracking-wide leading-none',
            px,
            textSize,
          )}
        >
          #{countryRank} in {COUNTRY_LABEL}
        </span>
      )}
    </div>
  );
}
