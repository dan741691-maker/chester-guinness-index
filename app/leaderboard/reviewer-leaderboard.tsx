'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Star, BarChart2 } from 'lucide-react';
import { formatDate, formatScore } from '@/lib/utils';
import type { ReviewerStat } from '@/services/reviewers';

interface Props {
  reviewers: ReviewerStat[];
  totalReviews: number;
  totalPubsReviewed: number;
  mostActiveReviewer: string;
  currentUserId: string | null;
}

const RANK_ICON: Record<number, string> = { 0: '👑', 1: '🥈', 2: '🥉' };

export function ReviewerLeaderboard({
  reviewers,
  totalReviews,
  totalPubsReviewed,
  mostActiveReviewer,
  currentUserId,
}: Props) {
  const [sortBy, setSortBy] = useState<'reviews' | 'avg'>('reviews');

  const sorted = [...reviewers].sort((a, b) =>
    sortBy === 'reviews'
      ? b.total_reviews - a.total_reviews
      : b.avg_score - a.avg_score,
  );

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface-2 p-4 text-center">
          <p className="text-2xl font-bold font-serif text-gold tabular-nums">{totalReviews}</p>
          <p className="text-[10px] uppercase tracking-widest text-cream-muted/40 mt-1">
            Total Reviews
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-4 text-center">
          <p className="text-2xl font-bold font-serif text-gold tabular-nums">{totalPubsReviewed}</p>
          <p className="text-[10px] uppercase tracking-widest text-cream-muted/40 mt-1">
            Pubs Reviewed
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-4 text-center">
          <p
            className="text-sm font-bold font-serif text-gold truncate leading-tight mt-1"
            title={mostActiveReviewer}
          >
            {mostActiveReviewer}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-cream-muted/40 mt-1">
            Most Active
          </p>
        </div>
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-cream-muted/40 mr-1">Sort by</span>
        <button
          onClick={() => setSortBy('reviews')}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            sortBy === 'reviews'
              ? 'border-gold text-gold bg-gold/10'
              : 'border-border text-cream-muted/50 hover:border-gold/30 hover:text-cream-muted'
          }`}
        >
          <Users className="h-3 w-3" />
          Reviews
        </button>
        <button
          onClick={() => setSortBy('avg')}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            sortBy === 'avg'
              ? 'border-gold text-gold bg-gold/10'
              : 'border-border text-cream-muted/50 hover:border-gold/30 hover:text-cream-muted'
          }`}
        >
          <Star className="h-3 w-3" />
          Avg Score
        </button>
      </div>

      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[2rem_1fr_4rem_5rem_1fr_5rem] gap-3 px-4 text-[10px] uppercase tracking-widest text-cream-muted/30">
        <span>#</span>
        <span>Reviewer</span>
        <span className="text-center">Reviews</span>
        <span className="text-center">Avg Score</span>
        <span>Top Pub</span>
        <span className="text-right">Last Active</span>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {sorted.map((reviewer, idx) => {
          const isCurrentUser = currentUserId && reviewer.user_id === currentUserId;
          const rankIcon = RANK_ICON[idx];

          return (
            <div
              key={reviewer.user_id ?? reviewer.display_name}
              className={`grid grid-cols-[2rem_1fr] sm:grid-cols-[2rem_1fr_4rem_5rem_1fr_5rem] gap-3 items-center p-4 rounded-xl border transition-colors ${
                isCurrentUser
                  ? 'border-gold/50 bg-gold/5'
                  : 'border-border bg-surface-2 hover:border-gold/20'
              }`}
            >
              {/* Rank */}
              <div className="text-center flex-shrink-0">
                {rankIcon ? (
                  <span className="text-lg leading-none">{rankIcon}</span>
                ) : (
                  <span className="text-sm font-bold font-serif text-cream-muted/40">{idx + 1}</span>
                )}
              </div>

              {/* Name + mobile stats */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {reviewer.accent_color && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: reviewer.accent_color }}
                    />
                  )}
                  <p className="font-serif font-semibold text-cream truncate">
                    {reviewer.display_name}
                    {isCurrentUser && (
                      <span className="ml-2 text-[10px] text-gold uppercase tracking-wider font-sans">
                        you
                      </span>
                    )}
                  </p>
                </div>
                {/* Mobile-only secondary stats */}
                <div className="sm:hidden mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-cream-muted/50">
                  <span>{reviewer.total_reviews} reviews</span>
                  <span>avg {formatScore(reviewer.avg_score)}/50</span>
                  {reviewer.highest_rated_pub_name && (
                    <span className="truncate">best: {reviewer.highest_rated_pub_name}</span>
                  )}
                </div>
              </div>

              {/* Reviews count */}
              <div className="hidden sm:block text-center">
                <span className="text-lg font-bold font-serif tabular-nums text-cream">
                  {reviewer.total_reviews}
                </span>
              </div>

              {/* Avg score */}
              <div className="hidden sm:block text-center">
                <span className="text-lg font-bold font-serif tabular-nums text-gold">
                  {formatScore(reviewer.avg_score)}
                </span>
                <span className="text-xs text-cream-muted/40">/50</span>
              </div>

              {/* Highest rated pub */}
              <div className="hidden sm:block min-w-0">
                {reviewer.highest_rated_pub_slug ? (
                  <Link
                    href={`/pub/${reviewer.highest_rated_pub_slug}`}
                    className="text-sm text-cream-muted hover:text-gold transition-colors truncate block"
                  >
                    {reviewer.highest_rated_pub_name}
                    <span className="ml-1 text-cream-muted/40 text-xs">
                      ({formatScore(reviewer.highest_rated_score ?? 0)})
                    </span>
                  </Link>
                ) : (
                  <span className="text-cream-muted/30 text-sm">—</span>
                )}
              </div>

              {/* Last active */}
              <div className="hidden sm:block text-right">
                <span className="text-xs text-cream-muted/40">
                  {reviewer.last_review_at ? formatDate(reviewer.last_review_at) : '—'}
                </span>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="py-12 text-center text-cream-muted/30 text-sm">
            No reviewer data yet.
          </div>
        )}
      </div>
    </div>
  );
}
