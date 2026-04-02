
-- 1. FIX: Remove dangerous user_roles self-assignment policies
DROP POLICY IF EXISTS "System can create initial user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can create initial roles" ON public.user_roles;

-- Only admins can insert roles (service_role bypasses RLS automatically)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. FIX: Make sensitive storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('provider-documents', 'provider-applications', 'attestations');

-- 3. FIX: Remove overly permissive storage policy on provider-applications
DROP POLICY IF EXISTS "Authenticated users can view application documents" ON storage.objects;

-- 4. FIX: Restrict upload policy to require auth and scope to user folder
DROP POLICY IF EXISTS "Anyone can upload application documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload own application documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'provider-applications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
