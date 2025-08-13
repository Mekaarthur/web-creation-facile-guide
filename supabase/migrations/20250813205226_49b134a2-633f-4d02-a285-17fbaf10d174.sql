-- Mise à jour de la table providers pour le nouveau workflow
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_validation';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS hourly_rate_override NUMERIC;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS forfait_rate NUMERIC;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS service_zones TEXT[];
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS postal_codes TEXT[];
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS work_radius INTEGER DEFAULT 20;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS identity_document_url TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS insurance_document_url TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS diploma_document_url TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS quality_agreement_signed BOOLEAN DEFAULT false;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS quality_agreement_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS performance_score NUMERIC DEFAULT 0;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS response_time_avg NUMERIC DEFAULT 0;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS last_mission_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS missions_this_week INTEGER DEFAULT 0;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS rotation_priority INTEGER DEFAULT 0;

-- Table pour l'historique des changements de statut prestataire
CREATE TABLE IF NOT EXISTS public.provider_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  admin_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les demandes de mission avec attribution automatique
CREATE TABLE IF NOT EXISTS public.mission_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_request_id UUID NOT NULL REFERENCES public.client_requests(id),
  eligible_providers UUID[] NOT NULL,
  assigned_provider_id UUID REFERENCES public.providers(id),
  assignment_method TEXT DEFAULT 'first_response',
  response_deadline TIMESTAMP WITH TIME ZONE,
  sent_notifications INTEGER DEFAULT 0,
  responses_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les réponses des prestataires
CREATE TABLE IF NOT EXISTS public.provider_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_assignment_id UUID NOT NULL REFERENCES public.mission_assignments(id),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  response_type TEXT NOT NULL, -- 'accept', 'decline', 'timeout'
  response_time INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fonction pour calculer le score de performance
CREATE OR REPLACE FUNCTION public.calculate_provider_performance_score(p_provider_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  acceptance_rate NUMERIC := 0;
  avg_rating NUMERIC := 0;
  punctuality_score NUMERIC := 0;
  final_score NUMERIC := 0;
BEGIN
  -- Calculer le taux d'acceptation
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100
      ELSE (COUNT(*) FILTER (WHERE response_type = 'accept') * 100.0 / COUNT(*))
    END
  INTO acceptance_rate
  FROM public.provider_responses pr
  JOIN public.mission_assignments ma ON ma.id = pr.mission_assignment_id
  WHERE pr.provider_id = p_provider_id
    AND pr.created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Moyenne des avis clients
  SELECT COALESCE(AVG(rating), 0)
  INTO avg_rating
  FROM public.reviews
  WHERE provider_id = p_provider_id
    AND is_approved = true
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Score de ponctualité (basé sur les réservations terminées à l'heure)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100
      ELSE (COUNT(*) FILTER (WHERE status = 'completed' AND completed_at <= (booking_date + start_time + INTERVAL '15 minutes')) * 100.0 / COUNT(*))
    END
  INTO punctuality_score
  FROM public.bookings
  WHERE provider_id = (SELECT id FROM public.providers WHERE id = p_provider_id)
    AND status = 'completed'
    AND booking_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calcul du score final
  final_score := (acceptance_rate + (avg_rating * 20) + punctuality_score) / 3;
  
  RETURN ROUND(final_score, 1);
END;
$$;

-- Fonction pour mettre à jour automatiquement les scores
CREATE OR REPLACE FUNCTION public.update_provider_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mettre à jour le score du prestataire concerné
  UPDATE public.providers 
  SET 
    performance_score = public.calculate_provider_performance_score(
      CASE 
        WHEN TG_TABLE_NAME = 'provider_responses' THEN NEW.provider_id
        WHEN TG_TABLE_NAME = 'reviews' THEN NEW.provider_id
        WHEN TG_TABLE_NAME = 'bookings' THEN NEW.provider_id
        ELSE NULL
      END
    ),
    last_activity_at = now()
  WHERE id = CASE 
    WHEN TG_TABLE_NAME = 'provider_responses' THEN NEW.provider_id
    WHEN TG_TABLE_NAME = 'reviews' THEN NEW.provider_id
    WHEN TG_TABLE_NAME = 'bookings' THEN NEW.provider_id
    ELSE NULL
  END;
  
  RETURN NEW;
END;
$$;

-- Triggers pour mettre à jour les scores automatiquement
DROP TRIGGER IF EXISTS update_scores_on_response ON public.provider_responses;
CREATE TRIGGER update_scores_on_response
  AFTER INSERT OR UPDATE ON public.provider_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_scores();

DROP TRIGGER IF EXISTS update_scores_on_review ON public.reviews;
CREATE TRIGGER update_scores_on_review
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_scores();

-- Fonction pour trouver les prestataires éligibles
CREATE OR REPLACE FUNCTION public.find_eligible_providers(
  p_service_type TEXT,
  p_location TEXT,
  p_postal_code TEXT DEFAULT NULL,
  p_requested_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
  provider_id UUID,
  business_name TEXT,
  performance_score NUMERIC,
  distance_score INTEGER,
  rotation_priority INTEGER,
  final_priority_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.business_name,
    COALESCE(p.performance_score, 0),
    CASE 
      WHEN p_postal_code IS NOT NULL AND p.postal_codes IS NOT NULL 
        AND p_postal_code = ANY(p.postal_codes) THEN 100
      WHEN p.location ILIKE '%' || p_location || '%' THEN 80
      ELSE 50
    END as distance_score,
    COALESCE(p.rotation_priority, 0),
    -- Score final : performance (40%) + distance (30%) + rotation (30%)
    (COALESCE(p.performance_score, 0) * 0.4 + 
     CASE 
       WHEN p_postal_code IS NOT NULL AND p.postal_codes IS NOT NULL 
         AND p_postal_code = ANY(p.postal_codes) THEN 100
       WHEN p.location ILIKE '%' || p_location || '%' THEN 80
       ELSE 50
     END * 0.3 +
     COALESCE(p.rotation_priority, 0) * 0.3) as final_priority_score
  FROM public.providers p
  WHERE p.status = 'active'
    AND p.is_verified = true
    AND (
      EXISTS (
        SELECT 1 FROM public.provider_services ps
        JOIN public.services s ON s.id = ps.service_id
        WHERE ps.provider_id = p.id 
        AND ps.is_active = true
        AND LOWER(s.name) LIKE '%' || LOWER(p_service_type) || '%'
      )
      OR LOWER(p.description) LIKE '%' || LOWER(p_service_type) || '%'
    )
    -- Vérifier disponibilité si date spécifiée
    AND (
      p_requested_date IS NULL 
      OR EXISTS (
        SELECT 1 FROM public.provider_availability pa
        WHERE pa.provider_id = p.id
        AND pa.day_of_week = EXTRACT(DOW FROM p_requested_date)
        AND pa.is_available = true
      )
    )
  ORDER BY final_priority_score DESC, p.last_mission_date ASC NULLS FIRST
  LIMIT 10;
END;
$$;

-- RLS pour les nouvelles tables
ALTER TABLE public.provider_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_responses ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Admin can view provider status history" ON public.provider_status_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert provider status history" ON public.provider_status_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Providers can view their mission assignments" ON public.mission_assignments
  FOR SELECT USING (
    assigned_provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
    OR auth.uid() = ANY(
      SELECT user_id FROM public.providers WHERE id = ANY(eligible_providers)
    )
  );

CREATE POLICY "System can manage mission assignments" ON public.mission_assignments
  FOR ALL USING (true);

CREATE POLICY "Providers can view their responses" ON public.provider_responses
  FOR SELECT USING (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can insert their responses" ON public.provider_responses
  FOR INSERT WITH CHECK (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage provider responses" ON public.provider_responses
  FOR ALL USING (true);