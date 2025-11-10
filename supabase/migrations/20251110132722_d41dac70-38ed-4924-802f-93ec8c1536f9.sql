-- Créer la table pour les documents des prestataires
CREATE TABLE IF NOT EXISTS public.provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('identity_document', 'criminal_record', 'siret_document', 'rib_iban', 'certification', 'cv', 'insurance', 'diploma')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON public.provider_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_status ON public.provider_documents(status);
CREATE INDEX IF NOT EXISTS idx_provider_documents_type ON public.provider_documents(document_type);

-- RLS pour provider_documents
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own documents"
  ON public.provider_documents
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can insert their own documents"
  ON public.provider_documents
  FOR INSERT
  WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their own pending documents"
  ON public.provider_documents
  FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    ) AND status = 'pending'
  );

CREATE POLICY "Providers can delete their own pending documents"
  ON public.provider_documents
  FOR DELETE
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    ) AND status = 'pending'
  );

CREATE POLICY "Admins can manage all documents"
  ON public.provider_documents
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Ajouter colonnes à job_applications pour les documents obligatoires
ALTER TABLE public.job_applications 
  ADD COLUMN IF NOT EXISTS identity_document_url TEXT,
  ADD COLUMN IF NOT EXISTS criminal_record_url TEXT,
  ADD COLUMN IF NOT EXISTS criminal_record_date DATE,
  ADD COLUMN IF NOT EXISTS siren_number TEXT,
  ADD COLUMN IF NOT EXISTS rib_iban_url TEXT,
  ADD COLUMN IF NOT EXISTS certifications_url TEXT,
  ADD COLUMN IF NOT EXISTS documents_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS documents_validated_at TIMESTAMP WITH TIME ZONE;

-- Créer le bucket storage pour les documents si n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-documents', 'provider-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes politiques storage si elles existent
DROP POLICY IF EXISTS "Providers can upload their documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can update their documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all provider documents" ON storage.objects;

-- RLS pour le bucket provider-documents
CREATE POLICY "Providers can upload their documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'provider-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Providers can view their documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'provider-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Providers can update their documents"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'provider-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Providers can delete their documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'provider-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can access all provider documents"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'provider-documents' AND
    has_role(auth.uid(), 'admin'::app_role)
  );