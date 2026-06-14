-- Remplace find_providers_in_zone(lat, lon, ...) par une version basée sur le code postal.
-- Raisons :
--   1. verify-payment extrait un code postal de l'adresse client (5 chiffres) — pas de lat/lon disponible
--   2. La table zones_geographiques stocke codes_postaux en ARRAY text[]
--   3. Ajout de missions_completed dans le retour pour le scoring côté JS
--   4. Correction alias : zg.zone_name → zg.nom_zone AS zone_name

DROP FUNCTION IF EXISTS public.find_providers_in_zone(numeric, numeric, text, integer);

CREATE OR REPLACE FUNCTION public.find_providers_in_zone(
  p_code_postal  text,
  p_service_type text    DEFAULT NULL,
  p_limit        integer DEFAULT 10
)
RETURNS TABLE(
  provider_id         uuid,
  prestataire_zone_id uuid,
  business_name       text,
  distance_km         numeric,
  rayon_km            integer,
  rating              numeric,
  zone_name           text,
  adresse_reference   text,
  missions_completed  integer
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id                    AS provider_id,
    pz.id                   AS prestataire_zone_id,
    p.business_name,
    NULL::numeric           AS distance_km,
    pz.rayon_km,
    p.rating,
    zg.nom_zone             AS zone_name,
    pz.adresse_reference,
    p.missions_completed
  FROM prestataire_zones pz
  INNER JOIN providers p  ON p.id  = pz.prestataire_id
  INNER JOIN zones_geographiques zg ON zg.id = pz.zone_id
  WHERE pz.statut       = 'active'
    AND p.is_verified   = true
    AND p.status        = 'active'
    AND zg.active       = true
    AND p_code_postal   = ANY(zg.codes_postaux)
    AND (
      pz.disponibilite IS NULL
      OR CASE EXTRACT(DOW FROM CURRENT_DATE)
        WHEN 0 THEN COALESCE((pz.disponibilite->>'sunday')::boolean,  true)
        WHEN 1 THEN COALESCE((pz.disponibilite->>'monday')::boolean,  true)
        WHEN 2 THEN COALESCE((pz.disponibilite->>'tuesday')::boolean, true)
        WHEN 3 THEN COALESCE((pz.disponibilite->>'wednesday')::boolean, true)
        WHEN 4 THEN COALESCE((pz.disponibilite->>'thursday')::boolean, true)
        WHEN 5 THEN COALESCE((pz.disponibilite->>'friday')::boolean,  true)
        WHEN 6 THEN COALESCE((pz.disponibilite->>'saturday')::boolean, true)
      END
    )
  ORDER BY
    p.rating              DESC,
    p.missions_completed  DESC
  LIMIT p_limit;
END;
$$;
