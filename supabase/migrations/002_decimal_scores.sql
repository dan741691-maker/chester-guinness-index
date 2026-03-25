-- ============================================================
-- 002_decimal_scores.sql
-- Upgrade scoring from INTEGER to NUMERIC(4,1) for 0.1-step precision
--
-- Existing integer scores (e.g. 7) are preserved exactly (become 7.0).
-- No data is lost. Run this in your Supabase SQL editor.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. reviews — drop the generated total_score column first
--    (PostgreSQL does not allow altering generated columns)
-- ────────────────────────────────────────────────────────────
ALTER TABLE reviews DROP COLUMN IF EXISTS total_score;

-- ────────────────────────────────────────────────────────────
-- 2. reviews — drop integer CHECK constraints on category fields
-- ────────────────────────────────────────────────────────────
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_pub_look_cleanliness_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_staff_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_glass_pour_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_taste_quality_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_price_score_check;

-- ────────────────────────────────────────────────────────────
-- 3. reviews — widen category columns to NUMERIC(4,1)
--    Integers cast automatically: 7 → 7.0, 10 → 10.0, etc.
-- ────────────────────────────────────────────────────────────
ALTER TABLE reviews
  ALTER COLUMN pub_look_cleanliness TYPE NUMERIC(4,1),
  ALTER COLUMN staff                TYPE NUMERIC(4,1),
  ALTER COLUMN glass_pour           TYPE NUMERIC(4,1),
  ALTER COLUMN taste_quality        TYPE NUMERIC(4,1),
  ALTER COLUMN price_score          TYPE NUMERIC(4,1);

-- ────────────────────────────────────────────────────────────
-- 4. reviews — add new decimal-aware CHECK constraints
-- ────────────────────────────────────────────────────────────
ALTER TABLE reviews
  ADD CONSTRAINT reviews_pub_look_cleanliness_check
    CHECK (pub_look_cleanliness BETWEEN 0.0 AND 10.0),
  ADD CONSTRAINT reviews_staff_check
    CHECK (staff BETWEEN 0.0 AND 10.0),
  ADD CONSTRAINT reviews_glass_pour_check
    CHECK (glass_pour BETWEEN 0.0 AND 10.0),
  ADD CONSTRAINT reviews_taste_quality_check
    CHECK (taste_quality BETWEEN 0.0 AND 10.0),
  ADD CONSTRAINT reviews_price_score_check
    CHECK (price_score BETWEEN 0.0 AND 10.0);

-- ────────────────────────────────────────────────────────────
-- 5. reviews — recreate total_score as NUMERIC(4,1) generated column
--    Existing rows recompute automatically: 7+7+8+7+6 = 35.0
-- ────────────────────────────────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN total_score NUMERIC(4,1) GENERATED ALWAYS AS (
    pub_look_cleanliness + staff + glass_pour + taste_quality + price_score
  ) STORED;

-- Recreate index (was dropped with the column above)
CREATE INDEX IF NOT EXISTS idx_reviews_total_score ON reviews(total_score DESC);

-- ────────────────────────────────────────────────────────────
-- 6. pubs — widen current_score to NUMERIC(4,1)
--    Existing integer scores preserved: 35 → 35.0
-- ────────────────────────────────────────────────────────────
ALTER TABLE pubs
  ALTER COLUMN current_score TYPE NUMERIC(4,1);

-- ────────────────────────────────────────────────────────────
-- 7. sync_pub_score() — update variable type and fix trigger
--    to also fire on UPDATE (so edited reviews sync correctly)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_pub_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total_score NUMERIC(4,1);
  v_tier        TEXT;
BEGIN
  -- Skip non-official reviews
  IF NEW.is_official IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  v_total_score := NEW.total_score;

  -- Tier boundaries use >= so decimals fall into the correct band naturally.
  -- e.g. 40.9 = Strong (< 41), 41.0 = Elite
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old INSERT-only trigger; replace with INSERT OR UPDATE
DROP TRIGGER IF EXISTS reviews_sync_pub_score ON reviews;

CREATE TRIGGER reviews_sync_pub_score
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_pub_score();

-- ────────────────────────────────────────────────────────────
-- 8. generate_social_post() — format decimal scores cleanly
--    NUMERIC(4,1)::TEXT naturally gives '36.7', '7.0', etc.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_social_post()
RETURNS TRIGGER AS $$
DECLARE
  v_pub_name  TEXT;
  v_tier      TEXT;
  v_price     TEXT;
  v_content   TEXT;
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
    WHEN NEW.guinness_price_gbp IS NOT NULL
      THEN '£' || to_char(NEW.guinness_price_gbp, 'FM9990.00')
    ELSE 'N/A'
  END;

  -- NUMERIC(4,1)::TEXT preserves one decimal place (e.g. '36.7', '7.0')
  v_content :=
    '🍺 Chester Guinness Review'                                              || chr(10) ||
    chr(10)                                                                   ||
    '📍 ' || v_pub_name                                                       || chr(10) ||
    'Score: ' || NEW.total_score::TEXT || '/50 (' || v_tier || ')'           || chr(10) ||
    chr(10)                                                                   ||
    'Look & Cleanliness: ' || NEW.pub_look_cleanliness::TEXT || '/10'        || chr(10) ||
    'Staff: '              || NEW.staff::TEXT                || '/10'        || chr(10) ||
    'Glass / Pour: '       || NEW.glass_pour::TEXT           || '/10'        || chr(10) ||
    'Taste / Quality: '    || NEW.taste_quality::TEXT        || '/10'        || chr(10) ||
    'Price: '              || NEW.price_score::TEXT          || '/10'        || chr(10) ||
    chr(10)                                                                   ||
    'Guinness Price: ' || v_price                                             || chr(10) ||
    chr(10)                                                                   ||
    'Verdict:'                                                                || chr(10) ||
    COALESCE(NEW.verdict, '—')                                                || chr(10) ||
    chr(10)                                                                   ||
    '#Chester #Guinness #PintReview';

  INSERT INTO social_posts (review_id, pub_id, content)
  VALUES (NEW.id, NEW.pub_id, v_content);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- Summary of data impact on existing rows:
--   reviews.pub_look_cleanliness: INTEGER → NUMERIC(4,1)  e.g. 7   → 7.0
--   reviews.staff:                INTEGER → NUMERIC(4,1)  e.g. 8   → 8.0
--   reviews.glass_pour:           INTEGER → NUMERIC(4,1)  e.g. 6   → 6.0
--   reviews.taste_quality:        INTEGER → NUMERIC(4,1)  e.g. 9   → 9.0
--   reviews.price_score:          INTEGER → NUMERIC(4,1)  e.g. 7   → 7.0
--   reviews.total_score:          INTEGER → NUMERIC(4,1)  e.g. 37  → 37.0
--   pubs.current_score:           INTEGER → NUMERIC(4,1)  e.g. 37  → 37.0
-- All values preserved exactly. No data loss.
-- ────────────────────────────────────────────────────────────
