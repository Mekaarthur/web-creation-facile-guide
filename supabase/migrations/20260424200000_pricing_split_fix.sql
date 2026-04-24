-- ============================================================
-- Fix répartition des paiements Bikawô
-- 1. Colonnes manquantes sur financial_transactions
-- 2. Colonne client_price sur financial_rules + tarifs corrects
-- 3. Fonction calculate_financial_breakdown corrigée (heures + Stripe)
-- 4. Trigger UPSERT pour éviter les doublons
-- ============================================================

-- 1. Colonnes manquantes sur financial_transactions
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS stripe_commission NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hours             NUMERIC NOT NULL DEFAULT 1;

-- 2. Colonne client_price sur financial_rules
ALTER TABLE public.financial_rules
  ADD COLUMN IF NOT EXISTS client_price NUMERIC NOT NULL DEFAULT 25.00;

-- Contrainte d'unicité sur service_category (nécessaire pour l'UPSERT ci-dessous)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'financial_rules_service_category_key'
      AND conrelid = 'public.financial_rules'::regclass
  ) THEN
    ALTER TABLE public.financial_rules
      ADD CONSTRAINT financial_rules_service_category_key UNIQUE (service_category);
  END IF;
END $$;

-- Mettre à jour / insérer la grille tarifaire officielle
INSERT INTO public.financial_rules (service_category, client_price, provider_payment, is_active)
VALUES
  ('bika_kids',     25.00, 18.00, true),
  ('bika_maison',   25.00, 18.00, true),
  ('bika_vie',      25.00, 18.00, true),
  ('bika_animals',  25.00, 18.00, true),
  ('bika_menage',   28.00, 21.00, true),
  ('bika_seniors',  30.00, 22.00, true),
  ('bika_travel',   30.00, 22.00, true),
  ('bika_pro',      40.00, 29.00, true),
  ('bika_plus',     40.00, 29.00, true)
ON CONFLICT (service_category) DO UPDATE SET
  client_price     = EXCLUDED.client_price,
  provider_payment = EXCLUDED.provider_payment,
  is_active        = true,
  updated_at       = now();

-- 3. Fonction calculate_financial_breakdown corrigée
--    p_client_price : montant TOTAL déjà facturé au client (€)
--    p_hours        : nombre d'heures (pour calculer la part prestataire)
CREATE OR REPLACE FUNCTION public.calculate_financial_breakdown(
  p_service_category TEXT,
  p_client_price     NUMERIC,
  p_hours            NUMERIC DEFAULT 1
)
RETURNS TABLE(
  provider_payment   NUMERIC,
  company_commission NUMERIC,
  stripe_commission  NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hourly_provider NUMERIC;
  v_provider_total NUMERIC;
  v_stripe_fee     NUMERIC;
BEGIN
  SELECT fr.provider_payment INTO hourly_provider
  FROM public.financial_rules fr
  WHERE fr.service_category = p_service_category AND fr.is_active = true
  LIMIT 1;

  -- Fallback si catégorie inconnue
  IF hourly_provider IS NULL THEN
    hourly_provider := 18.00;
  END IF;

  -- Part prestataire = tarif horaire × heures
  v_provider_total := ROUND(hourly_provider * p_hours, 2);

  -- Commission Stripe : 1,4 % + 0,25 € (arrondi au centime)
  v_stripe_fee := ROUND(p_client_price * 0.014 + 0.25, 2);

  RETURN QUERY SELECT
    v_provider_total,
    ROUND(p_client_price - v_provider_total - v_stripe_fee, 2),
    v_stripe_fee;
END;
$$;

-- 4. Trigger UPSERT corrigé
CREATE OR REPLACE FUNCTION public.create_financial_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_cat TEXT;
  breakdown   RECORD;
  v_hours     NUMERIC;
BEGIN
  -- Déduire la catégorie depuis le service associé
  SELECT
    CASE
      WHEN s.category ILIKE '%kids%'        OR s.category ILIKE '%enfant%'     THEN 'bika_kids'
      WHEN s.category ILIKE '%menage%'      OR s.category ILIKE '%ménage%'     THEN 'bika_menage'
      WHEN s.category ILIKE '%maison%'      OR s.category ILIKE '%home%'       THEN 'bika_maison'
      WHEN s.category ILIKE '%vie%'         OR s.category ILIKE '%life%'       THEN 'bika_vie'
      WHEN s.category ILIKE '%travel%'      OR s.category ILIKE '%voyage%'     THEN 'bika_travel'
      WHEN s.category ILIKE '%senior%'      OR s.category ILIKE '%âgé%'        THEN 'bika_seniors'
      WHEN s.category ILIKE '%animal%'      OR s.category ILIKE '%pet%'        THEN 'bika_animals'
      WHEN s.category ILIKE '%entretien%'   OR s.category ILIKE '%jardinage%'  THEN 'entretien_espaces_verts'
      WHEN s.category ILIKE '%maintenance%' OR s.category ILIKE '%réparation%' THEN 'maintenance'
      WHEN s.category ILIKE '%pro%'         OR s.category ILIKE '%business%'   THEN 'bika_pro'
      WHEN s.category ILIKE '%plus%'        OR s.category ILIKE '%premium%'    THEN 'bika_plus'
      ELSE 'bika_maison'
    END
  INTO service_cat
  FROM public.services s
  WHERE s.id = NEW.service_id;

  -- Nombre d'heures depuis custom_duration (minimum 0,5 h)
  v_hours := GREATEST(COALESCE(NEW.custom_duration, 1), 0.5);

  -- Calcul de la répartition
  SELECT * INTO breakdown
  FROM public.calculate_financial_breakdown(service_cat, NEW.total_price, v_hours);

  -- UPSERT : mise à jour si la transaction existe, sinon insertion
  IF EXISTS (
    SELECT 1 FROM public.financial_transactions WHERE booking_id = NEW.id
  ) THEN
    UPDATE public.financial_transactions SET
      service_category   = service_cat,
      client_price       = NEW.total_price,
      provider_payment   = breakdown.provider_payment,
      company_commission = breakdown.company_commission,
      stripe_commission  = breakdown.stripe_commission,
      hours              = v_hours,
      updated_at         = now()
    WHERE booking_id = NEW.id;
  ELSE
    INSERT INTO public.financial_transactions (
      booking_id,        client_id,         provider_id,
      service_category,  client_price,      provider_payment,
      company_commission, stripe_commission, hours,
      payment_status
    ) VALUES (
      NEW.id,                NEW.client_id,     NEW.provider_id,
      service_cat,           NEW.total_price,   breakdown.provider_payment,
      breakdown.company_commission, breakdown.stripe_commission, v_hours,
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recréer le trigger (DROP + CREATE pour éviter les conflits de signature)
DROP TRIGGER IF EXISTS create_financial_transaction_trigger ON public.bookings;
CREATE TRIGGER create_financial_transaction_trigger
AFTER INSERT OR UPDATE OF total_price, status, custom_duration
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.create_financial_transaction();
