
-- =====================================================
-- CORRECTION DES FONCTIONS SANS search_path
-- =====================================================

-- check_and_create_zone_alerts (RETURNS void)
CREATE OR REPLACE FUNCTION public.check_and_create_zone_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  zone_record RECORD;
  alert_exists BOOLEAN;
BEGIN
  FOR zone_record IN 
    SELECT * FROM zone_statistics WHERE active = true
  LOOP
    IF zone_record.provider_count < 3 THEN
      SELECT EXISTS(
        SELECT 1 FROM zone_alerts 
        WHERE zone_id = zone_record.id 
        AND alert_type = 'low_providers' 
        AND is_resolved = false
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO zone_alerts (
          zone_id, alert_type, severity, title, message, current_value, threshold_value
        ) VALUES (
          zone_record.id, 'low_providers',
          CASE 
            WHEN zone_record.provider_count = 0 THEN 'critical'
            WHEN zone_record.provider_count = 1 THEN 'high'
            ELSE 'medium'
          END,
          'Pénurie de prestataires',
          format('La zone "%s" ne compte que %s prestataire(s).', zone_record.nom_zone, zone_record.provider_count),
          zone_record.provider_count, 3
        );
      END IF;
    ELSE
      UPDATE zone_alerts 
      SET is_resolved = true, resolved_at = now(), updated_at = now()
      WHERE zone_id = zone_record.id AND alert_type = 'low_providers' AND is_resolved = false;
    END IF;
    
    IF zone_record.satisfaction_moyenne > 0 AND zone_record.satisfaction_moyenne < 3 THEN
      SELECT EXISTS(
        SELECT 1 FROM zone_alerts 
        WHERE zone_id = zone_record.id 
        AND alert_type = 'low_satisfaction' 
        AND is_resolved = false
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO zone_alerts (
          zone_id, alert_type, severity, title, message, current_value, threshold_value
        ) VALUES (
          zone_record.id, 'low_satisfaction',
          CASE 
            WHEN zone_record.satisfaction_moyenne < 2 THEN 'critical'
            WHEN zone_record.satisfaction_moyenne < 2.5 THEN 'high'
            ELSE 'medium'
          END,
          'Satisfaction faible',
          format('La zone "%s" a une satisfaction de %s⭐.', zone_record.nom_zone, ROUND(zone_record.satisfaction_moyenne, 1)),
          zone_record.satisfaction_moyenne, 3
        );
      END IF;
    ELSE
      UPDATE zone_alerts 
      SET is_resolved = true, resolved_at = now(), updated_at = now()
      WHERE zone_id = zone_record.id AND alert_type = 'low_satisfaction' AND is_resolved = false;
    END IF;
    
    IF zone_record.statut = 'inactive' AND zone_record.missions_count > 0 THEN
      SELECT EXISTS(
        SELECT 1 FROM zone_alerts 
        WHERE zone_id = zone_record.id 
        AND alert_type = 'inactive' 
        AND is_resolved = false
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO zone_alerts (
          zone_id, alert_type, severity, title, message, current_value, threshold_value
        ) VALUES (
          zone_record.id, 'inactive', 'high', 'Zone inactive avec activité',
          format('La zone "%s" est inactive mais a %s missions.', zone_record.nom_zone, zone_record.missions_count),
          zone_record.missions_count, 0
        );
      END IF;
    ELSE
      UPDATE zone_alerts 
      SET is_resolved = true, resolved_at = now(), updated_at = now()
      WHERE zone_id = zone_record.id AND alert_type = 'inactive' AND is_resolved = false;
    END IF;
  END LOOP;
  
  PERFORM notify_admins_critical_zone_alerts();
END;
$function$;

-- check_provider_zone_limit (RETURNS trigger)
CREATE OR REPLACE FUNCTION public.check_provider_zone_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  zone_count INTEGER;
  max_zones INTEGER := 5;
BEGIN
  SELECT COUNT(*) INTO zone_count
  FROM prestataire_zones
  WHERE prestataire_id = NEW.prestataire_id AND statut = 'active';
  
  IF zone_count >= max_zones THEN
    RAISE EXCEPTION 'Limite de zones atteinte. Maximum % zones actives autorisées.', max_zones;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- auto_assign_client_to_zone
CREATE OR REPLACE FUNCTION public.auto_assign_client_to_zone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  zone_record RECORD;
  client_postal_code TEXT;
BEGIN
  client_postal_code := substring(NEW.address from '\d{5}');
  
  IF client_postal_code IS NOT NULL THEN
    FOR zone_record IN 
      SELECT id FROM zones_geographiques 
      WHERE client_postal_code = ANY(codes_postaux)
    LOOP
      INSERT INTO zone_clients (zone_id, client_id)
      VALUES (zone_record.id, NEW.client_id)
      ON CONFLICT (zone_id, client_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- auto_assign_provider_to_zone
CREATE OR REPLACE FUNCTION public.auto_assign_provider_to_zone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  zone_record RECORD;
BEGIN
  FOR zone_record IN 
    SELECT id FROM zones_geographiques 
    WHERE NEW.postal_codes && codes_postaux
  LOOP
    INSERT INTO zone_prestataires (zone_id, prestataire_id)
    VALUES (zone_record.id, NEW.id)
    ON CONFLICT (zone_id, prestataire_id) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- auto_assign_zone_to_provider
CREATE OR REPLACE FUNCTION public.auto_assign_zone_to_provider()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  closest_zone_id UUID;
BEGIN
  IF NEW.zone_id IS NULL AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    SELECT id INTO closest_zone_id
    FROM zones_geographiques
    WHERE active = true
    ORDER BY 
      CASE 
        WHEN type_zone = 'ville' THEN 1
        WHEN type_zone = 'departement' THEN 2
        WHEN type_zone = 'metropole' THEN 3
        WHEN type_zone = 'region' THEN 4
        ELSE 5
      END
    LIMIT 1;
    
    NEW.zone_id := closest_zone_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- notify_admins_critical_zone_alerts
CREATE OR REPLACE FUNCTION public.notify_admins_critical_zone_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  admin_record RECORD;
  alert_record RECORD;
BEGIN
  FOR alert_record IN 
    SELECT * FROM zone_alerts_with_details
    WHERE severity IN ('critical', 'high')
    AND is_resolved = false
    AND created_at > now() - interval '5 minutes'
  LOOP
    FOR admin_record IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO realtime_notifications (
        user_id, type, title, message, data, priority, is_read
      ) VALUES (
        admin_record.user_id, 'alert', '🚨 ' || alert_record.title, alert_record.message,
        jsonb_build_object('zone_id', alert_record.zone_id, 'alert_id', alert_record.id, 
                           'alert_type', alert_record.alert_type, 'severity', alert_record.severity),
        CASE alert_record.severity WHEN 'critical' THEN 'high' ELSE 'normal' END, false
      );
    END LOOP;
  END LOOP;
END;
$function$;

-- update_prestataire_zone_stats
CREATE OR REPLACE FUNCTION public.update_prestataire_zone_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
    UPDATE prestataire_zones
    SET last_activity_at = now(), missions_count = missions_count + 1, updated_at = now()
    WHERE prestataire_id = NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$function$;
