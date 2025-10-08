-- Corriger la table audit existante
ALTER TABLE IF EXISTS public.security_audit_log
  ADD COLUMN IF NOT EXISTS event_type TEXT;

UPDATE public.security_audit_log SET event_type = 'unknown' WHERE event_type IS NULL;

ALTER TABLE public.security_audit_log
  ALTER COLUMN event_type SET NOT NULL;

-- Rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_id ON public.rate_limit_tracking(identifier, action_type);

ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin rate limits" ON public.rate_limit_tracking;
CREATE POLICY "Admin rate limits" ON public.rate_limit_tracking
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Chatbot sécurité
ALTER TABLE public.chatbot_conversations ADD COLUMN IF NOT EXISTS ip_address INET;
CREATE INDEX IF NOT EXISTS idx_chatbot_email_time ON public.chatbot_conversations(user_email, created_at);

-- Vue prestataires restreinte
DROP VIEW IF EXISTS public.providers_public_view CASCADE;
CREATE VIEW public.providers_public_view AS
SELECT 
  p.id,
  p.business_name,
  LEFT(p.description, 200) as description,
  SPLIT_PART(p.location, ',', 1) as location,
  p.rating,
  p.is_verified,
  p.status,
  CASE WHEN p.is_verified THEN p.profile_photo_url END as profile_photo_url
FROM public.providers p
WHERE p.is_verified = true AND p.status = 'active';