-- ============================================================
-- 005_focus_sessions.sql
-- Focus/study session tracking + post-session reflections
-- The Trail v2.0
-- ============================================================

-- ============================================================
-- 1. FOCUS SESSIONS
-- ============================================================

CREATE TABLE public.focus_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  study_plan_id       UUID REFERENCES public.study_plans(id) ON DELETE SET NULL,
  assignment_id       UUID REFERENCES public.canvas_assignments(id) ON DELETE SET NULL,
  goal_id             UUID,  -- FK added in 006_goals.sql to avoid circular dependency
  session_type        TEXT NOT NULL DEFAULT 'study'
                      CHECK (session_type IN (
                        'study', 'exam_prep', 'project', 'reading', 'review'
                      )),
  target_duration_min INTEGER,
  actual_duration_min INTEGER,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
  breaks_taken        INTEGER NOT NULL DEFAULT 0,
  total_break_min     INTEGER NOT NULL DEFAULT 0,
  focus_score         SMALLINT CHECK (focus_score BETWEEN 1 AND 100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.focus_sessions IS 'Individual study/focus blocks. Links to what the user was working on via study_plan, assignment, or goal.';
COMMENT ON COLUMN public.focus_sessions.actual_duration_min IS 'Computed from started_at/ended_at minus breaks. May also be set by client for offline sessions.';
COMMENT ON COLUMN public.focus_sessions.focus_score IS '1-100 score derived from completion ratio, break frequency, and session length vs target.';

-- Recent sessions for a user (dashboard, history)
CREATE INDEX idx_focus_sessions_user_recent
  ON public.focus_sessions(user_id, started_at DESC);

-- Active sessions (should be at most 1 per user)
CREATE INDEX idx_focus_sessions_active
  ON public.focus_sessions(user_id)
  WHERE status = 'active';

-- Sessions linked to a specific assignment (for grade correlation)
CREATE INDEX idx_focus_sessions_assignment
  ON public.focus_sessions(assignment_id, started_at)
  WHERE assignment_id IS NOT NULL;

-- Helper: IMMUTABLE date extraction for use in indexes.
-- timestamptz::date is STABLE (timezone-dependent), so we pin to UTC.
CREATE OR REPLACE FUNCTION public.to_date_utc(ts TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT (ts AT TIME ZONE 'UTC')::DATE;
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- Daily aggregation queries
CREATE INDEX idx_focus_sessions_user_day
  ON public.focus_sessions(user_id, public.to_date_utc(started_at))
  WHERE status = 'completed';

-- Auto-compute actual_duration_min on session end
CREATE OR REPLACE FUNCTION public.handle_session_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.actual_duration_min = GREATEST(0,
      EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60 - COALESCE(NEW.total_break_min, 0)
    )::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER focus_sessions_compute_duration
  BEFORE UPDATE ON public.focus_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_session_end();

-- RLS
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own"
  ON public.focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own"
  ON public.focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own"
  ON public.focus_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_service_role"
  ON public.focus_sessions FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 2. SESSION REFLECTIONS
-- ============================================================

CREATE TABLE public.session_reflections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL UNIQUE REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  what_i_learned      TEXT,
  difficulty_rating   SMALLINT CHECK (difficulty_rating BETWEEN 1 AND 5),
  confidence_rating   SMALLINT CHECK (confidence_rating BETWEEN 1 AND 5),
  mood_before         TEXT CHECK (mood_before IN (
                        'stressed', 'focused', 'tired', 'motivated', 'neutral'
                      )),
  mood_after          TEXT CHECK (mood_after IN (
                        'stressed', 'focused', 'tired', 'motivated', 'neutral'
                      )),
  ai_summary          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.session_reflections IS 'Optional post-session reflection. 1:1 with focus_sessions. Captures what was learned and mood shifts.';

CREATE INDEX idx_reflections_user
  ON public.session_reflections(user_id, created_at DESC);

-- RLS
ALTER TABLE public.session_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reflections_select_own"
  ON public.session_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reflections_insert_own"
  ON public.session_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reflections_update_own"
  ON public.session_reflections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reflections_service_role"
  ON public.session_reflections FOR ALL
  USING (auth.role() = 'service_role');