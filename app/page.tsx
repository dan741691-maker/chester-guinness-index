import { Suspense } from 'react';
import { getAllPubs } from '@/services/pubs';
import { MapExplorer } from './map-explorer';
import { Header } from '@/components/layout/header';

export const revalidate = 60;

export default async function HomePage() {
  const pubs = await getAllPubs({ activeOnly: true });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex flex-1 overflow-hidden pt-14">
        <Suspense fallback={null}>
          <MapExplorer initialPubs={pubs} />
        </Suspense>
      </main>
    </div>
  );
}
