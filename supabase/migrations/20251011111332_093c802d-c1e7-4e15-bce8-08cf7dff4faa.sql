-- ============================================
-- MONITORING & PERFORMANCE - Phase 2 (CLEAN)
-- ============================================

-- 1. Recréer la table system_alerts proprement
DROP TABLE IF EXISTS public.system_alerts CASCADE;

CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity, created_at DESC);
CREATE INDEX idx_system_alerts_resolved ON public.system_alerts(resolved, created_at DESC);
CREATE INDEX idx_system_alerts_type ON public.system_alerts(alert_type, created_at DESC);

-- 2. Indexes composites pour performance
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON public.bookings(status, booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_client_status ON public.bookings(client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_status ON public.bookings(provider_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_carts_status_created ON public.carts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_client_status ON public.carts(client_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_status_date ON public.payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_client_status ON public.payments(client_id, status);

CREATE INDEX IF NOT EXISTS idx_missions_status_assigned ON public.missions(status, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_missions_provider_status ON public.missions(assigned_provider_id, status);

-- 3. Vue matérialisée pour dashboard stats
DROP MATERIALIZED VIEW IF EXISTS public.admin_dashboard_stats CASCADE;

CREATE MATERIALIZED VIEW public.admin_dashboard_stats AS
SELECT 
  COUNT(DISTINCT b.id) FILTER (WHERE b.created_at > NOW() - INTERVAL '30 days') as bookings_last_30d,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed' AND b.created_at > NOW() - INTERVAL '30 days') as completed_bookings_30d,
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_verified = true AND p.status = 'active') as active_providers,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active' AND c.created_at > NOW() - INTERVAL '7 days') as active_carts_7d,
  COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'complete' AND pay.created_at > NOW() - INTERVAL '30 days'), 0) as revenue_30d,
  COALESCE(AVG(r.rating) FILTER (WHERE r.created_at > NOW() - INTERVAL '30 days'), 0) as avg_rating_30d,
  COUNT(DISTINCT comp.id) FILTER (WHERE comp.status IN ('pending', 'in_progress')) as open_complaints
FROM bookings b
CROSS JOIN providers p
CROSS JOIN carts c
CROSS JOIN payments pay
CROSS JOIN reviews r
CROSS JOIN complaints comp;

CREATE INDEX idx_dashboard_stats_bookings ON public.admin_dashboard_stats(bookings_last_30d);

-- 4. Fonctions de détection automatique
CREATE OR REPLACE FUNCTION public.detect_abandoned_carts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  abandoned_count INTEGER := 0;
  cart_record RECORD;
BEGIN
  FOR cart_record IN
    SELECT c.*, p.email, p.first_name
    FROM public.carts c
    JOIN public.profiles p ON p.user_id = c.client_id
    WHERE c.status = 'active'
      AND c.updated_at < NOW() - INTERVAL '2 hours'
      AND c.created_at > NOW() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.communications comm
        WHERE comm.related_entity_id = c.id
          AND comm.related_entity_type = 'cart'
          AND comm.type = 'email'
          AND comm.template_name = 'abandoned_cart'
          AND comm.created_at > NOW() - INTERVAL '2 hours'
      )
  LOOP
    abandoned_count := abandoned_count + 1;
    
    INSERT INTO public.communications (
      type,
      destinataire_id,
      destinataire_email,
      template_name,
      sujet,
      contenu,
      related_entity_type,
      related_entity_id,
      status
    ) VALUES (
      'email',
      cart_record.client_id,
      cart_record.email,
      'abandoned_cart',
      'Votre panier vous attend 🛒',
      'Bonjour ' || cart_record.first_name || ', vous avez laissé des articles dans votre panier.',
      'cart',
      cart_record.id,
      'en_attente'
    );
  END LOOP;
  
  IF abandoned_count > 20 THEN
    INSERT INTO public.system_alerts (
      alert_type,
      severity,
      title,
      message,
      metadata
    ) VALUES (
      'abandoned_carts',
      'high',
      'Pic de paniers abandonnés',
      CONCAT(abandoned_count, ' paniers abandonnés détectés'),
      jsonb_build_object('count', abandoned_count)
    );
  END IF;
  
  RETURN abandoned_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_payment_failures()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  failure_count INTEGER;
  failure_rate NUMERIC;
BEGIN
  SELECT COUNT(*) INTO failure_count
  FROM public.payments
  WHERE status = 'échoué'
    AND created_at > NOW() - INTERVAL '1 hour';
  
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE status = 'échoué')::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0
    END INTO failure_rate
  FROM public.payments
  WHERE created_at > NOW() - INTERVAL '1 hour';
  
  IF failure_rate > 10 THEN
    INSERT INTO public.system_alerts (
      alert_type,
      severity,
      title,
      message,
      metadata
    ) VALUES (
      'payment_failures',
      'critical',
      'Taux échec paiement élevé',
      CONCAT('Taux: ', ROUND(failure_rate, 2), '% (', failure_count, ' échecs)'),
      jsonb_build_object('failure_rate', failure_rate, 'count', failure_count)
    );
  END IF;
  
  RETURN failure_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_inactive_providers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inactive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inactive_count
  FROM public.providers p
  WHERE p.is_verified = true
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.provider_id = p.id
        AND b.created_at > NOW() - INTERVAL '7 days'
    );
  
  IF inactive_count > 20 THEN
    INSERT INTO public.system_alerts (
      alert_type,
      severity,
      title,
      message,
      metadata
    ) VALUES (
      'inactive_providers',
      'medium',
      'Prestataires inactifs',
      CONCAT(inactive_count, ' prestataires sans mission depuis 7j'),
      jsonb_build_object('count', inactive_count)
    );
  END IF;
  
  RETURN inactive_count;
END;
$$;

-- 5. RLS Policies
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin peut gérer alertes"
ON public.system_alerts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));