
-- =====================================================
-- CORRECTION DES 2 DERNIÈRES VUES
-- =====================================================

-- D'abord supprimer zone_alerts_with_details car elle dépend de zone_statistics
DROP VIEW IF EXISTS public.zone_alerts_with_details;

-- Puis recréer zone_statistics
DROP VIEW IF EXISTS public.zone_statistics;
CREATE VIEW public.zone_statistics
WITH (security_invoker = true)
AS
SELECT z.id,
    z.nom_zone,
    z.type_zone,
    z.codes_postaux,
    z.villes_couvertes,
    z.active,
    z.statut,
    z.rayon_km,
    z.responsable_id,
    z.description,
    z.created_at,
    z.updated_at,
    count(DISTINCT zp.prestataire_id) AS provider_count,
    count(DISTINCT zc.client_id) AS client_count,
    count(DISTINCT b.id) AS missions_count,
    COALESCE(avg(r.rating), 0::numeric) AS satisfaction_moyenne,
    COALESCE(sum(
        CASE
            WHEN b.status = 'completed'::text THEN ft.client_price
            ELSE 0::numeric
        END), 0::numeric) AS ca_total
FROM zones_geographiques z
    LEFT JOIN zone_prestataires zp ON z.id = zp.zone_id
    LEFT JOIN zone_clients zc ON z.id = zc.zone_id
    LEFT JOIN bookings b ON zp.prestataire_id = b.provider_id
    LEFT JOIN reviews r ON b.id = r.booking_id
    LEFT JOIN financial_transactions ft ON b.id = ft.booking_id
GROUP BY z.id, z.nom_zone, z.type_zone, z.codes_postaux, z.villes_couvertes, z.active, z.statut, z.rayon_km, z.responsable_id, z.description, z.created_at, z.updated_at;

-- Enfin recréer zone_alerts_with_details
CREATE VIEW public.zone_alerts_with_details
WITH (security_invoker = true)
AS
SELECT za.id,
    za.zone_id,
    za.alert_type,
    za.severity,
    za.title,
    za.message,
    za.current_value,
    za.threshold_value,
    za.is_resolved,
    za.resolved_at,
    za.resolved_by,
    za.created_at,
    za.updated_at,
    z.nom_zone,
    z.type_zone,
    z.statut,
    zs.provider_count,
    zs.client_count,
    zs.satisfaction_moyenne
FROM zone_alerts za
    JOIN zones_geographiques z ON za.zone_id = z.id
    LEFT JOIN zone_statistics zs ON za.zone_id = zs.id
ORDER BY (
    CASE za.severity
        WHEN 'critical'::text THEN 1
        WHEN 'high'::text THEN 2
        WHEN 'medium'::text THEN 3
        WHEN 'low'::text THEN 4
        ELSE NULL::integer
    END), za.created_at DESC;
