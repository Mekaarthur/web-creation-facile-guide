-- Créer la table des règles financières
CREATE TABLE public.financial_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_category TEXT NOT NULL,
  provider_payment NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les règles par défaut
INSERT INTO public.financial_rules (service_category, provider_payment) VALUES
('bika_kids', 18.00),
('bika_maison', 18.00),
('bika_vie', 18.00),
('bika_travel', 18.00),
('entretien_espaces_verts', 20.00),
('maintenance', 20.00),
('bika_seniors', 20.00),
('bika_animals', 20.00),
('bika_pro', 28.00),
('bika_plus', 28.00);

-- Créer la table des transactions financières
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  service_category TEXT NOT NULL,
  client_price NUMERIC NOT NULL,
  provider_payment NUMERIC NOT NULL,
  company_commission NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  client_paid_at TIMESTAMP WITH TIME ZONE,
  provider_paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.financial_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour financial_rules
CREATE POLICY "Admin can manage financial rules"
ON public.financial_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active financial rules"
ON public.financial_rules
FOR SELECT
USING (is_active = true);

-- Politiques RLS pour financial_transactions  
CREATE POLICY "Admin can view all financial transactions"
ON public.financial_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view their financial transactions"
ON public.financial_transactions
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Providers can view their financial transactions"
ON public.financial_transactions
FOR SELECT
USING (auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id));

CREATE POLICY "System can manage financial transactions"
ON public.financial_transactions
FOR ALL
USING (true);

-- Fonction pour calculer automatiquement les commissions
CREATE OR REPLACE FUNCTION public.calculate_financial_breakdown(
  p_service_category TEXT,
  p_client_price NUMERIC
)
RETURNS TABLE(
  provider_payment NUMERIC,
  company_commission NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule_payment NUMERIC;
BEGIN
  -- Récupérer le paiement prestataire selon la catégorie
  SELECT fr.provider_payment INTO rule_payment
  FROM public.financial_rules fr
  WHERE fr.service_category = p_service_category
    AND fr.is_active = true
  LIMIT 1;
  
  -- Si pas de règle trouvée, utiliser 18€ par défaut
  IF rule_payment IS NULL THEN
    rule_payment := 18.00;
  END IF;
  
  RETURN QUERY SELECT 
    rule_payment,
    p_client_price - rule_payment;
END;
$$;

-- Trigger pour créer automatiquement une transaction financière à chaque réservation
CREATE OR REPLACE FUNCTION public.create_financial_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_cat TEXT;
  breakdown RECORD;
BEGIN
  -- Déterminer la catégorie de service basée sur le service_id
  SELECT 
    CASE 
      WHEN s.category ILIKE '%kids%' OR s.category ILIKE '%enfant%' THEN 'bika_kids'
      WHEN s.category ILIKE '%maison%' OR s.category ILIKE '%home%' THEN 'bika_maison'
      WHEN s.category ILIKE '%vie%' OR s.category ILIKE '%life%' THEN 'bika_vie'
      WHEN s.category ILIKE '%travel%' OR s.category ILIKE '%voyage%' THEN 'bika_travel'
      WHEN s.category ILIKE '%senior%' OR s.category ILIKE '%âgé%' THEN 'bika_seniors'
      WHEN s.category ILIKE '%animal%' OR s.category ILIKE '%pet%' THEN 'bika_animals'
      WHEN s.category ILIKE '%pro%' OR s.category ILIKE '%business%' THEN 'bika_pro'
      WHEN s.category ILIKE '%plus%' OR s.category ILIKE '%premium%' THEN 'bika_plus'
      WHEN s.category ILIKE '%entretien%' OR s.category ILIKE '%jardinage%' THEN 'entretien_espaces_verts'
      WHEN s.category ILIKE '%maintenance%' OR s.category ILIKE '%réparation%' THEN 'maintenance'
      ELSE 'bika_maison' -- Défaut
    END
  INTO service_cat
  FROM public.services s
  WHERE s.id = NEW.service_id;
  
  -- Calculer la répartition financière
  SELECT * INTO breakdown
  FROM public.calculate_financial_breakdown(service_cat, NEW.total_price);
  
  -- Créer la transaction financière
  INSERT INTO public.financial_transactions (
    booking_id,
    client_id,
    provider_id,
    service_category,
    client_price,
    provider_payment,
    company_commission,
    payment_status
  ) VALUES (
    NEW.id,
    NEW.client_id,
    NEW.provider_id,
    service_cat,
    NEW.total_price,
    breakdown.provider_payment,
    breakdown.company_commission,
    CASE WHEN NEW.status = 'completed' THEN 'client_paid' ELSE 'pending' END
  );
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur les réservations
CREATE TRIGGER create_financial_transaction_trigger
AFTER INSERT OR UPDATE OF total_price, status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.create_financial_transaction();

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_financial_rules_updated_at
BEFORE UPDATE ON public.financial_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();