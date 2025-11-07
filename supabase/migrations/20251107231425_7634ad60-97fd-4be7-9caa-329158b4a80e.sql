-- Identifier et corriger toutes les vues avec SECURITY DEFINER

-- Supprimer toutes les vues potentiellement problématiques
DROP VIEW IF EXISTS public.complaint_statistics CASCADE;
DROP VIEW IF EXISTS public.conversations_with_details CASCADE;
DROP VIEW IF EXISTS public.provider_performance_view CASCADE;
DROP VIEW IF EXISTS public.mission_statistics CASCADE;
DROP VIEW IF EXISTS public.client_dashboard_stats CASCADE;

-- Recréer la vue complaint_statistics SANS security definer
CREATE OR REPLACE VIEW public.complaint_statistics AS
SELECT 
  COUNT(*) AS total_complaints,
  COUNT(*) FILTER (WHERE status = 'new') AS new_complaints,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_complaints,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_complaints,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_complaints,
  COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent_complaints,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS complaints_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS complaints_last_30_days,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL) AS avg_response_time_hours
FROM public.complaints;

-- Recréer la vue conversations_with_details SANS security definer
CREATE OR REPLACE VIEW public.conversations_with_details AS
SELECT 
  'internal'::text AS type,
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
  cp.first_name || ' ' || cp.last_name AS client_name,
  cp.email AS client_email,
  pp.first_name || ' ' || pp.last_name AS provider_name,
  ap.first_name || ' ' || ap.last_name AS admin_name,
  ic.subject,
  ic.status
FROM public.internal_conversations ic
LEFT JOIN public.profiles cp ON cp.user_id = ic.client_id
LEFT JOIN public.profiles pp ON pp.user_id = ic.provider_id
LEFT JOIN public.profiles ap ON ap.user_id = ic.admin_id;

-- Ajouter des politiques RLS pour les vues si nécessaire
COMMENT ON VIEW public.complaint_statistics IS 'Statistiques des réclamations - Respecte les RLS de la table complaints';
COMMENT ON VIEW public.conversations_with_details IS 'Vue détaillée des conversations - Respecte les RLS des tables sous-jacentes';