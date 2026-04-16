-- ============================================================
-- Rename review scoring columns to match new category names
-- ============================================================

-- pub_look_cleanliness → pub_ambience (Pub Ambience)
ALTER TABLE reviews RENAME COLUMN pub_look_cleanliness TO pub_ambience;

-- taste_quality → la_pinte (La Pinte — the Guinness itself)
ALTER TABLE reviews RENAME COLUMN taste_quality TO la_pinte;

-- glass_pour, staff, price_score columns are unchanged
