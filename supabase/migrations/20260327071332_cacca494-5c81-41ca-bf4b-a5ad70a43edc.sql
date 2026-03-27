-- Make provider-applications bucket public so admins can view uploaded documents
UPDATE storage.buckets SET public = true WHERE id = 'provider-applications';

-- Make attestations bucket public for admin access  
UPDATE storage.buckets SET public = true WHERE id = 'attestations';

-- Ensure admins can SELECT from attestations bucket
CREATE POLICY "Admin can view all attestation files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attestations' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure admins can manage attestations
CREATE POLICY "Admin can manage attestation files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'attestations' 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'attestations' 
  AND has_role(auth.uid(), 'admin'::app_role)
);