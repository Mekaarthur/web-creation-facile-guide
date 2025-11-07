-- Corriger le calcul des revenus prestataires pour utiliser le prix prestataire (72%)
-- au lieu du prix client

-- Fonction pour calculer le prix prestataire à partir du prix client
CREATE OR REPLACE FUNCTION calculate_provider_price(client_price NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  CASE 
    WHEN client_price = 25 THEN RETURN 18;
    WHEN client_price = 30 THEN RETURN 22;
    WHEN client_price = 40 THEN RETURN 29;
    WHEN client_price = 50 THEN RETURN 36;
    WHEN client_price = 60 THEN RETURN 43;
    ELSE RETURN ROUND(client_price * 0.72);
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction corrigée pour calculer automatiquement les revenus prestataires
CREATE OR REPLACE FUNCTION update_provider_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les earnings pour le prestataire quand une mission est complétée
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.providers 
    SET 
      -- Calcul du revenu total avec le prix prestataire (72% du prix client)
      total_earnings = COALESCE((
        SELECT SUM(calculate_provider_price(hourly_rate) * 
          EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
        FROM public.bookings 
        WHERE provider_id = NEW.provider_id AND status = 'completed'
      ), 0),
      -- Calcul du revenu mensuel avec le prix prestataire
      monthly_earnings = COALESCE((
        SELECT SUM(calculate_provider_price(hourly_rate) * 
          EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
        FROM public.bookings 
        WHERE provider_id = NEW.provider_id 
          AND status = 'completed'
          AND EXTRACT(MONTH FROM booking_date) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM booking_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      ), 0),
      missions_completed = missions_completed + 1
    WHERE id = NEW.provider_id;
  END IF;
  
  -- Mettre à jour le taux d'acceptation
  IF NEW.status IN ('accepted', 'refused') AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recréer le trigger
DROP TRIGGER IF EXISTS update_provider_earnings_trigger ON public.bookings;
CREATE TRIGGER update_provider_earnings_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_earnings();