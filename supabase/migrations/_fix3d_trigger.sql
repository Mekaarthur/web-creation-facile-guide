CREATE OR REPLACE FUNCTION public.create_financial_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  service_cat       TEXT;
  v_urssaf_eligible BOOLEAN;
  breakdown         RECORD;
  v_hours           NUMERIC;
BEGIN
  SELECT
    CASE
      WHEN s.category ILIKE '%kids%'        OR s.category ILIKE '%enfant%'     THEN 'bika_kids'
      WHEN s.category ILIKE '%bricolage%'                                        THEN 'bika_bricolage'
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
    END,
    COALESCE(s.urssaf_eligible, true)
  INTO service_cat, v_urssaf_eligible
  FROM public.services s
  WHERE s.id = NEW.service_id;

  IF service_cat IS NULL THEN
    service_cat := 'bika_maison';
  END IF;
  IF v_urssaf_eligible IS NULL THEN
    v_urssaf_eligible := true;
  END IF;

  v_hours := GREATEST(COALESCE(NEW.custom_duration, 1), 0.5);

  SELECT * INTO breakdown
  FROM public.calculate_financial_breakdown(service_cat, NEW.total_price, v_hours, v_urssaf_eligible);

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
      booking_id,         client_id,          provider_id,
      service_category,   client_price,       provider_payment,
      company_commission, stripe_commission,  hours,
      payment_status
    ) VALUES (
      NEW.id,               NEW.client_id,      NEW.provider_id,
      service_cat,          NEW.total_price,    breakdown.provider_payment,
      breakdown.company_commission, breakdown.stripe_commission, v_hours,
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;
