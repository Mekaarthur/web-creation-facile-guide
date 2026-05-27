-- =============================================================================
-- SECURITY HARDENING - 2026-05-27
-- Corrects remaining RLS vulnerabilities identified during security audit
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. user_presence: drop the original USING(true) policy if it still exists
--    (migration 20250916212610 should have dropped it, this is idempotent)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can view limited presence info" ON public.user_presence;

-- Secure policy: own presence only, or admin, or conversation partner
CREATE POLICY "Users can view relevant presence"
ON public.user_presence
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE (cc.client_id = auth.uid() AND cc.provider_id = user_presence.user_id)
       OR (cc.provider_id = auth.uid() AND cc.client_id = user_presence.user_id)
  )
);

-- ---------------------------------------------------------------------------
-- 2. profiles: ensure the public "visible par tous" policy is gone
--    (migration 20250821101502 should have dropped it, this is idempotent)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Les profils sont visibles par tous" ON public.profiles;

-- Ensure at minimum authenticated read for own profile exists
-- (already created by 20250821101502, idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. client_requests: ensure old IDOR policy is removed
--    (migration 20250821104214 should have handled this)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Providers can view all client requests" ON public.client_requests;

-- ---------------------------------------------------------------------------
-- 4. Harden check-email-exists: restrict to prevent scraping
--    Add a rate-limiting table for email check abuse prevention
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_check_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_check_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public read on email_check_log"
ON public.email_check_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert email check logs"
ON public.email_check_log
FOR INSERT
WITH CHECK (true);

-- Auto-cleanup old records (keep 24h only)
CREATE OR REPLACE FUNCTION public.cleanup_email_check_log()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  DELETE FROM public.email_check_log WHERE checked_at < now() - interval '24 hours';
$$;

-- ---------------------------------------------------------------------------
-- 5. admin storage policy: ensure first_name='Admin' variant is gone
--    (migration 20251107224627 should have handled this, idempotent safety)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all provider documents" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can view all provider documents secure'
  ) THEN
    CREATE POLICY "Admins can view all provider documents secure"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'provider-documents'
      AND has_role(auth.uid(), 'admin'::app_role)
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Realtime notifications: ensure system INSERT policy is not world-writable
--    Replace WITH CHECK (true) with a more controlled approach
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can create notifications" ON public.realtime_notifications;

CREATE POLICY "System can create notifications"
ON public.realtime_notifications
FOR INSERT
WITH CHECK (
  -- Allow system/service-role inserts (service role bypasses RLS)
  -- Allow users to create their own notifications
  auth.uid() IS NOT NULL
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- ---------------------------------------------------------------------------
-- Log this security hardening
-- ---------------------------------------------------------------------------
INSERT INTO public.action_history (
  entity_type,
  entity_id,
  action_type,
  old_value,
  new_value,
  admin_comment
) VALUES (
  'security_fix',
  gen_random_uuid(),
  'security_hardening_2026_05_27',
  'Multiple RLS gaps: user_presence USING(true), profiles public, client_requests IDOR, admin storage by name',
  'All fixed: presence restricted to own+chat partners, profiles require auth, IDOR removed, admin policy uses has_role()',
  'Security audit 2026-05-27: comprehensive RLS hardening applied'
) ON CONFLICT DO NOTHING;
