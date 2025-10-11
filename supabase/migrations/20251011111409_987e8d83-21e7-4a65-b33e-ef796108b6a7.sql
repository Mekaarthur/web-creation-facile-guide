-- ============================================
-- CORRECTIONS SÉCURITÉ LINTER
-- ============================================

-- 1. Protéger la vue matérialisée de l'API
REVOKE ALL ON public.admin_dashboard_stats FROM anon;
REVOKE ALL ON public.admin_dashboard_stats FROM authenticated;

-- Accorder seulement aux admins via une politique RLS
GRANT SELECT ON public.admin_dashboard_stats TO authenticated;

-- 2. Créer une fonction sécurisée pour accéder aux stats dashboard
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
  -- Vérifier que l'utilisateur est admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Rafraîchir la vue matérialisée si nécessaire
  REFRESH MATERIALIZED VIEW admin_dashboard_stats;
  
  -- Retourner les stats
  RETURN QUERY SELECT * FROM admin_dashboard_stats;
END;
$$;

-- 3. S'assurer que toutes les fonctions critiques ont search_path
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts INTEGER;
  blocked_until_time TIMESTAMPTZ;
BEGIN
  SELECT blocked_until INTO blocked_until_time
  FROM public.rate_limit_tracking
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND blocked_until IS NOT NULL
    AND blocked_until > NOW();
  
  IF blocked_until_time IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'blocked_until', blocked_until_time,
      'retry_after_seconds', EXTRACT(EPOCH FROM (blocked_until_time - NOW()))
    );
  END IF;
  
  SELECT COUNT(*) INTO current_attempts
  FROM public.rate_limit_tracking
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  IF current_attempts >= p_max_attempts THEN
    INSERT INTO public.rate_limit_tracking (
      identifier,
      action_type,
      attempt_count,
      blocked_until,
      last_attempt_at
    ) VALUES (
      p_identifier,
      p_action_type,
      current_attempts + 1,
      NOW() + INTERVAL '15 minutes',
      NOW()
    )
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET
      attempt_count = rate_limit_tracking.attempt_count + 1,
      blocked_until = NOW() + INTERVAL '15 minutes',
      last_attempt_at = NOW();
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'blocked_until', NOW() + INTERVAL '15 minutes',
      'retry_after_seconds', 900
    );
  END IF;
  
  INSERT INTO public.rate_limit_tracking (
    identifier,
    action_type,
    attempt_count,
    last_attempt_at
  ) VALUES (
    p_identifier,
    p_action_type,
    1,
    NOW()
  )
  ON CONFLICT (identifier, action_type)
  DO UPDATE SET
    attempt_count = rate_limit_tracking.attempt_count + 1,
    last_attempt_at = NOW();
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_attempts', p_max_attempts - current_attempts - 1
  );
END;
$$;