-- ============================================================
-- 004_fix_delete_trigger.sql
-- Fix sync_pub_score trigger to fire on DELETE as well as
-- INSERT/UPDATE. Migration 002 accidentally dropped DELETE
-- from the trigger events, so deleting a review left the
-- pub's cached current_score stale.
-- ============================================================

-- 1. Replace the function to handle DELETE (uses OLD when TG_OP = 'DELETE')
CREATE OR REPLACE FUNCTION sync_pub_score()
RETURNS TRIGGER AS $$
DECLARE
  v_pub_id      UUID;
  v_latest      RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_pub_id := OLD.pub_id;
  ELSE
    -- For INSERT/UPDATE, only sync if the review is official
    IF NEW.is_official IS DISTINCT FROM TRUE THEN
      RETURN NEW;
    END IF;
    v_pub_id := NEW.pub_id;
  END IF;

  -- Find the most recent official review remaining for this pub
  SELECT total_score INTO v_latest
  FROM reviews
  WHERE pub_id = v_pub_id
    AND is_official = TRUE
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE pubs
    SET
      current_score       = v_latest.total_score,
      current_rating_tier = CASE
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

-- 2. Drop existing trigger (was INSERT OR UPDATE only) and recreate with DELETE
DROP TRIGGER IF EXISTS reviews_sync_pub_score ON reviews;
DROP TRIGGER IF EXISTS sync_pub_score_on_review ON reviews;

CREATE TRIGGER sync_pub_score_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_pub_score();

-- 3. Immediate recalculation: fix every pub's cached score right now
--    This corrects any scores that were left stale by the missing DELETE trigger.
UPDATE pubs p
SET
  current_score = COALESCE(
    (
      SELECT r.total_score
      FROM reviews r
      WHERE r.pub_id = p.id
        AND r.is_official = TRUE
      ORDER BY r.created_at DESC
      LIMIT 1
    ),
    0
  ),
  current_rating_tier = (
    SELECT CASE
      WHEN r.total_score >= 46 THEN 'Legendary'
      WHEN r.total_score >= 41 THEN 'Elite'
      WHEN r.total_score >= 36 THEN 'Strong'
      WHEN r.total_score >= 31 THEN 'Decent'
      WHEN r.total_score >= 21 THEN 'Weak'
      ELSE 'Avoid'
    END
    FROM reviews r
    WHERE r.pub_id = p.id
      AND r.is_official = TRUE
    ORDER BY r.created_at DESC
    LIMIT 1
  ),
  updated_at = NOW();

-- Verify the result
SELECT p.name, p.current_score, p.current_rating_tier,
       (SELECT COUNT(*) FROM reviews r WHERE r.pub_id = p.id AND r.is_official = TRUE) AS official_review_count
FROM pubs p
ORDER BY p.current_score DESC;
