-- Fix: admin SELECT/UPDATE policy for custom_requests used the legacy admin_users table
-- instead of has_role(), causing "Erreur de chargement" in the admin back-office.

-- Replace the broken SELECT policy
DROP POLICY IF EXISTS "Admin can view all custom requests" ON public.custom_requests;
CREATE POLICY "Admin can view all custom requests"
ON public.custom_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE policy (was missing, needed for status changes)
DROP POLICY IF EXISTS "Admin can update custom requests" ON public.custom_requests;
CREATE POLICY "Admin can update custom requests"
ON public.custom_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
