-- =====================================================
-- Fix overly permissive RLS policies (USING(true) / WITH CHECK(true))
-- Replace with service_role-only or proper auth checks
-- =====================================================

-- 1. System ALL policies → restrict to service_role
DROP POLICY IF EXISTS "System can manage candidatures" ON public.candidatures_prestataires;
DROP POLICY IF EXISTS "System can manage monthly activity" ON public.client_monthly_activity;
DROP POLICY IF EXISTS "System can manage missions" ON public.missions;
DROP POLICY IF EXISTS "System can manage notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Le système peut gérer les prestations" ON public.prestations_realisees;
DROP POLICY IF EXISTS "System can manage referral rewards" ON public.provider_referral_rewards;
DROP POLICY IF EXISTS "System can manage provider rewards" ON public.provider_rewards;

CREATE POLICY "Service role can manage candidatures"
  ON public.candidatures_prestataires FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage monthly activity"
  ON public.client_monthly_activity FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage missions"
  ON public.missions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage notifications"
  ON public.notification_logs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage prestations"
  ON public.prestations_realisees FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage referral rewards"
  ON public.provider_referral_rewards FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage provider rewards"
  ON public.provider_rewards FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- 2. System INSERT policies → restrict to service_role
DROP POLICY IF EXISTS "System can insert action history" ON public.action_history;
CREATE POLICY "Service role can insert action history"
  ON public.action_history FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create client rewards" ON public.client_rewards;
CREATE POLICY "Service role can create client rewards"
  ON public.client_rewards FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create communications" ON public.communications;
CREATE POLICY "Service role can create communications"
  ON public.communications FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Système peut créer NPS" ON public.nps_surveys;
CREATE POLICY "Service role can create NPS"
  ON public.nps_surveys FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create payments" ON public.payments;
CREATE POLICY "Service role can create payments"
  ON public.payments FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Track stats access" ON public.platform_stats_access;
CREATE POLICY "Service role can track stats access"
  ON public.platform_stats_access FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.provider_access_audit;
CREATE POLICY "Service role can insert audit logs"
  ON public.provider_access_audit FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create notifications" ON public.provider_notifications;
CREATE POLICY "Service role can create provider notifications"
  ON public.provider_notifications FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert provider status history" ON public.provider_status_history;
CREATE POLICY "Service role can insert provider status history"
  ON public.provider_status_history FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create notifications" ON public.realtime_notifications;
CREATE POLICY "Service role can create realtime notifications"
  ON public.realtime_notifications FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_function_audit;
CREATE POLICY "Service role can insert security audit logs"
  ON public.security_function_audit FOR INSERT
  TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create alerts" ON public.system_alerts;
CREATE POLICY "Service role can create system alerts"
  ON public.system_alerts FOR INSERT
  TO service_role WITH CHECK (true);

-- 3. user_roles: restrict system insert to service_role
DROP POLICY IF EXISTS "System can create initial roles" ON public.user_roles;
CREATE POLICY "Service role can create initial roles"
  ON public.user_roles FOR INSERT
  TO service_role WITH CHECK (true);

-- 4. subscribers: fix update policy
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription"
  ON public.subscribers FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 5. Remove duplicate client_requests insert
DROP POLICY IF EXISTS "System can insert client requests" ON public.client_requests;

-- 6. support_tickets: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can create tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);