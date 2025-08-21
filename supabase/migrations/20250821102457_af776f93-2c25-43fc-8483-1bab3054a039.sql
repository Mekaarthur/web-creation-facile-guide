-- Fix security definer view warnings by ensuring views are standard views
-- without any security definer properties

-- Check and fix profiles_display view
DROP VIEW IF EXISTS public.profiles_display CASCADE;

-- Recreate profiles_display view as a standard view
CREATE VIEW public.profiles_display AS
SELECT 
  id,
  user_id,
  -- Only expose names for verified providers
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.user_id = profiles.user_id 
      AND p.is_verified = true
    ) THEN first_name
    ELSE NULL
  END as display_first_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.user_id = profiles.user_id 
      AND p.is_verified = true
    ) THEN last_name
    ELSE NULL
  END as display_last_name,
  -- Avatar for verified providers only
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.user_id = profiles.user_id 
      AND p.is_verified = true
    ) THEN avatar_url
    ELSE NULL
  END as display_avatar_url
FROM public.profiles;

-- Check and fix providers_public view
DROP VIEW IF EXISTS public.providers_public CASCADE;

-- Recreate providers_public view as a standard view
CREATE VIEW public.providers_public AS
SELECT 
  id,
  business_name,
  description,
  location,
  rating,
  is_verified,
  status,
  created_at,
  -- Safe price range without exposing exact rates
  CASE 
    WHEN hourly_rate IS NOT NULL THEN 'À partir de ' || ROUND(hourly_rate)::text || '€/h'
    ELSE 'Prix sur devis'
  END as price_range
FROM public.providers
WHERE is_verified = true AND status = 'active';

-- Grant appropriate permissions without making views security definers
GRANT SELECT ON public.profiles_display TO public;
GRANT SELECT ON public.profiles_display TO authenticated;
GRANT SELECT ON public.providers_public TO public;
GRANT SELECT ON public.providers_public TO authenticated;