'use client';

import { useRef, useEffect } from 'react';
import { PubCard } from './pub-card';
import type { PubWithLatestImage } from '@/types';

interface PubListProps {
  pubs: PubWithLatestImage[];
  selectedPubId: string | null;
  onPubSelect: (pub: PubWithLatestImage) => void;
}

export function PubList({ pubs, selectedPubId, onPubSelect }: PubListProps) {
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPubId]);

  if (!pubs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <span className="text-5xl mb-4 opacity-20">🍺</span>
        <p className="text-sm font-medium text-cream-muted/50">No pubs match your filters</p>
        <p className="text-xs text-cream-muted/30 mt-1">Try adjusting the area or score filter</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-3 pb-6 pt-1">
      {pubs.map((pub, idx) => (
        <div key={pub.id} ref={pub.id === selectedPubId ? selectedRef : null}>
          <PubCard
            pub={pub}
            rank={idx + 1}
            isSelected={pub.id === selectedPubId}
            onClick={() => onPubSelect(pub)}
          />
        </div>
      ))}
    </div>
  );
}
