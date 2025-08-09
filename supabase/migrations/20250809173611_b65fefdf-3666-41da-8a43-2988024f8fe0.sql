-- Update the referrals table to support new referral system
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_user_email TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referrer_type TEXT NOT NULL DEFAULT 'client';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_type TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS missions_completed INTEGER DEFAULT 0;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS provider_rating NUMERIC DEFAULT 0;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS first_mission_duration NUMERIC DEFAULT 0;

-- Update reward amounts based on type
UPDATE public.referrals SET reward_amount = 20.00 WHERE referrer_type = 'client';
UPDATE public.referrals SET reward_amount = 30.00 WHERE referrer_type = 'provider';

-- Function to process client referral rewards
CREATE OR REPLACE FUNCTION public.process_client_referral_reward()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a completed booking with 2+ hours
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Calculate duration in hours
    DECLARE
      duration_hours NUMERIC;
      referred_user_id UUID;
      referrer_referral RECORD;
    BEGIN
      duration_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;
      
      -- Only process if >= 2 hours
      IF duration_hours >= 2 THEN
        -- Check if this user was referred
        SELECT r.* INTO referrer_referral
        FROM public.referrals r
        WHERE r.referred_id = NEW.client_id 
          AND r.status = 'pending'
          AND r.referrer_type = 'client'
        LIMIT 1;
        
        IF FOUND THEN
          -- Update referral status and record mission duration
          UPDATE public.referrals 
          SET 
            status = 'completed',
            completed_at = now(),
            first_mission_duration = duration_hours
          WHERE id = referrer_referral.id;
          
          -- Give credits to referrer (20€)
          INSERT INTO public.client_rewards (client_id, reward_type, earned_date)
          VALUES (referrer_referral.referrer_id, 'referral_reward', now());
          
          -- Give credits to referred user (20€)
          INSERT INTO public.client_rewards (client_id, reward_type, earned_date)
          VALUES (NEW.client_id, 'referred_bonus', now());
        END IF;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process provider referral rewards
CREATE OR REPLACE FUNCTION public.process_provider_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  provider_user_id UUID;
  provider_rating NUMERIC;
  referrer_referral RECORD;
BEGIN
  -- Check if this is a completed booking
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get provider user_id
    SELECT user_id INTO provider_user_id
    FROM public.providers 
    WHERE id = NEW.provider_id;
    
    -- Update missions count for this provider's referral
    UPDATE public.referrals 
    SET missions_completed = missions_completed + 1
    WHERE referred_id = provider_user_id 
      AND referrer_type = 'provider'
      AND status = 'pending';
    
    -- Check if provider has completed 5 missions with good rating
    SELECT r.* INTO referrer_referral
    FROM public.referrals r
    WHERE r.referred_id = provider_user_id 
      AND r.status = 'pending'
      AND r.referrer_type = 'provider'
      AND r.missions_completed >= 5
    LIMIT 1;
    
    IF FOUND THEN
      -- Get provider's average rating
      SELECT COALESCE(AVG(rating), 0) INTO provider_rating
      FROM public.reviews
      WHERE provider_id = NEW.provider_id;
      
      -- Check if rating is 4/5 or higher
      IF provider_rating >= 4.0 THEN
        -- Complete the referral
        UPDATE public.referrals 
        SET 
          status = 'completed',
          completed_at = now(),
          provider_rating = provider_rating
        WHERE id = referrer_referral.id;
        
        -- Give reward to referrer (30€)
        INSERT INTO public.provider_rewards (
          provider_id, 
          amount, 
          reward_tier, 
          missions_count, 
          hours_worked, 
          average_rating
        )
        SELECT 
          p.id,
          30.00,
          'referral',
          1,
          0,
          provider_rating
        FROM public.providers p
        WHERE p.user_id = referrer_referral.referrer_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_client_referral_reward ON public.bookings;
CREATE TRIGGER trigger_client_referral_reward
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.process_client_referral_reward();

DROP TRIGGER IF EXISTS trigger_provider_referral_reward ON public.bookings;
CREATE TRIGGER trigger_provider_referral_reward
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.process_provider_referral_reward();

-- Function to create referral when user signs up with code
CREATE OR REPLACE FUNCTION public.create_referral_from_code(
  p_referral_code TEXT,
  p_referred_email TEXT,
  p_referred_type TEXT DEFAULT 'client'
)
RETURNS boolean AS $$
DECLARE
  referrer_record RECORD;
  new_referral_id UUID;
BEGIN
  -- Find the referrer
  SELECT r.referrer_id, r.referrer_type INTO referrer_record
  FROM public.referrals r
  WHERE r.referral_code = p_referral_code
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Create new referral entry
  INSERT INTO public.referrals (
    referrer_id,
    referrer_type,
    referred_type,
    referral_code,
    referred_user_email,
    reward_amount
  ) VALUES (
    referrer_record.referrer_id,
    referrer_record.referrer_type,
    p_referred_type,
    p_referral_code,
    p_referred_email,
    CASE 
      WHEN referrer_record.referrer_type = 'client' THEN 20.00
      WHEN referrer_record.referrer_type = 'provider' THEN 30.00
      ELSE 0.00
    END
  ) RETURNING id INTO new_referral_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;