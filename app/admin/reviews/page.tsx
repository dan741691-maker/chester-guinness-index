import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllPubs } from '@/services/pubs';
import { getAllReviews } from '@/services/reviews';
import { ReviewsListClient } from '@/components/admin/reviews-list-client';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Manage Reviews' };
export const revalidate = 0;

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const roleRes = user
    ? await supabase.from('reviewer_profiles').select('role').eq('user_id', user.id).single()
    : null;
  const role = roleRes?.data?.role ?? 'reviewer';
  const isAdmin = role === 'admin';
  const currentUserId = user?.id ?? null;

  const [pubs, allReviews] = await Promise.all([getAllPubs(), getAllReviews()]);

  // Reviewers only see their own reviews
  const reviews = isAdmin
    ? allReviews
    : allReviews.filter((r) => r.reviewer_id === currentUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Reviews</h1>
          <p className="text-sm text-cream-muted/60 mt-0.5">
            {isAdmin ? `${reviews.length} reviews` : `${reviews.length} of your reviews`}
          </p>
        </div>
        <Button size="sm" className="gap-2" asChild>
          <Link href="/admin/reviews/new">
            <Plus className="h-4 w-4" />
            Add Review
          </Link>
        </Button>
      </div>

      <ReviewsListClient
        reviews={reviews}
        pubs={pubs}
        role={role}
        currentUserId={currentUserId}
      />
    </div>
  );
}
