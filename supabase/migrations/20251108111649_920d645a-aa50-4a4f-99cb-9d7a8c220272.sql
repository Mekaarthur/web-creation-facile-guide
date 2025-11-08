-- Trigger pour envoyer automatiquement une demande d'avis quand une mission est terminée
CREATE OR REPLACE FUNCTION send_review_request_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Si la mission vient d'être marquée comme 'completed'
  IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    
    -- Envoyer la demande d'avis au client via edge function
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-review-request',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'bookingId', NEW.id,
        'clientId', NEW.client_id,
        'providerId', NEW.provider_id
      )
    );
    
    -- Créer notification admin pour le suivi
    FOR admin_record IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO realtime_notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        is_read
      ) VALUES (
        admin_record.user_id,
        'system',
        '⭐ Mission terminée - Avis en attente',
        'Mission #' || NEW.id || ' terminée. Demande d''avis envoyée au client.',
        jsonb_build_object(
          'booking_id', NEW.id,
          'client_id', NEW.client_id,
          'provider_id', NEW.provider_id
        ),
        'low',
        false
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_send_review_request ON bookings;
CREATE TRIGGER trigger_send_review_request
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION send_review_request_on_completion();

-- Trigger pour notifier l'admin lors d'un nouvel avis
CREATE OR REPLACE FUNCTION notify_admin_new_review()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  client_name TEXT;
  provider_name TEXT;
BEGIN
  -- Récupérer les noms
  SELECT first_name || ' ' || last_name INTO client_name
  FROM profiles WHERE id = NEW.client_id;
  
  SELECT first_name || ' ' || last_name INTO provider_name
  FROM profiles WHERE id = NEW.provider_id;
  
  -- Notifier tous les admins
  FOR admin_record IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO realtime_notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority,
      is_read
    ) VALUES (
      admin_record.user_id,
      'system',
      '⭐ Nouvel avis reçu',
      client_name || ' a noté ' || provider_name || ' (' || NEW.rating || '⭐)',
      jsonb_build_object(
        'review_id', NEW.id,
        'booking_id', NEW.booking_id,
        'rating', NEW.rating,
        'status', NEW.status
      ),
      CASE 
        WHEN NEW.rating <= 2 THEN 'high'
        ELSE 'normal'
      END,
      false
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_admin_new_review ON reviews;
CREATE TRIGGER trigger_notify_admin_new_review
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_review();
