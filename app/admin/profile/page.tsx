import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateReviewerProfile } from '@/services/reviewer-profiles';
import { ProfileForm } from '@/components/admin/profile-form';

export const metadata: Metadata = { title: 'Reviewer Profile' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Auto-creates the row on first visit
  const profile = await getOrCreateReviewerProfile(user.id, user.email!);
  if (!profile) redirect('/admin');

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cream">Reviewer Profile</h1>
        <p className="text-sm text-cream-muted/60 mt-1">
          Your avatar and colour shown on public reviews.
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
