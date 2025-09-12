-- Update provider_documents.document_type CHECK constraint to allow new types
DO $$
DECLARE
  conname text;
BEGIN
  SELECT conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'provider_documents'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%document_type%IN%';

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.provider_documents DROP CONSTRAINT %I', conname);
  END IF;

  ALTER TABLE public.provider_documents
  ADD CONSTRAINT provider_documents_document_type_check
  CHECK (document_type IN (
    'identity', 'certification', 'insurance', 'other',
    'identity_document', 'criminal_record', 'siret_document', 'insurance_document', 'rib_iban'
  ));
END $$;