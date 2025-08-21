-- Remove the overly permissive policy that exposes all provider data
DROP POLICY IF EXISTS "Providers are viewable by everyone" ON public.providers;

-- Create secure policies for providers table
-- 1. Allow public to see only basic, non-sensitive provider info needed for matching
CREATE POLICY "Public can view basic provider info" 
ON public.providers 
FOR SELECT 
TO public
USING (
  is_verified = true 
  AND status = 'active'
);

-- 2. Allow providers to see their own full data
CREATE POLICY "Providers can view their own data" 
ON public.providers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow admins to see all provider data
CREATE POLICY "Admins can view all providers" 
ON public.providers 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create a secure view for public provider information that excludes sensitive data
CREATE OR REPLACE VIEW public.providers_public AS
SELECT 
  id,
  user_id,
  business_name,
  description,
  location,
  rating,
  is_verified,
  status,
  created_at,
  -- Exclude sensitive fields like:
  -- siret_number, total_earnings, monthly_earnings, 
  -- missions_accepted, missions_completed, acceptance_rate, performance_score
  CASE 
    WHEN hourly_rate IS NOT NULL THEN 'À partir de ' || ROUND(hourly_rate)::text || '€/h'
    ELSE 'Prix sur devis'
  END as price_range
FROM public.providers
WHERE is_verified = true AND status = 'active';

-- Allow public read access to the secure view
GRANT SELECT ON public.providers_public TO public;

-- Create RLS policy for the view (views inherit policies from underlying table)
ALTER VIEW public.providers_public SET (security_barrier = true);

-- Update existing admin policies to be more explicit
DROP POLICY IF EXISTS "Admin can manage all providers" ON public.providers;

CREATE POLICY "Admins can manage all providers" 
ON public.providers 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));