-- Fix RLS protection on providers_public_view
-- Ensure the view is properly secured while remaining accessible for legitimate browsing

-- =============================================================================
-- 1. Ensure security barrier is enabled on the view
-- =============================================================================

ALTER VIEW public.providers_public_view SET (security_barrier = true);

-- =============================================================================
-- 2. Update view documentation with security clarifications
-- =============================================================================

COMMENT ON VIEW public.providers_public_view IS 
  'Public-safe view of provider information with controlled access.
   
   EXPOSED DATA (non-sensitive only):
   - Basic identity: id, business_name, location (general city/area only)
   - Public metrics: rating, verification status, active status
   - Service offerings with pricing
   - Profile photo URL
   
   PROTECTED DATA (never exposed via this view):
   - SIRET numbers, tax IDs, business registration details
   - Contact details (phone, email, user_id mappings)
   - Financial data (earnings, hourly rates, commission structures)
   - Performance metrics (acceptance_rate, performance_score, rotation_priority)
   - Detailed addresses or precise GPS coordinates
   - Internal administrative fields
   
   SECURITY MODEL:
   - This view is intentionally PUBLIC for marketplace browsing functionality
   - Only shows providers that are both verified AND active
   - Underlying providers table has strict RLS preventing direct access
   - View acts as a controlled public API endpoint
   
   RATE LIMITING RECOMMENDATIONS:
   - Implement application-layer rate limiting (suggested: 100 queries/minute/IP)
   - Monitor for scraping patterns in application logs
   - Consider CAPTCHA for bulk query patterns
   - Log suspicious access patterns to security_audit_log table';

-- =============================================================================
-- 3. Create monitoring function for application layer
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_provider_view_access(
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_query_type text DEFAULT 'list'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access patterns to security audit table for monitoring
  -- This helps detect scraping and abuse patterns
  INSERT INTO public.security_audit_log (
    event_type,
    table_name,
    details,
    ip_address
  ) VALUES (
    'provider_view_access',
    'providers_public_view',
    jsonb_build_object(
      'query_type', p_query_type,
      'user_agent', p_user_agent,
      'timestamp', now()
    ),
    p_ip_address
  );
END;
$$;

COMMENT ON FUNCTION public.log_provider_view_access IS 
  'Monitoring function for tracking access to provider public view. 
   Call this from your application to log and detect unusual access patterns.
   Example: SELECT log_provider_view_access(''192.168.1.1'', ''Mozilla/5.0...'', ''search'');';

-- =============================================================================
-- 4. Verify underlying table protection is properly configured
-- =============================================================================

-- Ensure anonymous users absolutely cannot access the main providers table directly
DO $$
BEGIN
  -- Check if the restrictive policy exists, create if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'providers' 
    AND policyname = 'Anonymous users cannot access providers table'
  ) THEN
    EXECUTE 'CREATE POLICY "Anonymous users cannot access providers table"
      ON public.providers FOR SELECT TO anon USING (false)';
  END IF;
END $$;

-- =============================================================================
-- 5. Document the security model in the providers table
-- =============================================================================

COMMENT ON TABLE public.providers IS 
  'Provider profiles with STRICT RLS protection.
   
   ACCESS CONTROL:
   ✅ Anonymous users: NO direct access (blocked by RLS)
   ✅ Anonymous users: CAN access via providers_public_view (safe, limited data)
   ✅ Authenticated users: Can view verified/active providers
   ✅ Providers: Full access to their own profile only
   ✅ Admins: Full access to all profiles
   
   SECURITY NOTES:
   - NEVER expose sensitive fields to public (SIRET, earnings, contact info)
   - All public access MUST go through providers_public_view
   - Direct table queries are blocked for anonymous users
   - Monitor security_audit_log for suspicious access patterns';