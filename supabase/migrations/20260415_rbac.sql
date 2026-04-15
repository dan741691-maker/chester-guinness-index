-- ============================================================
-- RBAC, added_by, and RLS policies
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Role column on reviewer_profiles
ALTER TABLE reviewer_profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'reviewer';

-- 2. Set Daniel as admin
UPDATE reviewer_profiles SET role = 'admin' WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'daniel.siddons@chesterguinnessindex.com'
);

-- 3. added_by column on pubs
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS added_by uuid REFERENCES auth.users(id);

-- 4. Enable RLS (safe to re-run)
ALTER TABLE pubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ── Reviews RLS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- ── Pubs RLS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view pubs" ON pubs;
CREATE POLICY "Anyone can view pubs"
  ON pubs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert pubs" ON pubs;
CREATE POLICY "Authenticated users can insert pubs"
  ON pubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can edit their own pubs" ON pubs;
CREATE POLICY "Users can edit their own pubs"
  ON pubs FOR UPDATE
  USING (auth.uid() = added_by);

DROP POLICY IF EXISTS "Only admin can delete pubs" ON pubs;
CREATE POLICY "Only admin can delete pubs"
  ON pubs FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM reviewer_profiles
      WHERE role = 'admin' LIMIT 1
    )
  );
