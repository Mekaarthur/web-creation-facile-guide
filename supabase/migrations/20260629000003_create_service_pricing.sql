-- Table for admin price overrides on services.
-- Starts empty; absence of a row = service uses static default price.
-- Written by admin-pricing Edge Function, read by admin Pricing page.

CREATE TABLE IF NOT EXISTS public.service_pricing (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_slug TEXT        NOT NULL UNIQUE,
  client_price NUMERIC     NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gère service_pricing"
  ON public.service_pricing FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
