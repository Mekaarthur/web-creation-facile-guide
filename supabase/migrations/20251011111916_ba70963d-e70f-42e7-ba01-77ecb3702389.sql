-- ============================================
-- RGPD & CONFORMITÉ - Phase 4
-- ============================================

-- 1. Table pour les consentements utilisateurs
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('cookies', 'marketing', 'analytics', 'data_processing', 'terms_conditions')),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  version TEXT NOT NULL, -- Version des CGU/Politique
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, consent_type, version)
);

CREATE INDEX idx_user_consents_user ON public.user_consents(user_id, consent_type);
CREATE INDEX idx_user_consents_granted ON public.user_consents(granted, granted_at DESC);

-- 2. Table pour les filtres sauvegardés
CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_name TEXT NOT NULL,
  filter_type TEXT NOT NULL, -- 'bookings', 'providers', 'carts', 'payments'
  filter_config JSONB NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_filters_user ON public.saved_filters(user_id, filter_type);
CREATE INDEX idx_saved_filters_favorite ON public.saved_filters(user_id, is_favorite);

-- 3. Table pour les exports RGPD
CREATE TABLE IF NOT EXISTS public.gdpr_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL DEFAULT 'full_data',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_size INTEGER,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gdpr_exports_user ON public.gdpr_exports(user_id, created_at DESC);
CREATE INDEX idx_gdpr_exports_status ON public.gdpr_exports(status, requested_at DESC);

-- 4. Fonction pour enregistrer un consentement
CREATE OR REPLACE FUNCTION public.record_consent(
  p_user_id UUID,
  p_consent_type TEXT,
  p_granted BOOLEAN,
  p_version TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  consent_id UUID;
BEGIN
  -- Retirer le consentement précédent s'il existe
  UPDATE public.user_consents
  SET withdrawn_at = NOW()
  WHERE user_id = p_user_id
    AND consent_type = p_consent_type
    AND withdrawn_at IS NULL;
  
  -- Créer le nouveau consentement
  INSERT INTO public.user_consents (
    user_id,
    consent_type,
    granted,
    version,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_consent_type,
    p_granted,
    p_version,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO consent_id;
  
  RETURN consent_id;
END;
$$;

-- 5. Fonction pour exporter toutes les données utilisateur (RGPD Article 15)
CREATE OR REPLACE FUNCTION public.request_gdpr_export(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  export_id UUID;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Créer la demande d'export
  INSERT INTO public.gdpr_exports (
    user_id,
    export_type,
    status
  ) VALUES (
    p_user_id,
    'full_data',
    'pending'
  ) RETURNING id INTO export_id;
  
  -- Logger l'action
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    description
  ) VALUES (
    p_user_id,
    'gdpr_export',
    export_id,
    'export_request',
    'GDPR data export requested by user'
  );
  
  RETURN export_id;
END;
$$;

-- 6. Fonction pour récupérer les données RGPD d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_data_for_export(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data JSONB;
BEGIN
  -- Vérifier que l'utilisateur demande ses propres données
  IF auth.uid() != p_user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT jsonb_build_object(
    'user_profile', (
      SELECT jsonb_build_object(
        'id', user_id,
        'email', email,
        'first_name', first_name,
        'last_name', last_name,
        'phone', phone,
        'created_at', created_at
      ) FROM public.profiles WHERE user_id = p_user_id
    ),
    'bookings', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'service_id', service_id,
          'booking_date', booking_date,
          'status', status,
          'total_price', total_price,
          'created_at', created_at
        )
      ), '[]'::jsonb)
      FROM public.bookings WHERE client_id = p_user_id
    ),
    'payments', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'amount', amount,
          'status', status,
          'payment_method', payment_method,
          'created_at', created_at
        )
      ), '[]'::jsonb)
      FROM public.payments WHERE client_id = p_user_id
    ),
    'reviews', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'rating', rating,
          'comment', comment,
          'created_at', created_at
        )
      ), '[]'::jsonb)
      FROM public.reviews WHERE client_id = p_user_id
    ),
    'consents', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'consent_type', consent_type,
          'granted', granted,
          'granted_at', granted_at,
          'withdrawn_at', withdrawn_at
        )
      ), '[]'::jsonb)
      FROM public.user_consents WHERE user_id = p_user_id
    ),
    'communications', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'type', type,
          'subject', sujet,
          'sent_at', sent_at,
          'status', status
        )
      ), '[]'::jsonb)
      FROM public.communications WHERE destinataire_id = p_user_id
    )
  ) INTO user_data;
  
  RETURN user_data;
END;
$$;

-- 7. RLS Policies
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
ON public.user_consents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents"
ON public.user_consents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their saved filters"
ON public.saved_filters FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their GDPR exports"
ON public.gdpr_exports FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can request GDPR exports"
ON public.gdpr_exports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all GDPR exports"
ON public.gdpr_exports FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));