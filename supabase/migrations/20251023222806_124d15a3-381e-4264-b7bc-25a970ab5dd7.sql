-- Simplify cooptation system to hours-only criteria
-- Validation: 50 hours
-- Loyalty: 120 hours

CREATE OR REPLACE FUNCTION public.process_provider_referral_reward()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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

  -- Get referral info for this provider
  SELECT referrer_id, referred_started_at
  INTO v_referrer_id, v_referred_started_at
  FROM public.referrals
  WHERE referred_id = NEW.provider_id
    AND status = 'completed'
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
          hours_completed = v_total_hours,
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
        hours_completed = v_total_hours,
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