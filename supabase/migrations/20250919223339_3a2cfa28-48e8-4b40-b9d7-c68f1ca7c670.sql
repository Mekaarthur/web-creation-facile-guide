-- Create a SECURITY DEFINER function to safely get current user's email
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Update problematic policy that referenced auth.users directly
DROP POLICY IF EXISTS "Providers can view assigned requests only" ON public.client_requests;

CREATE POLICY "Providers can view assigned requests only"
ON public.client_requests
FOR SELECT
TO authenticated
USING (
  -- provider can see requests assigned to them
  (assigned_provider_id IN (
    SELECT p.id FROM public.providers p WHERE p.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (client_email = public.current_user_email())
);

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;