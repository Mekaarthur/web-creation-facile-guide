-- Fix admin RLS policy: add explicit WITH CHECK
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.provider_documents;
CREATE POLICY "Admins can manage all documents"
ON public.provider_documents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Fix document_type constraint: add missing types
ALTER TABLE public.provider_documents DROP CONSTRAINT IF EXISTS provider_documents_document_type_check;
ALTER TABLE public.provider_documents ADD CONSTRAINT provider_documents_document_type_check
CHECK (document_type = ANY (ARRAY[
  'identity'::text, 'certification'::text, 'insurance'::text, 'other'::text,
  'identity_document'::text, 'criminal_record'::text, 'siret_document'::text,
  'insurance_document'::text, 'rib_iban'::text, 'certifications_other'::text, 'cv'::text
]));