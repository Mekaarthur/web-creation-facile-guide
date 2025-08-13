-- Fix all dependencies first then recreate the admin system properly
-- Drop dependent policies
DROP POLICY IF EXISTS "Admin can manage all invoices" ON public.invoices;

-- Now we can drop the table
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Create a proper user roles system 
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table 
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Recreate invoice policy properly
CREATE POLICY "Admin can manage all invoices" 
ON public.invoices 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update all admin policies to use the new role system
-- Job applications policies
DROP POLICY IF EXISTS "Admin can view all job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admin can update job applications" ON public.job_applications;

CREATE POLICY "Admin can view all job applications" 
ON public.job_applications 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update job applications" 
ON public.job_applications 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Client requests policies  
DROP POLICY IF EXISTS "Admin can view all custom requests" ON public.custom_requests;
DROP POLICY IF EXISTS "Admin can update client requests" ON public.client_requests;
DROP POLICY IF EXISTS "Admin can view all client requests" ON public.client_requests;

CREATE POLICY "Admin can view all custom requests" 
ON public.custom_requests 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update client requests" 
ON public.client_requests 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view all client requests" 
ON public.client_requests 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage roles" 
ON public.user_roles 
FOR ALL 
USING (true);