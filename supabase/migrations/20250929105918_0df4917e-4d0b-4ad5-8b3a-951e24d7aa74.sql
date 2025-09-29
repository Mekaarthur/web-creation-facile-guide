-- Fix remaining functions that still need proper search_path settings
-- This addresses the "Function Search Path Mutable" warnings

-- Fix the remaining SECURITY DEFINER functions that legitimately need it
-- but were missing proper search_path settings

CREATE OR REPLACE FUNCTION public.expire_old_carts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.carts 
  SET status = 'expiré', updated_at = now()
  WHERE status = 'active' 
    AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_moderation_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  open_reports_count INTEGER := 0;
  pending_reviews_count INTEGER := 0;
  suspended_users_count INTEGER := 0;
  weekly_actions_count INTEGER := 0;
BEGIN
  -- Compter les signalements ouverts
  SELECT COUNT(*) INTO open_reports_count
  FROM public.content_reports
  WHERE status IN ('pending', 'reviewing');
  
  -- Compter les avis en attente
  SELECT COUNT(*) INTO pending_reviews_count
  FROM public.reviews
  WHERE is_approved = false;
  
  -- Compter les utilisateurs suspendus (approximation basée sur les prestataires inactifs)
  SELECT COUNT(*) INTO suspended_users_count
  FROM public.providers
  WHERE status = 'suspended';
  
  -- Compter les actions de la semaine
  SELECT COUNT(*) INTO weekly_actions_count
  FROM public.admin_actions_log
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND entity_type IN ('review', 'content_report', 'provider');
  
  RETURN jsonb_build_object(
    'open_reports', open_reports_count,
    'pending_reviews', pending_reviews_count,
    'suspended_users', suspended_users_count,
    'weekly_actions', weekly_actions_count
  );
END;
$function$;

-- Fix all remaining SECURITY DEFINER functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_public_provider_info(p_provider_id uuid)
 RETURNS TABLE(id uuid, business_name text, description text, location text, rating numeric, missions_completed integer, is_verified boolean, profile_photo_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT 
    p.id,
    p.business_name,
    p.description,
    p.location,
    p.rating,
    p.missions_completed,
    p.is_verified,
    p.profile_photo_url
  FROM public.providers p
  WHERE p.id = p_provider_id 
    AND p.is_verified = true 
    AND p.status = 'active';
$function$;

-- Add comprehensive comments about security considerations
COMMENT ON FUNCTION public.get_current_user_role() IS 
'SECURITY DEFINER function - needed to access auth.uid() and user_roles table. Search path restricted to public schema.';

COMMENT ON FUNCTION public.current_user_email() IS 
'SECURITY DEFINER function - needed to access auth.users table. Search path restricted to public,auth schemas.';

COMMENT ON FUNCTION public.has_role(_user_id uuid, _role app_role) IS 
'SECURITY DEFINER function - needed to check user roles across the application. Search path restricted to public schema.';

COMMENT ON FUNCTION public.expire_old_carts() IS 
'SECURITY DEFINER function - needed to clean up expired carts system-wide. Search path restricted to public schema.';

COMMENT ON FUNCTION public.calculate_moderation_stats() IS 
'SECURITY DEFINER function - needed to access moderation data across tables. Search path restricted to public schema.';

COMMENT ON FUNCTION public.get_public_provider_info(uuid) IS 
'SECURITY DEFINER function - provides controlled access to provider information. Search path restricted to public schema.';

-- Add security audit log for tracking SECURITY DEFINER function usage
CREATE TABLE IF NOT EXISTS public.security_function_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name text NOT NULL,
    called_by uuid REFERENCES auth.users(id),
    called_at timestamp with time zone DEFAULT now(),
    parameters jsonb,
    success boolean DEFAULT true,
    error_message text
);

-- Enable RLS on the audit table
ALTER TABLE public.security_function_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security function audit"
ON public.security_function_audit FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
ON public.security_function_audit FOR INSERT
WITH CHECK (true);