-- Créer la table des prestations réalisées avec calcul automatique des montants
CREATE TABLE IF NOT EXISTS public.prestations_realisees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id),
  client_request_id UUID REFERENCES public.client_requests(id),
  provider_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  duree_heures NUMERIC NOT NULL DEFAULT 0,
  taux_horaire NUMERIC NOT NULL DEFAULT 17.00,
  montant_total NUMERIC GENERATED ALWAYS AS (duree_heures * taux_horaire) STORED,
  statut_paiement TEXT NOT NULL DEFAULT 'en_attente',
  date_prestation DATE NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Activer RLS
ALTER TABLE public.prestations_realisees ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Les prestataires peuvent voir leurs prestations" 
ON public.prestations_realisees 
FOR SELECT 
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Les clients peuvent voir leurs prestations" 
ON public.prestations_realisees 
FOR SELECT 
USING (client_id = auth.uid());

CREATE POLICY "Le système peut gérer les prestations" 
ON public.prestations_realisees 
FOR ALL 
USING (true);

-- Index pour performance
CREATE INDEX idx_prestations_provider_id ON public.prestations_realisees(provider_id);
CREATE INDEX idx_prestations_client_id ON public.prestations_realisees(client_id);
CREATE INDEX idx_prestations_date ON public.prestations_realisees(date_prestation);

-- Trigger pour updated_at
CREATE TRIGGER update_prestations_realisees_updated_at
  BEFORE UPDATE ON public.prestations_realisees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Améliorer la fonction find_eligible_providers pour utiliser les zones géographiques
CREATE OR REPLACE FUNCTION public.find_eligible_providers(
  p_service_type text, 
  p_location text, 
  p_postal_code text DEFAULT NULL,
  p_requested_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  provider_id uuid,
  business_name text,
  performance_score numeric,
  distance_score integer,
  rotation_priority integer,
  final_priority_score numeric
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
      -- Score basé sur les zones géographiques et codes postaux
      WHEN p_postal_code IS NOT NULL AND p.postal_codes IS NOT NULL 
        AND p_postal_code = ANY(p.postal_codes) THEN 100
      WHEN p.location ILIKE '%' || p_location || '%' THEN 80
      -- Vérifier les zones géographiques via provider_locations
      WHEN EXISTS (
        SELECT 1 FROM public.provider_locations pl
        WHERE pl.provider_id = p.id
        AND (
          pl.postal_code = p_postal_code
          OR pl.city ILIKE '%' || p_location || '%'
        )
      ) THEN 90
      ELSE 50
    END as distance_score,
    COALESCE(p.rotation_priority, 0),
    -- Score final pondéré : performance (40%) + distance (30%) + rotation (30%)
    (COALESCE(p.performance_score, 0) * 0.4 + 
     CASE 
       WHEN p_postal_code IS NOT NULL AND p.postal_codes IS NOT NULL 
         AND p_postal_code = ANY(p.postal_codes) THEN 100
       WHEN p.location ILIKE '%' || p_location || '%' THEN 80
       WHEN EXISTS (
         SELECT 1 FROM public.provider_locations pl
         WHERE pl.provider_id = p.id
         AND (
           pl.postal_code = p_postal_code
           OR pl.city ILIKE '%' || p_location || '%'
         )
       ) THEN 90
       ELSE 50
     END * 0.3 +
     COALESCE(p.rotation_priority, 0) * 0.3) as final_priority_score
  FROM public.providers p
  WHERE p.status = 'active'
    AND p.is_verified = true
    AND (
      -- Vérifier les services proposés
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

-- Fonction pour créer automatiquement une prestation réalisée après validation client
CREATE OR REPLACE FUNCTION public.create_prestation_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duree_calculee NUMERIC;
  provider_id_value UUID;
BEGIN
  -- Ne traiter que les réservations terminées et validées
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Calculer la durée en heures
    duree_calculee := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;
    
    -- Récupérer l'ID du prestataire
    provider_id_value := NEW.provider_id;
    
    -- Créer la prestation réalisée
    INSERT INTO public.prestations_realisees (
      booking_id,
      provider_id,
      client_id,
      service_type,
      duree_heures,
      date_prestation,
      location,
      notes,
      validated_at
    ) VALUES (
      NEW.id,
      provider_id_value,
      NEW.client_id,
      (SELECT name FROM public.services WHERE id = NEW.service_id),
      duree_calculee,
      NEW.booking_date,
      NEW.address,
      NEW.provider_notes,
      now()
    );
    
    -- Mettre à jour les earnings du prestataire
    UPDATE public.providers 
    SET 
      total_earnings = COALESCE(total_earnings, 0) + (duree_calculee * 17.00),
      monthly_earnings = (
        SELECT COALESCE(SUM(montant_total), 0) 
        FROM public.prestations_realisees 
        WHERE provider_id = provider_id_value
          AND EXTRACT(MONTH FROM date_prestation) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM date_prestation) = EXTRACT(YEAR FROM CURRENT_DATE)
      )
    WHERE id = provider_id_value;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour créer automatiquement les prestations réalisées
DROP TRIGGER IF EXISTS create_prestation_on_completion ON public.bookings;
CREATE TRIGGER create_prestation_on_completion
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_prestation_from_booking();