'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePubs } from '@/hooks/use-pubs';
import { PubList } from '@/components/pub/pub-list';
import { Filters } from '@/components/pub/filters';
import { PubDetailPanel } from '@/components/pub/pub-detail-panel';
import { brand } from '@/lib/brand';
import type { PubWithLatestImage } from '@/types';
import type { OfficialPubEntry } from '@/services/reviewers';

const PubMap = dynamic(() => import('@/components/map/pub-map').then((m) => m.PubMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface">
      <div className="h-8 w-8 rounded-full border-2 border-gold/40 border-t-gold animate-spin" />
    </div>
  ),
});

interface MapExplorerProps {
  initialPubs: PubWithLatestImage[];
  officialLeaderboard: OfficialPubEntry[];
}

export function MapExplorer({ initialPubs, officialLeaderboard }: MapExplorerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'official'>('all');

  const {
    filteredPubs,
    filters,
    updateFilter,
    resetFilters,
    selectedPubId,
    setSelectedPubId,
    selectedPub,
  } = usePubs(initialPubs);

  // Build official pubs: look up original pub data (for images/address),
  // override current_score with Daniel's score, sort by that score.
  const officialPubs = useMemo<PubWithLatestImage[]>(() => {
    if (!officialLeaderboard.length) return [];
    const scoreMap = new Map(officialLeaderboard.map((o) => [o.pubId, o.totalScore]));
    return initialPubs
      .filter((p) => scoreMap.has(p.id))
      .map((p) => ({ ...p, current_score: scoreMap.get(p.id)! }))
      .sort((a, b) => b.current_score - a.current_score);
  }, [initialPubs, officialLeaderboard]);

  // Apply the active filters to the official list
  const officialFiltered = useMemo<PubWithLatestImage[]>(() => {
    return officialPubs.filter((pub) => {
      if (filters.area && pub.area !== filters.area) return false;
      if (pub.current_score < filters.minScore) return false;
      if (
        filters.maxPrice !== null &&
        pub.guinness_price_gbp !== null &&
        pub.guinness_price_gbp > filters.maxPrice
      )
        return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !pub.name.toLowerCase().includes(q) &&
          !pub.area.toLowerCase().includes(q) &&
          !pub.address.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [officialPubs, filters]);

  // The list shown in the sidebar depends on the active tab
  const displayPubs = activeTab === 'official' ? officialFiltered : filteredPubs;

  const handlePubSelect = useCallback(
    (pub: PubWithLatestImage) => {
      setSelectedPubId(pub.id);
    },
    [setSelectedPubId]
  );

  const handleClose = useCallback(() => {
    setSelectedPubId(null);
  }, [setSelectedPubId]);

  return (
    <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border overflow-hidden order-2 md:order-1 h-[40vh] md:h-full">
        <Filters
          filters={filters}
          onUpdate={updateFilter}
          onReset={resetFilters}
          resultCount={displayPubs.length}
        />

        {/* Tab bar */}
        <div className="flex-shrink-0 bg-surface border-b border-border px-3 pt-2">
          <div className="flex items-end gap-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 pb-2 pt-1 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'all'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-cream-muted/50 hover:text-cream-muted'
              }`}
            >
              All Reviews
            </button>
            <button
              onClick={() => setActiveTab('official')}
              className={`px-3 pb-2 pt-1 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'official'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-cream-muted/50 hover:text-cream-muted'
              }`}
            >
              Official ⭐
            </button>
          </div>
          {activeTab === 'official' && (
            <p className="text-[10px] text-cream-muted/30 pb-1.5 -mt-0.5">
              Official ranking based on DHS reviews only
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <PubList
            pubs={displayPubs}
            selectedPubId={selectedPubId}
            onPubSelect={handlePubSelect}
          />
        </div>
      </aside>

      {/* Map + detail panel — always uses All Reviews (filteredPubs) */}
      <div className="flex-1 relative order-1 md:order-2 h-[60vh] md:h-full">
        <PubMap
          pubs={filteredPubs}
          onPubSelect={handlePubSelect}
          selectedPubId={selectedPubId}
        />

        {/* Brand overlay */}
        <div className="absolute top-3 left-3 pointer-events-none z-10">
          <div className="bg-black/70 backdrop-blur-sm border border-border/50 rounded-md px-3 py-1.5">
            <p className="text-[10px] text-cream-muted/60 uppercase tracking-widest">The</p>
            <p className="text-sm font-serif font-bold text-gold leading-none">
              Chester Guinness Index
            </p>
            <p className="text-[9px] text-cream-muted/35 tracking-wide mt-0.5">
              by {brand.parent}
            </p>
          </div>
        </div>

        {/* Detail panel (desktop: absolute overlay, mobile: fixed bottom sheet) */}
        <PubDetailPanel pub={selectedPub} onClose={handleClose} />
      </div>
    </div>
  );
}
