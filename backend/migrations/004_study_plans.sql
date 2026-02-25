-- ============================================================
-- 004_study_plans.sql
-- User-generated study plans overlaid on Canvas assignments
-- Answers: "What am I going to do about this assignment?"
-- The Oryn v2.0
-- ============================================================

CREATE TABLE public.study_plans (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_id             UUID REFERENCES public.canvas_assignments(id) ON DELETE SET NULL,
  title                     TEXT NOT NULL,
  estimated_minutes         INTEGER,
  priority                  TEXT NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status                    TEXT NOT NULL DEFAULT 'planned'
                            CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
  planned_date              DATE,
  planned_start_time        TIME,
  reminder_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_minutes_before   INTEGER NOT NULL DEFAULT 30,
  ai_generated_steps        JSONB DEFAULT '[]'::jsonb,
  completed_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.study_plans IS 'User intent layer over Canvas data. Links an assignment to when/how the user plans to tackle it.';
COMMENT ON COLUMN public.study_plans.assignment_id IS 'NULL for free-form study plans not tied to a specific Canvas assignment.';
COMMENT ON COLUMN public.study_plans.ai_generated_steps IS 'AI-decomposed subtasks. Format: [{"step": "Read chapter 5", "done": false}, ...]';

-- Primary query: "What''s on my plate today/this week?"
CREATE INDEX idx_study_plans_user_date
  ON public.study_plans(user_id, planned_date)
  WHERE status IN ('planned', 'in_progress');

-- Find plans for a specific assignment
CREATE INDEX idx_study_plans_assignment
  ON public.study_plans(assignment_id)
  WHERE assignment_id IS NOT NULL;

CREATE TRIGGER study_plans_updated_at
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-set completed_at when status changes to 'completed'
CREATE OR REPLACE FUNCTION public.handle_study_plan_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER study_plans_completion
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_study_plan_completion();

-- RLS
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_own"
  ON public.study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "plans_insert_own"
  ON public.study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "plans_update_own"
  ON public.study_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "plans_delete_own"
  ON public.study_plans FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "plans_service_role"
  ON public.study_plans FOR ALL
  USING (auth.role() = 'service_role');