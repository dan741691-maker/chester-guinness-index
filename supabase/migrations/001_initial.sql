-- ============================================================
-- Chester Guinness Index — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PUBS
-- ============================================================
CREATE TABLE pubs (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  address             TEXT NOT NULL,
  area                TEXT NOT NULL,
  lat                 DOUBLE PRECISION NOT NULL,
  lng                 DOUBLE PRECISION NOT NULL,
  guinness_price_gbp  NUMERIC(4, 2),
  hero_image_url      TEXT,
  current_score       INTEGER NOT NULL DEFAULT 0,
  current_rating_tier TEXT,
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pubs_slug ON pubs(slug);
CREATE INDEX idx_pubs_area ON pubs(area);
CREATE INDEX idx_pubs_current_score ON pubs(current_score DESC);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pub_id                UUID NOT NULL REFERENCES pubs(id) ON DELETE CASCADE,
  pub_look_cleanliness  INTEGER NOT NULL CHECK (pub_look_cleanliness BETWEEN 0 AND 10),
  staff                 INTEGER NOT NULL CHECK (staff BETWEEN 0 AND 10),
  glass_pour            INTEGER NOT NULL CHECK (glass_pour BETWEEN 0 AND 10),
  taste_quality         INTEGER NOT NULL CHECK (taste_quality BETWEEN 0 AND 10),
  price_score           INTEGER NOT NULL CHECK (price_score BETWEEN 0 AND 10),
  total_score           INTEGER GENERATED ALWAYS AS (
                          pub_look_cleanliness + staff + glass_pour + taste_quality + price_score
                        ) STORED,
  guinness_price_gbp    NUMERIC(4, 2),
  notes                 TEXT,
  verdict               TEXT,
  is_official           BOOLEAN NOT NULL DEFAULT TRUE,
  visited_at            DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_pub_id ON reviews(pub_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_total_score ON reviews(total_score DESC);

-- ============================================================
-- PUB IMAGES
-- ============================================================
CREATE TABLE pub_images (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pub_id      UUID NOT NULL REFERENCES pubs(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  caption     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pub_images_pub_id ON pub_images(pub_id);

-- ============================================================
-- SOCIAL POSTS
-- ============================================================
CREATE TABLE social_posts (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id   UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  pub_id      UUID NOT NULL REFERENCES pubs(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_posted   BOOLEAN NOT NULL DEFAULT FALSE,
  platform    TEXT DEFAULT 'twitter',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_posts_review_id ON social_posts(review_id);
CREATE INDEX idx_social_posts_is_posted ON social_posts(is_posted);

-- ============================================================
-- TRIGGER: update pubs.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pubs_updated_at
  BEFORE UPDATE ON pubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: sync pub current_score after new official review
-- ============================================================
CREATE OR REPLACE FUNCTION sync_pub_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total_score INTEGER;
  v_tier        TEXT;
BEGIN
  IF NEW.is_official = TRUE THEN
    v_total_score := NEW.total_score;

    -- Determine rating tier
    v_tier := CASE
      WHEN v_total_score >= 46 THEN 'Legendary'
      WHEN v_total_score >= 41 THEN 'Elite'
      WHEN v_total_score >= 36 THEN 'Strong'
      WHEN v_total_score >= 31 THEN 'Decent'
      WHEN v_total_score >= 21 THEN 'Weak'
      ELSE 'Avoid'
    END;

    UPDATE pubs
    SET
      current_score       = v_total_score,
      current_rating_tier = v_tier,
      guinness_price_gbp  = COALESCE(NEW.guinness_price_gbp, guinness_price_gbp),
      updated_at          = NOW()
    WHERE id = NEW.pub_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_sync_pub_score
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_pub_score();

-- ============================================================
-- TRIGGER: auto-generate social post on new review
-- ============================================================
CREATE OR REPLACE FUNCTION generate_social_post()
RETURNS TRIGGER AS $$
DECLARE
  v_pub_name      TEXT;
  v_tier          TEXT;
  v_price         TEXT;
  v_content       TEXT;
BEGIN
  SELECT name INTO v_pub_name FROM pubs WHERE id = NEW.pub_id;

  v_tier := CASE
    WHEN NEW.total_score >= 46 THEN 'Legendary'
    WHEN NEW.total_score >= 41 THEN 'Elite'
    WHEN NEW.total_score >= 36 THEN 'Strong'
    WHEN NEW.total_score >= 31 THEN 'Decent'
    WHEN NEW.total_score >= 21 THEN 'Weak'
    ELSE 'Avoid'
  END;

  v_price := CASE
    WHEN NEW.guinness_price_gbp IS NOT NULL THEN '£' || NEW.guinness_price_gbp::TEXT
    ELSE 'N/A'
  END;

  v_content :=
    '🍺 Chester Guinness Review' || chr(10) ||
    chr(10) ||
    '📍 ' || v_pub_name || chr(10) ||
    'Score: ' || NEW.total_score || '/50 (' || v_tier || ')' || chr(10) ||
    chr(10) ||
    'Look & Cleanliness: ' || NEW.pub_look_cleanliness || '/10' || chr(10) ||
    'Staff: ' || NEW.staff || '/10' || chr(10) ||
    'Glass / Pour: ' || NEW.glass_pour || '/10' || chr(10) ||
    'Taste / Quality: ' || NEW.taste_quality || '/10' || chr(10) ||
    'Price: ' || NEW.price_score || '/10' || chr(10) ||
    chr(10) ||
    'Guinness Price: ' || v_price || chr(10) ||
    chr(10) ||
    'Verdict:' || chr(10) ||
    COALESCE(NEW.verdict, '—') || chr(10) ||
    chr(10) ||
    '#Chester #Guinness #PintReview';

  INSERT INTO social_posts (review_id, pub_id, content)
  VALUES (NEW.id, NEW.pub_id, v_content);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_generate_social_post
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION generate_social_post();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE pubs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pub_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "pubs_public_read"       ON pubs         FOR SELECT USING (TRUE);
CREATE POLICY "reviews_public_read"    ON reviews      FOR SELECT USING (TRUE);
CREATE POLICY "pub_images_public_read" ON pub_images   FOR SELECT USING (TRUE);

-- Authenticated write access (admin only)
CREATE POLICY "pubs_admin_insert"           ON pubs         FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pubs_admin_update"           ON pubs         FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "pubs_admin_delete"           ON pubs         FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "reviews_admin_insert"        ON reviews      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "reviews_admin_update"        ON reviews      FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "reviews_admin_delete"        ON reviews      FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "pub_images_admin_insert"     ON pub_images   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pub_images_admin_delete"     ON pub_images   FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "social_posts_admin_select"   ON social_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "social_posts_admin_insert"   ON social_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "social_posts_admin_update"   ON social_posts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "social_posts_admin_delete"   ON social_posts FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pub-images', 'pub-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "pub_images_public_storage_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pub-images');

CREATE POLICY "pub_images_admin_storage_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pub-images' AND auth.role() = 'authenticated');

CREATE POLICY "pub_images_admin_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pub-images' AND auth.role() = 'authenticated');
