import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'border-gold/30 bg-gold/10 text-gold',
        secondary: 'border-border bg-surface-2 text-cream-muted',
        destructive: 'border-red-500/30 bg-red-500/10 text-red-400',
        outline: 'border-border text-cream-muted',
        legendary: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400',
        elite: 'border-gold/40 bg-gold/10 text-gold',
        strong: 'border-slate-400/40 bg-slate-400/10 text-slate-400',
        decent: 'border-amber-700/40 bg-amber-700/10 text-amber-700',
        weak: 'border-gray-500/40 bg-gray-500/10 text-gray-500',
        avoid: 'border-red-500/40 bg-red-500/10 text-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
