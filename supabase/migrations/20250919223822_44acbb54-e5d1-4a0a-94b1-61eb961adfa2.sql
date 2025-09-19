-- Replace provider SELECT policy to avoid any dependency on auth.users or functions
DROP POLICY IF EXISTS "Providers can view assigned requests only" ON public.client_requests;

CREATE POLICY "Providers can view assigned requests only"
ON public.client_requests
FOR SELECT
TO authenticated
USING (
  (assigned_provider_id IN (
    SELECT p.id FROM public.providers p WHERE p.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);
