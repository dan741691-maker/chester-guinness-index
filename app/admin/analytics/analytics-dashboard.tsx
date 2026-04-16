'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

interface Props {
  totalPageViews: number;
  uniqueSessions: number;
  mostViewedPub: { name: string; views: number } | null;
  mostSearchedTerm: { query: string; count: number } | null;
  reviewConversion: { started: number; submitted: number };
  topPubs: Array<{ name: string; count: number }>;
  dailySessions: Array<{ date: string; sessions: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  topSearchTerms: Array<{ query: string; count: number }>;
  recentSearches: Array<{ created_at: string; search_query: string; results_count: number | null }>;
  recentPubViews: Array<{ created_at: string; pub_name: string; device_type: string | null }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  latestSummary: { summary_text: string; created_at: string } | null;
}

const GOLD = '#C9A84C';
const DEVICE_COLORS: Record<string, string> = {
  mobile: '#C9A84C',
  desktop: '#8B7355',
  tablet: '#718096',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-widest text-cream-muted/40 mb-1">{label}</p>
      <p className="text-3xl font-serif font-bold text-gold leading-none">{value}</p>
      {sub && <p className="text-xs text-cream-muted/50 mt-1">{sub}</p>}
    </div>
  );
}

const tableCell = 'px-3 py-2.5 text-sm text-cream-muted/80 text-left';
const tableHead = 'px-3 py-2 text-[10px] uppercase tracking-widest text-cream-muted/40 text-left border-b border-border';

export function AnalyticsDashboard({
  totalPageViews,
  uniqueSessions,
  mostViewedPub,
  mostSearchedTerm,
  reviewConversion,
  topPubs,
  dailySessions,
  deviceBreakdown,
  topSearchTerms,
  recentSearches,
  recentPubViews,
  topReferrers,
  latestSummary,
}: Props) {
  const [summary, setSummary] = useState<string | null>(latestSummary?.summary_text ?? null);
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<string | null>(
    latestSummary?.created_at ?? null
  );
  const [generating, setGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const conversionRate =
    reviewConversion.started > 0
      ? Math.round((reviewConversion.submitted / reviewConversion.started) * 100)
      : null;

  async function generateSummary() {
    setGenerating(true);
    setSummaryError(null);
    try {
      const res = await fetch('/api/admin/analytics/summary', { method: 'POST' });
      const json = await res.json() as { summary?: string; error?: string };
      if (!res.ok) {
        setSummaryError(json.error ?? 'Failed to generate summary');
      } else {
        setSummary(json.summary ?? null);
        setSummaryGeneratedAt(new Date().toISOString());
      }
    } catch {
      setSummaryError('Network error — try again');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Analytics</h1>
          <p className="text-sm text-cream-muted/50 mt-0.5">Last 30 days</p>
        </div>
      </div>

      {/* ── AI Summary ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-5 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-gold">AI Summary</span>
            {summaryGeneratedAt && (
              <span className="text-xs text-cream-muted/40">
                Generated {formatDate(summaryGeneratedAt)}
              </span>
            )}
          </div>
          <button
            onClick={generateSummary}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-gold/40 text-gold text-sm hover:bg-gold/10 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? 'Generating…' : summary ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>
        {summaryError && (
          <p className="text-sm text-red-400">{summaryError}</p>
        )}
        {summary && (
          <p className="text-sm text-cream-muted leading-relaxed whitespace-pre-wrap">{summary}</p>
        )}
        {!summary && !generating && !summaryError && (
          <p className="text-sm text-cream-muted/40 italic">
            Click &ldquo;Generate Summary&rdquo; to get an AI analysis of the last 30 days.
          </p>
        )}
      </div>

      {/* ── Header stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Page Views" value={totalPageViews} />
        <StatCard label="Unique Sessions" value={uniqueSessions} />
        <StatCard
          label="Most Viewed Pub"
          value={mostViewedPub?.name ?? '—'}
          sub={mostViewedPub ? `${mostViewedPub.views} views` : undefined}
        />
        <StatCard
          label="Top Search"
          value={mostSearchedTerm?.query ?? '—'}
          sub={mostSearchedTerm ? `${mostSearchedTerm.count} searches` : undefined}
        />
        <StatCard
          label="Review Conversion"
          value={conversionRate !== null ? `${conversionRate}%` : '—'}
          sub={
            reviewConversion.started > 0
              ? `${reviewConversion.submitted}/${reviewConversion.started} submitted`
              : undefined
          }
        />
      </div>

      {/* ── Charts ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar: page views per pub */}
        {topPubs.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-cream-muted/40">Top Pubs by Views</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topPubs} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: '#aaa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 16) + '…' : v)}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#e8d5a0' }}
                  cursor={{ fill: 'rgba(201,168,76,0.08)' }}
                />
                <Bar dataKey="count" fill={GOLD} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Line: daily sessions */}
        {dailySessions.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-cream-muted/40">Daily Sessions (30 days)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailySessions} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#aaa', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#e8d5a0' }}
                />
                <Line type="monotone" dataKey="sessions" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie: device breakdown */}
        {deviceBreakdown.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-cream-muted/40">Device Types</p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={deviceBreakdown} dataKey="count" nameKey="device" innerRadius={40} outerRadius={70}>
                    {deviceBreakdown.map((entry) => (
                      <Cell key={entry.device} fill={DEVICE_COLORS[entry.device] ?? '#555'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#e8d5a0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {deviceBreakdown.map((d) => (
                  <div key={d.device} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: DEVICE_COLORS[d.device] ?? '#555' }}
                    />
                    <span className="text-sm text-cream-muted capitalize">{d.device}</span>
                    <span className="text-sm font-bold text-cream">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bar: top search terms */}
        {topSearchTerms.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-cream-muted/40">Top Search Terms</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSearchTerms} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="query"
                  width={100}
                  tick={{ fill: '#aaa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 14) + '…' : v)}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#e8d5a0' }}
                  cursor={{ fill: 'rgba(201,168,76,0.08)' }}
                />
                <Bar dataKey="count" fill="#8B7355" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Tables ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-xs uppercase tracking-widest text-cream-muted/40">Recent Searches</p>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHead}>Time</th>
                  <th className={tableHead}>Query</th>
                  <th className={tableHead}>Results</th>
                </tr>
              </thead>
              <tbody>
                {recentSearches.map((s, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-surface-2/30">
                    <td className={tableCell}>{formatDate(s.created_at)}</td>
                    <td className={tableCell + ' max-w-[160px] truncate'}>{s.search_query}</td>
                    <td className={tableCell}>{s.results_count ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent pub views */}
        {recentPubViews.length > 0 && (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-xs uppercase tracking-widest text-cream-muted/40">Recent Pub Views</p>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHead}>Time</th>
                  <th className={tableHead}>Pub</th>
                  <th className={tableHead}>Device</th>
                </tr>
              </thead>
              <tbody>
                {recentPubViews.map((v, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-surface-2/30">
                    <td className={tableCell}>{formatDate(v.created_at)}</td>
                    <td className={tableCell + ' max-w-[160px] truncate'}>{v.pub_name}</td>
                    <td className={tableCell + ' capitalize'}>{v.device_type ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Top referrers */}
        {topReferrers.length > 0 && (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-xs uppercase tracking-widest text-cream-muted/40">Top Referrers</p>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHead}>Source</th>
                  <th className={tableHead}>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.map((r, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-surface-2/30">
                    <td className={tableCell + ' max-w-[240px] truncate text-xs font-mono'}>
                      {r.referrer === 'Direct' ? 'Direct / none' : r.referrer}
                    </td>
                    <td className={tableCell}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPageViews === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-cream-muted/40 text-sm">No analytics data yet.</p>
          <p className="text-cream-muted/30 text-xs mt-1">
            Events will appear here once the analytics table migration has been applied.
          </p>
        </div>
      )}
    </div>
  );
}
