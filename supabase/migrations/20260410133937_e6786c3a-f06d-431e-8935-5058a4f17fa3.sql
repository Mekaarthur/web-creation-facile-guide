
-- 1. Fix client_requests: remove PII from provider-facing SELECT
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Providers can view anonymized request summaries for matching" ON public.client_requests;

-- Create a view for providers that hides PII
CREATE OR REPLACE VIEW public.client_requests_provider_view AS
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

-- Re-create the policy without PII access - providers see full row only when assigned
-- (They already have "Providers can view assigned requests only" for assigned ones)

-- 2. Fix user_presence: restrict to own data + admins
DROP POLICY IF EXISTS "Secure user presence access" ON public.user_presence;

CREATE POLICY "Users can view own presence"
ON public.user_presence
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fix provider_availability: restrict to authenticated users
DROP POLICY IF EXISTS "Everyone can view provider availability" ON public.provider_availability;

CREATE POLICY "Authenticated users can view provider availability"
ON public.provider_availability
FOR SELECT
TO authenticated
USING (true);

-- 4. Fix provider_services: restrict to authenticated users  
DROP POLICY IF EXISTS "Everyone can view provider services" ON public.provider_services;

CREATE POLICY "Authenticated users can view provider services"
ON public.provider_services
FOR SELECT
TO authenticated
USING (true);
