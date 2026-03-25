-- ============================================================
-- 003_reviewer_profiles.sql
-- Lightweight reviewer identity: avatar + accent colour
-- ============================================================

-- 1. reviewer_profiles — one row per Supabase auth user
CREATE TABLE IF NOT EXISTS reviewer_profiles (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text UNIQUE NOT NULL,
  display_name  text NOT NULL DEFAULT 'Reviewer',
  avatar_url    text,
  accent_color  text NOT NULL DEFAULT '#C9A84C',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Link reviews to a reviewer (nullable — old reviews stay anonymous)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES reviewer_profiles(id) ON DELETE SET NULL;

-- 3. RLS
ALTER TABLE reviewer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reviewer_profiles"  ON reviewer_profiles;
DROP POLICY IF EXISTS "Auth write reviewer_profiles"   ON reviewer_profiles;

CREATE POLICY "Public read reviewer_profiles"
  ON reviewer_profiles FOR SELECT USING (true);

CREATE POLICY "Auth write reviewer_profiles"
  ON reviewer_profiles FOR ALL USING (auth.role() = 'authenticated');

-- 4. reviewer-avatars storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reviewer-avatars', 'reviewer-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read reviewer-avatars storage"  ON storage.objects;
DROP POLICY IF EXISTS "Auth upload reviewer-avatars storage"  ON storage.objects;
DROP POLICY IF EXISTS "Auth update reviewer-avatars storage"  ON storage.objects;
DROP POLICY IF EXISTS "Auth delete reviewer-avatars storage"  ON storage.objects;

CREATE POLICY "Public read reviewer-avatars storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reviewer-avatars');

CREATE POLICY "Auth upload reviewer-avatars storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reviewer-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update reviewer-avatars storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'reviewer-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete reviewer-avatars storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reviewer-avatars' AND auth.role() = 'authenticated');

-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION touch_reviewer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviewer_profiles_set_updated_at ON reviewer_profiles;
CREATE TRIGGER reviewer_profiles_set_updated_at
  BEFORE UPDATE ON reviewer_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_reviewer_profiles_updated_at();

-- ============================================================
-- Seed Daniel's profile
--
-- Run this in Supabase SQL editor AFTER running the above:
--
-- Step 1 — find Daniel's auth user ID:
--   SELECT id FROM auth.users
--   WHERE email = 'daniel.siddons@chesterguinnessindex.com';
--
-- Step 2 — replace <DANIEL_USER_ID> and run:
--
--   INSERT INTO reviewer_profiles (user_id, email, display_name, accent_color)
--   VALUES (
--     '<DANIEL_USER_ID>',
--     'daniel.siddons@chesterguinnessindex.com',
--     'Daniel',
--     '#C9A84C'
--   )
--   ON CONFLICT (email) DO NOTHING;
--
-- (Or just visit /admin/profile once logged in — it auto-creates the row.)
-- ============================================================
