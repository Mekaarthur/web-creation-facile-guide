-- Fix: la policy "Clients can view their own custom requests" utilisait
-- (SELECT email FROM auth.users WHERE id = auth.uid()) qui lève une erreur
-- "permission denied for table users" pour le rôle authenticated.
-- Cela fait crasher TOUS les SELECT sur custom_requests, y compris pour l'admin.
--
-- Fix: remplacer par auth.email() qui est disponible sans accès direct à auth.users.

DROP POLICY IF EXISTS "Clients can view their own custom requests" ON public.custom_requests;

CREATE POLICY "Clients can view their own custom requests"
ON public.custom_requests
FOR SELECT
TO authenticated
USING (
  client_email = auth.email()
);
