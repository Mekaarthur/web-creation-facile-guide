-- FINAL SECURITY FIX: Remove Security Definer Views completely
-- Views owned by postgres superuser are inherently security definer and bypass RLS

-- Remove the problematic views entirely to eliminate security definer bypass
DROP VIEW IF EXISTS public.profiles_display CASCADE;
DROP VIEW IF EXISTS public.providers_public CASCADE;

-- Instead of views, create secure functions that respect RLS policies
-- These functions will run with the caller's permissions, not elevated privileges

-- Function to get safe provider display information (respects RLS)
CREATE OR REPLACE FUNCTION public.get_provider_display_info(p_provider_id UUID)
RETURNS TABLE(
  id UUID,
  business_name TEXT,
  description TEXT,
  location TEXT,
  rating NUMERIC,
  price_range TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Explicitly use invoker's rights, not definer's
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.business_name,
    p.description,
    p.location,
    p.rating,
    CASE 
      WHEN p.hourly_rate IS NOT NULL THEN 'À partir de ' || ROUND(p.hourly_rate)::text || '€/h'
      ELSE 'Prix sur devis'
    END as price_range
  FROM public.providers p
  WHERE p.id = p_provider_id
    AND p.is_verified = true 
    AND p.status = 'active';
$$;

-- Function to get safe profile display information (respects RLS)
CREATE OR REPLACE FUNCTION public.get_profile_display_info(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  display_first_name TEXT,
  display_last_name TEXT,
  display_avatar_url TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Explicitly use invoker's rights, not definer's  
SET search_path = public
AS $$
  SELECT 
    prof.id,
    prof.user_id,
    -- Only show names for verified providers
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.providers p 
        WHERE p.user_id = prof.user_id 
        AND p.is_verified = true
        AND p.status = 'active'
      ) THEN prof.first_name
      ELSE NULL
    END as display_first_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.providers p 
        WHERE p.user_id = prof.user_id 
        AND p.is_verified = true
        AND p.status = 'active'
      ) THEN prof.last_name
      ELSE NULL
    END as display_last_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.providers p 
        WHERE p.user_id = prof.user_id 
        AND p.is_verified = true
        AND p.status = 'active'
      ) THEN prof.avatar_url
      ELSE NULL
    END as display_avatar_url
  FROM public.profiles prof
  WHERE prof.user_id = p_user_id;
$$;

-- Grant execute permissions to authenticated users only (no public access)
GRANT EXECUTE ON FUNCTION public.get_provider_display_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_display_info(UUID) TO authenticated;

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
  'security_definer_views_eliminated',
  'Security definer views owned by postgres bypassing RLS',
  'Secure SECURITY INVOKER functions respecting RLS policies',
  'CRITICAL: Eliminated Security Definer Views - replaced with secure functions using invoker rights'
);