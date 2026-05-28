-- Ajouter client_price à financial_rules pour en faire la source unique
-- de vérité des tarifs par univers (split Stripe + affichage admin).
-- Les valeurs initiales correspondent aux prix officiels Bikawô.

ALTER TABLE public.financial_rules
  ADD COLUMN IF NOT EXISTS client_price NUMERIC(10, 2) NOT NULL DEFAULT 25.00;

-- Initialiser les prix client en fonction des catégories existantes
UPDATE public.financial_rules SET client_price =
  CASE service_category
    WHEN 'bika_maison'   THEN 25.00
    WHEN 'bika_kids'     THEN 25.00
    WHEN 'bika_vie'      THEN 25.00
    WHEN 'bika_animals'  THEN 25.00
    WHEN 'bika_plus'     THEN 35.00
    WHEN 'bika_seniors'  THEN 30.00
    WHEN 'bika_travel'   THEN 30.00
    WHEN 'bika_pro'      THEN 40.00
    ELSE 25.00
  END;

COMMENT ON COLUMN public.financial_rules.client_price IS
  'Prix horaire payé par le client (€). Source de vérité pour le split Stripe.';
COMMENT ON COLUMN public.financial_rules.provider_payment IS
  'Rémunération horaire versée au prestataire (€).';
