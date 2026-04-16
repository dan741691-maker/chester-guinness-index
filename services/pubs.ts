import { createClient } from '@/lib/supabase/server';
import type { Pub, PubInsert, PubUpdate, PubWithReviews, PubWithLatestImage } from '@/types';

export async function getAllPubs({ activeOnly = false, scoredOnly = false }: { activeOnly?: boolean; scoredOnly?: boolean } = {}): Promise<PubWithLatestImage[]> {
  const supabase = await createClient();
  let query = supabase.from('pubs').select('*').order('current_score', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);
  if (scoredOnly) query = query.gt('current_score', 0);
  const { data: pubs, error } = await query;
  if (error) throw new Error(`Failed to fetch pubs: ${error.message}`);
  if (!pubs?.length) return [];

  const pubRows = pubs as Pub[];

  // Fetch latest review image per pub (single query, sorted by date)
  const { data: reviewImages } = await supabase
    .from('reviews')
    .select('pub_id, image_url, created_at')
    .in('pub_id', pubRows.map((p) => p.id))
    .eq('is_official', true)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false });

  type ReviewImageRow = { pub_id: string; image_url: string | null; created_at: string };

  // Pick the most recent image per pub
  const latestImageMap = new Map<string, string>();
  for (const r of (reviewImages as ReviewImageRow[] | null) ?? []) {
    if (r.image_url && !latestImageMap.has(r.pub_id)) {
      latestImageMap.set(r.pub_id, r.image_url);
    }
  }

  return pubRows.map((pub) => ({
    ...pub,
    latest_review_image_url: latestImageMap.get(pub.id) ?? null,
  }));
}

export async function getPubBySlug(slug: string): Promise<PubWithReviews | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pubs')
    .select(`
      *,
      reviews(*, reviewer:reviewer_profiles(display_name, avatar_url, accent_color)),
      images:pub_images(*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch pub: ${error.message}`);
  }
  return data as PubWithReviews;
}

export async function getPubById(id: string): Promise<Pub | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch pub: ${error.message}`);
  }
  return data;
}

export async function createPub(input: PubInsert): Promise<Pub> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pubs')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create pub: ${error.message}`);
  return data;
}

export async function updatePub(id: string, input: PubUpdate): Promise<Pub> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pubs')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update pub: ${error.message}`);
  return data;
}

export async function deletePub(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('pubs').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete pub: ${error.message}`);
}

/**
 * Returns the average total_score across all reviews (official + unofficial)
 * for every pub, keyed by pub_id.
 */
export async function getAvgScoresPerPub(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from('reviews').select('pub_id, total_score');
  const byPub = new Map<string, number[]>();
  for (const r of ((data ?? []) as { pub_id: string; total_score: number }[])) {
    const arr = byPub.get(r.pub_id) ?? [];
    arr.push(r.total_score);
    byPub.set(r.pub_id, arr);
  }
  const avgMap = new Map<string, number>();
  for (const [pubId, scores] of byPub) {
    avgMap.set(pubId, Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10);
  }
  return avgMap;
}

export async function getLeaderboard() {
  const supabase = await createClient();

  const [topOverall, bestTaste, bestValue, bestPour, recentReviews] =
    await Promise.all([
      supabase
        .from('pubs')
        .select('*')
        .gt('current_score', 0)
        .eq('is_active', true)
        .order('current_score', { ascending: false })
        .limit(10),
      supabase
        .from('reviews')
        .select('*, pub:pubs(name, slug)')
        .order('taste_quality', { ascending: false })
        .eq('is_official', true)
        .limit(5),
      supabase
        .from('reviews')
        .select('*, pub:pubs(name, slug)')
        .order('price_score', { ascending: false })
        .eq('is_official', true)
        .limit(5),
      supabase
        .from('reviews')
        .select('*, pub:pubs(name, slug)')
        .order('glass_pour', { ascending: false })
        .eq('is_official', true)
        .limit(5),
      supabase
        .from('reviews')
        .select('*, pub:pubs(name, slug, hero_image_url)')
        .eq('is_official', true)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  return {
    topOverall: topOverall.data ?? [],
    bestTaste: bestTaste.data ?? [],
    bestValue: bestValue.data ?? [],
    bestPour: bestPour.data ?? [],
    recentReviews: recentReviews.data ?? [],
  };
}

