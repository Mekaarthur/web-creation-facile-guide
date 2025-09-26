-- Corriger la fonction problématique
CREATE OR REPLACE FUNCTION public.calculate_provider_performance_score(p_provider_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  acceptance_rate NUMERIC := 100;
  avg_rating NUMERIC := 0;
  punctuality_score NUMERIC := 100;
  final_score NUMERIC := 0;
BEGIN
  -- Pour l'instant, on retourne un score basé uniquement sur les avis
  -- La table provider_responses n'existe pas encore
  
  -- Moyenne des avis clients
  SELECT COALESCE(AVG(rating), 0)
  INTO avg_rating
  FROM public.reviews
  WHERE provider_id = p_provider_id
    AND is_approved = true
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Score de ponctualité (basé sur les réservations terminées à l'heure)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100
      ELSE (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))
    END
  INTO punctuality_score
  FROM public.bookings
  WHERE provider_id = (SELECT id FROM public.providers WHERE id = p_provider_id)
    AND status IN ('completed', 'cancelled')
    AND booking_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calcul du score final
  final_score := (acceptance_rate + (avg_rating * 20) + punctuality_score) / 3;
  
  RETURN ROUND(final_score, 1);
END;
$function$;

-- Maintenant créer les données de test
-- 1. Créer quelques réservations de test
INSERT INTO bookings (
    client_id, provider_id, service_id, booking_date, start_time, end_time,
    total_price, address, notes, status, created_at
) VALUES
(
    'b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b',
    (SELECT id FROM providers WHERE business_name = 'Marie Philippe Services'),
    (SELECT id FROM services LIMIT 1),
    CURRENT_DATE + INTERVAL '2 days',
    '14:00:00',
    '17:00:00',
    75.00,
    '123 Avenue de la République, 75015 Paris',
    'Appartement 3 pièces, accès code 1234',
    'confirmed',
    NOW() - INTERVAL '2 hours'
),
(
    'a34cdf39-90ca-4c4c-a234-7d6c1c2d54b4',
    (SELECT id FROM providers WHERE business_name = 'Jean Dupont Jardinage'),
    (SELECT id FROM services LIMIT 1),
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00', 
    '12:00:00',
    90.00,
    '45 Rue des Lilas, 75016 Paris',
    'Taille des haies et entretien pelouse',
    'pending',
    NOW() - INTERVAL '1 hour'
);