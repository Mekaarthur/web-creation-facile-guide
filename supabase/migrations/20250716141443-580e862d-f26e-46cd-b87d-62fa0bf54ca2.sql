-- Créer la table pour les disponibilités des prestataires
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Dimanche, 1=Lundi, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, day_of_week, start_time, end_time)
);

-- Créer la table pour les services que propose chaque prestataire
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price_override NUMERIC(10,2), -- Prix personnalisé pour ce prestataire, sinon utilise le prix du service
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_id)
);

-- Ajouter une colonne pour la dernière activité du prestataire
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour provider_availability
CREATE POLICY "Providers can manage their availability" 
ON public.provider_availability 
FOR ALL 
USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_availability.provider_id));

CREATE POLICY "Everyone can view provider availability" 
ON public.provider_availability 
FOR SELECT 
USING (true);

-- Politiques RLS pour provider_services
CREATE POLICY "Providers can manage their services" 
ON public.provider_services 
FOR ALL 
USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_services.provider_id));

CREATE POLICY "Everyone can view provider services" 
ON public.provider_services 
FOR SELECT 
USING (true);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_provider_availability_updated_at
  BEFORE UPDATE ON public.provider_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_services_updated_at
  BEFORE UPDATE ON public.provider_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Améliorer la fonction de matching des prestataires
CREATE OR REPLACE FUNCTION public.get_matching_providers(
  p_service_type text, 
  p_location text, 
  p_limit integer DEFAULT 5,
  p_date_time timestamp DEFAULT NULL
)
RETURNS TABLE(
  provider_id uuid, 
  business_name text, 
  rating numeric, 
  location text, 
  match_score integer,
  availability_slots jsonb,
  services_offered jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.business_name,
    p.rating,
    p.location,
    (CASE 
      -- Score de base sur la localisation
      WHEN LOWER(p.location) = LOWER(p_location) THEN 100
      WHEN LOWER(p.location) LIKE '%' || LOWER(p_location) || '%' THEN 80
      WHEN LOWER(p_location) LIKE LOWER(p_location) || '%' THEN 70
      ELSE 50
    END +
    -- Bonus pour le rating
    COALESCE(p.rating * 10, 0)::integer +
    -- Bonus pour les missions complétées
    LEAST(COALESCE(p.missions_completed, 0) * 2, 20) +
    -- Bonus pour le taux d'acceptation
    COALESCE(p.acceptance_rate::integer, 0) / 5 +
    -- Bonus si vérifié
    CASE WHEN p.is_verified THEN 15 ELSE 0 END
    ) as match_score,
    
    -- Récupérer les créneaux de disponibilité
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'day_of_week', pa.day_of_week,
          'start_time', pa.start_time,
          'end_time', pa.end_time,
          'is_available', pa.is_available
        )
      )
      FROM public.provider_availability pa 
      WHERE pa.provider_id = p.id AND pa.is_available = true),
      '[]'::jsonb
    ) as availability_slots,
    
    -- Récupérer les services offerts
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'service_id', s.id,
          'service_name', s.name,
          'price', COALESCE(ps.price_override, s.price_per_hour),
          'category', s.category
        )
      )
      FROM public.provider_services ps
      JOIN public.services s ON s.id = ps.service_id
      WHERE ps.provider_id = p.id AND ps.is_active = true),
      '[]'::jsonb
    ) as services_offered
    
  FROM public.providers p
  WHERE p.is_verified = true
    AND p.description IS NOT NULL
    AND (
      LOWER(p.description) LIKE '%' || LOWER(p_service_type) || '%'
      OR p_service_type = 'Autre'
      OR EXISTS (
        SELECT 1 FROM public.provider_services ps
        JOIN public.services s ON s.id = ps.service_id
        WHERE ps.provider_id = p.id 
        AND LOWER(s.name) LIKE '%' || LOWER(p_service_type) || '%'
      )
    )
  ORDER BY match_score DESC, p.rating DESC, p.total_earnings DESC
  LIMIT p_limit;
END;
$$;