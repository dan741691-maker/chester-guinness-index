import type { Database } from './database';

export type Pub = Database['public']['Tables']['pubs']['Row'];
export type PubInsert = Database['public']['Tables']['pubs']['Insert'];
export type PubUpdate = Database['public']['Tables']['pubs']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

export type PubImage = Database['public']['Tables']['pub_images']['Row'];
export type SocialPost = Database['public']['Tables']['social_posts']['Row'];
export type ReviewerProfile = Database['public']['Tables']['reviewer_profiles']['Row'];

/** Slim reviewer data joined onto a review query */
export interface ReviewerSummary {
  display_name: string;
  avatar_url: string | null;
  accent_color: string;
}

/** Review with the reviewer_profiles join included */
export interface ReviewWithReviewer extends Review {
  reviewer: ReviewerSummary | null;
}

export interface PubWithReviews extends Pub {
  reviews: ReviewWithReviewer[];
  images: PubImage[];
}

export interface PubWithLatestImage extends Pub {
  latest_review_image_url: string | null;
  /** 1-based rank within the pub's area. null if outside top 10 or unranked. */
  city_rank?: number | null;
  /** 1-based rank across all pubs in the index. null if outside top 10 or unranked. */
  country_rank?: number | null;
}

export interface RatingTier {
  label: string;
  min: number;
  max: number;
  color: string;
  bgClass: string;
  textClass: string;
}

export interface FilterState {
  area: string;
  minScore: number;
  maxPrice: number | null;
  search: string;
}

export interface ScoreCategory {
  key: keyof Pick<Review, 'pub_look_cleanliness' | 'staff' | 'glass_pour' | 'taste_quality' | 'price_score'>;
  label: string;
  icon: string;
}
