-- Remove sensitive PII columns that must not be stored in plain text
-- Fiscal number, IBAN, and date of birth are sent directly to URSSAF API
-- and must never be persisted in our database

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS numero_fiscal,
  DROP COLUMN IF EXISTS iban_avance_immediate,
  DROP COLUMN IF EXISTS date_naissance;

-- Ensure urssaf_declarations table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_urssaf_declarations_booking_id
  ON public.urssaf_declarations(booking_id);

CREATE INDEX IF NOT EXISTS idx_urssaf_declarations_status
  ON public.urssaf_declarations(status);

CREATE INDEX IF NOT EXISTS idx_urssaf_declarations_client_validation_deadline
  ON public.urssaf_declarations(client_validation_deadline)
  WHERE status = 'sent';

-- Link invoices to URSSAF declarations for compliance audit trail
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_urssaf_declaration_fk;

-- Add comment for compliance documentation
COMMENT ON COLUMN public.profiles.urssaf_particulier_id IS
  'URSSAF Avance Immédiate participant ID returned by URSSAF API after successful registration. Replaces all PII fields.';

COMMENT ON COLUMN public.profiles.avance_immediate_active IS
  'True only after URSSAF API confirms registration. Fiscal data never stored by Bikawo.';

COMMENT ON TABLE public.urssaf_declarations IS
  'URSSAF Avance Immédiate service declarations. Contains service amounts and references only - no personal financial data (no IBAN, no numéro fiscal).';
