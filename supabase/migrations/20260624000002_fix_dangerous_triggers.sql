-- ============================================================
-- Fix 5 triggers DANGEROUS + 1 LEGACY dead duplicate
-- + guard NULL provider_id sur create_conversation_for_booking
-- ============================================================

-- ============================================================
-- FIX 1: handle_new_user — ON CONFLICT (user_id, role) → 42P10
-- user_roles n'a pas de UNIQUE plain sur (user_id, role)
-- Seul index partiel : WHERE is_active = true → 42P10 à chaque signup
-- Fix : select-then-insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Pas de UNIQUE(user_id, role) sur user_roles — select-then-insert
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'client'
  ) THEN
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (NEW.id, 'client', NOW());
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 2: trigger_auto_assign_booking — statut 'assigned' invalide
-- Sets NEW.status = 'assigned' → pas dans bookings_status_check
-- verify-payment gère l'assignation via find_providers_in_zone
-- ============================================================
DROP TRIGGER IF EXISTS trigger_auto_assign_booking ON public.bookings;
DROP FUNCTION IF EXISTS public.auto_assign_booking();

-- ============================================================
-- FIX 3: trigger_send_booking_confirmation — double email client
-- verify-payment/index.ts ligne 610 envoie déjà booking_confirmation
-- Ce trigger envoie un second email sur chaque INSERT bookings
-- ============================================================
DROP TRIGGER IF EXISTS trigger_send_booking_confirmation ON public.bookings;
DROP FUNCTION IF EXISTS public.send_booking_confirmation_email();

-- ============================================================
-- FIX 4: trigger_generate_client_invoice — factures en double
-- Même condition (status='completed') que trigger_auto_invoice_on_completion
-- Pas de garde → 2 factures par booking complété
-- CONSERVER : trigger_auto_invoice_on_completion (a la garde existing_invoice_count=0)
-- SUPPRIMER : trigger_generate_client_invoice (pas de garde)
-- ============================================================
DROP TRIGGER IF EXISTS trigger_generate_client_invoice ON public.bookings;
DROP FUNCTION IF EXISTS public.generate_client_invoice_on_completion();

-- ============================================================
-- FIX 5: trigger_notify_providers_on_new_booking — no-op complet
-- notify_providers_in_zone() n'initialise jamais mission_lat/lon
-- IF mission_lat IS NOT NULL → toujours FALSE → s'exécute sur chaque
-- INSERT bookings sans rien faire
-- Idem pour trigger_notify_providers_on_new_request (même fonction)
-- ============================================================
DROP TRIGGER IF EXISTS trigger_notify_providers_on_new_booking ON public.bookings;
DROP TRIGGER IF EXISTS trigger_notify_providers_on_new_request ON public.client_requests;
DROP FUNCTION IF EXISTS public.notify_providers_in_zone();

-- ============================================================
-- LEGACY: clean-up fonction distincte si elle existe
-- ============================================================
DROP FUNCTION IF EXISTS public.notify_providers_on_new_request();

-- ============================================================
-- LEGACY FIX: create_conversation_for_booking — guard NULL provider_id
-- Sans cette garde, chaque INSERT booking crée une conversation avec
-- provider_id = NULL (bookings créés sans prestataire assigné initialement)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_conversation_for_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.provider_id IS NOT NULL THEN
    INSERT INTO public.chat_conversations (booking_id, client_id, provider_id)
    VALUES (
      NEW.id,
      NEW.client_id,
      (SELECT user_id FROM public.providers WHERE id = NEW.provider_id)
    );
  END IF;
  RETURN NEW;
END;
$$;
