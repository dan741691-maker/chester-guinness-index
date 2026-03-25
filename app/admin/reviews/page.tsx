import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllPubs } from '@/services/pubs';
import { getAllReviews } from '@/services/reviews';
import { ReviewsListClient } from '@/components/admin/reviews-list-client';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Manage Reviews' };
export const revalidate = 0;

export default async function AdminReviewsPage() {
  const [pubs, reviews] = await Promise.all([getAllPubs(), getAllReviews()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Reviews</h1>
          <p className="text-sm text-cream-muted/60 mt-0.5">{reviews.length} reviews</p>
        </div>
        <Button size="sm" className="gap-2" asChild>
          <Link href="/admin/reviews/new">
            <Plus className="h-4 w-4" />
            Add Review
          </Link>
        </Button>
      </div>

      <ReviewsListClient reviews={reviews} pubs={pubs} />
    </div>
  );
}
