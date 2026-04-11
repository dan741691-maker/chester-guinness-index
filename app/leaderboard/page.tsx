import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Droplets, PoundSterling, Star, Clock, Users } from 'lucide-react';
import { getLeaderboard } from '@/services/pubs';
import { getReviewerLeaderboard } from '@/services/reviewers';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ScoreRing } from '@/components/pub/score-display';
import { RatingBadge } from '@/components/pub/rating-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatScore } from '@/lib/utils';
import { ReviewerLeaderboard } from './reviewer-leaderboard';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'The definitive ranking of Chester Guinness pubs.',
};

export const revalidate = 60;

export default async function LeaderboardPage() {
  const [
    { topOverall, bestTaste, bestValue, bestPour, recentReviews },
    reviewerData,
    supabase,
  ] = await Promise.all([
    getLeaderboard(),
    getReviewerLeaderboard(),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <Header />
      <main className="flex-1 pt-14">
        {/* Hero */}
        <div className="border-b border-border bg-surface py-10 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Trophy className="h-8 w-8 text-gold mx-auto mb-3" />
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cream mb-2">
              Leaderboard
            </h1>
            <p className="text-cream-muted/60 text-sm">
              Chester&rsquo;s finest Guinness pubs, ranked by score
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <Tabs defaultValue="overall">
            <TabsList className="mb-6 flex flex-wrap gap-1 h-auto p-1">
              <TabsTrigger value="overall" className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> Overall
              </TabsTrigger>
              <TabsTrigger value="taste" className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" /> Taste
              </TabsTrigger>
              <TabsTrigger value="value" className="flex items-center gap-1.5">
                <PoundSterling className="h-3.5 w-3.5" /> Value
              </TabsTrigger>
              <TabsTrigger value="pour" className="flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5" /> Pour
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Recent
              </TabsTrigger>
              <TabsTrigger value="reviewers" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Reviewers
              </TabsTrigger>
            </TabsList>

            {/* Overall */}
            <TabsContent value="overall">
              <div className="space-y-2">
                {topOverall.map((pub, idx) => (
                  <Link
                    key={pub.id}
                    href={`/pub/${pub.slug}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
                  >
                    <div className="w-8 text-center flex-shrink-0">
                      {idx === 0 ? (
                        <span className="text-xl">🥇</span>
                      ) : idx === 1 ? (
                        <span className="text-xl">🥈</span>
                      ) : idx === 2 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-sm font-bold font-serif text-cream-muted/40">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-cream group-hover:text-gold transition-colors truncate">
                        {pub.name}
                      </p>
                      <p className="text-xs text-cream-muted/50">{pub.area}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <RatingBadge score={pub.current_score} size="sm" />
                      <ScoreRing score={pub.current_score} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Best Taste */}
            <TabsContent value="taste">
              <p className="text-xs text-cream-muted/40 uppercase tracking-widest mb-4">
                Ranked by Taste / Quality score
              </p>
              <div className="space-y-2">
                {bestTaste.map((review: { id: string; taste_quality: number; total_score: number; pub: { name: string; slug: string } }, idx: number) => (
                  <Link
                    key={review.id}
                    href={`/pub/${review.pub.slug}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
                  >
                    <span className="text-sm font-bold font-serif text-cream-muted/40 w-6 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-cream group-hover:text-gold transition-colors truncate">
                        {review.pub.name}
                      </p>
                      <p className="text-xs text-cream-muted/50">
                        Overall: {formatScore(review.total_score)}/50
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold font-serif text-gold">
                        {formatScore(review.taste_quality)}
                        <span className="text-sm text-cream-muted/40">/10</span>
                      </p>
                      <p className="text-[10px] text-cream-muted/40 uppercase tracking-wider">Taste</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Best Value */}
            <TabsContent value="value">
              <p className="text-xs text-cream-muted/40 uppercase tracking-widest mb-4">
                Ranked by Price score
              </p>
              <div className="space-y-2">
                {bestValue.map((review: { id: string; price_score: number; guinness_price_gbp: number | null; total_score: number; pub: { name: string; slug: string } }, idx: number) => (
                  <Link
                    key={review.id}
                    href={`/pub/${review.pub.slug}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
                  >
                    <span className="text-sm font-bold font-serif text-cream-muted/40 w-6 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-cream group-hover:text-gold transition-colors truncate">
                        {review.pub.name}
                      </p>
                      {review.guinness_price_gbp && (
                        <p className="text-xs text-cream-muted/50">
                          £{Number(review.guinness_price_gbp).toFixed(2)} per pint
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold font-serif text-gold">
                        {formatScore(review.price_score)}
                        <span className="text-sm text-cream-muted/40">/10</span>
                      </p>
                      <p className="text-[10px] text-cream-muted/40 uppercase tracking-wider">Value</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Best Pour */}
            <TabsContent value="pour">
              <p className="text-xs text-cream-muted/40 uppercase tracking-widest mb-4">
                Ranked by Glass / Pour score
              </p>
              <div className="space-y-2">
                {bestPour.map((review: { id: string; glass_pour: number; total_score: number; pub: { name: string; slug: string } }, idx: number) => (
                  <Link
                    key={review.id}
                    href={`/pub/${review.pub.slug}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
                  >
                    <span className="text-sm font-bold font-serif text-cream-muted/40 w-6 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-cream group-hover:text-gold transition-colors truncate">
                        {review.pub.name}
                      </p>
                      <p className="text-xs text-cream-muted/50">
                        Overall: {formatScore(review.total_score)}/50
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold font-serif text-gold">
                        {formatScore(review.glass_pour)}
                        <span className="text-sm text-cream-muted/40">/10</span>
                      </p>
                      <p className="text-[10px] text-cream-muted/40 uppercase tracking-wider">Pour</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Recent */}
            <TabsContent value="recent">
              <p className="text-xs text-cream-muted/40 uppercase tracking-widest mb-4">
                Most recently reviewed
              </p>
              <div className="space-y-2">
                {recentReviews.map((review: { id: string; total_score: number; created_at: string; verdict: string | null; pub: { name: string; slug: string; hero_image_url?: string | null } }) => (
                  <Link
                    key={review.id}
                    href={`/pub/${review.pub.slug}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-gold/30 hover:bg-surface transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-cream group-hover:text-gold transition-colors truncate">
                        {review.pub.name}
                      </p>
                      {review.verdict && (
                        <p className="text-xs text-cream-muted/50 truncate italic mt-0.5">
                          &ldquo;{review.verdict}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-cream-muted/40 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <RatingBadge score={review.total_score} size="sm" />
                      <ScoreRing score={review.total_score} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Reviewers */}
            <TabsContent value="reviewers">
              <ReviewerLeaderboard
                reviewers={reviewerData.reviewers}
                totalReviews={reviewerData.totalReviews}
                totalPubsReviewed={reviewerData.totalPubsReviewed}
                mostActiveReviewer={reviewerData.mostActiveReviewer}
                currentUserId={currentUserId}
              />
            </TabsContent>
          </Tabs>

          <Separator className="my-8" />

          {/* Footer note */}
          <p className="text-center text-xs text-cream-muted/30">
            Rankings update automatically with each official review.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
