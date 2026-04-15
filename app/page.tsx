import { Suspense } from 'react';
import { getAllPubs } from '@/services/pubs';
import { getDanielOfficialLeaderboard } from '@/services/reviewers';
import { MapExplorer } from './map-explorer';
import { Header } from '@/components/layout/header';

export const revalidate = 60;

export default async function HomePage() {
  const [pubs, officialLeaderboard] = await Promise.all([
    getAllPubs({ activeOnly: true, scoredOnly: true }),
    getDanielOfficialLeaderboard(),
  ]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex flex-1 overflow-hidden pt-14">
        <Suspense fallback={null}>
          <MapExplorer initialPubs={pubs} officialLeaderboard={officialLeaderboard} />
        </Suspense>
      </main>
    </div>
  );
}
