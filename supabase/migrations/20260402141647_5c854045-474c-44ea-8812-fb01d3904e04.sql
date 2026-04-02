
-- Remove dangerous "Service role" ALL policies that use USING(true)
DROP POLICY IF EXISTS "Service role can manage candidatures" ON public.candidatures_prestataires;
DROP POLICY IF EXISTS "Service role can manage monthly activity" ON public.client_monthly_activity;
DROP POLICY IF EXISTS "Service role can manage missions" ON public.missions;
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Service role can manage prestations" ON public.prestations_realisees;
DROP POLICY IF EXISTS "Service role can manage referral rewards" ON public.provider_referral_rewards;
DROP POLICY IF EXISTS "Service role can manage provider rewards" ON public.provider_rewards;

-- Remove dangerous "Service role" INSERT policies with WITH CHECK(true)
DROP POLICY IF EXISTS "Service role can insert action history" ON public.action_history;
DROP POLICY IF EXISTS "Service role can create client rewards" ON public.client_rewards;
DROP POLICY IF EXISTS "Service role can create communications" ON public.communications;
DROP POLICY IF EXISTS "Service role can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can create NPS" ON public.nps_surveys;
DROP POLICY IF EXISTS "Service role can create payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can track stats access" ON public.platform_stats_access;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.provider_access_audit;
DROP POLICY IF EXISTS "Service role can create provider notifications" ON public.provider_notifications;
DROP POLICY IF EXISTS "Service role can insert provider status history" ON public.provider_status_history;
DROP POLICY IF EXISTS "Service role can create realtime notifications" ON public.realtime_notifications;
DROP POLICY IF EXISTS "Service role can insert security audit logs" ON public.security_function_audit;
DROP POLICY IF EXISTS "Service role can create system alerts" ON public.system_alerts;
DROP POLICY IF EXISTS "System can create zone alerts" ON public.zone_alerts;
