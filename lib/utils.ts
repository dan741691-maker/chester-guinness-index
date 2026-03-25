import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RATING_TIERS } from './constants';
import type { RatingTier } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRatingTier(score: number): RatingTier {
  // RATING_TIERS is sorted descending by min; find first tier where score qualifies.
  // Using min-only comparison avoids gaps when decimal scores fall between integer boundaries.
  return (
    RATING_TIERS.find((tier) => score >= tier.min) ??
    RATING_TIERS[RATING_TIERS.length - 1]
  );
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateString));
}

export function scoreColor(score: number): string {
  const tier = getRatingTier(score);
  return tier.color;
}

export function getScorePercentage(score: number, max = 50): number {
  return Math.round((score / max) * 100);
}
