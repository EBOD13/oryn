-- ============================================================
-- 001_users.sql
-- Core user tables: profile + preferences
-- The Oryn v2.0
-- ============================================================

-- --------------------------------------------------------
-- updated_at trigger function (reused across all tables)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 1. USERS (extends auth.users)
-- ============================================================

CREATE TABLE public.users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  avatar_url            TEXT,
  institution           TEXT,
  major                 TEXT,
  college_year          SMALLINT CHECK (college_year BETWEEN 1 AND 6),
  timezone              TEXT NOT NULL DEFAULT 'America/Chicago',
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at           TIMESTAMPTZ
);

COMMENT ON TABLE public.users IS 'User profile data. Auth handled by Supabase Auth; this stores app-specific profile fields.';
COMMENT ON COLUMN public.users.college_year IS '1=Freshman, 2=Sophomore, 3=Junior, 4=Senior, 5=5th Year, 6=Grad';
COMMENT ON COLUMN public.users.archived_at IS 'Soft delete timestamp. NULL = active.';

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role bypass for backend operations
CREATE POLICY "users_service_role"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 2. USER PREFERENCES
-- ============================================================

CREATE TABLE public.user_preferences (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  daily_study_goal_minutes  INTEGER NOT NULL DEFAULT 120,
  exam_prep_lead_days       INTEGER NOT NULL DEFAULT 14,
  focus_break_allowed       BOOLEAN NOT NULL DEFAULT TRUE,
  focus_break_interval_min  INTEGER NOT NULL DEFAULT 25,
  focus_break_duration_min  INTEGER NOT NULL DEFAULT 5,
  notification_style        TEXT NOT NULL DEFAULT 'nudge'
                            CHECK (notification_style IN ('nudge', 'urgent', 'silent')),
  shield_message_style      TEXT NOT NULL DEFAULT 'motivational'
                            CHECK (shield_message_style IN ('motivational', 'factual', 'urgent')),
  ai_provider               TEXT NOT NULL DEFAULT 'gemini'
                            CHECK (ai_provider IN ('gemini', 'openai', 'claude')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_preferences IS 'Study and app preferences. Separated from users to allow frequent updates without profile contention.';

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_select_own"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "prefs_insert_own"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_update_own"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_service_role"
  ON public.user_preferences FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 3. AUTO-CREATE PROFILE + PREFERENCES ON SIGNUP
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();