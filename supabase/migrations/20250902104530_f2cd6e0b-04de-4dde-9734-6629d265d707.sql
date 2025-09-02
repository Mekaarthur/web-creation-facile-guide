-- Fix provider backend functionality - remove existing policies first
DROP POLICY IF EXISTS "Admin can manage all provider invoices" ON public.provider_invoices;
DROP POLICY IF EXISTS "Providers can view their invoices" ON public.provider_invoices;

-- Recreate policies correctly
CREATE POLICY "Providers can view their invoices" ON public.provider_invoices
FOR SELECT USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage all provider invoices" ON public.provider_invoices
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure providers table has all needed columns for the dashboard
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS missions_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_earnings NUMERIC DEFAULT 0;