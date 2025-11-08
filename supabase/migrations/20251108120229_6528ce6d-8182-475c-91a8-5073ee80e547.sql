-- Corriger les avertissements de sécurité : SET search_path pour les nouvelles fonctions

-- 1️⃣ Fonction calculate_distance_km
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
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius_km * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- 2️⃣ Fonction find_providers_in_zone
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
    AND calculate_distance_km(pz.latitude, pz.longitude, p_latitude, p_longitude) <= pz.rayon_km
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
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- 3️⃣ Fonction notify_providers_in_zone
CREATE OR REPLACE FUNCTION notify_providers_in_zone()
RETURNS TRIGGER AS $$
DECLARE
  provider_record RECORD;
  mission_address TEXT;
  mission_lat NUMERIC;
  mission_lon NUMERIC;
BEGIN
  IF TG_TABLE_NAME = 'bookings' THEN
    mission_address := NEW.address;
  ELSIF TG_TABLE_NAME = 'client_requests' THEN
    mission_address := NEW.location;
  END IF;

  IF mission_lat IS NOT NULL AND mission_lon IS NOT NULL THEN
    FOR provider_record IN 
      SELECT * FROM find_providers_in_zone(mission_lat, mission_lon, NULL, 20)
    LOOP
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4️⃣ Fonction geocode_address
CREATE OR REPLACE FUNCTION geocode_address(p_address TEXT)
RETURNS TABLE(latitude NUMERIC, longitude NUMERIC) AS $$
BEGIN
  RETURN QUERY SELECT NULL::NUMERIC as latitude, NULL::NUMERIC as longitude;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- 5️⃣ Fonction suggest_best_provider
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
  SELECT * INTO booking_record
  FROM bookings
  WHERE id = p_booking_id;

  IF booking_record.latitude IS NULL OR booking_record.longitude IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    pz.provider_id,
    p.business_name,
    pz.distance_km,
    p.rating,
    p.missions_completed,
    (
      (5 - pz.distance_km) * 10 +
      p.rating * 10 +
      LEAST(p.missions_completed, 10) * 0.5
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
$$ LANGUAGE plpgsql STABLE SET search_path = public;