-- Table pour les zones d'intervention des prestataires
CREATE TABLE IF NOT EXISTS public.prestataire_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prestataire_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones_geographiques(id) ON DELETE SET NULL,
  adresse_reference TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  rayon_km INTEGER NOT NULL DEFAULT 10 CHECK (rayon_km >= 5 AND rayon_km <= 50),
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'paused', 'inactive')),
  disponibilite JSONB DEFAULT '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": false, "sunday": false}'::jsonb,
  missions_count INTEGER DEFAULT 0,
  missions_accepted INTEGER DEFAULT 0,
  total_revenue NUMERIC(10, 2) DEFAULT 0,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prestataire_id, adresse_reference)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_prestataire_zones_prestataire ON prestataire_zones(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_prestataire_zones_zone ON prestataire_zones(zone_id);
CREATE INDEX IF NOT EXISTS idx_prestataire_zones_statut ON prestataire_zones(statut);
CREATE INDEX IF NOT EXISTS idx_prestataire_zones_location ON prestataire_zones(latitude, longitude);

-- RLS pour prestataire_zones
ALTER TABLE prestataire_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their own zones" ON prestataire_zones
  FOR ALL USING (
    prestataire_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all provider zones" ON prestataire_zones
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Vue statistiques des zones des prestataires
CREATE OR REPLACE VIEW prestataire_zones_stats AS
SELECT 
  pz.id,
  pz.prestataire_id,
  pz.zone_id,
  pz.adresse_reference,
  pz.latitude,
  pz.longitude,
  pz.rayon_km,
  pz.statut,
  pz.disponibilite,
  pz.created_at,
  pz.updated_at,
  pz.last_activity_at,
  z.nom_zone as zone_name,
  z.type_zone,
  -- Statistiques calculées
  COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('pending', 'confirmed', 'completed')) as missions_received,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('confirmed', 'completed')) as missions_accepted,
  COALESCE(SUM(ft.provider_payment) FILTER (WHERE b.status = 'completed'), 0) as total_revenue,
  COALESCE(AVG(r.rating) FILTER (WHERE r.status = 'published'), 0) as average_rating,
  MAX(b.completed_at) as last_mission_date
FROM prestataire_zones pz
LEFT JOIN zones_geographiques z ON pz.zone_id = z.id
LEFT JOIN bookings b ON b.provider_id = pz.prestataire_id
  AND b.address IS NOT NULL
  -- Vérifier que la mission est dans le rayon de la zone
  AND (
    -- Calcul simplifié de distance (approximation)
    pz.latitude IS NOT NULL 
    AND pz.longitude IS NOT NULL
  )
LEFT JOIN financial_transactions ft ON b.id = ft.booking_id
LEFT JOIN reviews r ON b.id = r.booking_id
GROUP BY 
  pz.id, pz.prestataire_id, pz.zone_id, pz.adresse_reference, 
  pz.latitude, pz.longitude, pz.rayon_km, pz.statut, pz.disponibilite,
  pz.created_at, pz.updated_at, pz.last_activity_at,
  z.nom_zone, z.type_zone;

-- Fonction pour limiter le nombre de zones par prestataire
CREATE OR REPLACE FUNCTION check_provider_zone_limit()
RETURNS TRIGGER AS $$
DECLARE
  zone_count INTEGER;
  max_zones INTEGER := 5; -- Configurable
BEGIN
  -- Compter les zones actives du prestataire
  SELECT COUNT(*) INTO zone_count
  FROM prestataire_zones
  WHERE prestataire_id = NEW.prestataire_id
  AND statut = 'active';
  
  IF zone_count >= max_zones THEN
    RAISE EXCEPTION 'Limite de zones atteinte. Maximum % zones actives autorisées.', max_zones;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier la limite
DROP TRIGGER IF EXISTS trigger_check_provider_zone_limit ON prestataire_zones;
CREATE TRIGGER trigger_check_provider_zone_limit
BEFORE INSERT ON prestataire_zones
FOR EACH ROW
EXECUTE FUNCTION check_provider_zone_limit();

-- Fonction pour auto-assigner une zone géographique basée sur les coordonnées
CREATE OR REPLACE FUNCTION auto_assign_zone_to_provider()
RETURNS TRIGGER AS $$
DECLARE
  closest_zone_id UUID;
BEGIN
  -- Si pas de zone_id spécifiée et qu'on a des coordonnées
  IF NEW.zone_id IS NULL AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    -- Trouver la zone la plus proche (basé sur les codes postaux pour l'instant)
    -- Cette logique peut être améliorée avec une vraie distance géographique
    SELECT id INTO closest_zone_id
    FROM zones_geographiques
    WHERE active = true
    ORDER BY 
      CASE 
        WHEN type_zone = 'ville' THEN 1
        WHEN type_zone = 'departement' THEN 2
        WHEN type_zone = 'metropole' THEN 3
        WHEN type_zone = 'region' THEN 4
        ELSE 5
      END
    LIMIT 1;
    
    NEW.zone_id := closest_zone_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-assignation
DROP TRIGGER IF EXISTS trigger_auto_assign_zone_to_provider ON prestataire_zones;
CREATE TRIGGER trigger_auto_assign_zone_to_provider
BEFORE INSERT OR UPDATE ON prestataire_zones
FOR EACH ROW
EXECUTE FUNCTION auto_assign_zone_to_provider();

-- Fonction pour mettre à jour les statistiques d'une zone prestataire
CREATE OR REPLACE FUNCTION update_prestataire_zone_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour last_activity_at quand une mission est complétée
  IF (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
    UPDATE prestataire_zones
    SET 
      last_activity_at = now(),
      missions_count = missions_count + 1,
      updated_at = now()
    WHERE prestataire_id = NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats
DROP TRIGGER IF EXISTS trigger_update_prestataire_zone_stats ON bookings;
CREATE TRIGGER trigger_update_prestataire_zone_stats
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_prestataire_zone_stats();