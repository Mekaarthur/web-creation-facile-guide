-- Fonction pour auto-générer une facture quand un booking est marqué "completed"
CREATE OR REPLACE FUNCTION public.auto_generate_invoice_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_num TEXT;
  existing_invoice_count INT;
BEGIN
  -- Seulement si le statut passe à 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Vérifier qu'une facture n'existe pas déjà pour ce booking
    SELECT COUNT(*) INTO existing_invoice_count 
    FROM invoices WHERE booking_id = NEW.id;
    
    IF existing_invoice_count = 0 THEN
      -- Générer un numéro de facture unique
      invoice_num := 'BKW-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(
        (SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INT)), 0) + 1 
         FROM invoices WHERE invoice_number LIKE 'BKW-' || TO_CHAR(NOW(), 'YYYYMM') || '-%')::TEXT, 
        4, '0'
      );
      
      INSERT INTO invoices (
        client_id,
        booking_id,
        invoice_number,
        amount,
        status,
        issued_date,
        due_date,
        service_description
      ) VALUES (
        NEW.client_id,
        NEW.id,
        invoice_num,
        NEW.total_price,
        'pending',
        NOW()::DATE::TEXT,
        (NOW() + INTERVAL '30 days')::DATE::TEXT,
        'Prestation Bikawo - Réservation ' || LEFT(NEW.id::TEXT, 8)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_invoice_on_completion ON bookings;
CREATE TRIGGER trigger_auto_invoice_on_completion
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invoice_on_completion();

-- Table provider_attestations pour les attestations prestataires
CREATE TABLE IF NOT EXISTS public.provider_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'nova_agreement',
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  issued_date TEXT NOT NULL DEFAULT NOW()::DATE::TEXT,
  expiry_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.provider_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own attestations"
  ON public.provider_attestations FOR SELECT
  TO authenticated
  USING (provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage provider attestations"
  ON public.provider_attestations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );