-- Renommer les tables pour un langage métier français
ALTER TABLE provider_responses RENAME TO candidatures_prestataires;
ALTER TABLE mission_assignments RENAME TO missions;

-- Ajouter les nouveaux champs pour l'attribution manuelle
ALTER TABLE missions 
ADD COLUMN assigned_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_assignment_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN admin_user_id UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Ajouter les nouveaux statuts pour les demandes clients
-- Modifier les contraintes existantes pour inclure les nouveaux statuts
ALTER TABLE client_requests 
DROP CONSTRAINT IF EXISTS client_requests_status_check,
ADD CONSTRAINT client_requests_status_check 
CHECK (status IN ('new', 'assigned', 'confirmed', 'en_cours', 'terminee', 'cancelled', 'unmatched'));

-- Ajouter les nouveaux statuts pour les candidatures
ALTER TABLE candidatures_prestataires 
ADD CONSTRAINT candidatures_prestataires_response_type_check 
CHECK (response_type IN ('accept', 'decline', 'en_attente', 'acceptee', 'attribuee_a_un_autre'));

-- Ajouter des horodatages pour le suivi précis
ALTER TABLE client_requests 
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN finished_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Mettre à jour les politiques RLS pour les nouvelles tables
DROP POLICY IF EXISTS "Providers can view their mission assignments" ON mission_assignments;
DROP POLICY IF EXISTS "System can manage mission assignments" ON mission_assignments;
DROP POLICY IF EXISTS "Providers can insert their responses" ON provider_responses;
DROP POLICY IF EXISTS "Providers can view their responses" ON provider_responses;
DROP POLICY IF EXISTS "System can manage provider responses" ON provider_responses;

-- Politiques pour la table missions (ex mission_assignments)
CREATE POLICY "Providers can view their missions" ON missions
FOR SELECT USING (
  assigned_provider_id IN (
    SELECT id FROM providers WHERE user_id = auth.uid()
  ) OR 
  auth.uid() IN (
    SELECT providers.user_id FROM providers 
    WHERE providers.id = ANY(missions.eligible_providers)
  )
);

CREATE POLICY "System can manage missions" ON missions
FOR ALL USING (true);

CREATE POLICY "Admin can manage missions" ON missions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Politiques pour la table candidatures_prestataires (ex provider_responses)
CREATE POLICY "Providers can insert their candidatures" ON candidatures_prestataires
FOR INSERT WITH CHECK (
  provider_id IN (
    SELECT id FROM providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view their candidatures" ON candidatures_prestataires
FOR SELECT USING (
  provider_id IN (
    SELECT id FROM providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage candidatures" ON candidatures_prestataires
FOR ALL USING (true);

CREATE POLICY "Admin can view all candidatures" ON candidatures_prestataires
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Fonction pour l'attribution manuelle par l'admin
CREATE OR REPLACE FUNCTION assign_mission_manually(
  p_mission_id UUID,
  p_provider_id UUID,
  p_admin_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mission_record RECORD;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT has_role(p_admin_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Récupérer les détails de la mission
  SELECT * INTO mission_record FROM missions WHERE id = p_mission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found';
  END IF;
  
  -- Assigner le prestataire manuellement
  UPDATE missions 
  SET 
    assigned_provider_id = p_provider_id,
    assigned_by_admin = TRUE,
    admin_assignment_time = NOW(),
    admin_user_id = p_admin_user_id,
    assigned_at = NOW()
  WHERE id = p_mission_id;
  
  -- Mettre à jour le statut de la demande client
  UPDATE client_requests 
  SET 
    status = 'assigned',
    assigned_provider_id = p_provider_id,
    updated_at = NOW()
  WHERE id = mission_record.client_request_id;
  
  -- Créer une candidature acceptée pour ce prestataire
  INSERT INTO candidatures_prestataires (
    mission_assignment_id,
    provider_id,
    response_type,
    created_at
  ) VALUES (
    p_mission_id,
    p_provider_id,
    'acceptee',
    NOW()
  );
  
  -- Créer une notification pour le prestataire assigné
  INSERT INTO provider_notifications (
    provider_id,
    title,
    message,
    type,
    created_at
  ) VALUES (
    p_provider_id,
    'Mission assignée par l''administrateur',
    'Une mission vous a été directement assignée par l''équipe administrative.',
    'admin_assignment',
    NOW()
  );
  
  RETURN TRUE;
END;
$$;