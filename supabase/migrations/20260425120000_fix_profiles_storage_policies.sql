-- Ensure profiles storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Safely recreate INSERT policy (drop first to avoid conflict)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Safely recreate UPDATE policy
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'avatars'
)
WITH CHECK (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Safely recreate SELECT policy
DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to avatar files" ON storage.objects;
CREATE POLICY "Public read access to avatar files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'profiles'
  AND name != ''
  AND name NOT LIKE '%/'
);
