
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS numero_fiscal TEXT,
ADD COLUMN IF NOT EXISTS iban_avance_immediate TEXT,
ADD COLUMN IF NOT EXISTS urssaf_particulier_id TEXT,
ADD COLUMN IF NOT EXISTS avance_immediate_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avance_immediate_pending BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avance_immediate_activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS date_naissance DATE;
