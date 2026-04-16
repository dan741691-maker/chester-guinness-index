import { Suspense } from 'react';
import { getAllPubs, getAvgScoresPerPub } from '@/services/pubs';
import { getDanielOfficialLeaderboard } from '@/services/reviewers';
import { getRatingTier, computePubRanks } from '@/lib/utils';
import { MapExplorer } from './map-explorer';
import { Header } from '@/components/layout/header';
import { TrackPageView } from '@/components/layout/track-page-view';

export const revalidate = 60;

export default async function HomePage() {
  const [rawPubs, officialLeaderboard, avgScores] = await Promise.all([
    getAllPubs({ activeOnly: true, scoredOnly: true }),
    getDanielOfficialLeaderboard(),
    getAvgScoresPerPub(),
  ]);

  // Build pubs with average scores (All Reviews tab).
  // Override current_score with the cross-reviewer average and
  // recalculate the tier label from that average.
  const scoredPubs = rawPubs
    .map((pub) => {
      const avg = avgScores.get(pub.id);
      if (avg === undefined) return null; // no reviews yet — skip
      return {
        ...pub,
        current_score: avg,
        current_rating_tier: getRatingTier(avg).label,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.current_score - a.current_score);

  // Attach city + country rank badges (top 10 only)
  const rankMap = computePubRanks(scoredPubs);
  const pubs = scoredPubs.map((pub) => {
    const ranks = rankMap.get(pub.id);
    return { ...pub, city_rank: ranks?.cityRank ?? null, country_rank: ranks?.countryRank ?? null };
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TrackPageView event="homepage_view" />
      <TrackPageView event="session_start" />
      <Header />
      <main className="flex flex-1 overflow-hidden pt-14">
        <Suspense fallback={null}>
          <MapExplorer initialPubs={pubs} officialLeaderboard={officialLeaderboard} />
        </Suspense>
      </main>
    </div>
  );
}
