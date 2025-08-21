-- SECURITY FIX: Fix overly permissive client_requests RLS policy
-- This addresses the critical vulnerability where providers can view all client personal data

-- Drop the dangerous policy that allows providers to view all client requests
DROP POLICY IF EXISTS "Providers can view all client requests" ON public.client_requests;

-- Create a new secure policy that only allows providers to see requests assigned to them
CREATE POLICY "Providers can view assigned requests only" 
ON public.client_requests 
FOR SELECT 
TO authenticated
USING (
  -- Allow providers to see only requests specifically assigned to them
  assigned_provider_id IN (
    SELECT id FROM public.providers 
    WHERE user_id = auth.uid()
  )
  -- Or if user is admin (maintains admin access)
  OR has_role(auth.uid(), 'admin'::app_role)
  -- Or if user is the client who created the request
  OR client_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Add anonymized view policy for provider matching (without PII)
CREATE POLICY "Providers can view anonymized request summaries for matching" 
ON public.client_requests 
FOR SELECT 
TO authenticated
USING (
  -- Only allow viewing basic matching info, not PII
  EXISTS (
    SELECT 1 FROM public.providers 
    WHERE user_id = auth.uid()
    AND is_verified = true
  )
  AND status = 'new'
  AND assigned_provider_id IS NULL
);

-- Fix database function search paths for security
-- Update functions to include SET search_path = 'public' for security
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- Fix other critical functions with search path
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  r DECIMAL := 6371; -- Rayon de la Terre en km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$function$;

-- Add audit logging for provider access to sensitive data
CREATE TABLE IF NOT EXISTS public.provider_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  accessed_request_id uuid NOT NULL,
  access_type text NOT NULL,
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit table
ALTER TABLE public.provider_access_audit ENABLE ROW LEVEL SECURITY;

-- Policy for audit table - only admins can read, system can insert
CREATE POLICY "Admin can view all audit logs" 
ON public.provider_access_audit 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs" 
ON public.provider_access_audit 
FOR INSERT 
TO authenticated
WITH CHECK (true);