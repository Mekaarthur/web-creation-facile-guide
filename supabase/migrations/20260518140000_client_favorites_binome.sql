-- ============================================
-- MIGRATION: Système de favoris clients + acceptation mutuelle binôme
-- ============================================

-- 1. Table client_favorites : acceptation mutuelle client ↔ prestataire
CREATE TABLE IF NOT EXISTS public.client_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id       UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  booking_id        UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  -- côté client
  client_status     TEXT NOT NULL DEFAULT 'accepted'
                    CHECK (client_status IN ('accepted', 'withdrawn')),
  -- côté prestataire
  provider_status   TEXT NOT NULL DEFAULT 'pending'
                    CHECK (provider_status IN ('pending', 'accepted', 'declined')),
  -- statut global de la relation
  status            TEXT NOT NULL DEFAULT 'pending_provider'
                    CHECK (status IN ('pending_provider', 'active', 'declined', 'withdrawn')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_client_provider UNIQUE (client_id, provider_id)
);

CREATE INDEX idx_client_favorites_client   ON public.client_favorites(client_id);
CREATE INDEX idx_client_favorites_provider ON public.client_favorites(provider_id);
CREATE INDEX idx_client_favorites_status   ON public.client_favorites(status);

-- 2. RLS
ALTER TABLE public.client_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client voit ses favoris"
  ON public.client_favorites FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Client crée une demande de favori"
  ON public.client_favorites FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Client peut retirer son favori"
  ON public.client_favorites FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Prestataire voit ses demandes de favori"
  ON public.client_favorites FOR SELECT
  USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin voit tous les favoris"
  ON public.client_favorites FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_client_favorites_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_client_favorites_updated_at
  BEFORE UPDATE ON public.client_favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_client_favorites_updated_at();

-- 4. Trigger : quand un prestataire accepte → tenter de créer/mettre à jour un binôme
CREATE OR REPLACE FUNCTION public.on_favorite_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id    UUID := NEW.client_id;
  v_provider_id  UUID := NEW.provider_id;
  fav1           RECORD;
  fav2           RECORD;
  existing_binome UUID;
BEGIN
  -- Seulement quand le prestataire passe à 'accepted'
  IF NEW.provider_status = 'accepted' AND OLD.provider_status <> 'accepted' THEN
    -- Marquer le statut global comme actif
    NEW.status := 'active';

    -- Chercher tous les favoris actifs de ce client (y compris celui-ci)
    SELECT id, provider_id INTO fav1
    FROM public.client_favorites
    WHERE client_id = v_client_id
      AND status = 'active'
      AND provider_id != v_provider_id
    ORDER BY created_at
    LIMIT 1;

    -- Si on a déjà un autre favori actif → créer ou mettre à jour le binôme
    IF fav1 IS NOT NULL THEN
      -- Vérifier si un binôme actif existe déjà pour ce client
      SELECT id INTO existing_binome
      FROM public.binomes
      WHERE client_id = v_client_id
        AND status IN ('active', 'pending')
      LIMIT 1;

      IF existing_binome IS NOT NULL THEN
        -- Mettre à jour le backup avec le nouveau favori
        UPDATE public.binomes
        SET
          backup_provider_id = v_provider_id,
          status             = 'active',
          updated_at         = NOW()
        WHERE id = existing_binome;
      ELSE
        -- Créer un nouveau binôme (fav1 = primary, nouveau = backup)
        INSERT INTO public.binomes (
          client_id,
          primary_provider_id,
          backup_provider_id,
          status,
          compatibility_score,
          notes
        ) VALUES (
          v_client_id,
          fav1.provider_id,
          v_provider_id,
          'active',
          75,
          'Créé automatiquement après acceptation mutuelle'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_favorite_accepted
  BEFORE UPDATE OF provider_status ON public.client_favorites
  FOR EACH ROW EXECUTE FUNCTION public.on_favorite_accepted();

-- 5. RPC : obtenir les favoris actifs d'un client pour l'assignation
CREATE OR REPLACE FUNCTION public.get_client_active_favorites(
  p_client_id   UUID,
  p_service_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  provider_id  UUID,
  rating       NUMERIC,
  is_verified  BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id          AS provider_id,
    p.rating,
    p.is_verified
  FROM public.client_favorites cf
  JOIN public.providers p ON p.id = cf.provider_id
  WHERE cf.client_id   = p_client_id
    AND cf.status      = 'active'
    AND p.is_verified  = true
    AND p.status       = 'active'
  ORDER BY p.rating DESC NULLS LAST;
$$;
