import { createClient } from '@/lib/supabase/server';

export interface ReviewerStat {
  user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  accent_color: string;
  total_reviews: number;
  avg_score: number;
  highest_rated_pub_name: string | null;
  highest_rated_pub_slug: string | null;
  highest_rated_score: number | null;
  last_review_at: string | null;
}

export interface ReviewerLeaderboardData {
  reviewers: ReviewerStat[];
  totalReviews: number;
  totalPubsReviewed: number;
  mostActiveReviewer: string;
}

export async function getReviewerLeaderboard(): Promise<ReviewerLeaderboardData> {
  const supabase = await createClient();

  const [profilesResult, reviewsResult] = await Promise.all([
    supabase
      .from('reviewer_profiles')
      .select('user_id, display_name, avatar_url, accent_color'),
    supabase
      .from('reviews')
      .select('reviewer_id, total_score, created_at, pub_id, pub:pubs(name, slug)')
      .eq('is_official', true),
  ]);

  const profiles = profilesResult.data ?? [];
  const reviews = reviewsResult.data ?? [];

  type ReviewRow = {
    reviewer_id: string | null;
    total_score: number;
    created_at: string;
    pub_id: string;
    pub: { name: string; slug: string } | null;
  };

  const typedReviews = reviews as unknown as ReviewRow[];

  // Group reviews by reviewer_id
  const byReviewer = new Map<string, ReviewRow[]>();
  for (const r of typedReviews) {
    if (!r.reviewer_id) continue;
    const arr = byReviewer.get(r.reviewer_id) ?? [];
    arr.push(r);
    byReviewer.set(r.reviewer_id, arr);
  }

  const reviewerStats: ReviewerStat[] = [];

  for (const profile of profiles) {
    const revs = byReviewer.get(profile.user_id ?? '') ?? [];
    if (revs.length === 0) continue;

    const totalReviews = revs.length;
    const avgScore =
      Math.round((revs.reduce((sum, r) => sum + r.total_score, 0) / totalReviews) * 10) / 10;

    const bestReview = revs.reduce((best, r) =>
      r.total_score > best.total_score ? r : best,
    );
    const lastReview = revs.reduce((latest, r) =>
      r.created_at > latest.created_at ? r : latest,
    );

    reviewerStats.push({
      user_id: profile.user_id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      accent_color: profile.accent_color,
      total_reviews: totalReviews,
      avg_score: avgScore,
      highest_rated_pub_name: bestReview.pub?.name ?? null,
      highest_rated_pub_slug: bestReview.pub?.slug ?? null,
      highest_rated_score: bestReview.total_score,
      last_review_at: lastReview.created_at,
    });
  }

  reviewerStats.sort((a, b) => b.total_reviews - a.total_reviews);

  const totalReviews = typedReviews.length;
  const totalPubsReviewed = new Set(typedReviews.map((r) => r.pub_id)).size;
  const mostActiveReviewer = reviewerStats[0]?.display_name ?? '—';

  return { reviewers: reviewerStats, totalReviews, totalPubsReviewed, mostActiveReviewer };
}

export interface OfficialPubEntry {
  pubId: string;
  pubName: string;
  pubSlug: string;
  pubArea: string;
  currentRatingTier: string | null;
  totalScore: number;
  guinnessPriceGbp: number | null;
}

export async function getDanielOfficialLeaderboard(): Promise<OfficialPubEntry[]> {
  const supabase = await createClient();

  // Find Daniel's reviewer profile by email
  const { data: danielProfile } = await supabase
    .from('reviewer_profiles')
    .select('user_id')
    .eq('email', 'daniel.siddons@chesterguinnessindex.com')
    .single();

  if (!danielProfile?.user_id) return [];

  // Fetch Daniel's official reviews ordered most recent first
  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      'total_score, pub_id, guinness_price_gbp, created_at, pub:pubs(id, name, slug, current_rating_tier, area)',
    )
    .eq('reviewer_id', danielProfile.user_id)
    .eq('is_official', true)
    .order('created_at', { ascending: false });

  if (!reviews) return [];

  type RawRow = {
    total_score: number;
    pub_id: string;
    guinness_price_gbp: number | null;
    created_at: string;
    pub: { id: string; name: string; slug: string; current_rating_tier: string | null; area: string } | null;
  };

  const rows = reviews as unknown as RawRow[];

  // De-duplicate: keep only the latest review per pub
  const seen = new Set<string>();
  const deduped: RawRow[] = [];
  for (const r of rows) {
    if (r.pub && !seen.has(r.pub_id)) {
      seen.add(r.pub_id);
      deduped.push(r);
    }
  }

  // Sort by score descending
  deduped.sort((a, b) => b.total_score - a.total_score);

  return deduped.map((r) => ({
    pubId: r.pub!.id,
    pubName: r.pub!.name,
    pubSlug: r.pub!.slug,
    pubArea: r.pub!.area,
    currentRatingTier: r.pub!.current_rating_tier,
    totalScore: r.total_score,
    guinnessPriceGbp: r.guinness_price_gbp,
  }));
}
