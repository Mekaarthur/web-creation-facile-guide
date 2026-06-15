-- R-GLOBAL-03/04: Expiration, révocation douce, charte, motif
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS is_active           boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS expires_at          timestamptz,
  ADD COLUMN IF NOT EXISTS charter_signed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS revocation_reason   text;

-- Remplace le UNIQUE (user_id, role) par un index partiel sur les actifs
-- → permet de conserver l'historique des accès révoqués
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_active_unique
  ON public.user_roles(user_id, role)
  WHERE is_active = true;

-- R-GLOBAL-03/04: has_role vérifie is_active ET expiration
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin' AND role = 'super_admin')
      )
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- R-GLOBAL-02: ip_address TEXT pour supporter x-forwarded-for multi-IP
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'admin_actions_log'
      AND column_name  = 'ip_address'
      AND data_type    = 'inet'
  ) THEN
    ALTER TABLE public.admin_actions_log
      ALTER COLUMN ip_address TYPE text USING ip_address::text;
  END IF;
END $$;

-- R-GLOBAL-06: Table des incidents de sécurité
CREATE TABLE IF NOT EXISTS public.governance_incidents (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by     uuid        NOT NULL REFERENCES auth.users(id),
  target_user_id  uuid        REFERENCES auth.users(id),
  description     text        NOT NULL,
  severity        text        NOT NULL DEFAULT 'high'
                              CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status          text        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  actions_taken   text,
  resolved_at     timestamptz,
  resolved_by     uuid        REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.governance_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incident_admin_manage" ON public.governance_incidents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- R-GLOBAL-02: Rétention 2 ans des logs (pg_cron si disponible)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-admin-logs-2yr',
      '0 3 * * 0',
      'DELETE FROM public.admin_actions_log WHERE created_at < now() - interval ''2 years'''
    );
  END IF;
END $$;
