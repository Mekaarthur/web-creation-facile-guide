-- Créer un trigger pour générer automatiquement des factures clients quand une mission est terminée
CREATE OR REPLACE FUNCTION generate_client_invoice_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_name TEXT;
  hours_worked NUMERIC;
  hourly_rate NUMERIC;
  calculated_amount NUMERIC;
BEGIN
  -- Vérifier que la mission vient d'être marquée comme terminée
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Récupérer le nom du service
    SELECT name INTO service_name
    FROM public.services 
    WHERE id = NEW.service_id;
    
    -- Calculer les heures travaillées
    hours_worked := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;
    
    -- Utiliser le tarif horaire de la réservation ou celui par défaut
    hourly_rate := COALESCE(NEW.hourly_rate, NEW.total_price / hours_worked);
    
    -- Calculer le montant total
    calculated_amount := COALESCE(NEW.total_price, hours_worked * hourly_rate);
    
    -- Générer la facture client
    INSERT INTO public.invoices (
      client_id,
      booking_id,
      amount,
      service_description,
      status,
      issued_date,
      due_date
    ) VALUES (
      NEW.client_id,
      NEW.id,
      calculated_amount,
      CONCAT('Prestation ', service_name, ' - ', hours_worked, 'h'),
      'pending',
      now(),
      now() + INTERVAL '30 days'
    );
    
    -- Créer une notification client
    INSERT INTO public.realtime_notifications (
      user_id,
      type,
      title,
      message,
      priority
    ) VALUES (
      NEW.client_id,
      'invoice_generated',
      'Nouvelle facture disponible',
      'Votre facture pour la prestation terminée est disponible dans votre espace personnel.',
      'normal'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table bookings
DROP TRIGGER IF EXISTS trigger_generate_client_invoice ON public.bookings;
CREATE TRIGGER trigger_generate_client_invoice
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_client_invoice_on_completion();

-- Ajouter une colonne mandat_facturation à la table providers pour stocker l'accord de facturation
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS mandat_facturation_accepte BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mandat_facturation_date TIMESTAMP WITH TIME ZONE;

-- Créer une table pour les fiches de rémunération prestataires
CREATE TABLE IF NOT EXISTS public.provider_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  invoice_number TEXT NOT NULL DEFAULT '',
  amount_brut NUMERIC NOT NULL DEFAULT 0,
  amount_net NUMERIC NOT NULL DEFAULT 0,
  tva_amount NUMERIC DEFAULT 0,
  charges_sociales NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_date TIMESTAMP WITH TIME ZONE,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger pour générer le numéro de fiche de rémunération
CREATE OR REPLACE FUNCTION generate_provider_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
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
$$;

-- Trigger pour définir automatiquement le numéro de fiche
CREATE OR REPLACE FUNCTION set_provider_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_provider_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_provider_invoice_number ON public.provider_invoices;
CREATE TRIGGER trigger_set_provider_invoice_number
  BEFORE INSERT ON public.provider_invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_provider_invoice_number();

-- Fonction pour générer automatiquement les fiches de rémunération prestataires
CREATE OR REPLACE FUNCTION generate_provider_invoice_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provider_data RECORD;
  hours_worked NUMERIC;
  base_amount NUMERIC;
  tva_rate NUMERIC := 0.20; -- 20% TVA par défaut
BEGIN
  -- Vérifier que la mission vient d'être marquée comme terminée
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Récupérer les données du prestataire
    SELECT * INTO provider_data
    FROM public.providers 
    WHERE id = NEW.provider_id;
    
    -- Vérifier que le prestataire a accepté le mandat de facturation
    IF provider_data.mandat_facturation_accepte = true THEN
      
      -- Calculer les heures travaillées
      hours_worked := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;
      
      -- Calculer le montant de base (70% du montant client)
      base_amount := NEW.total_price * 0.70;
      
      -- Générer la fiche de rémunération
      INSERT INTO public.provider_invoices (
        provider_id,
        booking_id,
        amount_brut,
        amount_net,
        tva_amount,
        status,
        issued_date
      ) VALUES (
        NEW.provider_id,
        NEW.id,
        base_amount,
        base_amount / (1 + tva_rate),
        base_amount - (base_amount / (1 + tva_rate)),
        'pending',
        now() + INTERVAL '4 days' -- Émission dans 4 jours
      );
      
      -- Créer une notification pour le prestataire
      INSERT INTO public.provider_notifications (
        provider_id,
        booking_id,
        title,
        message,
        type
      ) VALUES (
        NEW.provider_id,
        NEW.id,
        'Fiche de rémunération générée',
        'Votre fiche de rémunération sera disponible dans 4 jours dans votre espace prestataire.',
        'payment'
      );
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour les fiches prestataires
DROP TRIGGER IF EXISTS trigger_generate_provider_invoice ON public.bookings;
CREATE TRIGGER trigger_generate_provider_invoice
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_provider_invoice_on_completion();

-- RLS pour les fiches de rémunération prestataires
ALTER TABLE public.provider_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own invoices" 
ON public.provider_invoices 
FOR SELECT 
USING (provider_id IN (
  SELECT id FROM public.providers WHERE user_id = auth.uid()
));

CREATE POLICY "Admin can manage all provider invoices" 
ON public.provider_invoices 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour l'updated_at
DROP TRIGGER IF EXISTS update_provider_invoices_updated_at ON public.provider_invoices;
CREATE TRIGGER update_provider_invoices_updated_at
  BEFORE UPDATE ON public.provider_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();