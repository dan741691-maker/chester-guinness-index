import { createClient } from '@/lib/supabase/server';
import type { Review, ReviewInsert, ReviewUpdate } from '@/types';

export async function getReviewsForPub(pubId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('pub_id', pubId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch reviews: ${error.message}`);
  return data ?? [];
}

export async function getLatestOfficialReview(pubId: string): Promise<Review | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('pub_id', pubId)
    .eq('is_official', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch review: ${error.message}`);
  }
  return data;
}

export async function getAllReviews(): Promise<(Review & { pub: { name: string; slug: string } })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*, pub:pubs(name, slug)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch reviews: ${error.message}`);
  return (data ?? []) as (Review & { pub: { name: string; slug: string } })[];
}

export async function createReview(input: ReviewInsert): Promise<Review> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create review: ${error.message}`);
  return data;
}

export async function updateReview(id: string, input: ReviewUpdate): Promise<Review> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update review: ${error.message}`);
  return data;
}

export async function deleteReview(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete review: ${error.message}`);
}
