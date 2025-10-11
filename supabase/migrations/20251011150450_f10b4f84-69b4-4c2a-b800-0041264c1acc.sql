-- Fix Security Definer View warnings by converting table-returning functions
-- to SECURITY INVOKER where they don't need elevated privileges

-- 1. Fix calculate_financial_breakdown - doesn't need SECURITY DEFINER
--    It only reads from financial_rules which already has proper RLS
CREATE OR REPLACE FUNCTION public.calculate_financial_breakdown(
  p_service_category TEXT, 
  p_client_price NUMERIC
)
RETURNS TABLE(provider_payment NUMERIC, company_commission NUMERIC)
LANGUAGE plpgsql
SECURITY INVOKER -- Changed from DEFINER
STABLE
SET search_path = 'public'
AS $function$
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
$function$;

-- 2. Fix get_binome_history - doesn't need SECURITY DEFINER
--    The binomes_history table already has proper RLS policies
CREATE OR REPLACE FUNCTION public.get_binome_history(p_binome_id UUID)
RETURNS TABLE(
  id UUID, 
  action_type TEXT, 
  old_data JSONB, 
  new_data JSONB, 
  performed_by UUID, 
  notes TEXT, 
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY INVOKER -- Changed from DEFINER
STABLE
SET search_path = 'public'
AS $function$
  SELECT 
    id,
    action_type,
    old_data,
    new_data,
    performed_by,
    notes,
    created_at
  FROM public.binomes_history
  WHERE binome_id = p_binome_id
  ORDER BY created_at DESC;
$function$;

-- 3. bulk_assign_missions MUST remain SECURITY DEFINER as it performs admin operations
--    But we'll add a comment explaining why it's necessary
COMMENT ON FUNCTION public.bulk_assign_missions IS 
  'SECURITY DEFINER required: This function performs admin-level operations.
   Security is enforced via has_role() check at function start.
   Returns TABLE for batch operation results.';

COMMENT ON FUNCTION public.calculate_financial_breakdown IS 
  'SECURITY INVOKER: Safe to run with caller privileges. Respects RLS on financial_rules.';

COMMENT ON FUNCTION public.get_binome_history IS 
  'SECURITY INVOKER: Safe to run with caller privileges. Respects RLS on binomes_history.';
