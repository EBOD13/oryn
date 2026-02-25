-- ============================================================
-- 003_canvas.sql
-- Canvas LMS synced data: courses + assignments
-- These tables are WRITE-ONLY from the sync service.
-- Users overlay planning data via study_plans (migration 004).
-- The Trail v2.0
-- ============================================================

-- ============================================================
-- 1. CANVAS COURSES
-- ============================================================

CREATE TABLE public.canvas_courses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canvas_course_id  BIGINT NOT NULL,
  name              TEXT NOT NULL,
  course_code       TEXT,
  term              TEXT,
  current_score     DECIMAL(5,2),
  current_grade     TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, canvas_course_id)
);

COMMENT ON TABLE public.canvas_courses IS 'Courses synced from Canvas LMS. Read-only from user perspective; updated by sync service.';

CREATE INDEX idx_canvas_courses_user
  ON public.canvas_courses(user_id);

CREATE INDEX idx_canvas_courses_active
  ON public.canvas_courses(user_id)
  WHERE is_active = TRUE;

CREATE TRIGGER canvas_courses_updated_at
  BEFORE UPDATE ON public.canvas_courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.canvas_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_own"
  ON public.canvas_courses FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (sync service)
CREATE POLICY "courses_service_role"
  ON public.canvas_courses FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 2. CANVAS ASSIGNMENTS
-- ============================================================

CREATE TABLE public.canvas_assignments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id               UUID NOT NULL REFERENCES public.canvas_courses(id) ON DELETE CASCADE,
  canvas_assignment_id    BIGINT NOT NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  assignment_type         TEXT CHECK (assignment_type IN (
                            'assignment', 'quiz', 'discussion', 'exam', 'other'
                          )),
  due_at                  TIMESTAMPTZ,
  points_possible         DECIMAL(8,2),
  score                   DECIMAL(8,2),
  grade                   TEXT,
  submission_status       TEXT DEFAULT 'not_submitted'
                          CHECK (submission_status IN (
                            'not_submitted', 'submitted', 'graded', 'late', 'missing'
                          )),
  submitted_at            TIMESTAMPTZ,
  is_manually_created     BOOLEAN NOT NULL DEFAULT FALSE,
  last_synced_at          TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.canvas_assignments IS 'Assignments synced from Canvas. is_manually_created=TRUE for user-added entries (manual fallback).';
COMMENT ON COLUMN public.canvas_assignments.score IS 'NULL until graded by instructor.';

-- Partial unique index: only enforce uniqueness for Canvas-synced assignments
CREATE UNIQUE INDEX idx_canvas_assignments_unique_synced
  ON public.canvas_assignments(user_id, canvas_assignment_id)
  WHERE is_manually_created = FALSE;

CREATE INDEX idx_canvas_assignments_user_due
  ON public.canvas_assignments(user_id, due_at)
  WHERE due_at IS NOT NULL;

CREATE INDEX idx_canvas_assignments_course
  ON public.canvas_assignments(course_id);

-- Index for upcoming assignments: filter by status only.
-- NOW() is STABLE, not IMMUTABLE, so it cannot appear in index predicates.
-- Filter due_at > NOW() at query time instead.
CREATE INDEX idx_canvas_assignments_upcoming
  ON public.canvas_assignments(user_id, due_at)
  WHERE submission_status IN ('not_submitted', 'submitted');

CREATE TRIGGER canvas_assignments_updated_at
  BEFORE UPDATE ON public.canvas_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.canvas_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_select_own"
  ON public.canvas_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert manually-created assignments
CREATE POLICY "assignments_insert_own_manual"
  ON public.canvas_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_manually_created = TRUE);

-- Users can update their manual assignments
CREATE POLICY "assignments_update_own_manual"
  ON public.canvas_assignments FOR UPDATE
  USING (auth.uid() = user_id AND is_manually_created = TRUE)
  WITH CHECK (auth.uid() = user_id AND is_manually_created = TRUE);

-- Service role handles Canvas-synced data
CREATE POLICY "assignments_service_role"
  ON public.canvas_assignments FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 3. GRADE HISTORY (for tracking grade changes over time)
-- ============================================================

CREATE TABLE public.canvas_grade_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL REFERENCES public.canvas_courses(id) ON DELETE CASCADE,
  assignment_id     UUID REFERENCES public.canvas_assignments(id) ON DELETE CASCADE,
  score             DECIMAL(8,2),
  points_possible   DECIMAL(8,2),
  course_score      DECIMAL(5,2),
  course_grade      TEXT,
  snapshot_type     TEXT NOT NULL DEFAULT 'assignment_graded'
                    CHECK (snapshot_type IN ('assignment_graded', 'course_update', 'manual')),
  captured_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.canvas_grade_snapshots IS 'Point-in-time grade captures. Enables grade trend analysis and study-time correlation.';

CREATE INDEX idx_grade_snapshots_user_course
  ON public.canvas_grade_snapshots(user_id, course_id, captured_at DESC);

CREATE INDEX idx_grade_snapshots_assignment
  ON public.canvas_grade_snapshots(assignment_id, captured_at DESC)
  WHERE assignment_id IS NOT NULL;

-- RLS
ALTER TABLE public.canvas_grade_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grade_snapshots_select_own"
  ON public.canvas_grade_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "grade_snapshots_service_role"
  ON public.canvas_grade_snapshots FOR ALL
  USING (auth.role() = 'service_role');