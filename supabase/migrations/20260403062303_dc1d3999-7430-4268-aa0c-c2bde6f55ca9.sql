
-- 1. Add Nova status columns to providers
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS nova_status TEXT DEFAULT 'missing',
ADD COLUMN IF NOT EXISTS nova_validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS nova_expires_at TIMESTAMPTZ;

-- 2. Create urssaf_declarations table for tracking
CREATE TABLE IF NOT EXISTS public.urssaf_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email TEXT NOT NULL,
  client_name TEXT,
  provider_id UUID REFERENCES public.providers(id),
  booking_id UUID REFERENCES public.bookings(id),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  client_amount NUMERIC NOT NULL DEFAULT 0,
  state_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sent',
  urssaf_reference TEXT,
  error_code TEXT,
  error_message TEXT,
  rejection_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  declared_at TIMESTAMPTZ DEFAULT now(),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.urssaf_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view urssaf declarations"
ON public.urssaf_declarations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage urssaf declarations"
ON public.urssaf_declarations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Function to auto-create alerts from critical audit events
CREATE OR REPLACE FUNCTION public.create_alert_from_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create alerts for critical actions
  IF NEW.action_type IN ('suspicious_login', 'unauthorized_access', 'api_error_repeated', 'data_breach_attempt', 'role_change', 'mass_deletion') THEN
    INSERT INTO public.system_alerts (
      alert_type,
      severity,
      title,
      message,
      source,
      metadata,
      status
    ) VALUES (
      'audit_critical',
      CASE
        WHEN NEW.action_type IN ('data_breach_attempt', 'unauthorized_access') THEN 'critical'
        WHEN NEW.action_type IN ('suspicious_login', 'mass_deletion') THEN 'high'
        ELSE 'medium'
      END,
      'Alerte audit: ' || NEW.action_type,
      COALESCE(NEW.description, 'Événement critique détecté dans l''audit: ' || NEW.action_type),
      'audit_pipeline',
      jsonb_build_object(
        'audit_log_id', NEW.id,
        'entity_type', NEW.entity_type,
        'entity_id', NEW.entity_id,
        'admin_user_id', NEW.admin_user_id
      ),
      'active'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to admin_actions_log
DROP TRIGGER IF EXISTS trigger_audit_to_alerts ON public.admin_actions_log;
CREATE TRIGGER trigger_audit_to_alerts
AFTER INSERT ON public.admin_actions_log
FOR EACH ROW
EXECUTE FUNCTION public.create_alert_from_audit();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_urssaf_declarations_status ON public.urssaf_declarations(status);
CREATE INDEX IF NOT EXISTS idx_urssaf_declarations_client ON public.urssaf_declarations(client_email);
CREATE INDEX IF NOT EXISTS idx_providers_nova_status ON public.providers(nova_status);
