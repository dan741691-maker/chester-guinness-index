'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHESTER_AREAS } from '@/lib/constants';
import type { FilterState } from '@/types';

interface FiltersProps {
  filters: FilterState;
  onUpdate: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  resultCount: number;
}

export function Filters({ filters, onUpdate, onReset, resultCount }: FiltersProps) {
  const hasActiveFilters =
    !!filters.area || filters.minScore > 0 || filters.maxPrice !== null || !!filters.search;

  return (
    <div className="space-y-2 p-3 border-b border-border bg-surface">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-muted/40 pointer-events-none" />
        <Input
          placeholder="Search pubs…"
          value={filters.search}
          onChange={(e) => onUpdate('search', e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {filters.search && (
          <button
            onClick={() => onUpdate('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted/40 hover:text-cream-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Area + Score filters */}
      <div className="flex gap-2">
        <Select
          value={filters.area || '__all__'}
          onValueChange={(v) => onUpdate('area', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="h-9 text-xs flex-1">
            <SelectValue placeholder="All areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All areas</SelectItem>
            {CHESTER_AREAS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.minScore)}
          onValueChange={(v) => onUpdate('minScore', Number(v))}
        >
          <SelectTrigger className="h-9 text-xs flex-1">
            <SelectValue placeholder="Min score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any score</SelectItem>
            <SelectItem value="40">40+ Elite</SelectItem>
            <SelectItem value="35">35+ Strong</SelectItem>
            <SelectItem value="30">30+ Decent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results + reset */}
      <div className="flex items-center justify-between text-xs text-cream-muted/50">
        <span>
          {resultCount} pub{resultCount !== 1 ? 's' : ''}
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 px-2 text-xs gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}
