-- Drop and recreate the constraint with the correct values
ALTER TABLE public.provider_documents 
DROP CONSTRAINT IF EXISTS provider_documents_document_type_check;

ALTER TABLE public.provider_documents
ADD CONSTRAINT provider_documents_document_type_check
CHECK (document_type IN (
  'identity', 'certification', 'insurance', 'other',
  'identity_document', 'criminal_record', 'siret_document', 'insurance_document', 'rib_iban'
));