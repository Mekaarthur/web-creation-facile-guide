-- Fix remaining Security Definer View warnings
-- Convert table-returning functions to SECURITY INVOKER where possible

-- 1. get_public_provider_info - only returns public data, doesn't need SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_public_provider_info(p_provider_id UUID)
RETURNS TABLE(
  id UUID,
  business_name TEXT,
  description TEXT,
  location TEXT,
  rating NUMERIC,
  missions_completed INTEGER,
  is_verified BOOLEAN,
  profile_photo_url TEXT
)
LANGUAGE sql
SECURITY INVOKER -- Changed from DEFINER
STABLE
SET search_path = 'public'
AS $function$
  SELECT 
    p.id,
    p.business_name,
    p.description,
    p.location,
    p.rating,
    p.missions_completed,
    p.is_verified,
    p.profile_photo_url
  FROM public.providers p
  WHERE p.id = p_provider_id 
    AND p.is_verified = true 
    AND p.status = 'active';
$function$;

-- 2. get_safe_platform_stats - aggregate public stats, doesn't need SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_safe_platform_stats()
RETURNS TABLE(
  verified_providers BIGINT,
  monthly_completed_bookings BIGINT,
  platform_average_rating NUMERIC,
  active_service_categories BIGINT
)
LANGUAGE sql
SECURITY INVOKER -- Changed from DEFINER
STABLE
SET search_path = 'public'
AS $function$
  SELECT 
    (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active'),
    (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'),
    (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true),
    (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true);
$function$;

-- 3. match_providers_for_client - needs to read all providers for matching, keep SECURITY DEFINER
-- but add comment explaining why it's necessary
COMMENT ON FUNCTION public.match_providers_for_client IS 
  'SECURITY DEFINER required: Must access all provider data to perform matching algorithm.
   Security enforced via RLS on underlying tables and result filtering.
   Returns TABLE for matching results.';

-- Add comments to the updated functions
COMMENT ON FUNCTION public.get_public_provider_info IS 
  'SECURITY INVOKER: Safe to run with caller privileges. Only returns public verified provider data.';

COMMENT ON FUNCTION public.get_safe_platform_stats IS 
  'SECURITY INVOKER: Safe to run with caller privileges. Returns aggregate public statistics only.';
