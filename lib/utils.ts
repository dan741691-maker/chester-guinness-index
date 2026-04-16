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

/**
 * Given an array of pubs (must include id, area, current_score),
 * returns a Map from pubId → { cityRank, countryRank }.
 *
 * Ranks are 1-based. Both are null when outside the top 10.
 * Pass `topN` to change the cutoff (default 10).
 */
export function computePubRanks(
  pubs: Array<{ id: string; area: string; current_score: number }>,
  topN = 10,
): Map<string, { cityRank: number | null; countryRank: number | null }> {
  // Sort a copy by score descending to get country ranks
  const sorted = [...pubs].sort((a, b) => b.current_score - a.current_score);

  // Country ranks
  const countryRankMap = new Map<string, number>();
  sorted.forEach((pub, i) => countryRankMap.set(pub.id, i + 1));

  // City ranks — group by area then sort within each area
  const byArea = new Map<string, typeof sorted>();
  for (const pub of sorted) {
    const group = byArea.get(pub.area) ?? [];
    group.push(pub);
    byArea.set(pub.area, group);
  }
  const cityRankMap = new Map<string, number>();
  for (const group of byArea.values()) {
    group.forEach((pub, i) => cityRankMap.set(pub.id, i + 1));
  }

  const result = new Map<string, { cityRank: number | null; countryRank: number | null }>();
  for (const pub of pubs) {
    const cr = countryRankMap.get(pub.id) ?? null;
    const ci = cityRankMap.get(pub.id) ?? null;
    result.set(pub.id, {
      countryRank: cr !== null && cr <= topN ? cr : null,
      cityRank: ci !== null && ci <= topN ? ci : null,
    });
  }
  return result;
}
