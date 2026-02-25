-- ============================================================
-- 006_goals.sql
-- Goal setting, tracking, and progress logging
-- Supports manual + automated goals (Apple Health, Strava, etc.)
-- The Trail v2.0
-- ============================================================

-- ============================================================
-- 1. GOALS
-- ============================================================

CREATE TABLE public.goals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  description             TEXT,
  category                TEXT NOT NULL
                          CHECK (category IN (
                            'academic', 'fitness', 'personal', 'career', 'financial'
                          )),
  goal_type               TEXT NOT NULL
                          CHECK (goal_type IN ('habit', 'milestone', 'metric')),
  recurrence              TEXT CHECK (recurrence IN ('daily', 'weekly', 'monthly')),
  target_value            DECIMAL(10,2),
  target_unit             TEXT,
  is_automated            BOOLEAN NOT NULL DEFAULT FALSE,
  service_connection_id   UUID REFERENCES public.service_connections(id) ON DELETE SET NULL,
  automation_config       JSONB DEFAULT '{}'::jsonb,
  trigger_type            TEXT CHECK (trigger_type IN ('time_based', 'location_based', 'manual')),
  trigger_config          JSONB DEFAULT '{}'::jsonb,
  start_date              DATE,
  end_date                DATE,
  status                  TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  current_streak          INTEGER NOT NULL DEFAULT 0,
  best_streak             INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at             TIMESTAMPTZ
);

COMMENT ON TABLE public.goals IS 'User goals across all life categories. Supports habit tracking, milestones, and metric goals.';
COMMENT ON COLUMN public.goals.automation_config IS 'Config for automated goals. E.g. {"metric": "steps", "source": "apple_health", "threshold": 10000}';
COMMENT ON COLUMN public.goals.trigger_config IS 'When to prompt. E.g. {"time": "07:00", "days": ["mon","wed","fri"]} or {"lat": 35.2, "lng": -97.4, "radius_m": 100}';
COMMENT ON COLUMN public.goals.current_streak IS 'Cached streak value. Recomputed by application on each goal_log insert.';

CREATE INDEX idx_goals_user_active
  ON public.goals(user_id)
  WHERE status = 'active';

CREATE INDEX idx_goals_user_category
  ON public.goals(user_id, category)
  WHERE status = 'active';

CREATE INDEX idx_goals_automated
  ON public.goals(service_connection_id)
  WHERE is_automated = TRUE AND status = 'active';

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select_own"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_own"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_own"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_service_role"
  ON public.goals FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 2. GOAL LOGS
-- ============================================================

CREATE TABLE public.goal_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id       UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value         DECIMAL(10,2) NOT NULL DEFAULT 1,
  note          TEXT,
  source        TEXT NOT NULL DEFAULT 'manual'
                CHECK (source IN (
                  'manual', 'apple_health', 'strava', 'google_fit', 'canvas', 'auto'
                )),
  session_id    UUID REFERENCES public.focus_sessions(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.goal_logs IS 'Atomic progress entries. Each row = one logged action toward a goal.';
COMMENT ON COLUMN public.goal_logs.user_id IS 'Denormalized from goals for RLS. Avoids JOIN on every SELECT.';
COMMENT ON COLUMN public.goal_logs.value IS 'Meaning depends on goal: 1 for habit check-in, 5000 for steps, 30 for minutes, etc.';

CREATE INDEX idx_goal_logs_goal_recent
  ON public.goal_logs(goal_id, logged_at DESC);

CREATE INDEX idx_goal_logs_user_daily
  ON public.goal_logs(user_id, public.to_date_utc(logged_at));

-- For streak calculation: check consecutive days
CREATE INDEX idx_goal_logs_streak
  ON public.goal_logs(goal_id, public.to_date_utc(logged_at))
  WHERE value > 0;

-- RLS
ALTER TABLE public.goal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_select_own"
  ON public.goal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "logs_insert_own"
  ON public.goal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "logs_service_role"
  ON public.goal_logs FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 3. ADD FK FROM FOCUS_SESSIONS → GOALS
-- (Deferred from 005 to avoid circular dependency)
-- ============================================================

ALTER TABLE public.focus_sessions
  ADD CONSTRAINT fk_focus_sessions_goal
  FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;

CREATE INDEX idx_focus_sessions_goal
  ON public.focus_sessions(goal_id)
  WHERE goal_id IS NOT NULL;