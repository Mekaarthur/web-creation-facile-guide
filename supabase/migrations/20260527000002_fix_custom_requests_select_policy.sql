-- Fix: custom_requests SELECT policy blocked submitters from reading their own row
-- The original SELECT policy only allowed admins, causing INSERT+SELECT to fail
-- for non-admin users.
--
-- Strategy: add a policy that lets authenticated users read rows matching their email.
-- Unauthenticated (anon) submitters rely on the client-generated ID approach.

-- Allow authenticated clients to view their own submitted requests
CREATE POLICY "Clients can view their own custom requests"
ON public.custom_requests
FOR SELECT
TO authenticated
USING (
  client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
