-- Create system_alerts table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_alerts') THEN
    CREATE TABLE public.system_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      resolved BOOLEAN DEFAULT false,
      resolved_at TIMESTAMP WITH TIME ZONE,
      resolved_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
    
    CREATE INDEX idx_system_alerts_resolved ON public.system_alerts(resolved, created_at DESC);
    CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity);
  END IF;
END $$;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.system_alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.system_alerts;
DROP POLICY IF EXISTS "System can create alerts" ON public.system_alerts;

-- Create RLS Policies
CREATE POLICY "Admins can view all alerts"
  ON public.system_alerts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update alerts"
  ON public.system_alerts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create alerts"
  ON public.system_alerts FOR INSERT
  WITH CHECK (true);

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  bookings_last_30d BIGINT,
  completed_bookings_30d BIGINT,
  active_providers BIGINT,
  active_carts_7d BIGINT,
  revenue_30d NUMERIC,
  avg_rating_30d NUMERIC,
  open_complaints BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM bookings 
     WHERE created_at >= NOW() - INTERVAL '30 days')::BIGINT,
    
    (SELECT COUNT(*) FROM bookings 
     WHERE status = 'completed' 
     AND completed_at >= NOW() - INTERVAL '30 days')::BIGINT,
    
    (SELECT COUNT(*) FROM providers 
     WHERE is_verified = true 
     AND status = 'active')::BIGINT,
    
    (SELECT COUNT(*) FROM carts 
     WHERE status = 'active' 
     AND created_at >= NOW() - INTERVAL '7 days')::BIGINT,
    
    (SELECT COALESCE(SUM(amount), 0) 
     FROM payments 
     WHERE status = 'réussi' 
     AND payment_date >= NOW() - INTERVAL '30 days')::NUMERIC,
    
    (SELECT COALESCE(AVG(rating), 0) 
     FROM reviews 
     WHERE created_at >= NOW() - INTERVAL '30 days')::NUMERIC,
    
    (SELECT COUNT(*) FROM complaints 
     WHERE status IN ('pending', 'in_progress'))::BIGINT;
END;
$$;

-- Function to detect abandoned carts
CREATE OR REPLACE FUNCTION public.detect_abandoned_carts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_count INTEGER := 0;
  cart_record RECORD;
BEGIN
  FOR cart_record IN
    SELECT c.id, c.client_id, c.total_estimated, c.expires_at
    FROM carts c
    WHERE c.status = 'active'
      AND c.expires_at < NOW() - INTERVAL '1 hour'
      AND NOT EXISTS (
        SELECT 1 FROM system_alerts sa
        WHERE sa.alert_type = 'abandoned_cart'
          AND sa.metadata->>'cart_id' = c.id::text
          AND sa.created_at > NOW() - INTERVAL '24 hours'
      )
    LIMIT 10
  LOOP
    INSERT INTO system_alerts (
      alert_type, severity, title, message, metadata
    ) VALUES (
      'abandoned_cart', 'medium',
      'Panier abandonné détecté',
      'Un client a abandonné son panier d''une valeur de ' || cart_record.total_estimated || '€',
      jsonb_build_object(
        'cart_id', cart_record.id,
        'client_id', cart_record.client_id,
        'amount', cart_record.total_estimated,
        'expired_at', cart_record.expires_at
      )
    );
    alert_count := alert_count + 1;
  END LOOP;
  RETURN alert_count;
END;
$$;

-- Function to detect payment failures
CREATE OR REPLACE FUNCTION public.detect_payment_failures()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_count INTEGER := 0;
  payment_record RECORD;
BEGIN
  FOR payment_record IN
    SELECT p.id, p.client_id, p.amount, p.created_at
    FROM payments p
    WHERE p.status = 'échoué'
      AND p.created_at > NOW() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM system_alerts sa
        WHERE sa.alert_type = 'payment_failure'
          AND sa.metadata->>'payment_id' = p.id::text
      )
    LIMIT 10
  LOOP
    INSERT INTO system_alerts (
      alert_type, severity, title, message, metadata
    ) VALUES (
      'payment_failure', 'high',
      'Échec de paiement détecté',
      'Un paiement de ' || payment_record.amount || '€ a échoué',
      jsonb_build_object(
        'payment_id', payment_record.id,
        'client_id', payment_record.client_id,
        'amount', payment_record.amount,
        'failed_at', payment_record.created_at
      )
    );
    alert_count := alert_count + 1;
  END LOOP;
  RETURN alert_count;
END;
$$;

-- Function to detect inactive providers
CREATE OR REPLACE FUNCTION public.detect_inactive_providers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_count INTEGER := 0;
  provider_record RECORD;
BEGIN
  FOR provider_record IN
    SELECT p.id, p.business_name
    FROM providers p
    WHERE p.is_verified = true
      AND p.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.provider_id = p.id
          AND b.created_at > NOW() - INTERVAL '60 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM system_alerts sa
        WHERE sa.alert_type = 'inactive_provider'
          AND sa.metadata->>'provider_id' = p.id::text
          AND sa.created_at > NOW() - INTERVAL '7 days'
      )
    LIMIT 10
  LOOP
    INSERT INTO system_alerts (
      alert_type, severity, title, message, metadata
    ) VALUES (
      'inactive_provider', 'low',
      'Prestataire inactif détecté',
      'Le prestataire ' || provider_record.business_name || ' n''a eu aucune activité depuis 60 jours',
      jsonb_build_object(
        'provider_id', provider_record.id,
        'provider_name', provider_record.business_name
      )
    );
    alert_count := alert_count + 1;
  END LOOP;
  RETURN alert_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_abandoned_carts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_payment_failures() TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_inactive_providers() TO authenticated;