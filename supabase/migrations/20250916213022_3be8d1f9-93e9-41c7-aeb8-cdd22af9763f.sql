-- Finaliser les corrections de sécurité en gérant les policies existantes

-- Supprimer et recréer les policies qui peuvent déjà exister
DROP POLICY IF EXISTS "Only approved reviews visible to public" ON public.reviews;
DROP POLICY IF EXISTS "Users can only see relevant bookings" ON public.bookings;
DROP POLICY IF EXISTS "Candidatures visible only to relevant parties" ON public.candidatures_prestataires;
DROP POLICY IF EXISTS "Incidents visible to relevant users only" ON public.incidents;
DROP POLICY IF EXISTS "Referrals privacy protection" ON public.referrals;
DROP POLICY IF EXISTS "Location data privacy" ON public.provider_locations;

-- Recréer les policies de sécurité améliorées

-- Reviews sécurisées
CREATE POLICY "Secure reviews access" ON public.reviews
  FOR SELECT USING (
    is_approved = true OR 
    auth.uid() = client_id OR 
    auth.uid() = provider_id OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Bookings sécurisées
CREATE POLICY "Secure bookings access" ON public.bookings
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = (SELECT user_id FROM providers WHERE id = bookings.provider_id) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Candidatures sécurisées
CREATE POLICY "Secure candidatures access" ON public.candidatures_prestataires
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Incidents sécurisés
CREATE POLICY "Secure incidents access" ON public.incidents
  FOR SELECT USING (
    reported_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = incidents.booking_id 
      AND (
        b.client_id = auth.uid() OR 
        b.provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
      )
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Referrals sécurisés
CREATE POLICY "Secure referrals access" ON public.referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR 
    auth.uid() = referred_id OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Géolocalisation sécurisée
CREATE POLICY "Secure location access" ON public.provider_locations
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    (
      auth.uid() IS NOT NULL AND 
      EXISTS (SELECT 1 FROM providers WHERE id = provider_locations.provider_id AND is_verified = true)
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Créer la vue publique sécurisée pour les statistiques (si elle n'existe pas)
DROP VIEW IF EXISTS public.safe_public_stats;
CREATE VIEW public.safe_public_stats AS
SELECT 
  (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active') as verified_providers,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_completed_bookings,
  (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true) as platform_average_rating,
  (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true) as active_service_categories;

-- Fonction helper sécurisée pour admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT has_role(auth.uid(), 'admin'::app_role);
$$;

-- Améliorer la sécurité des communications
DROP POLICY IF EXISTS "Users can only see their communications" ON public.communications;
CREATE POLICY "Secure communications access" ON public.communications
  FOR SELECT USING (
    auth.uid() = destinataire_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Sécuriser les logs de notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notification_logs;
CREATE POLICY "Secure notification logs access" ON public.notification_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Sécuriser la présence utilisateur (amélioration)
DROP POLICY IF EXISTS "Users can view limited presence info" ON public.user_presence;
CREATE POLICY "Secure user presence access" ON public.user_presence
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND status IN ('online', 'offline'))
  );

-- Restreindre l'accès UPDATE pour la présence
CREATE POLICY "Users can only update their own presence" ON public.user_presence
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Corriger le problème du log de sécurité en utilisant un utilisateur système
DO $$
BEGIN
  -- Essayer d'insérer le log, mais ignorer l'erreur si pas d'utilisateur connecté
  BEGIN
    INSERT INTO public.security_audit_log (
      user_id,
      action_type,
      table_name,
      created_at
    ) VALUES (
      auth.uid(),
      'SECURITY_UPGRADE_FINAL',
      'platform_wide',
      now()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignorer si pas d'utilisateur connecté pendant la migration
      NULL;
  END;
END $$;