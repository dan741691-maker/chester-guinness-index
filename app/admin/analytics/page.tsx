import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AnalyticsDashboard } from './analytics-dashboard';

export const metadata: Metadata = { title: 'Analytics' };

export const revalidate = 0; // always fresh

export default async function AnalyticsPage() {
  // Auth + admin gate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('reviewer_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== 'admin') {
    redirect('/admin');
  }

  // Fetch analytics data using service role (bypasses RLS)
  const admin = await createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // @ts-ignore — pre-existing Supabase type mismatch
  const { data: events } = await admin
    .from('analytics_events')
    .select(
      'event_type, session_id, device_type, pub_name, search_query, filter_area, results_count, created_at, referrer'
    )
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false });

  type EventRow = {
    event_type: string;
    session_id: string | null;
    device_type: string | null;
    pub_name: string | null;
    search_query: string | null;
    filter_area: string | null;
    results_count: number | null;
    created_at: string;
    referrer: string | null;
  };

  const rows = (events ?? []) as EventRow[];

  // ── Aggregate ──────────────────────────────────────────────────

  const uniqueSessions = new Set(rows.map((r) => r.session_id).filter(Boolean)).size;

  const pageViewTypes = ['homepage_view', 'pub_view', 'leaderboard_view', 'map_view'];
  const totalPageViews = rows.filter((r) => pageViewTypes.includes(r.event_type)).length;

  // Most viewed pub
  const pubViewMap: Record<string, number> = {};
  for (const r of rows) {
    if (r.event_type === 'pub_view' && r.pub_name) {
      pubViewMap[r.pub_name] = (pubViewMap[r.pub_name] ?? 0) + 1;
    }
  }
  const pubViewEntries = Object.entries(pubViewMap).sort(([, a], [, b]) => b - a);
  const mostViewedPub = pubViewEntries[0] ? { name: pubViewEntries[0][0], views: pubViewEntries[0][1] } : null;

  // Most searched term
  const searchMap: Record<string, number> = {};
  for (const r of rows) {
    if (r.event_type === 'search_query' && r.search_query?.trim()) {
      const q = r.search_query.trim().toLowerCase();
      searchMap[q] = (searchMap[q] ?? 0) + 1;
    }
  }
  const searchEntries = Object.entries(searchMap).sort(([, a], [, b]) => b - a);
  const mostSearchedTerm = searchEntries[0] ? { query: searchEntries[0][0], count: searchEntries[0][1] } : null;

  // Review conversion
  const reviewsStarted = rows.filter((r) => r.event_type === 'review_started').length;
  const reviewsSubmitted = rows.filter((r) => r.event_type === 'review_submitted').length;

  // Top pubs (for chart — top 10)
  const topPubs = pubViewEntries.slice(0, 10).map(([name, count]) => ({ name, count }));

  // Daily sessions (last 30 days)
  const sessionsByDay: Record<string, Set<string>> = {};
  for (const r of rows) {
    if (!r.session_id) continue;
    const day = r.created_at.slice(0, 10);
    if (!sessionsByDay[day]) sessionsByDay[day] = new Set();
    sessionsByDay[day].add(r.session_id);
  }
  const dailySessions = Object.entries(sessionsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, set]) => ({ date, sessions: set.size }));

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  for (const r of rows) {
    if (r.device_type) deviceMap[r.device_type] = (deviceMap[r.device_type] ?? 0) + 1;
  }
  const deviceBreakdown = Object.entries(deviceMap).map(([device, count]) => ({ device, count }));

  // Top search terms (for chart)
  const topSearchTerms = searchEntries.slice(0, 10).map(([query, count]) => ({ query, count }));

  // Recent events for tables
  const recentSearches = rows
    .filter((r) => r.event_type === 'search_query' && r.search_query)
    .slice(0, 20)
    .map((r) => ({ created_at: r.created_at, search_query: r.search_query!, results_count: r.results_count }));

  const recentPubViews = rows
    .filter((r) => r.event_type === 'pub_view' && r.pub_name)
    .slice(0, 20)
    .map((r) => ({ created_at: r.created_at, pub_name: r.pub_name!, device_type: r.device_type }));

  const referrerMap: Record<string, number> = {};
  for (const r of rows) {
    const ref = r.referrer?.trim() || 'Direct';
    referrerMap[ref] = (referrerMap[ref] ?? 0) + 1;
  }
  const topReferrers = Object.entries(referrerMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  // Latest cached AI summary
  // @ts-ignore
  const { data: summaryRow } = await admin
    .from('analytics_ai_summaries')
    .select('summary_text, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestSummary = summaryRow
    ? { summary_text: (summaryRow as { summary_text: string }).summary_text, created_at: (summaryRow as { created_at: string }).created_at }
    : null;

  return (
    <AnalyticsDashboard
      totalPageViews={totalPageViews}
      uniqueSessions={uniqueSessions}
      mostViewedPub={mostViewedPub}
      mostSearchedTerm={mostSearchedTerm}
      reviewConversion={{ started: reviewsStarted, submitted: reviewsSubmitted }}
      topPubs={topPubs}
      dailySessions={dailySessions}
      deviceBreakdown={deviceBreakdown}
      topSearchTerms={topSearchTerms}
      recentSearches={recentSearches}
      recentPubViews={recentPubViews}
      topReferrers={topReferrers}
      latestSummary={latestSummary}
    />
  );
}
