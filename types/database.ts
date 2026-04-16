export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      pubs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          address: string;
          area: string;
          postcode: string | null;
          lat: number;
          lng: number;
          guinness_price_gbp: number | null;
          hero_image_url: string | null;
          current_score: number;
          current_rating_tier: string | null;
          description: string | null;
          is_active: boolean;
          added_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          address: string;
          area: string;
          postcode?: string | null;
          lat: number;
          lng: number;
          guinness_price_gbp?: number | null;
          hero_image_url?: string | null;
          current_score?: number;
          current_rating_tier?: string | null;
          description?: string | null;
          is_active?: boolean;
          added_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          address?: string;
          area?: string;
          postcode?: string | null;
          lat?: number;
          lng?: number;
          guinness_price_gbp?: number | null;
          hero_image_url?: string | null;
          current_score?: number;
          current_rating_tier?: string | null;
          description?: string | null;
          is_active?: boolean;
          added_by?: string | null;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          pub_id: string;
          pub_look_cleanliness: number;
          staff: number;
          glass_pour: number;
          taste_quality: number;
          price_score: number;
          total_score: number;
          guinness_price_gbp: number | null;
          notes: string | null;
          verdict: string | null;
          is_official: boolean;
          is_published: boolean;
          image_url: string | null;
          visited_at: string | null;
          created_at: string;
          reviewer_id: string | null;
        };
        Insert: {
          id?: string;
          pub_id: string;
          pub_look_cleanliness: number;
          staff: number;
          glass_pour: number;
          taste_quality: number;
          price_score: number;
          guinness_price_gbp?: number | null;
          notes?: string | null;
          verdict?: string | null;
          is_official?: boolean;
          is_published?: boolean;
          image_url?: string | null;
          visited_at?: string | null;
          created_at?: string;
          reviewer_id?: string | null;
        };
        Update: {
          pub_id?: string;
          pub_look_cleanliness?: number;
          staff?: number;
          glass_pour?: number;
          taste_quality?: number;
          price_score?: number;
          guinness_price_gbp?: number | null;
          notes?: string | null;
          verdict?: string | null;
          is_official?: boolean;
          is_published?: boolean;
          image_url?: string | null;
          visited_at?: string | null;
          reviewer_id?: string | null;
        };
      };
      pub_images: {
        Row: {
          id: string;
          pub_id: string;
          image_url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pub_id: string;
          image_url: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          pub_id?: string;
          image_url?: string;
          caption?: string | null;
        };
      };
      reviewer_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          display_name: string;
          avatar_url: string | null;
          accent_color: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          display_name?: string;
          avatar_url?: string | null;
          accent_color?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          accent_color?: string;
          role?: string;
          updated_at?: string;
        };
      };
      social_posts: {
        Row: {
          id: string;
          review_id: string;
          pub_id: string;
          content: string;
          is_posted: boolean;
          platform: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          pub_id: string;
          content: string;
          is_posted?: boolean;
          platform?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          is_posted?: boolean;
          platform?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
