-- Tables pour la gestion des zones (Bikawo)

-- Table zone_prestataires : Relation entre zones et prestataires
CREATE TABLE IF NOT EXISTS public.zone_prestataires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES zones_geographiques(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(zone_id, prestataire_id)
);

-- Table zone_clients : Relation entre zones et clients
CREATE TABLE IF NOT EXISTS public.zone_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES zones_geographiques(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(zone_id, client_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_zone_prestataires_zone ON zone_prestataires(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_prestataires_prestataire ON zone_prestataires(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_zone_clients_zone ON zone_clients(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_clients_client ON zone_clients(client_id);

-- Ajouter des colonnes supplémentaires à zones_geographiques
ALTER TABLE zones_geographiques 
ADD COLUMN IF NOT EXISTS villes_couvertes TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'inactive', 'test'));

-- Vue pour les statistiques des zones
CREATE OR REPLACE VIEW zone_statistics AS
SELECT 
  z.id,
  z.nom_zone,
  z.type_zone,
  z.codes_postaux,
  z.villes_couvertes,
  z.active,
  z.statut,
  z.rayon_km,
  z.responsable_id,
  z.description,
  z.created_at,
  z.updated_at,
  COUNT(DISTINCT zp.prestataire_id) as provider_count,
  COUNT(DISTINCT zc.client_id) as client_count,
  COUNT(DISTINCT b.id) as missions_count,
  COALESCE(AVG(r.rating), 0) as satisfaction_moyenne,
  COALESCE(SUM(CASE WHEN b.status = 'completed' THEN ft.client_price ELSE 0 END), 0) as ca_total
FROM zones_geographiques z
LEFT JOIN zone_prestataires zp ON z.id = zp.zone_id
LEFT JOIN zone_clients zc ON z.id = zc.zone_id
LEFT JOIN bookings b ON zp.prestataire_id = b.provider_id
LEFT JOIN reviews r ON b.id = r.booking_id
LEFT JOIN financial_transactions ft ON b.id = ft.booking_id
GROUP BY z.id, z.nom_zone, z.type_zone, z.codes_postaux, z.villes_couvertes, z.active, z.statut, z.rayon_km, z.responsable_id, z.description, z.created_at, z.updated_at;

-- RLS Policies pour zone_prestataires
ALTER TABLE zone_prestataires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage zone_prestataires" ON zone_prestataires
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can view their zones" ON zone_prestataires
  FOR SELECT USING (
    prestataire_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- RLS Policies pour zone_clients
ALTER TABLE zone_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage zone_clients" ON zone_clients
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view their zones" ON zone_clients
  FOR SELECT USING (client_id = auth.uid());

-- Fonction pour auto-assigner un prestataire à une zone basée sur son code postal
CREATE OR REPLACE FUNCTION auto_assign_provider_to_zone()
RETURNS TRIGGER AS $$
DECLARE
  zone_record RECORD;
BEGIN
  -- Pour chaque zone qui contient le code postal du prestataire
  FOR zone_record IN 
    SELECT id FROM zones_geographiques 
    WHERE NEW.postal_codes && codes_postaux
  LOOP
    -- Insérer dans zone_prestataires si pas déjà présent
    INSERT INTO zone_prestataires (zone_id, prestataire_id)
    VALUES (zone_record.id, NEW.id)
    ON CONFLICT (zone_id, prestataire_id) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour auto-assignation
DROP TRIGGER IF EXISTS trigger_auto_assign_provider_to_zone ON providers;
CREATE TRIGGER trigger_auto_assign_provider_to_zone
AFTER INSERT OR UPDATE OF postal_codes ON providers
FOR EACH ROW
EXECUTE FUNCTION auto_assign_provider_to_zone();

-- Fonction pour auto-assigner un client à une zone basée sur son adresse
CREATE OR REPLACE FUNCTION auto_assign_client_to_zone()
RETURNS TRIGGER AS $$
DECLARE
  zone_record RECORD;
  client_postal_code TEXT;
BEGIN
  -- Extraire le code postal de l'adresse du booking
  client_postal_code := substring(NEW.address from '\d{5}');
  
  IF client_postal_code IS NOT NULL THEN
    -- Pour chaque zone qui contient ce code postal
    FOR zone_record IN 
      SELECT id FROM zones_geographiques 
      WHERE client_postal_code = ANY(codes_postaux)
    LOOP
      -- Insérer dans zone_clients si pas déjà présent
      INSERT INTO zone_clients (zone_id, client_id)
      VALUES (zone_record.id, NEW.client_id)
      ON CONFLICT (zone_id, client_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour auto-assignation client
DROP TRIGGER IF EXISTS trigger_auto_assign_client_to_zone ON bookings;
CREATE TRIGGER trigger_auto_assign_client_to_zone
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION auto_assign_client_to_zone();