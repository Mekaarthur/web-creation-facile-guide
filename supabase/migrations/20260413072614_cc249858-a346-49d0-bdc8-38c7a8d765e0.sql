-- Allow anonymous uploads to provider-applications bucket for job applications
CREATE POLICY "Anyone can upload application documents"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'provider-applications');

-- Allow admins to delete application documents
CREATE POLICY "Admins can delete application documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'provider-applications' AND has_role(auth.uid(), 'admin'::app_role));
