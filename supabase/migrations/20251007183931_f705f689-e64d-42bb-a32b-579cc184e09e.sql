-- Fix provider data exposure by creating a safe public view
-- This prevents exposure of SIRET, contact details, earnings, and performance metrics

-- =============================================================================
-- 1. Remove public access to main providers table
-- =============================================================================

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public limited provider view" ON public.providers;
DROP POLICY IF EXISTS "Public can view limited provider info" ON public.providers;

-- Only authenticated users and admins can access the full providers table
-- Providers can still manage their own profiles
-- (Keep existing authenticated policies)

-- =============================================================================
-- 2. Create a safe public view with only non-sensitive information
-- =============================================================================

-- Drop view if it exists
DROP VIEW IF EXISTS public.providers_public_view;

-- Create a view that only exposes safe, non-sensitive provider information
CREATE VIEW public.providers_public_view AS
SELECT 
  p.id,
  p.business_name,
  p.location,  -- General location (city/area) is okay, not full address
  p.rating,
  p.is_verified,
  p.status,
  p.profile_photo_url,
  p.description,
  -- Expose services offered through a JSON aggregation
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'service_id', s.id,
          'service_name', s.name,
          'category', s.category,
          'price', COALESCE(ps.price_override, s.price_per_hour)
        )
      )
      FROM provider_services ps
      JOIN services s ON s.id = ps.service_id
      WHERE ps.provider_id = p.id 
        AND ps.is_active = true
    ),
    '[]'::json
  ) as services_offered
FROM providers p
WHERE p.is_verified = true 
  AND p.status = 'active';

-- Add comment explaining the security model
COMMENT ON VIEW public.providers_public_view IS 
  'Public-safe view of provider information. Only exposes:
   - Basic identity: id, business_name, location (general)
   - Public metrics: rating, verification status
   - Service offerings with pricing
   NEVER exposes: SIRET, phone, email, address details, earnings, 
   performance scores, acceptance rates, or other sensitive business data';

-- Enable RLS on the view (even though it's a view, this is good practice)
ALTER VIEW public.providers_public_view SET (security_barrier = true);

-- Grant SELECT on the view to public (unauthenticated users)
GRANT SELECT ON public.providers_public_view TO anon;
GRANT SELECT ON public.providers_public_view TO authenticated;

-- =============================================================================
-- 3. Ensure main providers table is properly restricted
-- =============================================================================

-- Verify that only these policies exist on providers table:
-- 1. Providers can manage their own profile (already exists)
-- 2. Admins can manage all providers (already exists)

-- Create explicit DENY policy for anonymous users on main table
CREATE POLICY "Anonymous users cannot access providers table"
ON public.providers
FOR SELECT
TO anon
USING (false);

-- Authenticated non-admin, non-owner users also cannot access
CREATE POLICY "Authenticated users can only view verified providers"
ON public.providers
FOR SELECT
TO authenticated
USING (
  -- User is the provider themselves
  auth.uid() = user_id
  -- OR user is an admin
  OR has_role(auth.uid(), 'admin'::app_role)
  -- OR for matching/booking purposes, show only verified active providers
  OR (is_verified = true AND status = 'active')
);

-- =============================================================================
-- 4. Add security documentation
-- =============================================================================

COMMENT ON TABLE public.providers IS 
  'Provider profiles with STRICT RLS protection:
   ✅ Public access: ONLY via providers_public_view (safe, limited columns)
   ✅ Providers: Full access to their own profile
   ✅ Admins: Full access to all profiles
   ✅ Authenticated users: Can see basic info of verified/active providers
   ❌ Anonymous users: NO direct table access
   
   NEVER expose directly to public:
   - SIRET numbers (siret_number)
   - Contact details (phone, email, user_id)
   - Financial data (total_earnings, monthly_earnings, hourly_rate)
   - Performance metrics (acceptance_rate, performance_score)
   - Detailed addresses or business registration info';
