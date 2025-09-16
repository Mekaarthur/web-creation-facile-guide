-- Correction des problèmes de sécurité critiques

-- 1. Sécuriser la table services (tarifs exposés publiquement)
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;

CREATE POLICY "Authenticated users can view services" ON public.services
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. Sécuriser la table zones_geographiques si elle existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'zones_geographiques') THEN
    EXECUTE 'ALTER TABLE public.zones_geographiques ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Authenticated users can view zones" ON public.zones_geographiques FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- 3. Sécuriser la table user_presence (tracking utilisateurs exposé)
DROP POLICY IF EXISTS "Users can view all presence" ON public.user_presence;

CREATE POLICY "Users can view limited presence info" ON public.user_presence
  FOR SELECT USING (
    auth.uid() = user_id OR 
    -- Permettre de voir le statut online/offline uniquement des autres utilisateurs
    (auth.uid() IS NOT NULL AND status IN ('online', 'offline'))
  );

-- 4. Corriger les fonctions avec search_path manquant
ALTER FUNCTION public.generate_invoice_number() SET search_path = 'public';
ALTER FUNCTION public.set_invoice_number() SET search_path = 'public';
ALTER FUNCTION public.calculate_detailed_rating(integer, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.update_provider_rating() SET search_path = 'public';
ALTER FUNCTION public.create_conversation_for_booking() SET search_path = 'public';
ALTER FUNCTION public.update_conversation_last_message() SET search_path = 'public';
ALTER FUNCTION public.update_provider_detailed_rating() SET search_path = 'public';
ALTER FUNCTION public.check_client_reward_eligibility(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_provider_earnings() SET search_path = 'public';
ALTER FUNCTION public.generate_referral_code() SET search_path = 'public';
ALTER FUNCTION public.create_booking_from_request(uuid, uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.notify_providers_new_request() SET search_path = 'public';
ALTER FUNCTION public.get_matching_providers(text, text, integer) SET search_path = 'public';
ALTER FUNCTION public.calculate_provider_reward_tier(uuid, integer, numeric, numeric, integer) SET search_path = 'public';
ALTER FUNCTION public.get_reward_amount(text) SET search_path = 'public';
ALTER FUNCTION public.set_client_reward_expiration() SET search_path = 'public';
ALTER FUNCTION public.log_action(text, uuid, text, text, text, text) SET search_path = 'public';
ALTER FUNCTION public.process_client_referral_reward() SET search_path = 'public';
ALTER FUNCTION public.process_provider_referral_reward() SET search_path = 'public';
ALTER FUNCTION public.create_referral_from_code(text, text, text) SET search_path = 'public';
ALTER FUNCTION public.log_status_change() SET search_path = 'public';
ALTER FUNCTION public.create_prestation_from_booking() SET search_path = 'public';
ALTER FUNCTION public.generate_client_invoice_on_completion() SET search_path = 'public';
ALTER FUNCTION public.generate_provider_invoice_number() SET search_path = 'public';
ALTER FUNCTION public.set_provider_invoice_number() SET search_path = 'public';
ALTER FUNCTION public.send_confirmation_email() SET search_path = 'public';
ALTER FUNCTION public.calculate_provider_performance_score(uuid) SET search_path = 'public';
ALTER FUNCTION public.confirm_booking(uuid, boolean) SET search_path = 'public';
ALTER FUNCTION public.update_provider_scores() SET search_path = 'public';
ALTER FUNCTION public.find_eligible_providers(text, text, text, timestamp with time zone) SET search_path = 'public';
ALTER FUNCTION public.assign_mission_manually(uuid, uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.generate_provider_invoice_on_completion() SET search_path = 'public';
ALTER FUNCTION public.create_provider_from_application(uuid) SET search_path = 'public';
ALTER FUNCTION public.expire_old_carts() SET search_path = 'public';
ALTER FUNCTION public.calculate_cart_total(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_cart_total() SET search_path = 'public';

-- 5. Ajouter une policy plus restrictive pour les providers
CREATE POLICY "Authenticated users can view basic provider info" ON public.providers
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      is_verified = true AND status = 'active'
      OR user_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 6. Créer une fonction pour nettoyer les données sensibles des providers pour les non-admins
CREATE OR REPLACE FUNCTION public.get_public_provider_info(p_provider_id uuid)
RETURNS TABLE(
  id uuid,
  business_name text,
  description text,
  location text,
  rating numeric,
  missions_completed integer,
  is_verified boolean,
  profile_photo_url text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 7. Ajouter des politiques plus strictes pour les données financières
CREATE POLICY "Clients can only see their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Only admins can see all invoices" ON public.invoices
  FOR SELECT USING (
    auth.uid() = client_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- 8. Sécuriser les communications internes
CREATE POLICY "Users can only see their communications" ON public.communications
  FOR SELECT USING (
    auth.uid() = destinataire_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- 9. Restreindre l'accès aux documents prestataires
DROP POLICY IF EXISTS "Providers can view their own documents" ON public.provider_documents;

CREATE POLICY "Providers and admins can view provider documents" ON public.provider_documents
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM providers WHERE id = provider_documents.provider_id) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- 10. Ajouter logging pour les accès sensibles
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action_type text NOT NULL,
  table_name text,
  record_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security audit log" ON public.security_audit_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));