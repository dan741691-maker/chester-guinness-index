import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export async function POST() {
  // Verify admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('reviewer_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = await createAdminClient();

  // Check for a cached summary from the last 24 hours
  // @ts-ignore — pre-existing Supabase type mismatch
  const { data: cached } = await admin
    .from('analytics_ai_summaries')
    .select('summary_text, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date((cached as { created_at: string }).created_at).getTime();
    if (age < TWENTY_FOUR_HOURS_MS) {
      return NextResponse.json({ summary: (cached as { summary_text: string }).summary_text, cached: true });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set. Add it to .env.local to enable AI summaries.' },
      { status: 503 }
    );
  }

  // Fetch last 30 days of analytics for the summary
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // @ts-ignore — pre-existing Supabase type mismatch
  const { data: events } = await admin
    .from('analytics_events')
    .select('event_type, session_id, device_type, pub_name, search_query, results_count, created_at')
    .gte('created_at', thirtyDaysAgo);

  const rows = (events ?? []) as Array<{
    event_type: string;
    session_id: string | null;
    device_type: string | null;
    pub_name: string | null;
    search_query: string | null;
    results_count: number | null;
    created_at: string;
  }>;

  // Aggregate for the prompt
  const uniqueSessions = new Set(rows.map((r) => r.session_id).filter(Boolean)).size;
  const pageViews = rows.filter((r) =>
    ['homepage_view', 'pub_view', 'leaderboard_view'].includes(r.event_type)
  ).length;

  const pubViewCounts: Record<string, number> = {};
  for (const r of rows) {
    if (r.event_type === 'pub_view' && r.pub_name) {
      pubViewCounts[r.pub_name] = (pubViewCounts[r.pub_name] ?? 0) + 1;
    }
  }
  const topPubs = Object.entries(pubViewCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const searchCounts: Record<string, number> = {};
  for (const r of rows) {
    if (r.event_type === 'search_query' && r.search_query?.trim()) {
      const q = r.search_query.trim().toLowerCase();
      searchCounts[q] = (searchCounts[q] ?? 0) + 1;
    }
  }
  const topSearches = Object.entries(searchCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([query, count]) => ({ query, count }));

  const deviceCounts: Record<string, number> = {};
  for (const r of rows) {
    if (r.device_type) deviceCounts[r.device_type] = (deviceCounts[r.device_type] ?? 0) + 1;
  }

  const reviewsStarted = rows.filter((r) => r.event_type === 'review_started').length;
  const reviewsSubmitted = rows.filter((r) => r.event_type === 'review_submitted').length;
  const conversionRate = reviewsStarted > 0
    ? Math.round((reviewsSubmitted / reviewsStarted) * 100)
    : null;

  const summary30DayData = {
    period: 'Last 30 days',
    uniqueSessions,
    pageViews,
    topPubs,
    topSearches,
    deviceBreakdown: deviceCounts,
    reviewConversion: { started: reviewsStarted, submitted: reviewsSubmitted, rate: conversionRate },
    totalEvents: rows.length,
  };

  const prompt = `You are an analyst for The Chester Guinness Index, a pub review site in Chester, UK. Based on this analytics data, write a concise weekly summary covering: which pubs are most popular, what users are searching for, traffic trends, review conversion rate, and 3 specific recommendations to grow the site. Keep it under 400 words, use plain prose (no markdown headers). Data: ${JSON.stringify(summary30DayData)}`;

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return NextResponse.json({ error: `Anthropic API error: ${err}` }, { status: 502 });
  }

  const anthropicJson = (await anthropicRes.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const summaryText = anthropicJson.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Cache in Supabase
  // @ts-ignore — pre-existing Supabase type mismatch
  await admin.from('analytics_ai_summaries').insert({ summary_text: summaryText });

  return NextResponse.json({ summary: summaryText, cached: false });
}
