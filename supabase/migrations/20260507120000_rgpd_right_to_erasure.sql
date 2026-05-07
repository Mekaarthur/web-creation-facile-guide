-- ============================================================
-- RGPD Article 17 — Droit à l'effacement (droit à l'oubli)
-- ============================================================

-- 1. Table des demandes de suppression
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  reason       text,
  status       text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cancelled', 'completed')),
  cancelled_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can manage own deletion request"
  ON public.account_deletion_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all deletion requests"
  ON public.account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fonction principale d'anonymisation et suppression
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.anonymize_and_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anon_email text := 'deleted_' || p_user_id || '@deleted.bikawo.com';
  v_anon_name  text := '[Compte supprimé]';
BEGIN
  -- Anonymiser le profil (conserver pour historique comptable)
  UPDATE public.profiles SET
    first_name  = v_anon_name,
    last_name   = '',
    phone       = NULL,
    avatar_url  = NULL,
    address     = NULL
  WHERE user_id = p_user_id;

  -- Anonymiser les réservations (conserver pour obligations légales comptables)
  UPDATE public.bookings SET
    client_notes = NULL,
    address      = '[Adresse supprimée]'
  WHERE client_id = p_user_id;

  -- Anonymiser les messages
  UPDATE public.chat_messages SET
    content = '[Message supprimé - compte effacé]'
  WHERE sender_id = p_user_id;

  -- Anonymiser les avis
  UPDATE public.reviews SET
    comment = '[Avis supprimé - compte effacé]'
  WHERE client_id = p_user_id;

  -- Supprimer les consentements (aucune obligation de les garder)
  DELETE FROM public.user_consents WHERE user_id = p_user_id;

  -- Supprimer les exports RGPD
  DELETE FROM public.gdpr_exports WHERE user_id = p_user_id;

  -- Supprimer les sessions actives (table subscribers/notifications)
  DELETE FROM public.subscribers WHERE user_id = p_user_id;

  -- Marquer la demande comme complétée
  UPDATE public.account_deletion_requests SET
    status       = 'completed',
    completed_at = now()
  WHERE user_id = p_user_id AND status = 'pending';

  -- Logger l'action pour conformité
  INSERT INTO public.action_history (
    entity_type, entity_id, action_type, new_value, admin_comment
  ) VALUES (
    'rgpd_erasure',
    p_user_id,
    'account_anonymized',
    jsonb_build_object('user_id', p_user_id, 'completed_at', now()),
    'RGPD Art.17 - Compte anonymisé sur demande utilisateur'
  );
END;
$$;

-- 3. Fonction pour demander la suppression (appelée par le client)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_request_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Annuler toute demande pending existante et en créer une nouvelle
  UPDATE public.account_deletion_requests
    SET status = 'cancelled', cancelled_at = now()
  WHERE user_id = v_user_id AND status = 'pending';

  INSERT INTO public.account_deletion_requests (user_id, reason)
  VALUES (v_user_id, p_reason)
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- 4. Fonction pour annuler une demande (droit de rétractation 30 jours)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_count   int;
BEGIN
  UPDATE public.account_deletion_requests SET
    status       = 'cancelled',
    cancelled_at = now()
  WHERE user_id = v_user_id
    AND status   = 'pending'
    AND scheduled_at > now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- 5. Vue admin pour suivre les demandes en attente
-- --------------------------------------------------------
CREATE OR REPLACE VIEW public.pending_deletions AS
SELECT
  r.id,
  r.user_id,
  r.requested_at,
  r.scheduled_at,
  r.reason,
  p.first_name,
  p.last_name
FROM public.account_deletion_requests r
LEFT JOIN public.profiles p ON p.user_id = r.user_id
WHERE r.status = 'pending'
ORDER BY r.scheduled_at ASC;

GRANT SELECT ON public.pending_deletions TO authenticated;
