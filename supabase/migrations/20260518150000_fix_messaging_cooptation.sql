-- ============================================================
-- CORRECTIFS MESSAGERIE + COOPTATION + PARRAINAGE
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- M2 : RLS internal_conversations trop permissif (USING true)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "System can manage internal conversations" ON public.internal_conversations;

-- Admins
CREATE POLICY "Admin gère internal_conversations"
  ON public.internal_conversations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Participants : client ou prestataire impliqué
CREATE POLICY "Participants voient leurs conversations"
  ON public.internal_conversations FOR SELECT
  USING (
    client_id  = auth.uid()
    OR provider_id = auth.uid()
    OR admin_id   = auth.uid()
  );

CREATE POLICY "Participants mettent à jour leurs conversations"
  ON public.internal_conversations FOR UPDATE
  USING (
    client_id  = auth.uid()
    OR provider_id = auth.uid()
    OR admin_id   = auth.uid()
  );

-- ────────────────────────────────────────────────────────────
-- M4 : RPC create_internal_conversation (appelée mais absente)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_internal_conversation(
  p_client_id      UUID,
  p_provider_id    UUID,
  p_admin_id       UUID,
  p_subject        TEXT DEFAULT 'Nouvelle conversation',
  p_initial_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  -- Vérifier s'il existe déjà une conversation ouverte entre ces participants
  SELECT id INTO v_conv_id
  FROM public.internal_conversations
  WHERE client_id   IS NOT DISTINCT FROM p_client_id
    AND provider_id IS NOT DISTINCT FROM p_provider_id
    AND admin_id    IS NOT DISTINCT FROM p_admin_id
    AND status = 'open'
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  INSERT INTO public.internal_conversations (
    client_id, provider_id, admin_id, subject, status
  ) VALUES (
    p_client_id, p_provider_id, p_admin_id, p_subject, 'open'
  ) RETURNING id INTO v_conv_id;

  -- Message initial optionnel
  IF p_initial_message IS NOT NULL AND p_admin_id IS NOT NULL THEN
    INSERT INTO public.internal_messages (
      conversation_id, sender_id, receiver_id,
      message_text, message_type, is_read
    ) VALUES (
      v_conv_id,
      p_admin_id,
      COALESCE(p_client_id, p_provider_id),
      p_initial_message,
      'text',
      false
    );
  END IF;

  RETURN v_conv_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- C2 : recalculate_referral_rewards — colonnes correctes
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.recalculate_referral_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_hours  NUMERIC;
  v_months INTEGER;
BEGIN
  FOR r IN
    SELECT
      ref.id               AS referral_id,
      ref.referrer_id      AS referrer_provider_id,
      ref.referred_id      AS referred_provider_id,
      ref.referred_started_at,
      ref.first_reward_paid,
      ref.loyalty_bonus_paid
    FROM public.referrals ref
    WHERE ref.referrer_type = 'provider'
      AND ref.status <> 'completed'
  LOOP
    -- Calculer les heures du filleul depuis bookings (robuste TEXT→interval)
    SELECT COALESCE(SUM(
      EXTRACT(EPOCH FROM (
        to_timestamp(booking_date::text || ' ' || COALESCE(end_time, '00:00'), 'YYYY-MM-DD HH24:MI')
        - to_timestamp(booking_date::text || ' ' || COALESCE(start_time, '00:00'), 'YYYY-MM-DD HH24:MI')
      )) / 3600
    ), 0)
    INTO v_hours
    FROM public.bookings
    WHERE provider_id = r.referred_provider_id
      AND status = 'completed';

    -- Mettre à jour les heures dans referrals
    UPDATE public.referrals
    SET hours_completed = v_hours
    WHERE id = r.referral_id;

    -- Mois depuis le début
    v_months := COALESCE(
      EXTRACT(MONTH FROM age(now(), r.referred_started_at))::INTEGER
      + EXTRACT(YEAR  FROM age(now(), r.referred_started_at))::INTEGER * 12,
      0
    );

    -- Récompense validation (30€) : 50h en ≤ 2 mois
    IF v_hours >= 50 AND v_months <= 2 AND NOT COALESCE(r.first_reward_paid, false) THEN
      INSERT INTO public.provider_referral_rewards (
        referrer_provider_id, referred_provider_id, referral_id,
        reward_type, amount, status, year
      ) VALUES (
        r.referrer_provider_id, r.referred_provider_id, r.referral_id,
        'validation', 30, 'pending', EXTRACT(YEAR FROM now())::INTEGER
      )
      ON CONFLICT DO NOTHING;

      UPDATE public.referrals SET first_reward_paid = true WHERE id = r.referral_id;
    END IF;

    -- Bonus fidélité (20€) : 12 mois actifs
    IF v_months >= 12 AND NOT COALESCE(r.loyalty_bonus_paid, false) THEN
      INSERT INTO public.provider_referral_rewards (
        referrer_provider_id, referred_provider_id, referral_id,
        reward_type, amount, status, year
      ) VALUES (
        r.referrer_provider_id, r.referred_provider_id, r.referral_id,
        'loyalty', 20, 'pending', EXTRACT(YEAR FROM now())::INTEGER
      )
      ON CONFLICT DO NOTHING;

      UPDATE public.referrals SET loyalty_bonus_paid = true WHERE id = r.referral_id;
    END IF;

    -- Marquer comme completed si les deux récompenses sont payées
    IF COALESCE(r.first_reward_paid, false) AND COALESCE(r.loyalty_bonus_paid, false) THEN
      UPDATE public.referrals SET status = 'completed' WHERE id = r.referral_id;
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- C3 : trigger qui incrémente missions_completed dans referrals
--      quand une booking prestataire passe à 'completed'
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_referral_missions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.referrals
    SET missions_completed = COALESCE(missions_completed, 0) + 1
    WHERE referred_id = NEW.provider_id
      AND referrer_type = 'provider';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_referral_missions ON public.bookings;
CREATE TRIGGER trg_increment_referral_missions
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_referral_missions();

-- ────────────────────────────────────────────────────────────
-- C4 : trigger process_provider_referral_reward — calcul heures robuste
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_provider_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral          RECORD;
  v_hours             NUMERIC;
  v_months            INTEGER;
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Chercher le parrainage prestataire correspondant
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id   = NEW.provider_id
    AND referrer_type = 'provider'
    AND status <> 'completed'
  LIMIT 1;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Calcul heures robuste (TEXT → timestamp arithmétique)
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (
      to_timestamp(b.booking_date::text || ' ' || COALESCE(b.end_time,   '00:00'), 'YYYY-MM-DD HH24:MI')
      - to_timestamp(b.booking_date::text || ' ' || COALESCE(b.start_time, '00:00'), 'YYYY-MM-DD HH24:MI')
    )) / 3600
  ), 0)
  INTO v_hours
  FROM public.bookings b
  WHERE b.provider_id = NEW.provider_id
    AND b.status = 'completed';

  UPDATE public.referrals
  SET hours_completed = v_hours,
      status = CASE WHEN v_hours >= 50 THEN 'active' ELSE status END
  WHERE id = v_referral.id;

  v_months := COALESCE(
    EXTRACT(MONTH FROM age(now(), v_referral.referred_started_at))::INTEGER
    + EXTRACT(YEAR  FROM age(now(), v_referral.referred_started_at))::INTEGER * 12,
    0
  );

  -- Récompense validation (50h en ≤ 2 mois)
  IF v_hours >= 50 AND v_months <= 2 AND NOT COALESCE(v_referral.first_reward_paid, false) THEN
    INSERT INTO public.provider_referral_rewards (
      referrer_provider_id, referred_provider_id, referral_id,
      reward_type, amount, status, year
    ) VALUES (
      v_referral.referrer_id, v_referral.referred_id, v_referral.id,
      'validation', 30, 'pending', EXTRACT(YEAR FROM now())::INTEGER
    ) ON CONFLICT DO NOTHING;

    UPDATE public.referrals SET first_reward_paid = true WHERE id = v_referral.id;
  END IF;

  -- Bonus fidélité (12 mois)
  IF v_months >= 12 AND NOT COALESCE(v_referral.loyalty_bonus_paid, false) THEN
    INSERT INTO public.provider_referral_rewards (
      referrer_provider_id, referred_provider_id, referral_id,
      reward_type, amount, status, year
    ) VALUES (
      v_referral.referrer_id, v_referral.referred_id, v_referral.id,
      'loyalty', 20, 'pending', EXTRACT(YEAR FROM now())::INTEGER
    ) ON CONFLICT DO NOTHING;

    UPDATE public.referrals SET loyalty_bonus_paid = true WHERE id = v_referral.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_provider_referral_reward ON public.bookings;
CREATE TRIGGER trg_process_provider_referral_reward
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.process_provider_referral_reward();

-- ────────────────────────────────────────────────────────────
-- C6 : RLS provider_rewards trop permissif
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "System can manage provider rewards" ON public.provider_rewards;

CREATE POLICY "Admin gère provider_rewards"
  ON public.provider_rewards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Prestataire voit ses propres récompenses"
  ON public.provider_rewards FOR SELECT
  USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────
-- P2 : badge Super Ambassadeur — unicité par année
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.award_super_ambassador_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year          INTEGER := EXTRACT(YEAR FROM now())::INTEGER;
  v_yearly_count  INTEGER;
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Compter les filleuls validés cette année pour le parrain
  SELECT COUNT(*)
  INTO v_yearly_count
  FROM public.referrals r
  JOIN public.provider_referral_rewards prr ON prr.referral_id = r.id
  WHERE r.referrer_id   = NEW.provider_id
    AND r.referrer_type = 'provider'
    AND prr.reward_type = 'validation'
    AND prr.year        = v_year;

  -- Attribuer le badge seulement si pas déjà attribué cette année
  IF v_yearly_count >= 5 THEN
    UPDATE public.providers
    SET
      is_super_ambassador        = true,
      ambassador_badge_earned_at = now()
    WHERE id = NEW.provider_id
      AND (
        is_super_ambassador = false
        OR ambassador_badge_earned_at IS NULL
        OR EXTRACT(YEAR FROM ambassador_badge_earned_at) < v_year
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_super_ambassador ON public.bookings;
CREATE TRIGGER trg_award_super_ambassador
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.award_super_ambassador_badge();
