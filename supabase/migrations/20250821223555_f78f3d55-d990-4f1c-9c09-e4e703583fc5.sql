-- Étendre la table profiles pour inclure tous les champs du formulaire
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Ajouter un commentaire pour documenter les colonnes
COMMENT ON COLUMN public.profiles.email IS 'Email de contact (peut différer de auth.users.email)';
COMMENT ON COLUMN public.profiles.phone IS 'Numéro de téléphone';
COMMENT ON COLUMN public.profiles.address IS 'Adresse complète';

-- Fonction pour synchroniser l'email depuis auth.users si le profil n'a pas d'email personnalisé
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si pas d'email dans le profil, utiliser celui de auth.users
  IF NEW.email IS NULL THEN
    NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour synchroniser l'email à la création/modification
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON public.profiles;
CREATE TRIGGER trigger_sync_profile_email
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();