-- Créer le bucket provider-documents s'il n'existe pas déjà
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-documents', 'provider-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can upload their own provider documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own provider documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own provider documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own provider documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all provider documents" ON storage.objects;

-- Les utilisateurs peuvent uploader leurs propres documents
CREATE POLICY "Users can upload their own provider documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'provider-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Les utilisateurs peuvent voir leurs propres documents
CREATE POLICY "Users can view their own provider documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'provider-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Les utilisateurs peuvent mettre à jour leurs propres documents
CREATE POLICY "Users can update their own provider documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'provider-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete their own provider documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'provider-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all provider documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'provider-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);