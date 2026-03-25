import { createClient } from '@/lib/supabase/server';
import type { SocialPost } from '@/types';

export async function getSocialPosts(): Promise<
  (SocialPost & { pub: { name: string; slug: string } })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('social_posts')
    .select('*, pub:pubs(name, slug)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch social posts: ${error.message}`);
  return (data ?? []) as (SocialPost & { pub: { name: string; slug: string } })[];
}

export async function markPostAsPosted(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('social_posts')
    .update({ is_posted: true })
    .eq('id', id);

  if (error) throw new Error(`Failed to update post: ${error.message}`);
}

export async function updatePostContent(id: string, content: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('social_posts')
    .update({ content })
    .eq('id', id);

  if (error) throw new Error(`Failed to update post: ${error.message}`);
}

export async function deleteSocialPost(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('social_posts').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete post: ${error.message}`);
}
