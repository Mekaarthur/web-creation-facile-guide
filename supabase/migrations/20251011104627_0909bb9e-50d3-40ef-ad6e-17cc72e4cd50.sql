-- ============================================
-- MIGRATION: Gestion Binômes + Bulk Assignment
-- Priorité: HAUTE
-- ============================================

-- 1. Créer la table binomes
CREATE TABLE IF NOT EXISTS public.binomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  backup_provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dissolved', 'mediating', 'pending')),
  compatibility_score NUMERIC DEFAULT 0 CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  missions_count INTEGER DEFAULT 0,
  successful_missions INTEGER DEFAULT 0,
  failed_missions INTEGER DEFAULT 0,
  last_mission_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dissolved_at TIMESTAMPTZ,
  dissolution_reason TEXT,
  notes TEXT,
  CONSTRAINT different_providers CHECK (primary_provider_id != backup_provider_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_binomes_client_id ON public.binomes(client_id);
CREATE INDEX idx_binomes_primary_provider ON public.binomes(primary_provider_id);
CREATE INDEX idx_binomes_backup_provider ON public.binomes(backup_provider_id);
CREATE INDEX idx_binomes_status ON public.binomes(status);

-- Activer RLS
ALTER TABLE public.binomes ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Admin peut tout voir sur binomes"
  ON public.binomes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin peut créer binomes"
  ON public.binomes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin peut modifier binomes"
  ON public.binomes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin peut supprimer binomes"
  ON public.binomes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Client peut voir son binome"
  ON public.binomes FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Prestataires peuvent voir leurs binomes"
  ON public.binomes FOR SELECT
  USING (
    primary_provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    OR backup_provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

-- Table historique des binomes
CREATE TABLE IF NOT EXISTS public.binomes_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binome_id UUID NOT NULL REFERENCES public.binomes(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- created, modified, dissolved, mediating
  old_data JSONB,
  new_data JSONB,
  performed_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_binomes_history_binome_id ON public.binomes_history(binome_id);

ALTER TABLE public.binomes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin peut voir historique binomes"
  ON public.binomes_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin peut créer historique binomes"
  ON public.binomes_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Table médiations
CREATE TABLE IF NOT EXISTS public.mediations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binome_id UUID NOT NULL REFERENCES public.binomes(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'escalated')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mediations_binome_id ON public.mediations(binome_id);
CREATE INDEX idx_mediations_status ON public.mediations(status);

ALTER TABLE public.mediations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin peut gérer médiations"
  ON public.mediations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FONCTIONS RPC GESTION BINÔMES
-- ============================================

-- 1. Analyser performance d'un binôme
CREATE OR REPLACE FUNCTION public.analyze_binome_performance(p_binome_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  binome_data RECORD;
  success_rate NUMERIC;
  avg_rating NUMERIC;
BEGIN
  -- Récupérer les données du binôme
  SELECT * INTO binome_data
  FROM public.binomes
  WHERE id = p_binome_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Binôme non trouvé');
  END IF;
  
  -- Calculer le taux de succès
  IF binome_data.missions_count > 0 THEN
    success_rate := (binome_data.successful_missions::NUMERIC / binome_data.missions_count::NUMERIC) * 100;
  ELSE
    success_rate := 0;
  END IF;
  
  -- Calculer la note moyenne des prestataires du binôme
  SELECT AVG(rating) INTO avg_rating
  FROM public.providers
  WHERE id IN (binome_data.primary_provider_id, binome_data.backup_provider_id);
  
  result := jsonb_build_object(
    'binome_id', p_binome_id,
    'compatibility_score', COALESCE(binome_data.compatibility_score, 0),
    'missions_count', binome_data.missions_count,
    'successful_missions', binome_data.successful_missions,
    'failed_missions', binome_data.failed_missions,
    'success_rate', ROUND(success_rate, 2),
    'average_rating', ROUND(COALESCE(avg_rating, 0), 2),
    'status', binome_data.status,
    'last_mission_date', binome_data.last_mission_date,
    'days_since_last_mission', 
      CASE 
        WHEN binome_data.last_mission_date IS NOT NULL 
        THEN EXTRACT(DAY FROM NOW() - binome_data.last_mission_date)
        ELSE NULL 
      END
  );
  
  RETURN result;
END;
$$;

-- 2. Créer un binôme
CREATE OR REPLACE FUNCTION public.create_binome(
  p_client_id UUID,
  p_primary_provider_id UUID,
  p_backup_provider_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_binome_id UUID;
BEGIN
  -- Vérifier que les prestataires sont différents
  IF p_primary_provider_id = p_backup_provider_id THEN
    RAISE EXCEPTION 'Le prestataire principal et le backup doivent être différents';
  END IF;
  
  -- Vérifier que les prestataires existent et sont vérifiés
  IF NOT EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = p_primary_provider_id AND is_verified = true
  ) THEN
    RAISE EXCEPTION 'Prestataire principal non trouvé ou non vérifié';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = p_backup_provider_id AND is_verified = true
  ) THEN
    RAISE EXCEPTION 'Prestataire backup non trouvé ou non vérifié';
  END IF;
  
  -- Créer le binôme
  INSERT INTO public.binomes (
    client_id,
    primary_provider_id,
    backup_provider_id,
    notes,
    status
  ) VALUES (
    p_client_id,
    p_primary_provider_id,
    p_backup_provider_id,
    p_notes,
    'active'
  ) RETURNING id INTO new_binome_id;
  
  -- Logger l'action
  INSERT INTO public.binomes_history (
    binome_id,
    action_type,
    new_data,
    performed_by,
    notes
  ) VALUES (
    new_binome_id,
    'created',
    jsonb_build_object(
      'client_id', p_client_id,
      'primary_provider_id', p_primary_provider_id,
      'backup_provider_id', p_backup_provider_id
    ),
    auth.uid(),
    'Binôme créé par admin'
  );
  
  RETURN new_binome_id;
END;
$$;

-- 3. Voir historique d'un binôme
CREATE OR REPLACE FUNCTION public.get_binome_history(p_binome_id UUID)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    action_type,
    old_data,
    new_data,
    performed_by,
    notes,
    created_at
  FROM public.binomes_history
  WHERE binome_id = p_binome_id
  ORDER BY created_at DESC;
$$;

-- 4. Changer le backup d'un binôme
CREATE OR REPLACE FUNCTION public.change_backup_provider(
  p_binome_id UUID,
  p_new_backup_provider_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_backup_id UUID;
  primary_id UUID;
BEGIN
  -- Récupérer les IDs actuels
  SELECT backup_provider_id, primary_provider_id 
  INTO old_backup_id, primary_id
  FROM public.binomes
  WHERE id = p_binome_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Binôme non trouvé';
  END IF;
  
  -- Vérifier que le nouveau backup est différent du principal
  IF p_new_backup_provider_id = primary_id THEN
    RAISE EXCEPTION 'Le backup ne peut pas être le même que le prestataire principal';
  END IF;
  
  -- Vérifier que le nouveau prestataire existe et est vérifié
  IF NOT EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = p_new_backup_provider_id AND is_verified = true
  ) THEN
    RAISE EXCEPTION 'Nouveau prestataire backup non trouvé ou non vérifié';
  END IF;
  
  -- Mettre à jour le binôme
  UPDATE public.binomes
  SET 
    backup_provider_id = p_new_backup_provider_id,
    updated_at = NOW()
  WHERE id = p_binome_id;
  
  -- Logger l'action
  INSERT INTO public.binomes_history (
    binome_id,
    action_type,
    old_data,
    new_data,
    performed_by,
    notes
  ) VALUES (
    p_binome_id,
    'backup_changed',
    jsonb_build_object('backup_provider_id', old_backup_id),
    jsonb_build_object('backup_provider_id', p_new_backup_provider_id),
    auth.uid(),
    'Changement de prestataire backup'
  );
  
  RETURN TRUE;
END;
$$;

-- 5. Recruter un nouveau backup (marquer comme recherche en cours)
CREATE OR REPLACE FUNCTION public.recruit_backup_provider(p_binome_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marquer le binôme comme en recherche de backup
  UPDATE public.binomes
  SET 
    status = 'pending',
    notes = CONCAT(COALESCE(notes, ''), E'\n', 'Recherche de nouveau backup - ', NOW()::TEXT),
    updated_at = NOW()
  WHERE id = p_binome_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Binôme non trouvé';
  END IF;
  
  -- Logger l'action
  INSERT INTO public.binomes_history (
    binome_id,
    action_type,
    new_data,
    performed_by,
    notes
  ) VALUES (
    p_binome_id,
    'recruiting_backup',
    jsonb_build_object('status', 'pending'),
    auth.uid(),
    'Lancement du recrutement d''un nouveau backup'
  );
  
  -- Notifier les admins
  INSERT INTO public.realtime_notifications (
    user_id,
    type,
    title,
    message,
    priority
  )
  SELECT 
    ur.user_id,
    'backup_recruitment',
    'Recrutement backup nécessaire',
    'Un binôme nécessite un nouveau prestataire backup',
    'normal'
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
  
  RETURN TRUE;
END;
$$;

-- 6. Marquer un binôme comme traité
CREATE OR REPLACE FUNCTION public.mark_binome_resolved(
  p_binome_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.binomes
  SET 
    status = 'active',
    notes = CONCAT(COALESCE(notes, ''), E'\n', 'Résolu: ', COALESCE(p_resolution_notes, 'Aucune note')),
    updated_at = NOW()
  WHERE id = p_binome_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Binôme non trouvé';
  END IF;
  
  -- Logger l'action
  INSERT INTO public.binomes_history (
    binome_id,
    action_type,
    new_data,
    performed_by,
    notes
  ) VALUES (
    p_binome_id,
    'resolved',
    jsonb_build_object('status', 'active'),
    auth.uid(),
    p_resolution_notes
  );
  
  RETURN TRUE;
END;
$$;

-- 7. Redistribuer les missions d'un binôme (réassigner au backup)
CREATE OR REPLACE FUNCTION public.redistribute_binome_missions(p_binome_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  binome_data RECORD;
  redistributed_count INTEGER := 0;
BEGIN
  -- Récupérer les données du binôme
  SELECT * INTO binome_data
  FROM public.binomes
  WHERE id = p_binome_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Binôme non trouvé';
  END IF;
  
  -- Réassigner les missions du principal au backup
  UPDATE public.bookings
  SET 
    provider_id = binome_data.backup_provider_id,
    updated_at = NOW()
  WHERE provider_id = binome_data.primary_provider_id
    AND client_id = binome_data.client_id
    AND status IN ('pending', 'assigned', 'confirmed');
  
  GET DIAGNOSTICS redistributed_count = ROW_COUNT;
  
  -- Logger l'action
  INSERT INTO public.binomes_history (
    binome_id,
    action_type,
    new_data,
    performed_by,
    notes
  ) VALUES (
    p_binome_id,
    'redistributed',
    jsonb_build_object('missions_redistributed', redistributed_count),
    auth.uid(),
    CONCAT(redistributed_count, ' missions redistribuées au backup')
  );
  
  RETURN redistributed_count;
END;
$$;

-- 8. Lancer une médiation
CREATE OR REPLACE FUNCTION public.initiate_mediation(
  p_binome_id UUID,
  p_reason TEXT,
  p_priority TEXT DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mediation_id UUID;
BEGIN
  -- Vérifier que le binôme existe
  IF NOT EXISTS (SELECT 1 FROM public.binomes WHERE id = p_binome_id) THEN
    RAISE EXCEPTION 'Binôme non trouvé';
  END IF;
  
  -- Mettre à jour le statut du binôme
  UPDATE public.binomes
  SET 
    status = 'mediating',
    updated_at = NOW()
  WHERE id = p_binome_id;
  
  -- Créer la médiation
  INSERT INTO public.mediations (
    binome_id,
    reason,
    priority,
    status,
    assigned_to
  ) VALUES (
    p_binome_id,
    p_reason,
    p_priority,
    'pending',
    auth.uid()
  ) RETURNING id INTO mediation_id;
  
  -- Logger l'action
  INSERT INTO public.binomes_history (
    binome_id,
    action_type,
    new_data,
    performed_by,
    notes
  ) VALUES (
    p_binome_id,
    'mediation_initiated',
    jsonb_build_object('mediation_id', mediation_id, 'reason', p_reason),
    auth.uid(),
    'Médiation lancée'
  );
  
  RETURN mediation_id;
END;
$$;

-- 9. Dissoudre un binôme
CREATE OR REPLACE FUNCTION public.dissolve_binome(
  p_binome_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour le binôme
  UPDATE public.binomes
  SET 
    status = 'dissolved',
    dissolved_at = NOW(),
    dissolution_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_binome_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Binôme non trouvé';
  END IF;
  
  -- Logger l'action
  INSERT INTO public.binomes_history (
    binome_id,
    action_type,
    old_data,
    new_data,
    performed_by,
    notes
  ) VALUES (
    p_binome_id,
    'dissolved',
    jsonb_build_object('status', 'active'),
    jsonb_build_object('status', 'dissolved', 'reason', p_reason),
    auth.uid(),
    p_reason
  );
  
  RETURN TRUE;
END;
$$;

-- 10. Algorithme de matching intelligent (basique pour MVP)
CREATE OR REPLACE FUNCTION public.match_providers_for_client(
  p_client_id UUID,
  p_service_type TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE (
  primary_provider_id UUID,
  backup_provider_id UUID,
  compatibility_score NUMERIC,
  reasoning TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_providers AS (
    SELECT 
      p.id,
      p.business_name,
      p.rating,
      p.missions_completed,
      p.location,
      -- Score de compatibilité basé sur plusieurs critères
      (
        COALESCE(p.rating, 0) * 20 +  -- Note sur 5 * 20 = 100 max
        LEAST(p.missions_completed * 2, 30) +  -- Expérience (max 30 points)
        CASE WHEN p.location = p_location THEN 20 ELSE 0 END +  -- Localisation
        CASE WHEN p.acceptance_rate >= 80 THEN 15 ELSE 0 END  -- Taux acceptation
      ) AS score,
      ROW_NUMBER() OVER (ORDER BY 
        p.rating DESC,
        p.missions_completed DESC,
        p.acceptance_rate DESC
      ) AS rank
    FROM public.providers p
    WHERE p.is_verified = true
      AND p.status = 'active'
      AND (p_service_type IS NULL OR p.description ILIKE '%' || p_service_type || '%')
      AND NOT EXISTS (
        -- Exclure les prestataires déjà dans un binôme actif avec ce client
        SELECT 1 FROM public.binomes b
        WHERE b.client_id = p_client_id
          AND (b.primary_provider_id = p.id OR b.backup_provider_id = p.id)
          AND b.status = 'active'
      )
  )
  SELECT 
    p1.id AS primary_provider_id,
    p2.id AS backup_provider_id,
    ROUND((p1.score + p2.score) / 2, 2) AS compatibility_score,
    CONCAT(
      'Principal: ', p1.business_name, ' (Note: ', p1.rating, ', Missions: ', p1.missions_completed, ') | ',
      'Backup: ', p2.business_name, ' (Note: ', p2.rating, ', Missions: ', p2.missions_completed, ')'
    ) AS reasoning
  FROM ranked_providers p1
  CROSS JOIN ranked_providers p2
  WHERE p1.rank = 1  -- Meilleur prestataire comme principal
    AND p2.rank = 2  -- Deuxième meilleur comme backup
    AND p1.id != p2.id
  LIMIT 1;
END;
$$;

-- ============================================
-- FONCTIONS RPC BULK ASSIGNMENT
-- ============================================

-- 11. Bulk assign missions (assigner plusieurs missions d'un coup)
CREATE OR REPLACE FUNCTION public.bulk_assign_missions(p_mission_ids UUID[])
RETURNS TABLE (
  mission_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mission_id_item UUID;
  assigned_count INTEGER := 0;
BEGIN
  -- Vérifier les permissions admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent faire des assignations en masse';
  END IF;
  
  -- Boucler sur chaque mission
  FOREACH mission_id_item IN ARRAY p_mission_ids
  LOOP
    BEGIN
      -- Utiliser la fonction existante assign_mission_manually
      PERFORM public.assign_mission_manually(
        mission_id_item,
        (
          SELECT assigned_provider_id 
          FROM public.missions 
          WHERE id = mission_id_item
          LIMIT 1
        ),
        auth.uid()
      );
      
      assigned_count := assigned_count + 1;
      
      RETURN QUERY SELECT mission_id_item, TRUE, NULL::TEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Logger l'erreur mais continuer
      RETURN QUERY SELECT mission_id_item, FALSE, SQLERRM;
    END;
  END LOOP;
  
  -- Logger l'action globale
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    new_data,
    description
  ) VALUES (
    auth.uid(),
    'missions',
    p_mission_ids[1],  -- Première mission comme référence
    'bulk_assignment',
    jsonb_build_object(
      'total_missions', array_length(p_mission_ids, 1),
      'assigned_count', assigned_count
    ),
    CONCAT('Assignation en masse de ', assigned_count, ' missions')
  );
END;
$$;

-- 12. Reset mission queue (réinitialiser la file d'attente)
CREATE OR REPLACE FUNCTION public.reset_mission_queue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  -- Vérifier les permissions admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent réinitialiser la queue';
  END IF;
  
  -- Réinitialiser les missions timeout ou en échec
  UPDATE public.missions
  SET 
    status = 'pending',
    assigned_at = NULL,
    expires_at = NOW() + INTERVAL '30 minutes',
    updated_at = NOW()
  WHERE status IN ('timeout', 'backup')
    AND responded_at IS NULL;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  -- Logger l'action
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    new_data,
    description
  ) VALUES (
    auth.uid(),
    'missions_queue',
    gen_random_uuid(),
    'queue_reset',
    jsonb_build_object('reset_count', reset_count),
    CONCAT('Reset de ', reset_count, ' missions dans la queue')
  );
  
  RETURN reset_count;
END;
$$;

-- Trigger pour mettre à jour updated_at sur binomes
CREATE OR REPLACE FUNCTION public.update_binome_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_binome_updated_at
  BEFORE UPDATE ON public.binomes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_binome_updated_at();