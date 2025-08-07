-- Créer la table pour les factures automatiques si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id),
  client_id uuid NOT NULL,
  invoice_number text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'pending',
  service_description text,
  issued_date timestamptz DEFAULT now(),
  due_date timestamptz DEFAULT (now() + interval '30 days'),
  payment_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour les factures
CREATE POLICY "Users can view their own invoices" ON public.invoices
FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admin can manage all invoices" ON public.invoices
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid()
));

-- Fonction pour générer automatiquement une facture quand une réservation est complétée
CREATE OR REPLACE FUNCTION public.generate_invoice_for_completed_booking()
RETURNS TRIGGER AS $$
DECLARE
  service_name text;
BEGIN
  -- Vérifier si le statut passe à 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Récupérer le nom du service
    SELECT name INTO service_name
    FROM public.services
    WHERE id = NEW.service_id;
    
    -- Créer la facture
    INSERT INTO public.invoices (
      booking_id,
      client_id,
      invoice_number,
      amount,
      service_description,
      status
    ) VALUES (
      NEW.id,
      NEW.client_id,
      'INV-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('invoice_sequence')::text, 6, '0'),
      NEW.total_price,
      'Prestation ' || COALESCE(service_name, 'Service') || ' du ' || TO_CHAR(NEW.booking_date, 'DD/MM/YYYY'),
      'issued'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer une séquence pour les numéros de facture
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

-- Créer le trigger pour générer automatiquement les factures
CREATE OR REPLACE TRIGGER generate_invoice_on_completion
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_for_completed_booking();

-- Créer la fonction pour programmer les rappels automatiquement
CREATE OR REPLACE FUNCTION public.schedule_reminder_for_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Programmer un rappel pour demain si la réservation est confirmée
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Insérer dans une table de tâches programmées (ou utiliser pg_cron si disponible)
    -- Pour l'instant, on log juste
    RAISE NOTICE 'Reminder scheduled for booking % on %', NEW.id, NEW.booking_date - interval '1 day';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour programmer les rappels
CREATE OR REPLACE TRIGGER schedule_reminder_on_confirmation
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_reminder_for_booking();