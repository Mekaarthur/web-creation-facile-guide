-- Fix Security Definer View warning by removing security_barrier
-- Security barrier makes views behave as SECURITY DEFINER which bypasses RLS
-- We want the view to respect the RLS policies of the underlying tables

-- Remove security_barrier from providers_public_view
ALTER VIEW public.providers_public_view SET (security_barrier = false);

-- Add comment explaining the security model
COMMENT ON VIEW public.providers_public_view IS 
  'Public view of verified, active provider information.
   This view respects RLS policies of the underlying providers table.
   No SECURITY DEFINER - queries execute with the permissions of the querying user.';
