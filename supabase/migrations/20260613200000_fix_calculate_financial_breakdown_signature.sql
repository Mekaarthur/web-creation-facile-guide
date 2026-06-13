-- Fix: align calculate_financial_breakdown signature with create_financial_transaction trigger
-- Also drops the old 2-arg overload to avoid PostgreSQL ambiguity.
DROP FUNCTION IF EXISTS public.calculate_financial_breakdown(text, numeric);

--
-- Problem: trigger calls calculate_financial_breakdown(category, price, hours) — 3 args
--          function only accepted (category, price) — 2 args → error on every booking INSERT/UPDATE
--
-- Fix: add p_hours (DEFAULT 1, backward-compatible) + add stripe_commission to return type
-- Stripe commission formula: 1.5% + €0.25 (standard European rate)

CREATE OR REPLACE FUNCTION public.calculate_financial_breakdown(
  p_service_category text,
  p_client_price     numeric,
  p_hours            numeric DEFAULT 1
)
RETURNS TABLE(
  provider_payment   numeric,
  company_commission numeric,
  stripe_commission  numeric
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  rule_payment  NUMERIC;
  v_stripe_comm NUMERIC;
BEGIN
  SELECT fr.provider_payment INTO rule_payment
  FROM public.financial_rules fr
  WHERE fr.service_category = p_service_category
    AND fr.is_active = true
  LIMIT 1;

  IF rule_payment IS NULL THEN
    rule_payment := 18.00;
  END IF;

  v_stripe_comm := ROUND(p_client_price * 0.015 + 0.25, 2);

  RETURN QUERY SELECT
    rule_payment,
    ROUND(p_client_price - rule_payment - v_stripe_comm, 2),
    v_stripe_comm;
END;
$$;
