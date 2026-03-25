'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, Search, X, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScoreRing } from '@/components/pub/score-display';
import { RatingBadge } from '@/components/pub/rating-badge';
import type { Pub } from '@/types';

interface PubsListClientProps {
  pubs: Pub[];
}

export function PubsListClient({ pubs }: PubsListClientProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return pubs;
    const q = search.toLowerCase();
    return pubs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [pubs, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-muted/40 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pubs by name, area, address…"
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

      {search && (
        <p className="text-xs text-cream-muted/40">
          {filtered.length} of {pubs.length} pubs
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/40 rounded-lg">
          <p className="text-sm text-cream-muted/40">
            {search ? 'No pubs match your search.' : 'No pubs yet. Add your first pub above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((pub) => (
            <Link
              key={pub.id}
              href={`/admin/pubs/${pub.id}`}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-colors group ${
                pub.is_active === false
                  ? 'border-border/40 bg-surface/40 opacity-60'
                  : 'border-border hover:bg-surface-2 hover:border-border/80'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-serif font-semibold text-cream truncate group-hover:text-gold transition-colors">
                    {pub.name}
                  </p>
                  {pub.is_active === false && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 text-red-400/60 flex-shrink-0">
                      inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-cream-muted/50 mt-0.5">
                  {pub.area} · {pub.address}
                  {pub.postcode ? ` · ${pub.postcode}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {pub.current_score > 0 ? (
                  <>
                    <RatingBadge score={pub.current_score} size="sm" />
                    <ScoreRing score={pub.current_score} size="sm" />
                  </>
                ) : (
                  <span className="text-xs text-cream-muted/30">Unreviewed</span>
                )}
                <Link
                  href={`/pub/${pub.slug}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-cream-muted/30 hover:text-cream-muted transition-colors ml-1 p-1"
                  aria-label="View public page"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <ChevronRight className="h-4 w-4 text-cream-muted/20 group-hover:text-cream-muted/50 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
