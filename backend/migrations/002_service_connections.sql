-- ============================================================
-- 002_service_connections.sql
-- External service integrations (Canvas, Apple Health, etc.)
-- OAuth tokens stored in Supabase Vault, NOT in this table.
-- The Oryn v2.0
-- ============================================================

CREATE TABLE public.service_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_type      TEXT NOT NULL
                    CHECK (service_type IN (
                      'canvas', 'google_calendar', 'apple_health',
                      'strava', 'google_fit'
                    )),
  service_label     TEXT,
  vault_secret_id   UUID,
  canvas_base_url   TEXT,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_sync_at      TIMESTAMPTZ,
  sync_error        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, service_type)
);

COMMENT ON TABLE public.service_connections IS 'Tracks linked external services. OAuth tokens live in vault.secrets; vault_secret_id is the reference.';
COMMENT ON COLUMN public.service_connections.vault_secret_id IS 'FK to vault.secrets — never expose tokens in application tables.';
COMMENT ON COLUMN public.service_connections.canvas_base_url IS 'Institution-specific Canvas URL, e.g. https://canvas.ou.edu';

CREATE INDEX idx_service_connections_user
  ON public.service_connections(user_id);

CREATE TRIGGER service_connections_updated_at
  BEFORE UPDATE ON public.service_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.service_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "svc_select_own"
  ON public.service_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "svc_insert_own"
  ON public.service_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "svc_update_own"
  ON public.service_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "svc_delete_own"
  ON public.service_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "svc_service_role"
  ON public.service_connections FOR ALL
  USING (auth.role() = 'service_role');