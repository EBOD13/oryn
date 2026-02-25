-- ============================================================
-- 009_analytics.sql
-- AI interaction audit log + materialized views for analytics
-- The Trail v2.0
-- ============================================================

-- ============================================================
-- 1. AI INTERACTION LOG
-- ============================================================

CREATE TABLE public.ai_interactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL
                      CHECK (provider IN ('gemini', 'openai', 'claude')),
  model               TEXT,
  interaction_type    TEXT CHECK (interaction_type IN (
                        'study_plan', 'nudge_generation', 'reflection_summary',
                        'encouragement', 'task_decomposition', 'grade_analysis'
                      )),
  prompt_tokens       INTEGER,
  completion_tokens   INTEGER,
  cost_usd            DECIMAL(8,6),
  latency_ms          INTEGER,
  context             JSONB DEFAULT '{}'::jsonb,
  response_summary    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ai_interactions IS 'Audit trail for every AI API call. Used for cost tracking, debugging, and prompt improvement.';
COMMENT ON COLUMN public.ai_interactions.context IS 'Sanitized request context. NEVER store raw student grades or PII here — only structural metadata.';

CREATE INDEX idx_ai_interactions_user
  ON public.ai_interactions(user_id, created_at DESC);

CREATE INDEX idx_ai_interactions_cost
  ON public.ai_interactions(provider, created_at)
  WHERE cost_usd IS NOT NULL;

-- RLS: users can see their own AI interactions
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_select_own"
  ON public.ai_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_service_role"
  ON public.ai_interactions FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 2. MATERIALIZED VIEW: DAILY SUMMARY
-- ============================================================

CREATE MATERIALIZED VIEW public.mv_daily_summary AS
WITH focus_daily AS (
  SELECT
    fs.user_id,
    (fs.started_at AT TIME ZONE 'UTC')::date        AS day,
    COUNT(fs.id)                                     AS session_count,
    COALESCE(SUM(fs.actual_duration_min), 0)         AS total_focus_minutes,
    ROUND(AVG(fs.focus_score), 1)                    AS avg_focus_score,
    COUNT(DISTINCT fs.assignment_id)                  AS assignments_worked
  FROM public.focus_sessions fs
  WHERE fs.status = 'completed'
  GROUP BY fs.user_id, (fs.started_at AT TIME ZONE 'UTC')::date
),
goals_daily AS (
  SELECT
    gl.user_id,
    (gl.logged_at AT TIME ZONE 'UTC')::date          AS day,
    COUNT(*)                                          AS goals_logged
  FROM public.goal_logs gl
  GROUP BY gl.user_id, (gl.logged_at AT TIME ZONE 'UTC')::date
),
shields_daily AS (
  SELECT
    si.user_id,
    (si.shown_at AT TIME ZONE 'UTC')::date           AS day,
    COUNT(*) FILTER (WHERE si.user_action = 'closed_app') AS shields_effective,
    COUNT(*)                                               AS shields_total
  FROM public.shield_impressions si
  GROUP BY si.user_id, (si.shown_at AT TIME ZONE 'UTC')::date
)
SELECT
  fd.user_id,
  fd.day,
  fd.session_count,
  fd.total_focus_minutes,
  fd.avg_focus_score,
  fd.assignments_worked,
  COALESCE(gd.goals_logged, 0)        AS goals_logged,
  COALESCE(sd.shields_effective, 0)    AS shields_effective,
  COALESCE(sd.shields_total, 0)        AS shields_total
FROM focus_daily fd
LEFT JOIN goals_daily gd
  ON gd.user_id = fd.user_id AND gd.day = fd.day
LEFT JOIN shields_daily sd
  ON sd.user_id = fd.user_id AND sd.day = fd.day
WITH NO DATA;  -- Don't populate on creation; refresh on demand

CREATE UNIQUE INDEX idx_mv_daily_summary_pk
  ON public.mv_daily_summary(user_id, day);

COMMENT ON MATERIALIZED VIEW public.mv_daily_summary IS 'Pre-aggregated daily stats. Refresh via: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_summary;';


-- ============================================================
-- 3. MATERIALIZED VIEW: WEEKLY SUMMARY
-- ============================================================

CREATE MATERIALIZED VIEW public.mv_weekly_summary AS
SELECT
  fs.user_id,
  date_trunc('week', fs.started_at AT TIME ZONE 'UTC')::date   AS week_start,
  COUNT(fs.id)                                                   AS session_count,
  COALESCE(SUM(fs.actual_duration_min), 0)                       AS total_focus_minutes,
  ROUND(AVG(fs.focus_score), 1)                                  AS avg_focus_score,
  COUNT(DISTINCT (fs.started_at AT TIME ZONE 'UTC')::date)       AS days_active,
  COUNT(DISTINCT fs.assignment_id)                                AS assignments_worked
FROM public.focus_sessions fs
WHERE fs.status = 'completed'
GROUP BY fs.user_id, date_trunc('week', fs.started_at AT TIME ZONE 'UTC')::date
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_weekly_summary_pk
  ON public.mv_weekly_summary(user_id, week_start);

COMMENT ON MATERIALIZED VIEW public.mv_weekly_summary IS 'Pre-aggregated weekly stats. Refresh via: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_summary;';


-- ============================================================
-- 4. HELPER FUNCTION: GRADE-TO-STUDY-TIME CORRELATION
-- Called from application layer, not stored.
-- ============================================================

CREATE OR REPLACE FUNCTION public.grade_study_correlation(
  p_user_id UUID,
  p_course_id UUID DEFAULT NULL
)
RETURNS TABLE (
  assignment_id     UUID,
  assignment_title  TEXT,
  course_name       TEXT,
  score_pct         DECIMAL,
  study_minutes     BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.id                                           AS assignment_id,
    ca.title                                        AS assignment_title,
    cc.name                                         AS course_name,
    CASE
      WHEN ca.points_possible > 0
      THEN ROUND((ca.score / ca.points_possible) * 100, 2)
      ELSE NULL
    END                                             AS score_pct,
    COALESCE(SUM(fs.actual_duration_min), 0)::BIGINT AS study_minutes
  FROM public.canvas_assignments ca
  JOIN public.canvas_courses cc ON cc.id = ca.course_id
  LEFT JOIN public.focus_sessions fs
    ON fs.assignment_id = ca.id
    AND fs.status = 'completed'
  WHERE ca.user_id = p_user_id
    AND ca.score IS NOT NULL
    AND (p_course_id IS NULL OR ca.course_id = p_course_id)
  GROUP BY ca.id, ca.title, cc.name, ca.score, ca.points_possible
  HAVING ca.score IS NOT NULL
  ORDER BY ca.due_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.grade_study_correlation IS 'Returns assignment scores paired with total study time. Client computes Pearson r from results.';


-- ============================================================
-- 5. HELPER FUNCTION: SHIELD EFFECTIVENESS RATE
-- ============================================================

CREATE OR REPLACE FUNCTION public.shield_effectiveness(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_impressions   BIGINT,
  closed_app          BIGINT,
  dismissed           BIGINT,
  opened_anyway       BIGINT,
  effectiveness_rate  DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)                                                    AS total_impressions,
    COUNT(*) FILTER (WHERE si.user_action = 'closed_app')       AS closed_app,
    COUNT(*) FILTER (WHERE si.user_action = 'dismissed_shield') AS dismissed,
    COUNT(*) FILTER (WHERE si.user_action = 'opened_anyway')    AS opened_anyway,
    CASE
      WHEN COUNT(*) > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE si.user_action = 'closed_app')::DECIMAL / COUNT(*) * 100, 1
      )
      ELSE 0
    END                                                         AS effectiveness_rate
  FROM public.shield_impressions si
  WHERE si.user_id = p_user_id
    AND si.shown_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;