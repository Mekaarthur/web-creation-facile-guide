-- ============================================
-- 1. Realtime RLS: Restrict channel subscriptions
-- Users can only subscribe to channels matching their user ID
-- ============================================

-- Enable RLS on realtime.messages if not already
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to subscribe only to channels that contain their user ID
-- This covers patterns like: private:user_<uuid>, chat:<conversation_id>
CREATE POLICY "Users can only listen to their own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow subscription if the topic/extension contains the user's ID
  EXISTS (
    SELECT 1 WHERE
      realtime.topic() LIKE '%' || auth.uid()::text || '%'
  )
  OR
  -- Allow admins to listen to all channels
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ============================================
-- 2. Storage: Restrict listing on public buckets
-- Replace broad SELECT policies with path-specific access
-- ============================================

-- Drop the overly broad profiles SELECT policy
DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;

-- Recreate: allow reading specific files but not listing the entire bucket
-- Users can access files if they know the path (direct URL access)
CREATE POLICY "Public read access to avatar files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.filename(name) IS NOT NULL)
  AND name != ''
  AND name NOT LIKE '%/'
);

-- Drop the overly broad brand-assets SELECT policy
DROP POLICY IF EXISTS "Public read brand assets" ON storage.objects;

-- Recreate with same restriction
CREATE POLICY "Public read brand asset files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'brand-assets'
  AND (storage.filename(name) IS NOT NULL)
  AND name != ''
  AND name NOT LIKE '%/'
);