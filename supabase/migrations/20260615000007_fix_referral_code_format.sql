-- R-CLI-06: codes de parrainage au format BIKA-XXXXX (5 chars alphanum)
-- Les anciens codes (hex 8 chars) restent valides pour la rétrocompatibilité.
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'BIKA-' || upper(substr(
      md5(random()::text || clock_timestamp()::text),
      1, 5
    ));
    SELECT EXISTS(
      SELECT 1 FROM public.referrals WHERE referral_code = code
    ) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';
