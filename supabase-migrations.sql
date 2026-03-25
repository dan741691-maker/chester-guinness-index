-- ============================================================
-- Chester Guinness Index — Required Database Migrations
-- Run these in your Supabase SQL editor if not already present
-- ============================================================

-- 1. Calculate total_score automatically when a review is inserted or updated
-- (If your reviews.total_score column doesn't auto-populate, add this trigger)

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


-- 2. Keep pub.current_score and pub.current_rating_tier in sync with
--    the latest official review whenever a review is added/changed/deleted

CREATE OR REPLACE FUNCTION sync_pub_score()
RETURNS TRIGGER AS $$
DECLARE
  v_pub_id UUID;
  v_latest RECORD;
BEGIN
  -- Determine which pub was affected
  IF TG_OP = 'DELETE' THEN
    v_pub_id := OLD.pub_id;
  ELSE
    v_pub_id := NEW.pub_id;
  END IF;

  -- Find the most recent official review for that pub
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
    -- No official reviews remain — reset the pub score
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


-- 3. Auto-generate a social_posts draft when a new official review is saved

CREATE OR REPLACE FUNCTION create_social_post_for_review()
RETURNS TRIGGER AS $$
DECLARE
  v_pub RECORD;
  v_content TEXT;
  v_tier TEXT;
BEGIN
  -- Only for new official reviews
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
    '🍺 New Guinness review: %s%sTier: %s | Score: %s/50%s%s%s#Chester #Guinness #PintReview',
    v_pub.name,
    E'\n',
    v_tier,
    NEW.total_score,
    CASE WHEN NEW.verdict IS NOT NULL THEN E'\n\n"' || NEW.verdict || '"' ELSE '' END,
    E'\n\n',
    ''
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


-- 4. Ensure the pub-images storage bucket exists and is public
-- (Run manually in Supabase Storage UI or via API if not already done)
-- Bucket name: pub-images
-- Public: true
