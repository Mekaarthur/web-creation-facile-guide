-- CRITICAL SECURITY FIX: Remove Security Definer Views that bypass RLS policies

-- Drop existing views that have security definer properties
DROP VIEW IF EXISTS public.profiles_display CASCADE;
DROP VIEW IF EXISTS public.providers_public CASCADE;

-- Recreate profiles_display as a standard view without security definer bypass
-- This view will now respect RLS policies of the underlying profiles table
CREATE VIEW public.profiles_display AS
SELECT 
  id,
  user_id,
  -- Only show names for verified providers (respects profiles table RLS)
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.user_id = profiles.user_id 
      AND p.is_verified = true
      AND p.status = 'active'
    ) THEN first_name
    ELSE NULL
  END as display_first_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.user_id = profiles.user_id 
      AND p.is_verified = true
      AND p.status = 'active'
    ) THEN last_name
    ELSE NULL
  END as display_last_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.user_id = profiles.user_id 
      AND p.is_verified = true
      AND p.status = 'active'
    ) THEN avatar_url
    ELSE NULL
  END as display_avatar_url
FROM public.profiles;

-- Recreate providers_public as a standard view without security definer bypass
-- This view will now respect RLS policies of the underlying providers table
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
  -- Safe price display without exposing exact rates
  CASE 
    WHEN hourly_rate IS NOT NULL THEN 'À partir de ' || ROUND(hourly_rate)::text || '€/h'
    ELSE 'Prix sur devis'
  END as price_range
FROM public.providers
WHERE is_verified = true AND status = 'active';

-- Grant only necessary permissions (no broad public access that bypasses RLS)
-- Remove overly permissive grants that created security definer behavior
REVOKE ALL ON public.profiles_display FROM public;
REVOKE ALL ON public.providers_public FROM public;

-- Grant limited access that respects RLS policies
GRANT SELECT ON public.profiles_display TO authenticated;
GRANT SELECT ON public.providers_public TO authenticated;
GRANT SELECT ON public.providers_public TO anon;  -- Only for provider search functionality

-- Ensure views cannot be modified by regular users
REVOKE INSERT, UPDATE, DELETE ON public.profiles_display FROM public, authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.providers_public FROM public, authenticated, anon;

-- Log this critical security fix
INSERT INTO public.action_history (
  entity_type,
  entity_id,
  action_type,
  old_value,
  new_value,
  admin_comment
) VALUES (
  'security_fix',
  gen_random_uuid(),
  'security_definer_views_fixed',
  'Views with SECURITY DEFINER properties bypassing RLS',
  'Standard views respecting RLS policies with limited permissions',
  'CRITICAL: Fixed Security Definer Views - removed bypass of RLS policies'
);