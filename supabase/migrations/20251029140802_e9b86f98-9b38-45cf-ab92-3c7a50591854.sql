-- Create RLS policies for provider-documents bucket

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own provider documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'provider-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own documents
CREATE POLICY "Users can view their own provider documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'provider-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own documents
CREATE POLICY "Users can update their own provider documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'provider-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete their own provider documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'provider-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);