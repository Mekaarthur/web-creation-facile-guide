
-- Corriger le système de récompenses pour qu'il fonctionne correctement

-- 1. Modifier le trigger pour fonctionner avec status 'pending' aussi
CREATE OR REPLACE FUNCTION public.process_provider_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_referred_started_at TIMESTAMPTZ;
  v_total_hours NUMERIC;
  v_existing_reward_id UUID;
  v_referrals_validated_count INTEGER;
BEGIN
  -- Only process completed bookings
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get referral info for this provider (enlever la condition status = 'completed')
  SELECT referrer_id, referred_started_at
  INTO v_referrer_id, v_referred_started_at
  FROM public.referrals
  WHERE referred_id = NEW.provider_id
    AND referrer_type = 'provider'  -- S'assurer que c'est un parrainage prestataire
  LIMIT 1;

  -- Exit if no referral found
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate total hours for referred provider
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600), 0)
  INTO v_total_hours
  FROM public.bookings
  WHERE provider_id = NEW.provider_id
    AND status = 'completed';

  -- TOUJOURS mettre à jour les heures et le statut dans la table referrals
  UPDATE public.referrals
  SET 
    hours_completed = v_total_hours,
    status = CASE 
      WHEN v_total_hours >= 50 THEN 'completed'
      ELSE 'pending'
    END
  WHERE referrer_id = v_referrer_id
    AND referred_id = NEW.provider_id;

  -- Check for validation bonus (50 hours)
  IF v_total_hours >= 50 THEN
    -- Check if validation reward not already paid
    SELECT id INTO v_existing_reward_id
    FROM public.provider_referral_rewards
    WHERE referrer_id = v_referrer_id
      AND referred_id = NEW.provider_id
      AND reward_type = 'validation'
    LIMIT 1;

    IF v_existing_reward_id IS NULL THEN
      -- Check referrer hasn't exceeded 5 paid referrals this year
      SELECT COUNT(*)
      INTO v_referrals_validated_count
      FROM public.provider_referral_rewards
      WHERE referrer_id = v_referrer_id
        AND reward_type = 'validation'
        AND status = 'paid'
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);

      IF v_referrals_validated_count < 5 THEN
        -- Award validation bonus
        INSERT INTO public.provider_referral_rewards (
          referrer_id,
          referred_id,
          reward_type,
          amount,
          status
        ) VALUES (
          v_referrer_id,
          NEW.provider_id,
          'validation',
          30.00,
          'pending'
        );

        -- Update referral record
        UPDATE public.referrals
        SET 
          first_reward_paid = true,
          first_reward_paid_at = CURRENT_TIMESTAMP
        WHERE referrer_id = v_referrer_id
          AND referred_id = NEW.provider_id;
      END IF;
    END IF;
  END IF;

  -- Check for loyalty bonus (120 hours)
  IF v_total_hours >= 120 THEN
    -- Check if loyalty reward not already paid
    SELECT id INTO v_existing_reward_id
    FROM public.provider_referral_rewards
    WHERE referrer_id = v_referrer_id
      AND referred_id = NEW.provider_id
      AND reward_type = 'loyalty'
    LIMIT 1;

    IF v_existing_reward_id IS NULL THEN
      -- Award loyalty bonus
      INSERT INTO public.provider_referral_rewards (
        referrer_id,
        referred_id,
        reward_type,
        amount,
        status
      ) VALUES (
        v_referrer_id,
        NEW.provider_id,
        'loyalty',
        50.00,
        'pending'
      );

      -- Update referral record
      UPDATE public.referrals
      SET 
        loyalty_bonus_paid = true,
        loyalty_bonus_paid_at = CURRENT_TIMESTAMP
      WHERE referrer_id = v_referrer_id
        AND referred_id = NEW.provider_id;
    END IF;
  END IF;

  -- Check for Super Ambassador bonus (5 validated referrals in current year)
  SELECT COUNT(DISTINCT referred_id)
  INTO v_referrals_validated_count
  FROM public.provider_referral_rewards
  WHERE referrer_id = v_referrer_id
    AND reward_type = 'validation'
    AND status IN ('pending', 'paid')
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);

  IF v_referrals_validated_count >= 5 THEN
    -- Check if super ambassador reward not already given this year
    SELECT id INTO v_existing_reward_id
    FROM public.provider_referral_rewards
    WHERE referrer_id = v_referrer_id
      AND reward_type = 'super_ambassador'
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
    LIMIT 1;

    IF v_existing_reward_id IS NULL THEN
      -- Award super ambassador bonus
      INSERT INTO public.provider_referral_rewards (
        referrer_id,
        referred_id,
        reward_type,
        amount,
        status
      ) VALUES (
        v_referrer_id,
        NEW.provider_id,
        'super_ambassador',
        100.00,
        'pending'
      );

      -- Update provider as super ambassador
      UPDATE public.providers
      SET 
        is_super_ambassador = true,
        ambassador_badge_earned_at = CURRENT_TIMESTAMP,
        yearly_referrals_count = v_referrals_validated_count
      WHERE id = v_referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Créer une fonction pour recalculer les récompenses existantes
CREATE OR REPLACE FUNCTION public.recalculate_referral_rewards()
RETURNS TABLE(
  referral_code TEXT,
  referrer_id UUID,
  referred_id UUID,
  total_hours NUMERIC,
  rewards_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  referral_record RECORD;
  v_total_hours NUMERIC;
  v_rewards_created INTEGER;
BEGIN
  -- Parcourir tous les parrainages prestataires
  FOR referral_record IN
    SELECT r.referral_code, r.referrer_id, r.referred_id
    FROM public.referrals r
    WHERE r.referrer_type = 'provider'
      AND r.referred_id IS NOT NULL
  LOOP
    v_rewards_created := 0;
    
    -- Calculer les heures pour ce filleul
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600), 0)
    INTO v_total_hours
    FROM public.bookings b
    WHERE b.provider_id = referral_record.referred_id
      AND b.status = 'completed';
    
    -- Mettre à jour les heures dans referrals
    UPDATE public.referrals
    SET 
      hours_completed = v_total_hours,
      status = CASE WHEN v_total_hours >= 50 THEN 'completed' ELSE 'pending' END
    WHERE referrer_id = referral_record.referrer_id
      AND referred_id = referral_record.referred_id;
    
    -- Si 50h+, créer récompense validation si pas déjà créée
    IF v_total_hours >= 50 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.provider_referral_rewards
        WHERE referrer_id = referral_record.referrer_id
          AND referred_id = referral_record.referred_id
          AND reward_type = 'validation'
      ) THEN
        INSERT INTO public.provider_referral_rewards (
          referrer_id, referred_id, reward_type, amount, status
        ) VALUES (
          referral_record.referrer_id,
          referral_record.referred_id,
          'validation',
          30.00,
          'pending'
        );
        v_rewards_created := v_rewards_created + 1;
      END IF;
    END IF;
    
    -- Si 120h+, créer récompense fidélisation si pas déjà créée
    IF v_total_hours >= 120 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.provider_referral_rewards
        WHERE referrer_id = referral_record.referrer_id
          AND referred_id = referral_record.referred_id
          AND reward_type = 'loyalty'
      ) THEN
        INSERT INTO public.provider_referral_rewards (
          referrer_id, referred_id, reward_type, amount, status
        ) VALUES (
          referral_record.referrer_id,
          referral_record.referred_id,
          'loyalty',
          50.00,
          'pending'
        );
        v_rewards_created := v_rewards_created + 1;
      END IF;
    END IF;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
      referral_record.referral_code,
      referral_record.referrer_id,
      referral_record.referred_id,
      v_total_hours,
      v_rewards_created;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.recalculate_referral_rewards() IS 'Recalcule toutes les récompenses de parrainage en fonction des heures réellement effectuées';
