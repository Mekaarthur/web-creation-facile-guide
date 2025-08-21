-- Fix the security definer view issue by removing security_barrier
-- and ensuring the view uses proper RLS instead

-- Remove the security_barrier setting that creates a security definer view
ALTER VIEW public.providers_public SET (security_barrier = false);

-- Drop and recreate the view with proper permissions
DROP VIEW IF EXISTS public.providers_public;

-- Create a standard view without security definer properties
CREATE VIEW public.providers_public AS
SELECT 
  id,
  business_name,
  description,
  location,
  rating,
  is_verified,
  status,
  created_at,
  -- Safe price range without exposing exact rates
  CASE 
    WHEN hourly_rate IS NOT NULL THEN 'À partir de ' || ROUND(hourly_rate)::text || '€/h'
    ELSE 'Prix sur devis'
  END as price_range
FROM public.providers
WHERE is_verified = true AND status = 'active';

-- Grant SELECT access to the view
GRANT SELECT ON public.providers_public TO public;
GRANT SELECT ON public.providers_public TO authenticated;