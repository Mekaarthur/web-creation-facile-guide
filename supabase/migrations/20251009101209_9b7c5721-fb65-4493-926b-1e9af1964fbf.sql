-- Ajouter les colonnes pour l'onboarding prestataire
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS formation_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS formation_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS identity_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS mandat_signature_date TIMESTAMP WITH TIME ZONE;

-- Commenter les colonnes
COMMENT ON COLUMN public.providers.formation_completed IS 'Indique si le prestataire a terminé la formation obligatoire';
COMMENT ON COLUMN public.providers.formation_completed_at IS 'Date de complétion de la formation';
COMMENT ON COLUMN public.providers.identity_verified IS 'Indique si l''identité du prestataire a été vérifiée par l''admin';
COMMENT ON COLUMN public.providers.identity_verified_at IS 'Date de vérification de l''identité';
COMMENT ON COLUMN public.providers.identity_verified_by IS 'Admin ayant vérifié l''identité';
COMMENT ON COLUMN public.providers.mandat_signature_date IS 'Date de signature du mandat de facturation';
