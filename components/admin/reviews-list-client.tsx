'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, Search, X, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RatingBadge } from '@/components/pub/rating-badge';
import { formatDate } from '@/lib/utils';
import type { Pub, Review } from '@/types';

type ReviewWithPub = Review & { pub: { name: string; slug: string } | null };

interface ReviewsListClientProps {
  reviews: ReviewWithPub[];
  pubs: Pub[];
}

export function ReviewsListClient({ reviews, pubs }: ReviewsListClientProps) {
  const [search, setSearch] = useState('');
  const [pubFilter, setPubFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = reviews;

    if (pubFilter !== 'all') {
      result = result.filter((r) => r.pub_id === pubFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.pub?.name ?? '').toLowerCase().includes(q) ||
          (r.verdict ?? '').toLowerCase().includes(q) ||
          (r.notes ?? '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [reviews, search, pubFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-muted/40 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews…"
            className="pl-9 pr-9 h-11"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted/40 hover:text-cream-muted p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={pubFilter} onValueChange={setPubFilter}>
          <SelectTrigger className="w-36 flex-shrink-0 h-11">
            <SelectValue placeholder="All pubs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pubs</SelectItem>
            {pubs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(search || pubFilter !== 'all') && (
        <div className="flex items-center gap-2 text-xs text-cream-muted/40">
          <span>{filtered.length} of {reviews.length} reviews</span>
          {pubFilter !== 'all' && (
            <button
              onClick={() => setPubFilter('all')}
              className="text-gold/60 hover:text-gold underline"
            >
              clear filter
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/40 rounded-lg">
          <p className="text-sm text-cream-muted/40">
            {search || pubFilter !== 'all'
              ? 'No reviews match your filters.'
              : 'No reviews yet. Add the first one above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((review) => {
            const pubName = review.pub?.name ?? 'Unknown pub';
            const pubSlug = review.pub?.slug ?? null;

            return (
              <Link
                key={review.id}
                href={`/admin/reviews/${review.id}`}
                className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-surface-2 hover:border-border/80 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif font-semibold text-cream truncate group-hover:text-gold transition-colors">
                      {pubName}
                    </p>
                    {pubSlug && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`/pub/${pubSlug}`, '_blank');
                        }}
                        className="text-cream-muted/30 hover:text-cream-muted flex-shrink-0 cursor-pointer p-0.5"
                        aria-label="View public pub page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {!review.is_official && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-cream-muted/20 text-cream-muted/40 flex-shrink-0">
                        unofficial
                      </span>
                    )}
                    {review.is_published === false && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-500/60 flex-shrink-0">
                        unpublished
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cream-muted/50 mt-0.5">
                    {review.visited_at
                      ? `Visited ${formatDate(review.visited_at)}`
                      : `Added ${formatDate(review.created_at)}`}
                  </p>
                  {review.verdict && (
                    <p className="text-xs text-cream-muted/40 italic mt-1 truncate">
                      &ldquo;{review.verdict}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <RatingBadge score={review.total_score} size="sm" />
                  <span className="font-serif font-bold text-lg text-cream tabular-nums">
                    {review.total_score}
                    <span className="text-xs text-cream-muted/40">/50</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-cream-muted/20 group-hover:text-cream-muted/50 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
