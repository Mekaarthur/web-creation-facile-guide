-- Fix: La politique "Applicants can view their document validations" 
-- fait une sous-requête vers auth.users qui cause "permission denied for table users"
-- On la remplace par une comparaison directe avec auth.email()

DROP POLICY IF EXISTS "Applicants can view their document validations" ON public.application_document_validations;

CREATE POLICY "Applicants can view their document validations"
ON public.application_document_validations
FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.job_applications
    WHERE email = auth.email()
  )
);

-- Aussi ajouter WITH CHECK sur la politique UPDATE de job_applications
DROP POLICY IF EXISTS "Admin can update job applications" ON public.job_applications;

CREATE POLICY "Admin can update job applications"
ON public.job_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));