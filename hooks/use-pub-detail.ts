'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Review } from '@/types';

export function usePubDetail(pubId: string | null) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pubId) {
      setReview(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const supabase = createClient();
    supabase
      .from('reviews')
      .select('*')
      .eq('pub_id', pubId)
      .eq('is_official', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          // Only show published reviews on the public map.
          // Pre-migration rows have is_published as undefined — treat as published.
          const visibleReview =
            data && data.is_published !== false ? data : null;
          setReview(visibleReview);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pubId]);

  return { review, loading };
}
