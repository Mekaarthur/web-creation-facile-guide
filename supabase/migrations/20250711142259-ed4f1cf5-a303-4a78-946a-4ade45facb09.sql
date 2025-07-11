-- Ajouter la table pour le système de parrainage
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
  reward_amount DECIMAL(10,2) DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Ajouter des colonnes pour les earnings et missions à la table providers
ALTER TABLE public.providers 
ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN monthly_earnings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN missions_accepted INTEGER DEFAULT 0,
ADD COLUMN missions_completed INTEGER DEFAULT 0,
ADD COLUMN acceptance_rate DECIMAL(5,2) DEFAULT 100.00;

-- Ajouter une colonne address pour remplacer location dans bookings
ALTER TABLE public.bookings 
ADD COLUMN address TEXT;

-- Ajouter une table pour les notifications des prestataires
CREATE TABLE public.provider_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mission', -- mission, payment, verification, system
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les parrainages
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their referrals" 
ON public.referrals 
FOR UPDATE 
USING (auth.uid() = referrer_id);

-- Politiques RLS pour les notifications prestataires
CREATE POLICY "Providers can view their notifications" 
ON public.provider_notifications 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_id));

CREATE POLICY "System can create notifications" 
ON public.provider_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Providers can update their notifications" 
ON public.provider_notifications 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_id));

-- Fonction pour calculer automatiquement les earnings mensuels
CREATE OR REPLACE FUNCTION update_provider_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les earnings pour le prestataire
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.providers 
    SET 
      total_earnings = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM public.bookings 
        WHERE provider_id = NEW.provider_id AND status = 'completed'
      ),
      monthly_earnings = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM public.bookings 
        WHERE provider_id = NEW.provider_id 
          AND status = 'completed'
          AND EXTRACT(MONTH FROM booking_date) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM booking_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      ),
      missions_completed = missions_completed + 1
    WHERE id = NEW.provider_id;
  END IF;
  
  -- Mettre à jour le taux d'acceptation
  IF NEW.status IN ('accepted', 'refused') AND OLD.status = 'pending' THEN
    UPDATE public.providers 
    SET 
      missions_accepted = CASE WHEN NEW.status = 'accepted' THEN missions_accepted + 1 ELSE missions_accepted END,
      acceptance_rate = (
        SELECT CASE 
          WHEN COUNT(*) = 0 THEN 100.00
          ELSE (COUNT(*) FILTER (WHERE status = 'accepted') * 100.0 / COUNT(*))
        END
        FROM public.bookings 
        WHERE provider_id = NEW.provider_id AND status IN ('accepted', 'refused')
      )
    WHERE id = NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les earnings
CREATE TRIGGER update_provider_earnings_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_earnings();

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;