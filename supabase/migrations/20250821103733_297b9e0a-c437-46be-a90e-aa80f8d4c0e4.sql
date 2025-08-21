-- Fix job_applications security: Allow users to view their own applications
-- This addresses the security issue where applicants cannot access their own data
-- while maintaining admin-only access to all applications

-- Add policy for users to view their own job applications
-- Users should be able to see the status of applications they submitted
CREATE POLICY "Users can view their own job applications" 
ON public.job_applications 
FOR SELECT 
TO authenticated
USING (
  -- Allow access if the email matches the user's email from their profile
  email = (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  )
  -- Or if user has admin role (keeps existing admin access)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Drop the old admin-only policy since it's now covered by the new policy
DROP POLICY IF EXISTS "Admin can view all job applications" ON public.job_applications;