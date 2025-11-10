-- Table pour suivre les validations de documents des candidatures
CREATE TABLE IF NOT EXISTS public.application_document_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('identity_document', 'criminal_record', 'siret_document', 'rib_iban', 'cv', 'certifications')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_app_doc_validations_application_id ON public.application_document_validations(application_id);
CREATE INDEX IF NOT EXISTS idx_app_doc_validations_status ON public.application_document_validations(status);
CREATE INDEX IF NOT EXISTS idx_app_doc_validations_document_type ON public.application_document_validations(document_type);

-- Contrainte unique pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_doc_validations_unique 
  ON public.application_document_validations(application_id, document_type);

-- RLS pour application_document_validations
ALTER TABLE public.application_document_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document validations"
  ON public.application_document_validations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Applicants can view their document validations"
  ON public.application_document_validations
  FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM job_applications 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_application_document_validation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_application_document_validation_timestamp
  BEFORE UPDATE ON public.application_document_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_application_document_validation_timestamp();