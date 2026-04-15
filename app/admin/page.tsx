import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, Share2, Trophy, TrendingUp, CheckCircle, BarChart3, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { brand } from '@/lib/brand';

export const metadata: Metadata = { title: 'Admin Dashboard' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch current user's role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const roleRes = user
    ? await supabase
        .from('reviewer_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()
    : null;
  const role = roleRes?.data?.role ?? 'reviewer';
  const isAdmin = role === 'admin';

  // Reviewer simplified dashboard
  if (!isAdmin && user) {
    const [myReviewsRes, myAvgRes] = await Promise.all([
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('reviewer_id', user.id),
      supabase.from('reviews').select('total_score').eq('reviewer_id', user.id),
    ]);

    const latestMyReview = await supabase
      .from('reviews')
      .select('*, pub:pubs(name, slug)')
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const myScores = myAvgRes.data?.map((r) => r.total_score) ?? [];
    const myAvg =
      myScores.length > 0
        ? Math.round((myScores.reduce((a, b) => a + b, 0) / myScores.length) * 10) / 10
        : null;

    const latestReview = latestMyReview.data;
    const latestPubName =
      latestReview && typeof latestReview.pub === 'object' && latestReview.pub
        ? (latestReview.pub as { name: string }).name
        : null;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Dashboard</h1>
          <p className="text-sm text-cream-muted/60 mt-1">{brand.siteName}</p>
        </div>

        {/* My stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-surface">
            <Star className="h-4 w-4 text-cream-muted/40" />
            <div>
              <p className="text-2xl font-bold font-serif text-cream">{myReviewsRes.count ?? 0}</p>
              <p className="text-xs text-cream-muted/50 mt-0.5">My Reviews</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-surface">
            <BarChart3 className="h-4 w-4 text-cream-muted/40" />
            <div>
              <p className="text-2xl font-bold font-serif text-cream">
                {myAvg !== null ? `${myAvg}/50` : '—'}
              </p>
              <p className="text-xs text-cream-muted/50 mt-0.5">Avg Score</p>
            </div>
          </div>
        </div>

        {/* Latest review */}
        {latestReview && latestPubName && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-cream-muted/40" />
              <p className="text-xs uppercase tracking-widest text-cream-muted/40">Latest Review</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif font-semibold text-cream">{latestPubName}</p>
                <p className="text-xs text-cream-muted/50 mt-0.5">
                  {formatDate(latestReview.created_at)}
                </p>
              </div>
              <p className="font-serif font-bold text-2xl text-cream">
                {latestReview.total_score}
                <span className="text-xs text-cream-muted/40">/50</span>
              </p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <p className="text-xs uppercase tracking-widest text-cream-muted/40 mb-3">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/admin/reviews/new"
              className="flex items-center gap-3 p-4 rounded-lg border border-gold/30 bg-gold/5 hover:bg-gold/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-gold group-hover:text-gold transition-colors">
                  Add Review
                </p>
                <p className="text-xs text-cream-muted/50">Score a new Guinness</p>
              </div>
            </Link>
            <Link
              href="/admin/pubs/new"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
            >
              <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                  Add Pub
                </p>
                <p className="text-xs text-cream-muted/50">Register a new pub</p>
              </div>
            </Link>
            <Link
              href="/admin/reviews"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
            >
              <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                  My Reviews
                </p>
                <p className="text-xs text-cream-muted/50">View and edit your reviews</p>
              </div>
            </Link>
            <Link
              href="/leaderboard"
              target="_blank"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
            >
              <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                  Leaderboard
                </p>
                <p className="text-xs text-cream-muted/50">View public rankings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [pubsRes, reviewsRes, socialRes, reviewedPubsRes, latestReviewRes, avgScoreRes] =
    await Promise.all([
      supabase.from('pubs').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase
        .from('social_posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_posted', false),
      // Pubs with at least one review (current_score > 0)
      supabase
        .from('pubs')
        .select('id', { count: 'exact', head: true })
        .gt('current_score', 0),
      // Latest review
      supabase
        .from('reviews')
        .select('*, pub:pubs(name, slug)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      // Average score across reviewed pubs
      supabase.from('pubs').select('current_score').gt('current_score', 0),
    ]);

  const topPub = await supabase
    .from('pubs')
    .select('name, current_score, current_rating_tier, slug')
    .order('current_score', { ascending: false })
    .gt('current_score', 0)
    .limit(1)
    .single();

  const scores = avgScoreRes.data?.map((p) => p.current_score) ?? [];
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  const latestReview = latestReviewRes.data;
  const latestPubName =
    latestReview && typeof latestReview.pub === 'object' && latestReview.pub
      ? (latestReview.pub as { name: string }).name
      : null;

  const statCards = [
    {
      label: 'Total Pubs',
      value: pubsRes.count ?? 0,
      icon: MapPin,
      href: '/admin/pubs',
      sub: 'registered',
    },
    {
      label: 'Reviewed',
      value: reviewedPubsRes.count ?? 0,
      icon: CheckCircle,
      href: '/admin/pubs',
      sub: 'with scores',
    },
    {
      label: 'Reviews',
      value: reviewsRes.count ?? 0,
      icon: Star,
      href: '/admin/reviews',
      sub: 'total',
    },
    {
      label: 'Avg Score',
      value: avgScore !== null ? `${avgScore}/50` : '—',
      icon: BarChart3,
      href: '/admin/reviews',
      sub: 'across pubs',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cream">Dashboard</h1>
        <p className="text-sm text-cream-muted/60 mt-1">{brand.siteName} — Admin</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, icon: Icon, href, sub }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col gap-2 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all"
          >
            <Icon className="h-4 w-4 text-cream-muted/40" />
            <div>
              <p className="text-2xl font-bold font-serif text-cream">{value}</p>
              <p className="text-xs text-cream-muted/50 mt-0.5">{label}</p>
              <p className="text-[10px] text-cream-muted/30">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Latest review */}
      {latestReview && latestPubName && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-cream-muted/40" />
            <p className="text-xs uppercase tracking-widest text-cream-muted/40">Latest Review</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif font-semibold text-cream">{latestPubName}</p>
              <p className="text-xs text-cream-muted/50 mt-0.5">
                {formatDate(latestReview.created_at)}
                {!latestReview.is_official && (
                  <span className="ml-2 text-[10px] border border-cream-muted/20 rounded px-1 py-0.5 text-cream-muted/40">
                    unofficial
                  </span>
                )}
                {latestReview.is_published === false && (
                  <span className="ml-1 text-[10px] border border-amber-500/30 text-amber-500/70 rounded px-1 py-0.5">
                    unpublished
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="font-serif font-bold text-2xl text-cream">
                {latestReview.total_score}
                <span className="text-xs text-cream-muted/40">/50</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top pub */}
      {topPub.data && (
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-gold" />
            <p className="text-xs uppercase tracking-widest text-gold/70">Current Top Pub</p>
          </div>
          <Link href={`/pub/${topPub.data.slug}`} target="_blank" className="group">
            <p className="font-serif text-xl font-bold text-cream group-hover:text-gold transition-colors">
              {topPub.data.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold font-serif text-gold">
                {topPub.data.current_score}
                <span className="text-sm text-cream-muted/40">/50</span>
              </span>
              <span className="text-xs text-cream-muted/60">{topPub.data.current_rating_tier}</span>
            </div>
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs uppercase tracking-widest text-cream-muted/40 mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/reviews/new"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
          >
            <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
              <Star className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                Add Review
              </p>
              <p className="text-xs text-cream-muted/50">Score a new Guinness</p>
            </div>
          </Link>
          <Link
            href="/admin/pubs/new"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
          >
            <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                Add Pub
              </p>
              <p className="text-xs text-cream-muted/50">Register a new pub</p>
            </div>
          </Link>
          <Link
            href="/admin/pubs"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
          >
            <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                Manage Pubs
              </p>
              <p className="text-xs text-cream-muted/50">{pubsRes.count ?? 0} pubs registered</p>
            </div>
          </Link>
          <Link
            href="/admin/reviews"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
          >
            <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
              <Star className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                Manage Reviews
              </p>
              <p className="text-xs text-cream-muted/50">{reviewsRes.count ?? 0} reviews total</p>
            </div>
          </Link>
          <Link
            href="/leaderboard"
            target="_blank"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
          >
            <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                Leaderboard
              </p>
              <p className="text-xs text-cream-muted/50">View public rankings</p>
            </div>
          </Link>
          <Link
            href="/admin/social"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
          >
            <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                Social Drafts
              </p>
              <p className="text-xs text-cream-muted/50">
                {socialRes.count ?? 0} waiting to post
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
