-- Ajouter les champs manquants à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
ADD COLUMN IF NOT EXISTS personal_description TEXT;

-- Ajouter les champs manquants à la table providers
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS professional_status TEXT CHECK (professional_status IN ('auto_entrepreneur', 'company', 'independent', NULL)),
ADD COLUMN IF NOT EXISTS experience_years INTEGER CHECK (experience_years >= 0),
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['fr'],
ADD COLUMN IF NOT EXISTS universes TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'documents_received', 'in_review', 'approved', 'rejected', 'suspended')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS last_status_change_at TIMESTAMPTZ;

-- Créer un index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_providers_verification_status ON public.providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_providers_universes ON public.providers USING GIN(universes);
CREATE INDEX IF NOT EXISTS idx_providers_languages ON public.providers USING GIN(languages);

-- Fonction pour mettre à jour automatiquement last_status_change_at
CREATE OR REPLACE FUNCTION public.update_provider_status_change_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    NEW.last_status_change_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le timestamp
DROP TRIGGER IF EXISTS trigger_provider_status_change ON public.providers;
CREATE TRIGGER trigger_provider_status_change
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_status_change_timestamp();

COMMENT ON COLUMN public.profiles.date_of_birth IS 'Date de naissance du prestataire';
COMMENT ON COLUMN public.profiles.gender IS 'Genre: male, female, other';
COMMENT ON COLUMN public.profiles.personal_description IS 'Description personnelle courte';
COMMENT ON COLUMN public.providers.professional_status IS 'Statut professionnel: auto_entrepreneur, company, independent';
COMMENT ON COLUMN public.providers.experience_years IS 'Années d''expérience dans le domaine';
COMMENT ON COLUMN public.providers.languages IS 'Langues parlées par le prestataire';
COMMENT ON COLUMN public.providers.universes IS 'Univers d''activité du prestataire';
COMMENT ON COLUMN public.providers.verification_status IS 'Statut de vérification du profil prestataire';
COMMENT ON COLUMN public.providers.rejection_reason IS 'Raison du rejet si applicable';
COMMENT ON COLUMN public.providers.last_status_change_at IS 'Date du dernier changement de statut';