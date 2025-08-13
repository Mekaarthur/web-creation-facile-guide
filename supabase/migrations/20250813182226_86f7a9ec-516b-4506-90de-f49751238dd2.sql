-- Fix the infinite recursion in admin_users RLS policy
DROP POLICY IF EXISTS "Only admins can access admin_users" ON public.admin_users;

-- Create a proper admin_users policy without recursion
CREATE POLICY "Admin users can manage admin_users" 
ON public.admin_users 
FOR ALL 
USING (auth.uid() = user_id);

-- Allow admin operations on job_applications for admins
DROP POLICY IF EXISTS "Admin can view all job applications" ON public.job_applications;
CREATE POLICY "Admin can view all job applications" 
ON public.job_applications 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Allow admin operations on job_applications for updating status
CREATE POLICY "Admin can update job applications" 
ON public.job_applications 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Allow admin operations on client_requests
DROP POLICY IF EXISTS "Admin can view all custom requests" ON public.custom_requests;
CREATE POLICY "Admin can view all custom requests" 
ON public.custom_requests 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Allow admin to update client_requests status
CREATE POLICY "Admin can update client requests" 
ON public.client_requests 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Allow admin to view client_requests
CREATE POLICY "Admin can view all client requests" 
ON public.client_requests 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Add admin_comments column to job_applications for status tracking
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS admin_comments TEXT;