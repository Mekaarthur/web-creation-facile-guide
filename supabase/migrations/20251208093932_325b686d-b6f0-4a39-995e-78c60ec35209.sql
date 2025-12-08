
-- =====================================================
-- CORRECTION DES VUES AVEC SECURITY INVOKER
-- =====================================================

-- 1. complaint_statistics
DROP VIEW IF EXISTS public.complaint_statistics;
CREATE VIEW public.complaint_statistics
WITH (security_invoker = true)
AS
SELECT count(*) AS total_complaints,
    count(*) FILTER (WHERE status = 'new'::text) AS new_complaints,
    count(*) FILTER (WHERE status = 'in_progress'::text) AS in_progress_complaints,
    count(*) FILTER (WHERE status = 'resolved'::text) AS resolved_complaints,
    count(*) FILTER (WHERE status = 'rejected'::text) AS rejected_complaints,
    count(*) FILTER (WHERE priority = 'urgent'::text) AS urgent_complaints,
    count(*) FILTER (WHERE created_at >= (CURRENT_DATE - '7 days'::interval)) AS complaints_last_7_days,
    count(*) FILTER (WHERE created_at >= (CURRENT_DATE - '30 days'::interval)) AS complaints_last_30_days,
    avg(EXTRACT(epoch FROM resolved_at - created_at) / 3600::numeric) FILTER (WHERE resolved_at IS NOT NULL) AS avg_response_time_hours
FROM complaints;

-- 2. conversations_with_details
DROP VIEW IF EXISTS public.conversations_with_details;
CREATE VIEW public.conversations_with_details
WITH (security_invoker = true)
AS
SELECT 'internal'::text AS type,
    ic.id,
    NULL::uuid AS client_request_id,
    NULL::uuid AS job_application_id,
    NULL::uuid AS booking_id,
    ic.client_id,
    ic.provider_id,
    ic.admin_id,
    ic.last_message_at,
    ic.created_at,
    ic.updated_at,
    (cp.first_name || ' '::text) || cp.last_name AS client_name,
    cp.email AS client_email,
    (pp.first_name || ' '::text) || pp.last_name AS provider_name,
    (ap.first_name || ' '::text) || ap.last_name AS admin_name,
    ic.subject,
    ic.status
FROM internal_conversations ic
    LEFT JOIN profiles cp ON cp.user_id = ic.client_id
    LEFT JOIN profiles pp ON pp.user_id = ic.provider_id
    LEFT JOIN profiles ap ON ap.user_id = ic.admin_id;

-- 3. missions_without_providers_in_zone
DROP VIEW IF EXISTS public.missions_without_providers_in_zone;
CREATE VIEW public.missions_without_providers_in_zone
WITH (security_invoker = true)
AS
SELECT id AS booking_id,
    address,
    booking_date,
    status,
    created_at,
    CASE
        WHEN (EXISTS ( SELECT 1 FROM prestataire_zones pz WHERE pz.statut = 'active'::text)) THEN 'providers_available'::text
        ELSE 'no_providers_in_zone'::text
    END AS provider_availability
FROM bookings b
WHERE provider_id IS NULL AND status = 'pending'::text AND created_at > (now() - '24:00:00'::interval)
ORDER BY created_at DESC;

-- 4. prestataire_zones_stats
DROP VIEW IF EXISTS public.prestataire_zones_stats;
CREATE VIEW public.prestataire_zones_stats
WITH (security_invoker = true)
AS
SELECT pz.id,
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
    z.nom_zone AS zone_name,
    z.type_zone,
    count(DISTINCT b.id) FILTER (WHERE b.status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text])) AS missions_received,
    count(DISTINCT b.id) FILTER (WHERE b.status = ANY (ARRAY['confirmed'::text, 'completed'::text])) AS missions_accepted,
    COALESCE(sum(ft.provider_payment) FILTER (WHERE b.status = 'completed'::text), 0::numeric) AS total_revenue,
    COALESCE(avg(r.rating) FILTER (WHERE r.status = 'published'::text), 0::numeric) AS average_rating,
    max(b.completed_at) AS last_mission_date
FROM prestataire_zones pz
    LEFT JOIN zones_geographiques z ON pz.zone_id = z.id
    LEFT JOIN bookings b ON b.provider_id = pz.prestataire_id AND b.address IS NOT NULL AND pz.latitude IS NOT NULL AND pz.longitude IS NOT NULL
    LEFT JOIN financial_transactions ft ON b.id = ft.booking_id
    LEFT JOIN reviews r ON b.id = r.booking_id
GROUP BY pz.id, pz.prestataire_id, pz.zone_id, pz.adresse_reference, pz.latitude, pz.longitude, pz.rayon_km, pz.statut, pz.disponibilite, pz.created_at, pz.updated_at, pz.last_activity_at, z.nom_zone, z.type_zone;

-- 5. providers_public_view
DROP VIEW IF EXISTS public.providers_public_view;
CREATE VIEW public.providers_public_view
WITH (security_invoker = true)
AS
SELECT p.id,
    p.business_name,
    p.rating,
    p.location,
    p.is_verified,
    p.hourly_rate,
    pr.first_name,
    pr.last_name,
    pr.avatar_url
FROM providers p
    LEFT JOIN profiles pr ON pr.user_id = p.user_id
WHERE p.is_verified = true;

-- 6. review_statistics
DROP VIEW IF EXISTS public.review_statistics;
CREATE VIEW public.review_statistics
WITH (security_invoker = true)
AS
SELECT count(*) AS total_reviews,
    count(*) FILTER (WHERE status = 'pending'::text) AS pending_reviews,
    count(*) FILTER (WHERE status = 'published'::text) AS published_reviews,
    count(*) FILTER (WHERE status = 'rejected'::text) AS rejected_reviews,
    count(*) FILTER (WHERE rating <= 2) AS negative_reviews,
    count(*) FILTER (WHERE rating >= 4) AS positive_reviews,
    round(avg(rating), 1) AS average_rating,
    count(*) FILTER (WHERE created_at >= (now() - '7 days'::interval)) AS reviews_last_7_days,
    count(*) FILTER (WHERE created_at >= (now() - '30 days'::interval)) AS reviews_last_30_days
FROM reviews;
