-- ============================================================
-- OPTIONAL: Rename review scoring columns to match new category names
--
-- NOTE: The application code currently uses the OLD column names
-- (pub_look_cleanliness, taste_quality) while displaying them with
-- the new labels (Pub Ambience, La Pinte). Run this migration via
-- the Supabase SQL Editor when you are ready to rename the DB columns,
-- then also update the codebase as follows:
--
--   types/database.ts:     pub_look_cleanliness → pub_ambience
--                          taste_quality        → la_pinte
--   types/index.ts:        ScoreCategory key union
--   lib/constants.ts:      SCORE_CATEGORIES keys
--   review-form.tsx:       DEFAULT_SCORES + scores state
--   reviews/route.ts:      SCORE_FIELDS
--   reviews/[id]/route.ts: SCORE_FIELDS
--   reviews/[id]/page.tsx: Review object construction
--   services/pubs.ts:      .order('taste_quality' → 'la_pinte')
--   leaderboard/page.tsx:  review.taste_quality → review.la_pinte
-- ============================================================

-- pub_look_cleanliness → pub_ambience (Pub Ambience)
ALTER TABLE reviews RENAME COLUMN pub_look_cleanliness TO pub_ambience;

-- taste_quality → la_pinte (La Pinte — the Guinness itself)
ALTER TABLE reviews RENAME COLUMN taste_quality TO la_pinte;

-- glass_pour, staff, price_score columns are unchanged
