-- ============================================
-- MATCHING AUTOMATIQUE MISSIONS ↔ ZONES
-- ============================================

-- 1️⃣ Fonction pour calculer la distance entre deux points GPS (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  earth_radius_km NUMERIC := 6371;
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  -- Convertir en radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Formule Haversine
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius_km * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2️⃣ Fonction pour trouver les prestataires disponibles dans une zone donnée
CREATE OR REPLACE FUNCTION find_providers_in_zone(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_service_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  provider_id UUID,
  prestataire_zone_id UUID,
  business_name TEXT,
  distance_km NUMERIC,
  rayon_km INTEGER,
  rating NUMERIC,
  zone_name TEXT,
  adresse_reference TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as provider_id,
    pz.id as prestataire_zone_id,
    p.business_name,
    calculate_distance_km(pz.latitude, pz.longitude, p_latitude, p_longitude) as distance_km,
    pz.rayon_km,
    p.rating,
    zg.zone_name,
    pz.adresse_reference
  FROM prestataire_zones pz
  INNER JOIN providers p ON p.id = pz.prestataire_id
  LEFT JOIN zones_geographiques zg ON zg.id = pz.zone_id
  WHERE pz.statut = 'active'
    AND p.is_verified = true
    AND p.status = 'active'
    -- Vérifier que la distance est dans le rayon
    AND calculate_distance_km(pz.latitude, pz.longitude, p_latitude, p_longitude) <= pz.rayon_km
    -- Vérifier la disponibilité du jour (optionnel)
    AND (
      CASE EXTRACT(DOW FROM CURRENT_DATE)
        WHEN 0 THEN (pz.disponibilite->>'sunday')::boolean
        WHEN 1 THEN (pz.disponibilite->>'monday')::boolean
        WHEN 2 THEN (pz.disponibilite->>'tuesday')::boolean
        WHEN 3 THEN (pz.disponibilite->>'wednesday')::boolean
        WHEN 4 THEN (pz.disponibilite->>'thursday')::boolean
        WHEN 5 THEN (pz.disponibilite->>'friday')::boolean
        WHEN 6 THEN (pz.disponibilite->>'saturday')::boolean
      END
    )
  ORDER BY 
    distance_km ASC,
    p.rating DESC,
    p.missions_completed DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3️⃣ Fonction pour notifier les prestataires d'une nouvelle mission dans leur zone
CREATE OR REPLACE FUNCTION notify_providers_in_zone()
RETURNS TRIGGER AS $$
DECLARE
  provider_record RECORD;
  mission_address TEXT;
  mission_lat NUMERIC;
  mission_lon NUMERIC;
BEGIN
  -- Récupérer l'adresse de la mission (depuis bookings ou client_requests)
  IF TG_TABLE_NAME = 'bookings' THEN
    mission_address := NEW.address;
    -- TODO: Géocoder l'adresse si lat/lon pas disponibles
    -- Pour l'instant on cherche dans toutes les zones actives
  ELSIF TG_TABLE_NAME = 'client_requests' THEN
    mission_address := NEW.location;
  END IF;

  -- Si on a des coordonnées, trouver les prestataires dans la zone
  IF mission_lat IS NOT NULL AND mission_lon IS NOT NULL THEN
    FOR provider_record IN 
      SELECT * FROM find_providers_in_zone(mission_lat, mission_lon, NULL, 20)
    LOOP
      -- Créer notification pour chaque prestataire dans la zone
      INSERT INTO provider_notifications (
        provider_id,
        title,
        message,
        type,
        booking_id,
        created_at
      ) VALUES (
        provider_record.provider_id,
        '🎯 Nouvelle mission dans votre zone',
        CONCAT(
          'Mission disponible à ', mission_address,
          ' (à ', ROUND(provider_record.distance_km, 1), ' km de votre zone "', 
          provider_record.adresse_reference, '")'
        ),
        'new_mission_in_zone',
        CASE WHEN TG_TABLE_NAME = 'bookings' THEN NEW.id ELSE NULL END,
        NOW()
      );

      -- Créer notification temps réel
      INSERT INTO realtime_notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        is_read
      )
      SELECT 
        pr.user_id,
        'mission_available',
        '🎯 Mission dans votre zone',
        CONCAT('Nouvelle mission à ', ROUND(provider_record.distance_km, 1), ' km'),
        jsonb_build_object(
          'booking_id', CASE WHEN TG_TABLE_NAME = 'bookings' THEN NEW.id ELSE NULL END,
          'distance_km', provider_record.distance_km,
          'zone_name', provider_record.zone_name,
          'address', mission_address
        ),
        'normal',
        false
      FROM providers pr
      WHERE pr.id = provider_record.provider_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ Trigger sur les nouvelles réservations (bookings)
DROP TRIGGER IF EXISTS trigger_notify_providers_on_new_booking ON bookings;
CREATE TRIGGER trigger_notify_providers_on_new_booking
AFTER INSERT ON bookings
FOR EACH ROW
WHEN (NEW.status = 'pending' AND NEW.provider_id IS NULL)
EXECUTE FUNCTION notify_providers_in_zone();

-- 5️⃣ Trigger sur les nouvelles demandes clients (client_requests)
DROP TRIGGER IF EXISTS trigger_notify_providers_on_new_request ON client_requests;
CREATE TRIGGER trigger_notify_providers_on_new_request
AFTER INSERT ON client_requests
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_providers_in_zone();

-- 6️⃣ Fonction pour géocoder une adresse (placeholder - nécessite API externe)
CREATE OR REPLACE FUNCTION geocode_address(p_address TEXT)
RETURNS TABLE(latitude NUMERIC, longitude NUMERIC) AS $$
BEGIN
  -- TODO: Implémenter avec Google Maps Geocoding API via edge function
  -- Pour l'instant, retourner NULL (sera géré par l'application)
  RETURN QUERY SELECT NULL::NUMERIC as latitude, NULL::NUMERIC as longitude;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7️⃣ Vue pour dashboard admin: missions sans prestataire dans zone
CREATE OR REPLACE VIEW missions_without_providers_in_zone AS
SELECT 
  b.id as booking_id,
  b.address,
  b.booking_date,
  b.status,
  b.created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM prestataire_zones pz
      WHERE pz.statut = 'active'
      -- Ici on devrait vérifier la distance mais sans coordonnées...
    ) THEN 'providers_available'
    ELSE 'no_providers_in_zone'
  END as provider_availability
FROM bookings b
WHERE b.provider_id IS NULL
  AND b.status = 'pending'
  AND b.created_at > NOW() - INTERVAL '24 hours'
ORDER BY b.created_at DESC;

-- 8️⃣ Fonction pour suggérer le meilleur prestataire pour une mission
CREATE OR REPLACE FUNCTION suggest_best_provider(
  p_booking_id UUID
)
RETURNS TABLE(
  provider_id UUID,
  business_name TEXT,
  distance_km NUMERIC,
  rating NUMERIC,
  missions_completed INTEGER,
  recommendation_score NUMERIC
) AS $$
DECLARE
  booking_record RECORD;
BEGIN
  -- Récupérer les infos de la réservation
  SELECT * INTO booking_record
  FROM bookings
  WHERE id = p_booking_id;

  -- Si pas de coordonnées, impossible de suggérer
  IF booking_record.latitude IS NULL OR booking_record.longitude IS NULL THEN
    RETURN;
  END IF;

  -- Trouver et scorer les prestataires
  RETURN QUERY
  SELECT 
    pz.provider_id,
    p.business_name,
    pz.distance_km,
    p.rating,
    p.missions_completed,
    -- Score de recommandation (0-100)
    (
      (5 - pz.distance_km) * 10 +  -- Distance (max 50 points)
      p.rating * 10 +                -- Note (max 50 points)
      LEAST(p.missions_completed, 10) * 0.5  -- Expérience (max 5 points)
    ) as recommendation_score
  FROM find_providers_in_zone(
    booking_record.latitude,
    booking_record.longitude,
    NULL,
    10
  ) pz
  INNER JOIN providers p ON p.id = pz.provider_id
  ORDER BY recommendation_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_providers_in_zone IS 'Trouve les prestataires disponibles dans une zone géographique donnée';
COMMENT ON FUNCTION notify_providers_in_zone IS 'Notifie automatiquement les prestataires quand une mission est créée dans leur zone';
COMMENT ON FUNCTION suggest_best_provider IS 'Suggère les meilleurs prestataires pour une mission donnée basé sur distance, note et expérience';