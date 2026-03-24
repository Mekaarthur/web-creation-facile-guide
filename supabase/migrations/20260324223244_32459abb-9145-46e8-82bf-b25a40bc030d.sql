-- Rewrite get_matching_providers to use provider_services, prestataire_zones, and real data
CREATE OR REPLACE FUNCTION public.get_matching_providers(
  p_service_type text,
  p_location text,
  p_limit integer DEFAULT 10,
  p_date_time timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  provider_id uuid,
  business_name text,
  rating numeric,
  location text,
  match_score integer,
  hourly_rate numeric,
  services_offered jsonb,
  availability_slots jsonb,
  missions_completed bigint,
  last_activity_at timestamp with time zone,
  distance_km numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_service_ids uuid[];
BEGIN
  -- Find matching service IDs by name or category
  SELECT ARRAY_AGG(s.id) INTO v_service_ids
  FROM services s
  WHERE s.is_active = true
    AND (
      LOWER(s.name) LIKE '%' || LOWER(p_service_type) || '%'
      OR LOWER(s.category) LIKE '%' || LOWER(p_service_type) || '%'
    );

  RETURN QUERY
  SELECT 
    p.id AS provider_id,
    p.business_name,
    p.rating,
    p.location,
    -- Compute match score
    (
      -- Service match (40 pts)
      CASE WHEN ps_match.provider_id IS NOT NULL THEN 40
           WHEN LOWER(p.description) LIKE '%' || LOWER(p_service_type) || '%' THEN 20
           ELSE 0
      END
      +
      -- Zone match (30 pts)
      CASE WHEN zone_match.prestataire_id IS NOT NULL THEN 30
           WHEN LOWER(p.location) ILIKE '%' || LOWER(p_location) || '%' THEN 15
           ELSE 5
      END
      +
      -- Rating bonus (20 pts)
      CASE WHEN p.rating >= 4.5 THEN 20
           WHEN p.rating >= 4.0 THEN 15
           WHEN p.rating >= 3.5 THEN 10
           ELSE 5
      END
      +
      -- Activity recency (10 pts)
      CASE WHEN p.updated_at > NOW() - INTERVAL '7 days' THEN 10
           WHEN p.updated_at > NOW() - INTERVAL '30 days' THEN 5
           ELSE 0
      END
    )::integer AS match_score,
    p.hourly_rate,
    -- Services offered
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'service_id', s.id,
        'service_name', s.name,
        'category', s.category
      ))
      FROM provider_services ps2
      JOIN services s ON s.id = ps2.service_id
      WHERE ps2.provider_id = p.id AND ps2.is_active = true),
      '[]'::jsonb
    ) AS services_offered,
    -- Availability from zones
    COALESCE(
      (SELECT jsonb_agg(pz.disponibilite)
       FROM prestataire_zones pz
       WHERE pz.prestataire_id = p.id AND pz.statut = 'active'
       AND pz.disponibilite IS NOT NULL),
      '[]'::jsonb
    ) AS availability_slots,
    -- Completed missions count
    COALESCE(
      (SELECT COUNT(*) FROM bookings b 
       WHERE b.provider_id = p.id AND b.status = 'completed'),
      0
    ) AS missions_completed,
    p.updated_at AS last_activity_at,
    -- Approximate distance via zone
    COALESCE(zone_match.rayon_km, 999)::numeric AS distance_km
  FROM providers p
  -- Join provider_services for service matching
  LEFT JOIN LATERAL (
    SELECT ps.provider_id
    FROM provider_services ps
    WHERE ps.provider_id = p.id
      AND ps.is_active = true
      AND (v_service_ids IS NULL OR ps.service_id = ANY(v_service_ids))
    LIMIT 1
  ) ps_match ON true
  -- Join prestataire_zones for location matching
  LEFT JOIN LATERAL (
    SELECT pz.prestataire_id, pz.rayon_km
    FROM prestataire_zones pz
    JOIN zones_geographiques zg ON zg.id = pz.zone_id
    WHERE pz.prestataire_id = p.id
      AND pz.statut = 'active'
      AND (
        EXISTS (SELECT 1 FROM unnest(zg.villes_couvertes) v WHERE LOWER(v) ILIKE '%' || LOWER(p_location) || '%')
        OR LOWER(zg.nom_zone) ILIKE '%' || LOWER(p_location) || '%'
      )
    LIMIT 1
  ) zone_match ON true
  WHERE p.is_verified = true
    AND p.status = 'active'
  ORDER BY match_score DESC, p.rating DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;
