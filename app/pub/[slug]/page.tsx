import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, PoundSterling, ArrowLeft, Calendar } from 'lucide-react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getPubBySlug } from '@/services/pubs';
import { ScoreRing, ScoreBreakdown } from '@/components/pub/score-display';
import { RatingBadge } from '@/components/pub/rating-badge';
import { ReviewHistory } from '@/components/pub/review-history';
import { PhotoGallery } from '@/components/pub/photo-gallery';
import { PubHeroImage } from '@/components/pub/pub-hero-image';
import { ReviewImage } from '@/components/pub/review-image';
import { ReviewerAvatar } from '@/components/pub/reviewer-avatar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatScore } from '@/lib/utils';
import { brand } from '@/lib/brand';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Use a standalone client (no cookies) so this works during build time
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.from('pubs').select('slug');
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pub = await getPubBySlug(slug);
  if (!pub) return { title: 'Pub not found' };

  return {
    title: pub.name,
    description: `Guinness review for ${pub.name}, Chester. Score: ${formatScore(pub.current_score)}/50 — ${pub.current_rating_tier ?? ''} | ${brand.siteName}`,
  };
}

export const revalidate = 30;

export default async function PubPage({ params }: Props) {
  const { slug } = await params;
  const pub = await getPubBySlug(slug);
  if (!pub) notFound();

  // Only show official AND published reviews publicly
  const officialReviews = pub.reviews
    .filter((r) => r.is_official && (r.is_published !== false))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const latestReview = officialReviews[0] ?? null;

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <Header />

      <main className="flex-1 pt-14">
        {/* Hero — pub cover → latest review image → placeholder */}
        <div className="relative h-56 sm:h-72 md:h-96 bg-surface-2 overflow-hidden">
          <PubHeroImage
            src={pub.hero_image_url}
            fallbackSrc={latestReview?.image_url ?? null}
            alt={pub.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-black/40 to-transparent" />

          {/* Back */}
          <Link
            href="/"
            className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-cream/80 hover:text-cream bg-black/50 backdrop-blur-sm rounded-md px-3 py-1.5 border border-border/40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Map
          </Link>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 -mt-16 relative z-10">
          {/* Pub identity */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cream leading-tight">
                {pub.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-2 text-sm text-cream-muted/70">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{pub.address}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs uppercase tracking-widest text-gold/70 border border-gold/20 rounded-sm px-2 py-0.5">
                  {pub.area}
                </span>
                {pub.guinness_price_gbp && (
                  <span className="flex items-center gap-1 text-sm text-cream-muted/70">
                    <PoundSterling className="h-3.5 w-3.5" />
                    {Number(pub.guinness_price_gbp).toFixed(2)}
                  </span>
                )}
                {latestReview?.visited_at && (
                  <span className="flex items-center gap-1 text-xs text-cream-muted/50">
                    <Calendar className="h-3 w-3" />
                    {formatDate(latestReview.visited_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Score */}
            {pub.current_score > 0 && (
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <ScoreRing score={pub.current_score} size="lg" />
                <RatingBadge score={pub.current_score} size="lg" />
              </div>
            )}
          </div>

          {/* Description */}
          {pub.description && (
            <p className="text-cream-muted leading-relaxed mb-6 text-sm">{pub.description}</p>
          )}

          <Separator className="mb-6" />

          {/* Tabs */}
          <Tabs defaultValue="review">
            <TabsList className="mb-6">
              <TabsTrigger value="review">Latest Review</TabsTrigger>
              <TabsTrigger value="history">All Reviews ({officialReviews.length})</TabsTrigger>
              {pub.images.length > 0 && (
                <TabsTrigger value="photos">Photos ({pub.images.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="review">
              {latestReview ? (
                <div className="space-y-6">
                  <ScoreBreakdown review={latestReview} />
                  <Separator />
                  {latestReview.notes && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-cream-muted/40 mb-2">Notes</p>
                      <p className="text-sm text-cream-muted leading-relaxed">{latestReview.notes}</p>
                    </div>
                  )}
                  {latestReview.verdict && (
                    <div className="border-l-2 border-gold/50 pl-4">
                      <p className="text-xs uppercase tracking-widest text-gold/60 mb-1">Verdict</p>
                      <p className="font-serif italic text-cream text-base leading-relaxed">
                        &ldquo;{latestReview.verdict}&rdquo;
                      </p>
                    </div>
                  )}
                  {latestReview.image_url && (
                    <ReviewImage src={latestReview.image_url} />
                  )}
                  {latestReview.reviewer?.avatar_url && (
                    <div className="flex items-center gap-2 pt-2">
                      <ReviewerAvatar reviewer={latestReview.reviewer} size={28} />
                      <span className="text-[10px] uppercase tracking-widest text-cream-muted/30">
                        {latestReview.reviewer.display_name}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-cream-muted/50 text-center py-8">No review yet</p>
              )}
            </TabsContent>

            <TabsContent value="history">
              <ReviewHistory reviews={officialReviews} />
            </TabsContent>

            {pub.images.length > 0 && (
              <TabsContent value="photos">
                <PhotoGallery images={pub.images} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
