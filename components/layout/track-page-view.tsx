'use client';

import { useEffect } from 'react';
import { trackEvent, type AnalyticsEventData } from '@/lib/analytics';

interface TrackPageViewProps {
  event: string;
  data?: AnalyticsEventData;
}

/**
 * Zero-render client component — drops into any server component to fire
 * an analytics event on mount without converting the parent to 'use client'.
 */
export function TrackPageView({ event, data }: TrackPageViewProps) {
  useEffect(() => {
    trackEvent(event, data);
    // Only fire once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
