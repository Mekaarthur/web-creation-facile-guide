-- Ajouter le champ genre dans profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('homme', 'femme', 'autre', NULL));

-- Ajouter les champs de statut de vérification dans providers
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'in_review', 'active', 'suspended')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS last_status_change_at TIMESTAMPTZ DEFAULT now();

-- Ajouter les champs de validation dans provider_documents
ALTER TABLE public.provider_documents 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_providers_verification_status ON public.providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_documents_status ON public.provider_documents(status);

-- Trigger pour mettre à jour last_status_change_at
CREATE OR REPLACE FUNCTION update_provider_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    NEW.last_status_change_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_provider_status ON public.providers;
CREATE TRIGGER trigger_update_provider_status
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_status_timestamp();