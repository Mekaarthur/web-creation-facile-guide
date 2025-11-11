-- Ajouter les colonnes manquantes à la table profiles pour la gestion admin

-- Ajouter les colonnes de statut de compte
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'blocked', 'suspended', 'pending')),
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Ajouter les colonnes de statistiques
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10, 2) DEFAULT 0.00;

-- Créer un index sur account_status pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked_at ON public.profiles(blocked_at) WHERE blocked_at IS NOT NULL;

-- Créer une fonction trigger pour mettre à jour automatiquement total_bookings et total_spent
CREATE OR REPLACE FUNCTION public.update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.profiles
    SET 
      total_bookings = (
        SELECT COUNT(*) 
        FROM public.bookings 
        WHERE client_id = NEW.client_id
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM public.bookings 
        WHERE client_id = NEW.client_id 
        AND status = 'completed'
      )
    WHERE user_id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table bookings
DROP TRIGGER IF EXISTS trigger_update_client_stats ON public.bookings;
CREATE TRIGGER trigger_update_client_stats
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_client_stats();

-- Commenter les colonnes
COMMENT ON COLUMN public.profiles.account_status IS 'Statut du compte: active, blocked, suspended, pending';
COMMENT ON COLUMN public.profiles.blocked_at IS 'Date et heure du blocage du compte';
COMMENT ON COLUMN public.profiles.blocked_by IS 'ID de l''admin qui a bloqué le compte';
COMMENT ON COLUMN public.profiles.block_reason IS 'Raison du blocage du compte';
COMMENT ON COLUMN public.profiles.total_bookings IS 'Nombre total de réservations du client';
COMMENT ON COLUMN public.profiles.total_spent IS 'Montant total dépensé par le client';