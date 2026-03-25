CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pubs (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                text NOT NULL,
  slug                text NOT NULL UNIQUE,
  address             text NOT NULL DEFAULT '',
  area                text NOT NULL DEFAULT '',
  postcode            text,
  lat                 numeric(10,7) NOT NULL DEFAULT 0,
  lng                 numeric(10,7) NOT NULL DEFAULT 0,
  guinness_price_gbp  numeric(5,2),
  hero_image_url      text,
  current_score       integer NOT NULL DEFAULT 0,
  current_rating_tier text,
  description         text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pubs ADD COLUMN IF NOT EXISTS postcode            text;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS guinness_price_gbp  numeric(5,2);
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS hero_image_url      text;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS current_score       integer NOT NULL DEFAULT 0;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS current_rating_tier text;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS description         text;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS is_active           boolean NOT NULL DEFAULT true;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS created_at          timestamptz NOT NULL DEFAULT now();
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS reviews (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pub_id                uuid NOT NULL REFERENCES pubs(id) ON DELETE CASCADE,
  pub_look_cleanliness  integer NOT NULL DEFAULT 5 CHECK (pub_look_cleanliness BETWEEN 0 AND 10),
  staff                 integer NOT NULL DEFAULT 5 CHECK (staff BETWEEN 0 AND 10),
  glass_pour            integer NOT NULL DEFAULT 5 CHECK (glass_pour BETWEEN 0 AND 10),
  taste_quality         integer NOT NULL DEFAULT 5 CHECK (taste_quality BETWEEN 0 AND 10),
  price_score           integer NOT NULL DEFAULT 5 CHECK (price_score BETWEEN 0 AND 10),
  total_score           integer NOT NULL DEFAULT 0,
  guinness_price_gbp    numeric(5,2),
  notes                 text,
  verdict               text,
  is_official           boolean NOT NULL DEFAULT true,
  is_published          boolean NOT NULL DEFAULT true,
  image_url             text,
  visited_at            date,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS total_score          integer NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS guinness_price_gbp   numeric(5,2);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS notes                text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verdict              text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_official          boolean NOT NULL DEFAULT true;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_published         boolean NOT NULL DEFAULT true;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url            text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS visited_at           date;

CREATE TABLE IF NOT EXISTS pub_images (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pub_id      uuid NOT NULL REFERENCES pubs(id) ON DELETE CASCADE,
  image_url   text NOT NULL,
  caption     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pub_images ADD COLUMN IF NOT EXISTS caption text;

CREATE TABLE IF NOT EXISTS social_posts (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id   uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  pub_id      uuid NOT NULL REFERENCES pubs(id) ON DELETE CASCADE,
  content     text NOT NULL DEFAULT '',
  is_posted   boolean NOT NULL DEFAULT false,
  platform    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS platform text;

CREATE INDEX IF NOT EXISTS idx_pubs_slug          ON pubs(slug);
CREATE INDEX IF NOT EXISTS idx_pubs_is_active     ON pubs(is_active);
CREATE INDEX IF NOT EXISTS idx_pubs_score         ON pubs(current_score DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_pub_id     ON reviews(pub_id);
CREATE INDEX IF NOT EXISTS idx_reviews_official   ON reviews(is_official);
CREATE INDEX IF NOT EXISTS idx_reviews_created    ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pub_images_pub_id  ON pub_images(pub_id);
CREATE INDEX IF NOT EXISTS idx_social_review_id   ON social_posts(review_id);
CREATE INDEX IF NOT EXISTS idx_social_pub_id      ON social_posts(pub_id);
CREATE INDEX IF NOT EXISTS idx_social_created     ON social_posts(created_at DESC);

CREATE OR REPLACE FUNCTION calculate_review_total_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_score := NEW.pub_look_cleanliness
                   + NEW.staff
                   + NEW.glass_pour
                   + NEW.taste_quality
                   + NEW.price_score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_review_total_score ON reviews;
CREATE TRIGGER set_review_total_score
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION calculate_review_total_score();

CREATE OR REPLACE FUNCTION sync_pub_score()
RETURNS TRIGGER AS $$
DECLARE
  v_pub_id UUID;
  v_latest RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_pub_id := OLD.pub_id;
  ELSE
    v_pub_id := NEW.pub_id;
  END IF;

  SELECT total_score INTO v_latest
  FROM reviews
  WHERE pub_id = v_pub_id
    AND is_official = TRUE
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE pubs
    SET
      current_score        = v_latest.total_score,
      current_rating_tier  = CASE
        WHEN v_latest.total_score >= 46 THEN 'Legendary'
        WHEN v_latest.total_score >= 41 THEN 'Elite'
        WHEN v_latest.total_score >= 36 THEN 'Strong'
        WHEN v_latest.total_score >= 31 THEN 'Decent'
        WHEN v_latest.total_score >= 21 THEN 'Weak'
        ELSE 'Avoid'
      END,
      updated_at = NOW()
    WHERE id = v_pub_id;
  ELSE
    UPDATE pubs
    SET current_score = 0, current_rating_tier = NULL, updated_at = NOW()
    WHERE id = v_pub_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_pub_score_on_review ON reviews;
CREATE TRIGGER sync_pub_score_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_pub_score();

CREATE OR REPLACE FUNCTION create_social_post_for_review()
RETURNS TRIGGER AS $$
DECLARE
  v_pub    RECORD;
  v_content TEXT;
  v_tier   TEXT;
BEGIN
  IF NEW.is_official = FALSE THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_pub FROM pubs WHERE id = NEW.pub_id;

  v_tier := CASE
    WHEN NEW.total_score >= 46 THEN 'Legendary'
    WHEN NEW.total_score >= 41 THEN 'Elite'
    WHEN NEW.total_score >= 36 THEN 'Strong'
    WHEN NEW.total_score >= 31 THEN 'Decent'
    WHEN NEW.total_score >= 21 THEN 'Weak'
    ELSE 'Avoid'
  END;

  v_content := format(
    E'🍺 New Guinness review: %s\nTier: %s | Score: %s/50%s\n\n#Chester #Guinness #PintReview',
    v_pub.name,
    v_tier,
    NEW.total_score,
    CASE WHEN NEW.verdict IS NOT NULL THEN E'\n\n"' || NEW.verdict || '"' ELSE '' END
  );

  INSERT INTO social_posts (review_id, pub_id, content, is_posted)
  VALUES (NEW.id, NEW.pub_id, v_content, FALSE)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_social_post_on_review ON reviews;
CREATE TRIGGER create_social_post_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION create_social_post_for_review();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pubs_set_updated_at ON pubs;
CREATE TRIGGER pubs_set_updated_at
  BEFORE UPDATE ON pubs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE pubs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pub_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pubs"         ON pubs;
DROP POLICY IF EXISTS "Public read reviews"      ON reviews;
DROP POLICY IF EXISTS "Public read pub_images"   ON pub_images;
DROP POLICY IF EXISTS "Public read social_posts" ON social_posts;

CREATE POLICY "Public read pubs"         ON pubs         FOR SELECT USING (true);
CREATE POLICY "Public read reviews"      ON reviews      FOR SELECT USING (true);
CREATE POLICY "Public read pub_images"   ON pub_images   FOR SELECT USING (true);
CREATE POLICY "Public read social_posts" ON social_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth write pubs"         ON pubs;
DROP POLICY IF EXISTS "Auth write reviews"      ON reviews;
DROP POLICY IF EXISTS "Auth write pub_images"   ON pub_images;
DROP POLICY IF EXISTS "Auth write social_posts" ON social_posts;

CREATE POLICY "Auth write pubs"         ON pubs         FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write reviews"      ON reviews      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write pub_images"   ON pub_images   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write social_posts" ON social_posts FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO storage.buckets (id, name, public)
VALUES ('pub-images', 'pub-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read pub-images storage"        ON storage.objects;
DROP POLICY IF EXISTS "Auth upload pub-images storage"        ON storage.objects;
DROP POLICY IF EXISTS "Auth update pub-images storage"        ON storage.objects;
DROP POLICY IF EXISTS "Auth delete pub-images storage"        ON storage.objects;

CREATE POLICY "Public read pub-images storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pub-images');

CREATE POLICY "Auth upload pub-images storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pub-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update pub-images storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pub-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete pub-images storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pub-images' AND auth.role() = 'authenticated');
