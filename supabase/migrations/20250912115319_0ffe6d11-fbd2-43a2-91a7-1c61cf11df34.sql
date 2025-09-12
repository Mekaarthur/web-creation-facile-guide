-- Fix the constraint name query by using proper schema reference
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'provider_documents'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%document_type%IN%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.provider_documents DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE public.provider_documents
  ADD CONSTRAINT provider_documents_document_type_check
  CHECK (document_type IN (
    'identity', 'certification', 'insurance', 'other',
    'identity_document', 'criminal_record', 'siret_document', 'insurance_document', 'rib_iban'
  ));
END $$;