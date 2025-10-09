-- Ajouter colonnes mandat dans providers si elles n'existent pas
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS mandat_signature_data TEXT,
ADD COLUMN IF NOT EXISTS mandat_signature_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS formation_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS formation_date TIMESTAMP WITH TIME ZONE;

-- Créer une table pour suivre l'historique des vérifications d'identité
CREATE TABLE IF NOT EXISTS public.provider_identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  verification_method TEXT NOT NULL, -- 'video_call', 'document_check', 'in_person'
  verified BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  verification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_identity_verifications_provider 
ON public.provider_identity_verifications(provider_id);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_date 
ON public.provider_identity_verifications(verification_date DESC);

-- RLS policies
ALTER TABLE public.provider_identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin peut gérer vérifications identité"
ON public.provider_identity_verifications FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Prestataires peuvent voir leurs vérifications"
ON public.provider_identity_verifications FOR SELECT
TO authenticated
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

COMMENT ON TABLE public.provider_identity_verifications IS 'Historique des vérifications d''identité des prestataires par les admins';