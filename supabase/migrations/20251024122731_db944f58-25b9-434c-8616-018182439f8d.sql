
-- Créer une fonction pour calculer et générer les récompenses de performance
CREATE OR REPLACE FUNCTION public.calculate_all_provider_rewards()
RETURNS TABLE(
  provider_id UUID,
  business_name TEXT,
  tier TEXT,
  amount NUMERIC,
  missions_count INTEGER,
  hours_worked NUMERIC,
  average_rating NUMERIC,
  months_active INTEGER,
  reward_created BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  provider_record RECORD;
  v_tier TEXT;
  v_amount NUMERIC;
  v_missions_count INTEGER;
  v_hours_worked NUMERIC;
  v_average_rating NUMERIC;
  v_months_active INTEGER;
  v_reward_created BOOLEAN;
  v_existing_reward_id UUID;
  v_current_year INTEGER;
BEGIN
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Parcourir tous les prestataires vérifiés
  FOR provider_record IN
    SELECT 
      p.id,
      p.business_name,
      p.created_at
    FROM public.providers p
    WHERE p.is_verified = true
      AND p.status = 'active'
  LOOP
    v_reward_created := false;
    
    -- Calculer les métriques
    SELECT 
      COUNT(*),
      COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600), 0),
      COALESCE(AVG(r.rating), 0)
    INTO v_missions_count, v_hours_worked, v_average_rating
    FROM public.bookings b
    LEFT JOIN public.reviews r ON r.booking_id = b.id
    WHERE b.provider_id = provider_record.id
      AND b.status = 'completed';
    
    -- Calculer les mois d'ancienneté
    v_months_active := EXTRACT(MONTH FROM AGE(CURRENT_DATE, provider_record.created_at::date));
    
    -- Calculer le tier éligible
    v_tier := public.calculate_provider_reward_tier(
      provider_record.id,
      v_missions_count,
      v_hours_worked,
      v_average_rating,
      v_months_active
    );
    
    -- Définir le montant selon le tier
    v_amount := CASE v_tier
      WHEN 'bronze' THEN 50
      WHEN 'silver' THEN 100
      WHEN 'gold' THEN 150
      ELSE 0
    END;
    
    -- Si éligible, vérifier si pas déjà créé cette année
    IF v_tier IS NOT NULL THEN
      SELECT id INTO v_existing_reward_id
      FROM public.provider_rewards
      WHERE provider_id = provider_record.id
        AND reward_tier = v_tier
        AND year = v_current_year
      LIMIT 1;
      
      -- Créer la récompense si elle n'existe pas
      IF v_existing_reward_id IS NULL THEN
        INSERT INTO public.provider_rewards (
          provider_id,
          reward_tier,
          amount,
          year,
          status,
          missions_count,
          hours_worked,
          average_rating
        ) VALUES (
          provider_record.id,
          v_tier,
          v_amount,
          v_current_year,
          'pending',
          v_missions_count,
          v_hours_worked,
          v_average_rating
        );
        v_reward_created := true;
      END IF;
    END IF;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
      provider_record.id,
      provider_record.business_name,
      COALESCE(v_tier, 'none'),
      COALESCE(v_amount, 0),
      v_missions_count,
      v_hours_worked,
      v_average_rating,
      v_months_active,
      v_reward_created;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.calculate_all_provider_rewards() IS 'Calcule et génère automatiquement les récompenses de performance pour tous les prestataires éligibles';
