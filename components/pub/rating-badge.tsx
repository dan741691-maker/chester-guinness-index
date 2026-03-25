import { getRatingTier } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BadgeProps } from '@/components/ui/badge';

interface RatingBadgeProps {
  score: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

const TIER_VARIANT_MAP: Record<string, BadgeProps['variant']> = {
  Legendary: 'legendary',
  Elite: 'elite',
  Strong: 'strong',
  Decent: 'decent',
  Weak: 'weak',
  Avoid: 'avoid',
};

export function RatingBadge({ score, className, size = 'default' }: RatingBadgeProps) {
  const tier = getRatingTier(score);
  const variant = TIER_VARIANT_MAP[tier.label] ?? 'secondary';

  return (
    <Badge
      variant={variant}
      className={cn(
        size === 'lg' && 'text-sm px-4 py-1.5',
        size === 'sm' && 'text-[10px] px-2 py-0.5',
        className
      )}
    >
      {tier.label}
    </Badge>
  );
}
