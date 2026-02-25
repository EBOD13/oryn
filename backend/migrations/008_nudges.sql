-- ============================================================
-- 008_nudges.sql
-- Notification / nudge queue
-- AI service writes nudges; client + push service reads them.
-- The Oryn v2.0
-- ============================================================

CREATE TABLE public.nudge_queue (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nudge_type              TEXT NOT NULL
                          CHECK (nudge_type IN (
                            'assignment_reminder', 'exam_prep', 'goal_check',
                            'daily_summary', 'encouragement', 'streak_alert',
                            'grade_update', 'custom'
                          )),
  title                   TEXT,
  body                    TEXT NOT NULL,
  priority                TEXT NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  delivery_channel        TEXT NOT NULL DEFAULT 'push'
                          CHECK (delivery_channel IN ('push', 'shield', 'in_app', 'all')),
  related_assignment_id   UUID REFERENCES public.canvas_assignments(id) ON DELETE SET NULL,
  related_goal_id         UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  scheduled_for           TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  read_at                 TIMESTAMPTZ,
  dismissed_at            TIMESTAMPTZ,
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN (
                            'pending', 'delivered', 'read', 'dismissed', 'expired'
                          )),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.nudge_queue IS 'Queued nudges/notifications. AI service inserts; push worker + client consume.';

-- Primary query: "What pending nudges does this user have?"
CREATE INDEX idx_nudge_queue_pending
  ON public.nudge_queue(user_id, scheduled_for)
  WHERE status = 'pending';

-- Delivery worker: find nudges ready to send
CREATE INDEX idx_nudge_queue_ready
  ON public.nudge_queue(scheduled_for, status)
  WHERE status = 'pending';

-- User's notification history
CREATE INDEX idx_nudge_queue_user_history
  ON public.nudge_queue(user_id, created_at DESC);

-- Auto-expire old undelivered nudges (run via pg_cron or app worker)
-- Nudges older than 24h that are still pending get expired
CREATE OR REPLACE FUNCTION public.expire_stale_nudges()
RETURNS void AS $$
BEGIN
  UPDATE public.nudge_queue
  SET status = 'expired'
  WHERE status = 'pending'
    AND scheduled_for < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE public.nudge_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nudge_select_own"
  ON public.nudge_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark as read/dismissed
CREATE POLICY "nudge_update_own"
  ON public.nudge_queue FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only service role can insert (AI service generates nudges)
CREATE POLICY "nudge_service_role"
  ON public.nudge_queue FOR ALL
  USING (auth.role() = 'service_role');