-- =============================================================
-- PHASE 1 — B2B Enterprise services
-- Segment B: 27% Bikawo / 73% provider, no URSSAF
-- =============================================================

-- 1. Add bika_entreprise to financial_rules
--    financial_rules has no UNIQUE on service_category — create it first
CREATE UNIQUE INDEX IF NOT EXISTS financial_rules_service_category_key
  ON public.financial_rules(service_category);

-- client_price = tarif plancher (≤100m²), provider_payment = 25.00×0.73
-- Le prix réel par contrat est stocké dans entreprise_contracts.price_per_hour
INSERT INTO financial_rules
  (service_category, client_price, provider_payment, provider_pct, bikawo_pct, is_active, urssaf_eligible)
VALUES
  ('bika_entreprise', 25.00, 18.25, 0.73, 0.27, true, false)
ON CONFLICT (service_category) DO UPDATE
SET client_price     = 25.00,
    provider_payment = 18.25,
    provider_pct     = 0.73,
    bikawo_pct       = 0.27,
    urssaf_eligible  = false;

-- 2. Add B2B services to services table
INSERT INTO services
  (name, category, price_per_hour, is_active, urssaf_eligible, slug)
VALUES
  (
    'Ménage bureaux (≤100m²)',
    'BIKA Entreprise',
    25.00, true, false,
    'menage-bureaux-small'
  ),
  (
    'Ménage bureaux (100-200m²)',
    'BIKA Entreprise',
    28.00, true, false,
    'menage-bureaux-medium'
  ),
  (
    'Ménage bureaux (sur devis)',
    'BIKA Entreprise',
    0.00, true, false,
    'menage-bureaux-devis'
  ),
  (
    'Matériel de ménage entreprise',
    'BIKA Entreprise',
    5.00, true, false,
    'materiel-entreprise'
  )
ON CONFLICT (slug) DO UPDATE
SET name            = EXCLUDED.name,
    price_per_hour  = EXCLUDED.price_per_hour,
    urssaf_eligible = EXCLUDED.urssaf_eligible;

-- 3. Create entreprise_clients table (CRM B2B)
CREATE TABLE IF NOT EXISTS public.entreprise_clients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name   TEXT NOT NULL,
  siret          TEXT,
  sector         TEXT,
  address        TEXT NOT NULL,
  city           TEXT NOT NULL,
  postal_code    TEXT NOT NULL,
  surface_m2     INTEGER,
  contact_name   TEXT NOT NULL,
  contact_email  TEXT NOT NULL,
  contact_phone  TEXT,
  employee_count INTEGER,
  status         TEXT DEFAULT 'prospect'
    CHECK (status IN ('prospect','quote_sent','active','suspended','churned')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Quote number sequence (must exist before function references it)
CREATE SEQUENCE IF NOT EXISTS public.quote_number_seq START 1;

-- 5. Auto-generate quote numbers: DEV-2026-0001
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.quote_number := 'DEV-' ||
    TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(NEXTVAL('public.quote_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- 6. Create entreprise_quotes table
CREATE TABLE IF NOT EXISTS public.entreprise_quotes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID REFERENCES public.entreprise_clients(id) ON DELETE CASCADE,
  quote_number         TEXT UNIQUE,
  surface_m2           INTEGER,
  service_type         TEXT,
  frequency            TEXT CHECK (frequency IN ('daily','weekly','biweekly','monthly','one_time')),
  hours_per_session    NUMERIC,
  price_per_hour       NUMERIC,
  equipment_forfait    NUMERIC DEFAULT 5.00,
  sessions_per_month   INTEGER,
  total_per_session    NUMERIC,
  total_per_month      NUMERIC,
  provider_per_session NUMERIC,
  bikawo_per_session   NUMERIC,
  valid_until          DATE,
  status               TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  pdf_url              TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_quote_number
  BEFORE INSERT ON public.entreprise_quotes
  FOR EACH ROW
  WHEN (NEW.quote_number IS NULL)
  EXECUTE FUNCTION public.generate_quote_number();

-- 7. Create entreprise_contracts table
CREATE TABLE IF NOT EXISTS public.entreprise_contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES public.entreprise_clients(id),
  quote_id            UUID REFERENCES public.entreprise_quotes(id),
  provider_id         UUID REFERENCES public.providers(id),
  service_type        TEXT NOT NULL,
  frequency           TEXT NOT NULL,
  hours_per_session   NUMERIC NOT NULL,
  price_per_hour      NUMERIC NOT NULL,
  equipment_forfait   NUMERIC DEFAULT 5.00,
  start_date          DATE NOT NULL,
  end_date            DATE,
  notice_days         INTEGER DEFAULT 7,
  preferred_time      TIME,
  preferred_days      TEXT[],
  status              TEXT DEFAULT 'active'
    CHECK (status IN ('active','suspended','cancelled','completed')),
  cancellation_date   DATE,
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create entreprise_bookings table
CREATE TABLE IF NOT EXISTS public.entreprise_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id       UUID REFERENCES public.entreprise_contracts(id),
  client_id         UUID REFERENCES public.entreprise_clients(id),
  provider_id       UUID REFERENCES public.providers(id),
  scheduled_date    DATE NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  duration_hours    NUMERIC NOT NULL,
  price_per_hour    NUMERIC NOT NULL,
  equipment_forfait NUMERIC DEFAULT 5.00,
  total_price       NUMERIC NOT NULL,
  provider_payment  NUMERIC NOT NULL,
  bikawo_commission NUMERIC NOT NULL,
  stripe_commission NUMERIC NOT NULL,
  status            TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','in_progress','completed','cancelled','no_show')),
  notes             TEXT,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 9. updated_at triggers
CREATE TRIGGER update_entreprise_clients_updated_at
  BEFORE UPDATE ON public.entreprise_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entreprise_quotes_updated_at
  BEFORE UPDATE ON public.entreprise_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entreprise_contracts_updated_at
  BEFORE UPDATE ON public.entreprise_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entreprise_bookings_updated_at
  BEFORE UPDATE ON public.entreprise_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. RLS
ALTER TABLE public.entreprise_clients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprise_quotes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprise_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprise_bookings  ENABLE ROW LEVEL SECURITY;

-- Admins : full access
CREATE POLICY "Admins manage enterprise clients"
  ON public.entreprise_clients FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage enterprise quotes"
  ON public.entreprise_quotes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage enterprise contracts"
  ON public.entreprise_contracts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage enterprise bookings"
  ON public.entreprise_bookings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Formulaire devis public (anon + authenticated)
CREATE POLICY "Anyone can request quote"
  ON public.entreprise_clients FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
