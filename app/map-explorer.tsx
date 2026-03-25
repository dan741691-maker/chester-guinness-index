'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { usePubs } from '@/hooks/use-pubs';
import { PubList } from '@/components/pub/pub-list';
import { Filters } from '@/components/pub/filters';
import { PubDetailPanel } from '@/components/pub/pub-detail-panel';
import { brand } from '@/lib/brand';
import type { PubWithLatestImage } from '@/types';

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
}

export function MapExplorer({ initialPubs }: MapExplorerProps) {
  const {
    filteredPubs,
    filters,
    updateFilter,
    resetFilters,
    selectedPubId,
    setSelectedPubId,
    selectedPub,
  } = usePubs(initialPubs);

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
          resultCount={filteredPubs.length}
        />
        <div className="flex-1 overflow-y-auto py-2">
          <PubList
            pubs={filteredPubs}
            selectedPubId={selectedPubId}
            onPubSelect={handlePubSelect}
          />
        </div>
      </aside>

      {/* Map + detail panel */}
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
