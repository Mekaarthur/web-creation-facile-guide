-- ============================================================
-- Chantier 2 : Tables unifiées (anomalies, chat_sessions, mission_ratings)
-- + enrichissement invoices pour NeedMe / URSSAF
-- ============================================================

-- 1. Table anomalies (centre unifié)
CREATE TABLE IF NOT EXISTS public.anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('system','mission','compliance','security','business','communication')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')) DEFAULT 'medium',
  source_table TEXT,
  source_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  assigned_to UUID,
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_status ON public.anomalies(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON public.anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON public.anomalies(type);
CREATE INDEX IF NOT EXISTS idx_anomalies_created_at ON public.anomalies(created_at DESC);

ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_anomalies" ON public.anomalies;
CREATE POLICY "admins_select_anomalies" ON public.anomalies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "admins_insert_anomalies" ON public.anomalies;
CREATE POLICY "admins_insert_anomalies" ON public.anomalies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "admins_update_anomalies" ON public.anomalies;
CREATE POLICY "admins_update_anomalies" ON public.anomalies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP TRIGGER IF EXISTS anomalies_updated_at ON public.anomalies;
CREATE TRIGGER anomalies_updated_at BEFORE UPDATE ON public.anomalies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2. Table chat_sessions (chatbot IA)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_type TEXT CHECK (user_type IN ('client','provider','admin','guest')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','escalated','closed')),
  escalated_to TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(status);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_chat_sessions" ON public.chat_sessions;
CREATE POLICY "users_own_chat_sessions" ON public.chat_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "users_create_chat_sessions" ON public.chat_sessions;
CREATE POLICY "users_create_chat_sessions" ON public.chat_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "users_update_own_chat_sessions" ON public.chat_sessions;
CREATE POLICY "users_update_own_chat_sessions" ON public.chat_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3. Table mission_ratings (notation post-mission)
CREATE TABLE IF NOT EXISTS public.mission_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),
  friendliness INTEGER CHECK (friendliness BETWEEN 1 AND 5),
  comment TEXT,
  authorized_testimonial BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_mission_ratings_provider ON public.mission_ratings(provider_id);
CREATE INDEX IF NOT EXISTS idx_mission_ratings_booking ON public.mission_ratings(booking_id);

ALTER TABLE public.mission_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_create_own_ratings" ON public.mission_ratings;
CREATE POLICY "clients_create_own_ratings" ON public.mission_ratings FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "client_provider_admin_view_ratings" ON public.mission_ratings;
CREATE POLICY "client_provider_admin_view_ratings" ON public.mission_ratings FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR provider_id IN (SELECT user_id FROM public.providers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

DROP POLICY IF EXISTS "clients_update_own_ratings" ON public.mission_ratings;
CREATE POLICY "clients_update_own_ratings" ON public.mission_ratings FOR UPDATE TO authenticated
  USING (client_id = auth.uid());

DROP TRIGGER IF EXISTS mission_ratings_updated_at ON public.mission_ratings;
CREATE TRIGGER mission_ratings_updated_at BEFORE UPDATE ON public.mission_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 4. Enrichissement invoices pour NeedMe + URSSAF (préparation squelette)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS needme_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS needme_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS urssaf_declaration_id TEXT,
  ADD COLUMN IF NOT EXISTS urssaf_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_needme ON public.invoices(needme_invoice_id) WHERE needme_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_urssaf ON public.invoices(urssaf_declaration_id) WHERE urssaf_declaration_id IS NOT NULL;