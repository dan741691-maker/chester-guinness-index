-- Migration: Add admin management fields
-- Run this in your Supabase SQL editor before using the updated admin system

-- Pubs: add postcode and is_active
ALTER TABLE pubs
  ADD COLUMN IF NOT EXISTS postcode TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Reviews: add is_published and image_url
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing reviews to published (they were all visible before this migration)
UPDATE reviews SET is_published = TRUE WHERE is_published IS NULL;

-- Index for common admin query pattern
CREATE INDEX IF NOT EXISTS idx_reviews_official_published ON reviews (pub_id, is_official, is_published, created_at DESC);
