-- ============================================================
-- Analytics event tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  event_type text NOT NULL,
  session_id text,
  device_type text,
  referrer text,
  pub_id uuid REFERENCES pubs(id),
  pub_name text,
  search_query text,
  filter_area text,
  filter_score text,
  latitude numeric,
  longitude numeric,
  results_count integer,
  selected_pub_id uuid REFERENCES pubs(id),
  time_on_page_seconds integer,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS analytics_events_type_idx
  ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS analytics_events_created_idx
  ON analytics_events(created_at);

-- Cache table for AI-generated summaries
CREATE TABLE IF NOT EXISTS analytics_ai_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  summary_text text NOT NULL
);

-- ── RLS ──────────────────────────────────────────────────────────

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admin can read analytics"
  ON analytics_events FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM reviewer_profiles
      WHERE role = 'admin' LIMIT 1
    )
  );
