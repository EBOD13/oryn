-- ============================================================
-- 010_oryn_gamification.sql
-- The Oryn progression system: steps, levels, achievements
-- Steps are banked from focus time + completed goals
-- The Oryn v2.0
-- ============================================================

-- ============================================================
-- 1. Oryn PROGRESS (per-user running totals)
-- ============================================================

CREATE TABLE public.oryn_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  total_steps       INTEGER NOT NULL DEFAULT 0,
  current_level     INTEGER NOT NULL DEFAULT 1,
  steps_today       INTEGER NOT NULL DEFAULT 0,
  steps_this_week   INTEGER NOT NULL DEFAULT 0,
  last_step_date    DATE,
  avatar_config     JSONB NOT NULL DEFAULT '{"body": "body1", "hair": "hair1", "clothing": "clothing1"}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.oryn_progress IS 'Running oryn progress. Steps banked from: focus minutes (1 min = 1 step) + goal completions (10 steps each).';
COMMENT ON COLUMN public.oryn_progress.avatar_config IS 'Pixel art avatar customization. References SVG asset names.';

CREATE TRIGGER oryn_progress_updated_at
  BEFORE UPDATE ON public.oryn_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.oryn_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oryn_select_own"
  ON public.oryn_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "oryn_update_own"
  ON public.oryn_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oryn_insert_own"
  ON public.oryn_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oryn_service_role"
  ON public.oryn_progress FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 2. oryn STEP LOG (audit oryn for step grants)
-- ============================================================

CREATE TABLE public.oryn_step_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  steps         INTEGER NOT NULL,
  source_type   TEXT NOT NULL
                CHECK (source_type IN (
                  'focus_session', 'goal_completed', 'streak_bonus',
                  'achievement', 'daily_bonus', 'manual'
                )),
  source_id     UUID,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.oryn_step_log IS 'Every step grant with source attribution. Enables audit and prevents double-counting.';

CREATE INDEX idx_oryn_step_log_user
  ON public.oryn_step_log(user_id, created_at DESC);

CREATE INDEX idx_oryn_step_log_source
  ON public.oryn_step_log(source_type, source_id)
  WHERE source_id IS NOT NULL;

-- RLS
ALTER TABLE public.oryn_step_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "step_log_select_own"
  ON public.oryn_step_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "step_log_service_role"
  ON public.oryn_step_log FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 3. ACHIEVEMENTS
-- ============================================================

CREATE TABLE public.achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon            TEXT,
  category        TEXT NOT NULL
                  CHECK (category IN ('focus', 'goals', 'streak', 'oryn', 'special')),
  threshold_value INTEGER,
  steps_reward    INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.achievements IS 'Achievement definitions. Global — not per-user. Seeded by migrations.';

-- No RLS needed — this is global read-only data
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select_all"
  ON public.achievements FOR SELECT
  USING (TRUE);

CREATE POLICY "achievements_service_role"
  ON public.achievements FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 4. USER ACHIEVEMENTS (join table)
-- ============================================================

CREATE TABLE public.user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id  UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user
  ON public.user_achievements(user_id, earned_at DESC);

-- RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ua_select_own"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ua_service_role"
  ON public.user_achievements FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 5. SEED ACHIEVEMENTS
-- ============================================================

INSERT INTO public.achievements (slug, title, description, category, threshold_value, steps_reward) VALUES
  -- Focus achievements
  ('first_session',       'First Steps',           'Complete your first focus session',                   'focus',  1,    10),
  ('focus_10_sessions',   'Getting in the Zone',   'Complete 10 focus sessions',                          'focus',  10,   25),
  ('focus_50_sessions',   'Study Machine',          'Complete 50 focus sessions',                          'focus',  50,   100),
  ('focus_100_sessions',  'Unstoppable',            'Complete 100 focus sessions',                         'focus',  100,  250),
  ('focus_1000_min',      'Hour Hero',              'Accumulate 1,000 minutes of focus time',              'focus',  1000, 50),
  ('focus_5000_min',      'Time Lord',              'Accumulate 5,000 minutes of focus time',              'focus',  5000, 200),

  -- Streak achievements
  ('streak_3',            'Three-peat',             'Maintain a 3-day goal streak',                        'streak', 3,    15),
  ('streak_7',            'Week Warrior',           'Maintain a 7-day goal streak',                        'streak', 7,    50),
  ('streak_30',           'Monthly Master',         'Maintain a 30-day goal streak',                       'streak', 30,   200),
  ('streak_100',          'Century Club',           'Maintain a 100-day goal streak',                      'streak', 100,  500),

  -- Goal achievements
  ('goal_first',          'Goal Setter',            'Create your first goal',                              'goals',  1,    10),
  ('goal_10_completed',   'Achiever',               'Complete 10 goals',                                   'goals',  10,   50),
  ('goals_all_categories','Renaissance Student',    'Have active goals in all 5 categories',               'goals',  5,    75),

  -- oryn achievements
  ('oryn_100',           'orynblazer',            'Earn 100 oryn steps',                                'oryn',  100,  0),
  ('oryn_1000',          'Pathfinder',             'Earn 1,000 oryn steps',                              'oryn',  1000, 0),
  ('oryn_10000',         'Explorer',               'Earn 10,000 oryn steps',                             'oryn',  10000,0),

  -- Special
  ('shield_10_resisted',  'Willpower',              'Close a blocked app 10 times after seeing a shield',  'special', 10,  30),
  ('perfect_week',        'Perfect Week',           'Hit your daily study goal every day for a week',      'special', 7,   100);


-- ============================================================
-- 6. AUTO-CREATE oryn PROGRESS ON USER SIGNUP
-- (Extend the existing handle_new_user trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  INSERT INTO public.oryn_progress (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;