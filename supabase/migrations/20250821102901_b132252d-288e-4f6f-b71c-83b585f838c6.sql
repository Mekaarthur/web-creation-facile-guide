-- CRITICAL SECURITY FIX: Remove public access to admin user IDs in user_roles table

-- Drop the extremely dangerous policy that exposes ALL user roles to public
DROP POLICY IF EXISTS "System can manage roles" ON public.user_roles;

-- Create secure policies for user_roles table to protect admin identities

-- 1. Users can only view their own roles (keep existing secure policy)
-- This policy already exists and is correct: "Users can view their own roles"

-- 2. Only authenticated admins can view all roles for management purposes  
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Only authenticated admins can manage user roles
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Allow the system to create initial roles for new users (restricted to INSERT only)
CREATE POLICY "System can create initial user roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

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
  'user_roles_secured',
  'Public access to all user roles including admin user IDs',
  'Restricted access - users see own roles only, admins manage when authenticated',
  'CRITICAL: Fixed admin user ID exposure - user_roles table no longer publicly readable'
);