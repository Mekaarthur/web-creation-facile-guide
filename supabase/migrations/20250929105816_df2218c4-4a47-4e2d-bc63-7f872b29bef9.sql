-- Continue fixing security issues - focus on remaining SECURITY DEFINER functions
-- and add proper search_path to all functions that need it

-- Fix update_provider_earnings function
CREATE OR REPLACE FUNCTION public.update_provider_earnings()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
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
$function$;

-- Fix set_invoice_number function
CREATE OR REPLACE FUNCTION public.set_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number LIKE year_part || '-%' 
      THEN CAST(SPLIT_PART(invoice_number, '-', 2) AS INTEGER)
      ELSE 0 
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.invoices;
  
  invoice_num := year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$function$;

-- Fix set_provider_invoice_number function
CREATE OR REPLACE FUNCTION public.set_provider_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_provider_invoice_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix generate_provider_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_provider_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_part := 'REM-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number LIKE year_part || '-%' 
      THEN CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)
      ELSE 0 
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.provider_invoices;
  
  invoice_num := year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$function$;

-- Fix cleanup_old_security_logs function
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  -- Supprimer les logs plus anciens que 1 an
  DELETE FROM public.security_audit_log 
  WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Fix check_admin_role function to remove SECURITY DEFINER - it should use the has_role function
CREATE OR REPLACE FUNCTION public.check_admin_role()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path = public
AS $function$
  SELECT has_role(auth.uid(), 'admin'::app_role);
$function$;

-- Fix get_platform_stats function to remove SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_platform_stats()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path = public
AS $function$
  SELECT jsonb_build_object(
    'verified_providers', (SELECT COUNT(*) FROM providers WHERE is_verified = true AND status = 'active'),
    'monthly_bookings', (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'),
    'platform_rating', (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE is_approved = true),
    'service_categories', (SELECT COUNT(DISTINCT category) FROM services WHERE is_active = true)
  );
$function$;

-- Fix update_provider_scores function
CREATE OR REPLACE FUNCTION public.update_provider_scores()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Mettre à jour le score du prestataire concerné
  UPDATE public.providers 
  SET 
    performance_score = public.calculate_provider_performance_score(
      CASE 
        WHEN TG_TABLE_NAME = 'provider_responses' THEN NEW.provider_id
        WHEN TG_TABLE_NAME = 'reviews' THEN NEW.provider_id
        WHEN TG_TABLE_NAME = 'bookings' THEN NEW.provider_id
        ELSE NULL
      END
    ),
    last_activity_at = now()
  WHERE id = CASE 
    WHEN TG_TABLE_NAME = 'provider_responses' THEN NEW.provider_id
    WHEN TG_TABLE_NAME = 'reviews' THEN NEW.provider_id
    WHEN TG_TABLE_NAME = 'bookings' THEN NEW.provider_id
    ELSE NULL
  END;
  
  RETURN NEW;
END;
$function$;

-- Check for and drop any views that might have SECURITY DEFINER
-- Since we can't easily query for them, let's recreate the most common utility functions
-- to ensure they don't have SECURITY DEFINER when not needed

-- Update get_matching_providers functions to ensure consistent security model
CREATE OR REPLACE FUNCTION public.get_matching_providers(p_service_type text, p_location text, p_limit integer DEFAULT 5)
 RETURNS TABLE(provider_id uuid, business_name text, rating numeric, location text, match_score integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.business_name,
    p.rating,
    p.location,
    (CASE 
      WHEN LOWER(p.location) = LOWER(p_location) THEN 100
      WHEN LOWER(p.location) LIKE '%' || LOWER(p_location) || '%' THEN 80
      WHEN LOWER(p.location) LIKE LOWER(p_location) || '%' THEN 70
      ELSE 50
    END) as match_score
  FROM public.providers p
  WHERE p.is_verified = true
    AND p.description IS NOT NULL
    AND (
      LOWER(p.description) LIKE '%' || LOWER(p_service_type) || '%'
      OR p_service_type = 'Autre'
    )
  ORDER BY match_score DESC, p.rating DESC, p.total_earnings DESC
  LIMIT p_limit;
END;
$function$;