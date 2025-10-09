-- Add email tracking columns to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_request_sent TIMESTAMP WITH TIME ZONE;

-- Create indexes for scheduled email queries
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_pending 
ON public.bookings(booking_date, status) 
WHERE reminder_sent IS NULL AND status = 'confirmed';

CREATE INDEX IF NOT EXISTS idx_bookings_review_pending 
ON public.bookings(completed_at, status) 
WHERE review_request_sent IS NULL AND status = 'completed';

-- Function to automatically send booking confirmation email
CREATE OR REPLACE FUNCTION public.send_booking_confirmation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_data RECORD;
  service_data RECORD;
BEGIN
  -- Récupérer les données du client
  SELECT first_name, last_name, email INTO client_data
  FROM public.profiles
  WHERE user_id = NEW.client_id;
  
  -- Récupérer les données du service
  SELECT name INTO service_data
  FROM public.services
  WHERE id = NEW.service_id;
  
  -- Appeler l'edge function d'envoi d'email (en arrière-plan)
  PERFORM net.http_post(
    url := (SELECT CONCAT(current_setting('app.settings.supabase_url', true), '/functions/v1/send-transactional-email')),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key', true))
    ),
    body := jsonb_build_object(
      'type', 'booking_confirmation',
      'recipientEmail', client_data.email,
      'recipientName', CONCAT(client_data.first_name, ' ', client_data.last_name),
      'data', jsonb_build_object(
        'clientName', client_data.first_name,
        'serviceName', service_data.name,
        'bookingDate', to_char(NEW.booking_date, 'DD/MM/YYYY'),
        'startTime', NEW.start_time::text,
        'endTime', NEW.end_time::text,
        'address', NEW.address,
        'totalPrice', NEW.total_price,
        'bookingId', NEW.id::text
      )
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'insertion
    RAISE WARNING 'Failed to send booking confirmation email: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger pour l'envoi automatique d'email de confirmation
DROP TRIGGER IF EXISTS trigger_send_booking_confirmation ON public.bookings;
CREATE TRIGGER trigger_send_booking_confirmation
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'pending' OR NEW.status = 'confirmed')
  EXECUTE FUNCTION public.send_booking_confirmation_email();

-- Function to send provider assigned email
CREATE OR REPLACE FUNCTION public.send_provider_assigned_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_data RECORD;
  provider_data RECORD;
  service_data RECORD;
BEGIN
  -- Vérifier si un prestataire vient d'être assigné
  IF NEW.provider_id IS NOT NULL AND (OLD.provider_id IS NULL OR OLD.provider_id != NEW.provider_id) THEN
    -- Récupérer les données
    SELECT first_name, last_name, email INTO client_data
    FROM public.profiles WHERE user_id = NEW.client_id;
    
    SELECT business_name, rating INTO provider_data
    FROM public.providers WHERE id = NEW.provider_id;
    
    SELECT name INTO service_data
    FROM public.services WHERE id = NEW.service_id;
    
    -- Envoyer l'email
    PERFORM net.http_post(
      url := (SELECT CONCAT(current_setting('app.settings.supabase_url', true), '/functions/v1/send-transactional-email')),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key', true))
      ),
      body := jsonb_build_object(
        'type', 'provider_assigned',
        'recipientEmail', client_data.email,
        'data', jsonb_build_object(
          'clientName', client_data.first_name,
          'providerName', provider_data.business_name,
          'providerRating', COALESCE(provider_data.rating, 5),
          'serviceName', service_data.name,
          'bookingDate', to_char(NEW.booking_date, 'DD/MM/YYYY'),
          'startTime', NEW.start_time::text
        )
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send provider assigned email: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger pour l'envoi d'email d'assignation
DROP TRIGGER IF EXISTS trigger_send_provider_assigned ON public.bookings;
CREATE TRIGGER trigger_send_provider_assigned
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.send_provider_assigned_email();