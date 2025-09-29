-- Fix security issues identified by the linter

-- 1. Remove SECURITY DEFINER from functions that don't need elevated privileges
-- and add proper search_path settings where missing

-- Fix functions that don't need SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.calculate_provider_performance_score(p_provider_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
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

-- Fix calculate_distance function
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
DECLARE
  r DECIMAL := 6371; -- Rayon de la Terre en km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$function$;

-- Fix calculate_cart_total function
CREATE OR REPLACE FUNCTION public.calculate_cart_total(cart_id_param uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
AS $function$
DECLARE
  total_amount NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(total_price), 0)
  INTO total_amount
  FROM public.cart_items
  WHERE cart_id = cart_id_param;
  
  RETURN total_amount;
END;
$function$;

-- Fix update_cart_total function
CREATE OR REPLACE FUNCTION public.update_cart_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.carts 
    SET total_estimated = public.calculate_cart_total(OLD.cart_id),
        updated_at = now()
    WHERE id = OLD.cart_id;
    RETURN OLD;
  ELSE
    UPDATE public.carts 
    SET total_estimated = public.calculate_cart_total(NEW.cart_id),
        updated_at = now()
    WHERE id = NEW.cart_id;
    RETURN NEW;
  END IF;
END;
$function$;

-- Fix calculate_detailed_rating function
CREATE OR REPLACE FUNCTION public.calculate_detailed_rating(general_rating integer, punctuality_rating integer, quality_rating integer)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
BEGIN
  RETURN ROUND((general_rating + punctuality_rating + quality_rating) / 3.0, 1);
END;
$function$;

-- Fix get_reward_amount function
CREATE OR REPLACE FUNCTION public.get_reward_amount(p_tier text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
BEGIN
  CASE p_tier
    WHEN 'bronze' THEN RETURN 50;
    WHEN 'silver' THEN RETURN 100;
    WHEN 'gold' THEN RETURN 150;
    ELSE RETURN 0;
  END CASE;
END;
$function$;

-- Add missing search_path to remaining SECURITY DEFINER functions that need it
-- These functions legitimately need SECURITY DEFINER for accessing restricted data

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.current_user_email()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, auth
AS $function$
  SELECT email FROM auth.users WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- Fix generate_referral_code function to remove SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
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
$function$;

-- Fix set_client_reward_expiration function
CREATE OR REPLACE FUNCTION public.set_client_reward_expiration()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Valid for 3 months from earning date
  NEW.valid_until := NEW.earned_date + INTERVAL '3 months';
  
  -- Expires on December 31st of current year
  NEW.expires_at := DATE_TRUNC('year', NEW.earned_date) + INTERVAL '1 year' - INTERVAL '1 day';
  
  -- If valid_until is after expires_at, use expires_at
  IF NEW.valid_until > NEW.expires_at THEN
    NEW.valid_until := NEW.expires_at;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix update_provider_rating function
CREATE OR REPLACE FUNCTION public.update_provider_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.providers 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0) 
    FROM public.reviews 
    WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id) 
    AND is_approved = true
  )
  WHERE id = COALESCE(NEW.provider_id, OLD.provider_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix update_provider_detailed_rating function
CREATE OR REPLACE FUNCTION public.update_provider_detailed_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.providers 
  SET rating = (
    SELECT COALESCE(AVG(
      CASE 
        WHEN punctuality_rating IS NOT NULL AND quality_rating IS NOT NULL 
        THEN calculate_detailed_rating(rating, punctuality_rating, quality_rating)
        ELSE rating
      END
    ), 0) 
    FROM public.reviews 
    WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id) 
    AND is_approved = true
  )
  WHERE id = COALESCE(NEW.provider_id, OLD.provider_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix log_status_change function
CREATE OR REPLACE FUNCTION public.log_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Pour les demandes clients
  IF TG_TABLE_NAME = 'client_requests' THEN
    -- Changement de statut principal
    IF OLD.status != NEW.status THEN
      PERFORM public.log_action(
        'client_request',
        NEW.id,
        'status_change',
        OLD.status,
        NEW.status,
        'Changement de statut automatique'
      );
    END IF;
    
    -- Changement de statut de paiement (gérer le cas où les colonnes n'existent pas encore)
    IF (COALESCE(OLD.payment_status, '') != COALESCE(NEW.payment_status, '')) THEN
      PERFORM public.log_action(
        'client_request',
        NEW.id,
        'payment_status_change',
        COALESCE(OLD.payment_status, ''),
        COALESCE(NEW.payment_status, ''),
        'Changement de statut de paiement'
      );
    END IF;
  END IF;
  
  -- Pour les candidatures
  IF TG_TABLE_NAME = 'job_applications' AND OLD.status != NEW.status THEN
    PERFORM public.log_action(
      'job_application',
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      'Changement de statut automatique'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;