-- Fix admin access for application document validations used by the unified admin pipeline
-- The existing FOR ALL policy lacks WITH CHECK, which breaks INSERT/UPSERT approval flows.

DROP POLICY IF EXISTS "Admins can manage document validations" ON public.application_document_validations;

CREATE POLICY "Admins can view document validations"
ON public.application_document_validations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert document validations"
ON public.application_document_validations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update document validations"
ON public.application_document_validations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete document validations"
ON public.application_document_validations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));