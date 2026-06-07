-- ============================================================
-- Migration: bookings table — provider_id nullable + statuts étendus
--
-- Contexte: Un booking peut être créé sans prestataire assigné
-- (status = 'pending_provider') quand aucun prestataire vérifié
-- n'est disponible au moment du paiement. L'admin assigne ensuite
-- manuellement ou un algorithme de matching retente.
--
-- Cette migration ajoute également les statuts 'refunded' et
-- 'disputed' utilisés par le webhook Stripe mais absents du schéma.
-- ============================================================

-- 1. Rendre provider_id nullable
--    Les bookings en 'pending_provider' n'ont pas de prestataire assigné.
ALTER TABLE public.bookings
  ALTER COLUMN provider_id DROP NOT NULL;

-- 2. Supprimer l'éventuel CHECK sur status (nom inconnu → IF EXISTS)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 3. Nouveau CHECK status — toutes les valeurs utilisées dans le code
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'refunded',
    'disputed',
    'pending_provider',
    'pending_urssaf'
  ));

-- 4. Contrainte de cohérence provider_id ↔ status
--    pending_provider → provider_id IS NULL (pas encore assigné)
--    tous les autres statuts → provider_id IS NOT NULL (prestataire requis)
--
--    Sûr sur les données existantes : tous les bookings actuels ont
--    provider_id IS NOT NULL et status != 'pending_provider'.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_provider_status_consistency
  CHECK (
    (status = 'pending_provider' AND provider_id IS NULL)
    OR
    (status != 'pending_provider' AND provider_id IS NOT NULL)
  );

-- 5. Index pour le suivi admin des bookings sans prestataire
CREATE INDEX IF NOT EXISTS idx_bookings_pending_provider
  ON public.bookings (created_at DESC)
  WHERE status = 'pending_provider';
