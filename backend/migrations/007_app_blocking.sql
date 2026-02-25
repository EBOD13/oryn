-- ============================================================
-- 007_app_blocking.sql
-- Blocked apps configuration + shield overlay impression tracking
-- The Oryn v2.0
-- ============================================================

-- ============================================================
-- 1. BLOCKED APPS
-- ============================================================

CREATE TABLE public.blocked_apps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_bundle_id   TEXT NOT NULL,
  app_name        TEXT,
  app_category    TEXT,
  block_mode      TEXT NOT NULL DEFAULT 'focus_only'
                  CHECK (block_mode IN ('always', 'focus_only', 'scheduled')),
  schedule_config JSONB DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, app_bundle_id)
);

COMMENT ON TABLE public.blocked_apps IS 'Apps the user wants blocked. Uses Apple Screen Time Family Controls + Managed Settings for enforcement.';
COMMENT ON COLUMN public.blocked_apps.app_bundle_id IS 'iOS bundle identifier, e.g. com.burbn.instagram';
COMMENT ON COLUMN public.blocked_apps.schedule_config IS 'For scheduled mode: {"days": ["mon","tue","wed","thu","fri"], "start": "09:00", "end": "17:00"}';

CREATE INDEX idx_blocked_apps_user_active
  ON public.blocked_apps(user_id)
  WHERE is_active = TRUE;

-- RLS
ALTER TABLE public.blocked_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_select_own"
  ON public.blocked_apps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "blocked_insert_own"
  ON public.blocked_apps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "blocked_update_own"
  ON public.blocked_apps FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "blocked_delete_own"
  ON public.blocked_apps FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "blocked_service_role"
  ON public.blocked_apps FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 2. SHIELD IMPRESSIONS
-- ============================================================

CREATE TABLE public.shield_impressions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_app_id          UUID NOT NULL REFERENCES public.blocked_apps(id) ON DELETE CASCADE,
  message_shown           TEXT,
  message_type            TEXT CHECK (message_type IN (
                            'assignment_due', 'goal_reminder', 'study_nudge', 'custom'
                          )),
  related_assignment_id   UUID REFERENCES public.canvas_assignments(id) ON DELETE SET NULL,
  related_goal_id         UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  user_action             TEXT CHECK (user_action IN (
                            'closed_app', 'dismissed_shield', 'opened_anyway'
                          )),
  shown_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at            TIMESTAMPTZ
);

COMMENT ON TABLE public.shield_impressions IS 'Every shield overlay shown. Critical analytics: measures whether nudges actually change behavior.';

-- Analytics: recent impressions per user
CREATE INDEX idx_shield_impressions_user_recent
  ON public.shield_impressions(user_id, shown_at DESC);

-- Effectiveness analysis: group by action
CREATE INDEX idx_shield_impressions_effectiveness
  ON public.shield_impressions(user_id, user_action, shown_at);

-- Per-app analytics
CREATE INDEX idx_shield_impressions_app
  ON public.shield_impressions(blocked_app_id, shown_at DESC);

-- RLS
ALTER TABLE public.shield_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shield_select_own"
  ON public.shield_impressions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "shield_insert_own"
  ON public.shield_impressions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shield_service_role"
  ON public.shield_impressions FOR ALL
  USING (auth.role() = 'service_role');