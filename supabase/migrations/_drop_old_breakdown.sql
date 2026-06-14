-- Drop the old 3-param overload replaced by the 4-param version in FIX 2
DROP FUNCTION IF EXISTS public.calculate_financial_breakdown(text, numeric, numeric);
