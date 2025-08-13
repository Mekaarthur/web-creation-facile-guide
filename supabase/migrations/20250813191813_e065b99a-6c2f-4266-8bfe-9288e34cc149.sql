-- Corriger le trigger pour gérer les nouveaux champs
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;