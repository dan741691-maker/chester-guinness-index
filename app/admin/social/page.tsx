import type { Metadata } from 'next';
import { Share2 } from 'lucide-react';
import { getSocialPosts } from '@/services/social';
import { SocialPostCard } from '@/components/admin/social-post-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = { title: 'Social Post Drafts' };
export const revalidate = 0;

export default async function AdminSocialPage() {
  const posts = await getSocialPosts();

  const unposted = posts.filter((p) => !p.is_posted);
  const posted = posts.filter((p) => p.is_posted);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Share2 className="h-5 w-5 text-gold" />
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Social Drafts</h1>
          <p className="text-sm text-cream-muted/60 mt-0.5">
            {unposted.length} unposted · auto-generated from reviews
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {unposted.length > 0 && (
              <span className="ml-1.5 h-4 w-4 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center">
                {unposted.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="posted">Posted ({posted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {unposted.length === 0 ? (
            <div className="text-center py-12 text-cream-muted/40">
              <Share2 className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No pending posts</p>
              <p className="text-xs mt-1">Posts are auto-generated when you add a review</p>
            </div>
          ) : (
            unposted.map((post) => <SocialPostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="posted" className="space-y-4 mt-4">
          {posted.length === 0 ? (
            <div className="text-center py-12 text-cream-muted/40 text-sm">
              No posted drafts yet
            </div>
          ) : (
            posted.map((post) => <SocialPostCard key={post.id} post={post} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
