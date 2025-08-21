-- CRITICAL SECURITY FIX: Remove public access to customer personal information

-- Drop the overly permissive policy that exposes all customer personal data
DROP POLICY IF EXISTS "Les profils sont visibles par tous" ON public.profiles;

-- Create secure policies for profiles table to protect customer privacy
-- 1. Allow users to view only their own profile data
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Allow admins to view all profiles for management purposes
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create a secure public view that only exposes non-sensitive data when explicitly needed
-- This view can be used for features like provider listings where you need to show names
CREATE VIEW public.profiles_display AS
SELECT 
  id,
  user_id,
  -- Only expose names for verified providers or with explicit consent
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
  -- Avatar can be shown for verified providers only
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.providers p 
      WHERE p.user_id = profiles.user_id 
      AND p.is_verified = true
    ) THEN avatar_url
    ELSE NULL
  END as display_avatar_url
FROM public.profiles;

-- Grant access to the display view
GRANT SELECT ON public.profiles_display TO public;
GRANT SELECT ON public.profiles_display TO authenticated;

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
  'profiles_privacy_secured',
  'Public access to all customer personal data',
  'Restricted access - users see own data only',
  'CRITICAL: Fixed customer data exposure vulnerability - profiles table no longer publicly readable'
);