-- ============================================================
-- RLS Audit Hardening
--
-- Fix 1: Provider self-approval vulnerability
--   Providers could SET is_verified=true / status='active' on
--   their own row, bypassing the admin approval workflow.
--
-- Fix 2: Booking status escalation vulnerability
--   Clients could set status='completed' on their bookings,
--   triggering the auto_queue_provider_payout trigger and
--   queuing premature provider payouts.
--   Clients/providers could also change total_price or provider_id.
--
-- Safety note for both triggers:
--   auth.uid() IS NULL when the request comes from service_role
--   (edge functions using SERVICE_ROLE_KEY). Those bypass the
--   checks below, which is intentional.
-- ============================================================


-- ============================================================
-- 1. PROVIDER SELF-APPROVAL GUARD
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_provider_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (edge functions) → auth.uid() is NULL → allowed
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins can change anything
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Block sensitive admin-only fields
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Accès refusé : is_verified ne peut être modifié que par un administrateur';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Accès refusé : status ne peut être modifié que par un administrateur';
  END IF;

  IF NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id THEN
    RAISE EXCEPTION 'Accès refusé : stripe_account_id ne peut être modifié que par un administrateur';
  END IF;

  IF NEW.stripe_onboarding_complete IS DISTINCT FROM OLD.stripe_onboarding_complete THEN
    RAISE EXCEPTION 'Accès refusé : stripe_onboarding_complete ne peut être modifié que par un administrateur';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_provider_self_approval ON public.providers;
CREATE TRIGGER trg_prevent_provider_self_approval
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_provider_self_approval();


-- ============================================================
-- 2. BOOKING FIELD ESCALATION GUARD
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_booking_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (edge functions) → auth.uid() is NULL → allowed
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins can change anything
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Nobody (except admin / service role) can change total_price
  IF NEW.total_price IS DISTINCT FROM OLD.total_price THEN
    RAISE EXCEPTION 'Accès refusé : total_price ne peut être modifié que par un administrateur';
  END IF;

  -- Nobody (except admin / service role) can change provider_id
  IF NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    RAISE EXCEPTION 'Accès refusé : provider_id ne peut être modifié que par un administrateur';
  END IF;

  -- Clients can only cancel (not self-complete, start, etc.)
  IF NEW.status IS DISTINCT FROM OLD.status AND auth.uid() = OLD.client_id THEN
    IF NEW.status != 'cancelled' THEN
      RAISE EXCEPTION
        'Accès refusé : un client ne peut pas passer le statut de réservation à "%"',
        NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_booking_escalation ON public.bookings;
CREATE TRIGGER trg_prevent_booking_escalation
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_booking_escalation();
