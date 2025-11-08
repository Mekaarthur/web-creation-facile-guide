-- Table pour les alertes zones
CREATE TABLE IF NOT EXISTS public.zone_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES zones_geographiques(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_providers', 'low_satisfaction', 'high_demand', 'inactive')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  current_value NUMERIC,
  threshold_value NUMERIC,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_zone_alerts_zone ON zone_alerts(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_alerts_type ON zone_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_zone_alerts_resolved ON zone_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_zone_alerts_created ON zone_alerts(created_at DESC);

-- RLS pour zone_alerts
ALTER TABLE zone_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage zone alerts" ON zone_alerts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create zone alerts" ON zone_alerts
  FOR INSERT WITH CHECK (true);

-- Vue pour les alertes actives avec détails des zones
CREATE OR REPLACE VIEW zone_alerts_with_details AS
SELECT 
  za.id,
  za.zone_id,
  za.alert_type,
  za.severity,
  za.title,
  za.message,
  za.current_value,
  za.threshold_value,
  za.is_resolved,
  za.resolved_at,
  za.resolved_by,
  za.created_at,
  za.updated_at,
  z.nom_zone,
  z.type_zone,
  z.statut,
  zs.provider_count,
  zs.client_count,
  zs.satisfaction_moyenne
FROM zone_alerts za
JOIN zones_geographiques z ON za.zone_id = z.id
LEFT JOIN zone_statistics zs ON za.zone_id = zs.id
ORDER BY 
  CASE za.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  za.created_at DESC;

-- Fonction pour vérifier et créer les alertes automatiquement
CREATE OR REPLACE FUNCTION check_and_create_zone_alerts()
RETURNS void AS $$
DECLARE
  zone_record RECORD;
  alert_exists BOOLEAN;
BEGIN
  -- Parcourir toutes les zones actives
  FOR zone_record IN 
    SELECT * FROM zone_statistics WHERE active = true
  LOOP
    -- Alerte: Moins de 3 prestataires
    IF zone_record.provider_count < 3 THEN
      -- Vérifier si l'alerte existe déjà et n'est pas résolue
      SELECT EXISTS(
        SELECT 1 FROM zone_alerts 
        WHERE zone_id = zone_record.id 
        AND alert_type = 'low_providers' 
        AND is_resolved = false
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO zone_alerts (
          zone_id,
          alert_type,
          severity,
          title,
          message,
          current_value,
          threshold_value
        ) VALUES (
          zone_record.id,
          'low_providers',
          CASE 
            WHEN zone_record.provider_count = 0 THEN 'critical'
            WHEN zone_record.provider_count = 1 THEN 'high'
            ELSE 'medium'
          END,
          'Pénurie de prestataires',
          format('La zone "%s" ne compte que %s prestataire(s). Risque de non-couverture.', 
                 zone_record.nom_zone, zone_record.provider_count),
          zone_record.provider_count,
          3
        );
      END IF;
    ELSE
      -- Résoudre l'alerte si elle existe et que le problème est réglé
      UPDATE zone_alerts 
      SET is_resolved = true, 
          resolved_at = now(),
          updated_at = now()
      WHERE zone_id = zone_record.id 
      AND alert_type = 'low_providers' 
      AND is_resolved = false;
    END IF;
    
    -- Alerte: Satisfaction < 3 étoiles
    IF zone_record.satisfaction_moyenne > 0 AND zone_record.satisfaction_moyenne < 3 THEN
      SELECT EXISTS(
        SELECT 1 FROM zone_alerts 
        WHERE zone_id = zone_record.id 
        AND alert_type = 'low_satisfaction' 
        AND is_resolved = false
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO zone_alerts (
          zone_id,
          alert_type,
          severity,
          title,
          message,
          current_value,
          threshold_value
        ) VALUES (
          zone_record.id,
          'low_satisfaction',
          CASE 
            WHEN zone_record.satisfaction_moyenne < 2 THEN 'critical'
            WHEN zone_record.satisfaction_moyenne < 2.5 THEN 'high'
            ELSE 'medium'
          END,
          'Satisfaction faible',
          format('La zone "%s" a une satisfaction de %s⭐. Action requise pour améliorer la qualité.', 
                 zone_record.nom_zone, ROUND(zone_record.satisfaction_moyenne, 1)),
          zone_record.satisfaction_moyenne,
          3
        );
      END IF;
    ELSE
      UPDATE zone_alerts 
      SET is_resolved = true, 
          resolved_at = now(),
          updated_at = now()
      WHERE zone_id = zone_record.id 
      AND alert_type = 'low_satisfaction' 
      AND is_resolved = false;
    END IF;
    
    -- Alerte: Zone inactive avec missions en attente
    IF zone_record.statut = 'inactive' AND zone_record.missions_count > 0 THEN
      SELECT EXISTS(
        SELECT 1 FROM zone_alerts 
        WHERE zone_id = zone_record.id 
        AND alert_type = 'inactive' 
        AND is_resolved = false
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO zone_alerts (
          zone_id,
          alert_type,
          severity,
          title,
          message,
          current_value,
          threshold_value
        ) VALUES (
          zone_record.id,
          'inactive',
          'high',
          'Zone inactive avec activité',
          format('La zone "%s" est inactive mais a %s missions. Réactivation recommandée.', 
                 zone_record.nom_zone, zone_record.missions_count),
          zone_record.missions_count,
          0
        );
      END IF;
    ELSE
      UPDATE zone_alerts 
      SET is_resolved = true, 
          resolved_at = now(),
          updated_at = now()
      WHERE zone_id = zone_record.id 
      AND alert_type = 'inactive' 
      AND is_resolved = false;
    END IF;
    
  END LOOP;
  
  -- Notifier les admins des nouvelles alertes critiques
  PERFORM notify_admins_critical_zone_alerts();
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier les admins des alertes critiques
CREATE OR REPLACE FUNCTION notify_admins_critical_zone_alerts()
RETURNS void AS $$
DECLARE
  admin_record RECORD;
  alert_record RECORD;
BEGIN
  -- Pour chaque alerte critique créée dans les dernières 5 minutes
  FOR alert_record IN 
    SELECT * FROM zone_alerts_with_details
    WHERE severity IN ('critical', 'high')
    AND is_resolved = false
    AND created_at > now() - interval '5 minutes'
  LOOP
    -- Notifier tous les admins
    FOR admin_record IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO realtime_notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        is_read
      ) VALUES (
        admin_record.user_id,
        'alert',
        '🚨 ' || alert_record.title,
        alert_record.message,
        jsonb_build_object(
          'zone_id', alert_record.zone_id,
          'alert_id', alert_record.id,
          'alert_type', alert_record.alert_type,
          'severity', alert_record.severity
        ),
        CASE alert_record.severity
          WHEN 'critical' THEN 'high'
          ELSE 'normal'
        END,
        false
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;