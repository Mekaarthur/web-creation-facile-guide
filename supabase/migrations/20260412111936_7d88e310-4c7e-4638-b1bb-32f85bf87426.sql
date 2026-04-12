
-- Fix the security definer view issue
DROP VIEW IF EXISTS public.client_requests_provider_view;

CREATE VIEW public.client_requests_provider_view
WITH (security_invoker = true) AS
SELECT 
  id,
  service_type,
  service_description,
  location,
  preferred_date,
  preferred_time,
  status,
  created_at,
  assigned_provider_id
FROM public.client_requests
WHERE status = 'new' AND assigned_provider_id IS NULL;
