-- Fix RLS policies for profiles table to prevent unauthorized access to personal information
-- This uses DROP POLICY IF EXISTS to safely handle both new and existing installations

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Users can only create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- Create restrictive SELECT policy: only allow users to see their own profile or admins to see all
-- This prevents enumeration attacks where authenticated users try to access other users' contact info
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create INSERT policy: only allow users to create their own profile
-- Prevents users from creating profiles for other user IDs
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

-- Add documentation comment
COMMENT ON TABLE public.profiles IS 
  'User profiles with strict RLS policies:
   - Users can ONLY view/edit their own profile (auth.uid() must match user_id)
   - Admins can view/edit all profiles
   - Anonymous users have NO access (no policies for anon role)
   - Prevents enumeration attacks and unauthorized access to contact information';
