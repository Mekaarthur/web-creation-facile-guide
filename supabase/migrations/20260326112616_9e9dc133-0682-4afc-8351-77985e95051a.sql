-- Allow anonymous uploads to provider-applications bucket for job candidates
CREATE POLICY "Anyone can upload application documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'provider-applications');

-- Allow anyone to read from provider-applications (for admin review)
CREATE POLICY "Authenticated users can view application documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'provider-applications');

-- Drop the old restrictive upload policy that requires auth.uid() match
DROP POLICY IF EXISTS "Users can upload their application documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their application documents" ON storage.objects;