-- Fix RLS policies for profiles table to prevent unauthorized access to personal information
-- This addresses the security vulnerability where other authenticated users could potentially
-- enumerate user IDs and access contact information

-- First, drop existing policies to recreate them with proper restrictions
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create restrictive SELECT policy: only allow users to see their own profile or admins to see all
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create INSERT policy: only allow users to create their own profile
CREATE POLICY "Users can only create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Create UPDATE policy: only allow users to update their own profile or admins to update any
CREATE POLICY "Users can only update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create DELETE policy: only admins can delete profiles
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Explicitly deny anonymous access by ensuring no policies exist for anon role
-- RLS will automatically deny access if no policy grants it

-- Add comment explaining the security model
COMMENT ON TABLE public.profiles IS 
  'User profiles with RLS policies enforcing: 
   - Users can only view/edit their own profile
   - Admins can view/edit all profiles
   - Anonymous users have no access
   - No enumeration of other users contact information possible';
