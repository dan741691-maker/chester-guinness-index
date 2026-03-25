import { createClient } from '@/lib/supabase/server';
import type { ReviewerProfile } from '@/types';

function toDisplayName(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Get the reviewer profile for a user, creating it if it doesn't exist yet. */
export async function getOrCreateReviewerProfile(
  userId: string,
  email: string,
): Promise<ReviewerProfile | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('reviewer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing as ReviewerProfile;

  const { data: created } = await supabase
    .from('reviewer_profiles')
    .insert({ user_id: userId, email, display_name: toDisplayName(email) })
    .select()
    .single();

  return (created as ReviewerProfile) ?? null;
}

export async function updateReviewerProfile(
  userId: string,
  input: { display_name?: string; avatar_url?: string | null; accent_color?: string },
): Promise<ReviewerProfile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('reviewer_profiles')
    .update(input)
    .eq('user_id', userId)
    .select()
    .single();

  return (data as ReviewerProfile) ?? null;
}
