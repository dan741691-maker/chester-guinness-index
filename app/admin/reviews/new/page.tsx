import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllPubs } from '@/services/pubs';
import { ReviewForm } from '@/components/admin/review-form';

export const metadata: Metadata = { title: 'Add New Review' };

interface Props {
  searchParams: Promise<{ pub?: string }>;
}

export default async function NewReviewPage({ searchParams }: Props) {
  const { pub: defaultPubId } = await searchParams;
  const pubs = await getAllPubs();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/reviews"
          className="flex items-center gap-1.5 text-sm text-cream-muted/60 hover:text-cream transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reviews
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-bold text-cream">Add Review</h1>
        <p className="text-sm text-cream-muted/60 mt-1">Score a new Guinness visit</p>
      </div>

      {pubs.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center space-y-3">
          <p className="text-cream-muted/60 text-sm">No pubs registered yet.</p>
          <Link href="/admin/pubs/new" className="text-gold text-sm hover:underline">
            Add a pub first →
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-5">
          <ReviewForm
            pubs={pubs}
            defaultPubId={defaultPubId}
            successRedirectUrl="/admin/reviews"
          />
        </div>
      )}
    </div>
  );
}
