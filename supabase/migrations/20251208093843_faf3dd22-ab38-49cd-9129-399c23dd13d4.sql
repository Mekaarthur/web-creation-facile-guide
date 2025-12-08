
-- =====================================================
-- CORRECTION DES 6 FONCTIONS RESTANTES
-- =====================================================

-- calculate_provider_price
CREATE OR REPLACE FUNCTION public.calculate_provider_price(client_price numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
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
$function$;

-- notify_admin_new_review
CREATE OR REPLACE FUNCTION public.notify_admin_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  admin_record RECORD;
  client_name TEXT;
  provider_name TEXT;
BEGIN
  SELECT first_name || ' ' || last_name INTO client_name
  FROM profiles WHERE id = NEW.client_id;
  
  SELECT first_name || ' ' || last_name INTO provider_name
  FROM profiles WHERE id = NEW.provider_id;
  
  FOR admin_record IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO realtime_notifications (
      user_id, type, title, message, data, priority, is_read
    ) VALUES (
      admin_record.user_id, 'system', '⭐ Nouvel avis reçu',
      client_name || ' a noté ' || provider_name || ' (' || NEW.rating || '⭐)',
      jsonb_build_object('review_id', NEW.id, 'booking_id', NEW.booking_id, 'rating', NEW.rating, 'status', NEW.status),
      CASE WHEN NEW.rating <= 2 THEN 'high' ELSE 'normal' END, false
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- send_review_request_on_completion
CREATE OR REPLACE FUNCTION public.send_review_request_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  admin_record RECORD;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-review-request',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('bookingId', NEW.id, 'clientId', NEW.client_id, 'providerId', NEW.provider_id)
    );
    
    FOR admin_record IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO realtime_notifications (
        user_id, type, title, message, data, priority, is_read
      ) VALUES (
        admin_record.user_id, 'system', '⭐ Mission terminée - Avis en attente',
        'Mission #' || NEW.id || ' terminée. Demande d''avis envoyée au client.',
        jsonb_build_object('booking_id', NEW.id, 'client_id', NEW.client_id, 'provider_id', NEW.provider_id),
        'low', false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- update_client_stats
CREATE OR REPLACE FUNCTION public.update_client_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE profiles
    SET 
      total_bookings = (SELECT COUNT(*) FROM bookings WHERE client_id = NEW.client_id),
      total_spent = (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE client_id = NEW.client_id AND status = 'completed')
    WHERE user_id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- update_provider_status_change_timestamp
CREATE OR REPLACE FUNCTION public.update_provider_status_change_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    NEW.last_status_change_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

-- update_provider_status_timestamp
CREATE OR REPLACE FUNCTION public.update_provider_status_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    NEW.last_status_change_at = now();
  END IF;
  RETURN NEW;
END;
$function$;
