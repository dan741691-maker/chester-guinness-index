'use client';

import { useMap } from '@/hooks/use-map';
import type { PubWithLatestImage } from '@/types';
import { MapPin } from 'lucide-react';

interface PubMapProps {
  pubs: PubWithLatestImage[];
  onPubSelect: (pub: PubWithLatestImage) => void;
  selectedPubId?: string | null;
}

export function PubMap({ pubs, onPubSelect, selectedPubId }: PubMapProps) {
  const { mapRef, isLoaded, error } = useMap({ pubs, onPubSelect, selectedPubId });

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface text-cream-muted gap-3">
        <MapPin className="h-8 w-8 text-red-400" />
        <p className="text-sm">Map failed to load</p>
        <p className="text-xs text-cream-muted/50">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <div className="flex flex-col items-center gap-3 text-cream-muted">
            <div className="h-8 w-8 rounded-full border-2 border-gold/40 border-t-gold animate-spin" />
            <p className="text-sm">Loading map…</p>
          </div>
        </div>
      )}
    </div>
  );
}
