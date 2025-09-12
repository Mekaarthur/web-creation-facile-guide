-- Supprimer les anciennes politiques RLS pour le bucket provider-documents
DROP POLICY IF EXISTS "Providers can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete their own documents" ON storage.objects;

-- Créer les nouvelles politiques RLS pour le bucket provider-documents
CREATE POLICY "Providers can upload documents"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'provider-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can view their documents"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'provider-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can update their documents"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'provider-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can delete their documents"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'provider-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour que les admins puissent accéder à tous les documents
CREATE POLICY "Admin can access all provider documents"
ON storage.objects FOR ALL 
USING (
  bucket_id = 'provider-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Mettre à jour les politiques RLS sur la table provider_documents pour permettre la suppression
DROP POLICY IF EXISTS "Providers can delete their own documents" ON provider_documents;

CREATE POLICY "Providers can delete their own documents" 
ON provider_documents FOR DELETE 
USING (auth.uid() = ( SELECT providers.user_id
   FROM providers
  WHERE providers.id = provider_documents.provider_id));