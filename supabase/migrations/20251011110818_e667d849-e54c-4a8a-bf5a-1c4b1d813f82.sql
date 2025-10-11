-- ============================================
-- SÉCURITÉ CRITIQUE - Rate Limiting + Audit Trail (CORRIGÉ)
-- ============================================

-- 1. Table pour rate limiting (améliorer l'existante)
ALTER TABLE public.rate_limit_tracking 
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action 
ON public.rate_limit_tracking(identifier, action_type, created_at DESC);

-- 2. Fonction pour vérifier et appliquer rate limiting
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
  -- Vérifier si déjà bloqué
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
  
  -- Compter les tentatives récentes
  SELECT COUNT(*) INTO current_attempts
  FROM public.rate_limit_tracking
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  IF current_attempts >= p_max_attempts THEN
    -- Bloquer pour 15 minutes
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
  
  -- Enregistrer la tentative
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

-- 3. Améliorer audit trail pour exports et suppressions
ALTER TABLE public.admin_actions_log
ADD COLUMN IF NOT EXISTS affected_records_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_exported BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_gdpr_related BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS request_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_admin_actions_gdpr 
ON public.admin_actions_log(is_gdpr_related, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_actions_exports 
ON public.admin_actions_log(data_exported, created_at DESC);

-- 4. Fonction pour logger exports RGPD
CREATE OR REPLACE FUNCTION public.log_gdpr_export(
  p_entity_type TEXT,
  p_entity_ids UUID[],
  p_export_format TEXT DEFAULT 'json',
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Vérifier permissions admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent exporter des données';
  END IF;
  
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    new_data,
    description,
    affected_records_count,
    data_exported,
    is_gdpr_related,
    request_metadata
  ) VALUES (
    auth.uid(),
    p_entity_type,
    p_entity_ids[1],
    'gdpr_export',
    jsonb_build_object(
      'entity_ids', p_entity_ids,
      'export_format', p_export_format,
      'exported_at', NOW()
    ),
    CONCAT(
      'Export RGPD: ', 
      array_length(p_entity_ids, 1), 
      ' ', 
      p_entity_type,
      CASE WHEN p_reason IS NOT NULL THEN ' - Raison: ' || p_reason ELSE '' END
    ),
    array_length(p_entity_ids, 1),
    true,
    true,
    jsonb_build_object(
      'export_format', p_export_format,
      'reason', p_reason
    )
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 5. Fonction pour logger suppressions en masse
CREATE OR REPLACE FUNCTION public.log_bulk_deletion(
  p_entity_type TEXT,
  p_entity_ids UUID[],
  p_reason TEXT,
  p_is_soft_delete BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Vérifier permissions admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent supprimer en masse';
  END IF;
  
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    old_data,
    description,
    affected_records_count,
    is_gdpr_related,
    request_metadata
  ) VALUES (
    auth.uid(),
    p_entity_type,
    p_entity_ids[1],
    CASE WHEN p_is_soft_delete THEN 'soft_delete_bulk' ELSE 'hard_delete_bulk' END,
    jsonb_build_object(
      'deleted_ids', p_entity_ids,
      'deleted_at', NOW()
    ),
    CONCAT(
      CASE WHEN p_is_soft_delete THEN 'Suppression logique' ELSE 'Suppression définitive' END,
      ' en masse: ',
      array_length(p_entity_ids, 1),
      ' ',
      p_entity_type,
      ' - Raison: ',
      p_reason
    ),
    array_length(p_entity_ids, 1),
    true,
    jsonb_build_object(
      'reason', p_reason,
      'is_soft_delete', p_is_soft_delete
    )
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;