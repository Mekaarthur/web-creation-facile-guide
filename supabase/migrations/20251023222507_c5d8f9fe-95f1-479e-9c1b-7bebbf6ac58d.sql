-- Amélioration du système de cooptation prestataires Bikawo (version corrigée)
-- Ajout de nouvelles colonnes pour suivre les étapes du parrainage

-- Ajouter colonnes pour tracking détaillé des parrainages prestataires
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS hours_completed NUMERIC DEFAULT 0;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS first_reward_paid BOOLEAN DEFAULT false;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS first_reward_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS loyalty_bonus_paid BOOLEAN DEFAULT false;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS loyalty_bonus_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS months_active INTEGER DEFAULT 0;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_started_at TIMESTAMP WITH TIME ZONE;

-- Ajouter une colonne pour compter les parrainages valides par an
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS yearly_referrals_count INTEGER DEFAULT 0;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS is_super_ambassador BOOLEAN DEFAULT false;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS ambassador_badge_earned_at TIMESTAMP WITH TIME ZONE;

-- Table pour suivre les récompenses de parrainage prestataire (si elle n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provider_referral_rewards') THEN
    CREATE TABLE public.provider_referral_rewards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_provider_id UUID NOT NULL REFERENCES public.providers(id),
      referred_provider_id UUID NOT NULL REFERENCES public.providers(id),
      referral_id UUID NOT NULL REFERENCES public.referrals(id),
      reward_type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      paid_at TIMESTAMP WITH TIME ZONE,
      year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_provider_referral_rewards_referrer ON public.provider_referral_rewards(referrer_provider_id);
    CREATE INDEX idx_provider_referral_rewards_year ON public.provider_referral_rewards(year, status);

    ALTER TABLE public.provider_referral_rewards ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Supprimer et recréer les policies pour la table provider_referral_rewards
DROP POLICY IF EXISTS "Providers can view their referral rewards" ON public.provider_referral_rewards;
DROP POLICY IF EXISTS "System can manage referral rewards" ON public.provider_referral_rewards;

CREATE POLICY "Providers can view their referral rewards"
ON public.provider_referral_rewards FOR SELECT
USING (
  auth.uid() = (SELECT user_id FROM public.providers WHERE id = referrer_provider_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can manage referral rewards"
ON public.provider_referral_rewards FOR ALL
USING (true);

-- Fonction mise à jour pour traiter les récompenses de parrainage prestataire
CREATE OR REPLACE FUNCTION public.process_provider_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  referred_provider_id UUID;
  referred_provider_user_id UUID;
  referred_provider_rating NUMERIC;
  referred_provider_hours NUMERIC;
  referrer_referral RECORD;
  referrer_provider_id UUID;
  months_since_start INTEGER;
  current_year INTEGER;
  yearly_referrals INTEGER;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    SELECT id, user_id INTO referred_provider_id, referred_provider_user_id
    FROM public.providers 
    WHERE id = NEW.provider_id;
    
    SELECT r.* INTO referrer_referral
    FROM public.referrals r
    WHERE r.referred_id = referred_provider_user_id 
      AND r.referrer_type = 'provider'
      AND r.status = 'pending';
    
    IF FOUND THEN
      UPDATE public.referrals 
      SET missions_completed = missions_completed + 1,
          referred_started_at = COALESCE(referred_started_at, now())
      WHERE id = referrer_referral.id;
      
      SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600
      ), 0) INTO referred_provider_hours
      FROM public.bookings
      WHERE provider_id = NEW.provider_id 
        AND status = 'completed';
      
      UPDATE public.referrals 
      SET hours_completed = referred_provider_hours
      WHERE id = referrer_referral.id;
      
      SELECT p.id INTO referrer_provider_id
      FROM public.providers p
      WHERE p.user_id = referrer_referral.referrer_id;
      
      current_year := EXTRACT(YEAR FROM now());
      SELECT COUNT(*) INTO yearly_referrals
      FROM public.provider_referral_rewards
      WHERE referrer_provider_id = referrer_provider_id
        AND year = current_year
        AND status != 'cancelled';
      
      -- RÉCOMPENSE 1: Parrainage validé (30€)
      IF NOT referrer_referral.first_reward_paid AND yearly_referrals < 5 THEN
        months_since_start := EXTRACT(MONTH FROM AGE(now(), COALESCE(referrer_referral.referred_started_at, now())));
        
        IF (referrer_referral.missions_completed >= 5 OR referred_provider_hours >= 50) 
           AND months_since_start <= 2 THEN
          
          UPDATE public.referrals 
          SET first_reward_paid = true,
              first_reward_paid_at = now()
          WHERE id = referrer_referral.id;
          
          INSERT INTO public.provider_referral_rewards (
            referrer_provider_id,
            referred_provider_id,
            referral_id,
            reward_type,
            amount,
            status,
            year
          ) VALUES (
            referrer_provider_id,
            referred_provider_id,
            referrer_referral.id,
            'validation',
            30,
            'pending',
            current_year
          );
          
          UPDATE public.providers
          SET yearly_referrals_count = yearly_referrals_count + 1
          WHERE id = referrer_provider_id;
        END IF;
      END IF;
      
      -- RÉCOMPENSE 2: Bonus fidélisation (50€)
      IF referrer_referral.first_reward_paid 
         AND NOT referrer_referral.loyalty_bonus_paid 
         AND yearly_referrals < 5 THEN
        
        months_since_start := EXTRACT(MONTH FROM AGE(now(), referrer_referral.referred_started_at));
        
        SELECT COALESCE(rating, 0) INTO referred_provider_rating
        FROM public.providers
        WHERE id = referred_provider_id;
        
        IF months_since_start >= 6 
           AND referred_provider_hours >= 120 
           AND referred_provider_rating >= 4.0 THEN
          
          UPDATE public.referrals 
          SET loyalty_bonus_paid = true,
              loyalty_bonus_paid_at = now(),
              status = 'completed',
              completed_at = now()
          WHERE id = referrer_referral.id;
          
          INSERT INTO public.provider_referral_rewards (
            referrer_provider_id,
            referred_provider_id,
            referral_id,
            reward_type,
            amount,
            status,
            year
          ) VALUES (
            referrer_provider_id,
            referred_provider_id,
            referrer_referral.id,
            'loyalty',
            50,
            'pending',
            current_year
          );
        END IF;
      END IF;
      
      -- RÉCOMPENSE 3: Super Ambassadeur (100€ + badge)
      SELECT COUNT(*) INTO yearly_referrals
      FROM public.provider_referral_rewards prr
      WHERE prr.referrer_provider_id = referrer_provider_id
        AND prr.year = current_year
        AND prr.reward_type = 'validation'
        AND prr.status != 'cancelled';
      
      IF yearly_referrals >= 5 THEN
        DECLARE
          badge_exists BOOLEAN;
        BEGIN
          SELECT EXISTS(
            SELECT 1 FROM public.provider_referral_rewards
            WHERE referrer_provider_id = referrer_provider_id
              AND year = current_year
              AND reward_type = 'ambassador'
          ) INTO badge_exists;
          
          IF NOT badge_exists THEN
            UPDATE public.providers
            SET is_super_ambassador = true,
                ambassador_badge_earned_at = now()
            WHERE id = referrer_provider_id;
            
            INSERT INTO public.provider_referral_rewards (
              referrer_provider_id,
              referred_provider_id,
              referral_id,
              reward_type,
              amount,
              status,
              year
            ) VALUES (
              referrer_provider_id,
              referred_provider_id,
              referrer_referral.id,
              'ambassador',
              100,
              'pending',
              current_year
            );
          END IF;
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_provider_referral_reward ON public.bookings;
CREATE TRIGGER trigger_provider_referral_reward
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.process_provider_referral_reward();