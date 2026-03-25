'use client';

import { useState, useMemo } from 'react';
import type { PubWithLatestImage, FilterState } from '@/types';

const DEFAULT_FILTERS: FilterState = {
  area: '',
  minScore: 0,
  maxPrice: null,
  search: '',
};

export function usePubs(pubs: PubWithLatestImage[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedPubId, setSelectedPubId] = useState<string | null>(null);

  const filteredPubs = useMemo(() => {
    return pubs.filter((pub) => {
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
  }, [pubs, filters]);

  const selectedPub = useMemo(
    () => pubs.find((p) => p.id === selectedPubId) ?? null,
    [pubs, selectedPubId]
  );

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    filteredPubs,
    filters,
    updateFilter,
    resetFilters,
    selectedPubId,
    setSelectedPubId,
    selectedPub,
  };
}
