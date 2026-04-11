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
