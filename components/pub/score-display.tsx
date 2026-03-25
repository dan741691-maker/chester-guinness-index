import { getRatingTier, getScorePercentage, formatScore } from '@/lib/utils';
import { SCORE_CATEGORIES } from '@/lib/constants';
import type { Review } from '@/types';

interface ScoreDisplayProps {
  score: number;
  review?: Review | null;
  size?: 'sm' | 'default' | 'lg';
}

export function ScoreRing({ score, size = 'default' }: { score: number; size?: 'sm' | 'default' | 'lg' }) {
  const tier = getRatingTier(score);
  const percentage = getScorePercentage(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const dimensions = { sm: 80, default: 110, lg: 140 };
  const dim = dimensions[size];
  const formatted = formatScore(score);
  // Decimal strings like "36.7" are 4 chars — reduce font size to fit in the ring
  const textSize = {
    sm: formatted.length >= 4 ? 'text-base' : 'text-xl',
    default: formatted.length >= 4 ? 'text-2xl' : 'text-3xl',
    lg: formatted.length >= 4 ? 'text-3xl' : 'text-4xl',
  };
  const subTextSize = { sm: 'text-[10px]', default: 'text-xs', lg: 'text-sm' };

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#222222" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={tier.color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-serif font-bold leading-none ${textSize[size]}`}
          style={{ color: tier.color }}
        >
          {formatted}
        </span>
        <span className={`text-cream-muted/50 ${subTextSize[size]}`}>/50</span>
      </div>
    </div>
  );
}

export function ScoreBreakdown({ review }: { review: Review }) {
  return (
    <div className="space-y-3">
      {SCORE_CATEGORIES.map(({ key, label, icon }) => {
        const value = review[key] as number;
        const pct = (value / 10) * 100;
        const barColor =
          value >= 8 ? '#c9a84c' : value >= 6 ? '#8B7355' : '#444';
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-cream-muted/80">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-xs">{label}</span>
              </span>
              <span className="font-semibold text-cream tabular-nums text-sm">
                {formatScore(value)}
                <span className="text-cream-muted/30 text-xs">/10</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScoreDisplay({ score, review, size = 'default' }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreRing score={score} size={size} />
      {review && <ScoreBreakdown review={review} />}
    </div>
  );
}
