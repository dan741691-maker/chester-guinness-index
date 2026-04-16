/**
 * Client-side analytics utility.
 *
 * - Generates / retrieves a session_id from sessionStorage
 * - Detects device type from user agent
 * - Batches events and flushes every 30 s or on page hide / unload
 * - Never throws — analytics must not break the app
 */

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────

export type AnalyticsEventData = {
  pub_id?: string;
  pub_name?: string;
  search_query?: string;
  filter_area?: string;
  filter_score?: string;
  latitude?: number;
  longitude?: number;
  results_count?: number;
  selected_pub_id?: string;
  time_on_page_seconds?: number;
  metadata?: Record<string, unknown>;
};

type QueuedEvent = AnalyticsEventData & {
  event_type: string;
  session_id: string;
  device_type: string;
  referrer: string;
};

// ─── Session helpers ─────────────────────────────────────────────

function getSessionId(): string {
  try {
    const key = 'cgi_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

function getDeviceType(): string {
  try {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPod/.test(ua)) return 'mobile';
    if (/iPad|Tablet/.test(ua)) return 'tablet';
    return 'desktop';
  } catch {
    return 'desktop';
  }
}

function getReferrer(): string {
  try {
    return document.referrer ?? '';
  } catch {
    return '';
  }
}

// ─── Flush queue ─────────────────────────────────────────────────

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let listenersRegistered = false;

async function flush(): Promise<void> {
  if (!queue.length) return;
  const batch = [...queue];
  queue = [];
  try {
    const supabase = createClient();
    await supabase.from('analytics_events').insert(batch);
  } catch {
    // Silently swallow — analytics must never break the app
  }
}

function ensureSetup(): void {
  if (typeof window === 'undefined') return;
  if (!flushTimer) {
    flushTimer = setInterval(() => {
      flush().catch(() => {});
    }, 30_000);
  }
  if (!listenersRegistered) {
    listenersRegistered = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush().catch(() => {});
    });
    window.addEventListener('beforeunload', () => {
      flush().catch(() => {});
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────

/** Queue an analytics event for batched insertion. Fire-and-forget, never throws. */
export function trackEvent(type: string, data: AnalyticsEventData = {}): void {
  try {
    if (typeof window === 'undefined') return;
    ensureSetup();
    queue.push({
      event_type: type,
      session_id: getSessionId(),
      device_type: getDeviceType(),
      referrer: getReferrer(),
      ...data,
    });
  } catch {
    // Never throw
  }
}

/** Force-flush the queue immediately (e.g. before navigation). */
export function flushAnalytics(): void {
  flush().catch(() => {});
}
