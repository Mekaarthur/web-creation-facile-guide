-- ============================================================
-- URSSAF : déclencheur automatique + cron check-expirations
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Bug 4 : Créer automatiquement une déclaration URSSAF
--         quand une mission passe à 'completed'
--         ET que le client a l'avance immédiate active
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_create_urssaf_declaration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email          TEXT;
  v_first_name     TEXT;
  v_last_name      TEXT;
  v_avance_active  BOOLEAN;
  v_total          NUMERIC;
BEGIN
  -- Ne s'exécute que quand le statut passe à 'completed'
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Récupérer les infos du client
  SELECT
    p.email,
    p.first_name,
    p.last_name,
    COALESCE(p.avance_immediate_active, false)
  INTO v_email, v_first_name, v_last_name, v_avance_active
  FROM public.profiles p
  WHERE p.user_id = NEW.client_id;

  -- Ne créer une déclaration que si l'avance immédiate est active
  IF NOT v_avance_active THEN
    RETURN NEW;
  END IF;

  -- Éviter les doublons (une déclaration par réservation)
  IF EXISTS (
    SELECT 1 FROM public.urssaf_declarations WHERE booking_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  v_total := COALESCE(NEW.total_price, 0);

  INSERT INTO public.urssaf_declarations (
    booking_id,
    provider_id,
    client_email,
    client_name,
    total_amount,
    client_amount,
    state_amount,
    status,
    client_validation_deadline
  ) VALUES (
    NEW.id,
    NEW.provider_id,
    COALESCE(v_email, ''),
    TRIM(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, '')),
    v_total,
    ROUND(v_total * 0.5, 2),
    ROUND(v_total * 0.5, 2),
    'pending',
    NOW() + INTERVAL '48 hours'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_urssaf_declaration ON public.bookings;
CREATE TRIGGER trg_auto_create_urssaf_declaration
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_urssaf_declaration();

-- ────────────────────────────────────────────────────────────
-- Bug 5 : Cron horaire pour check-urssaf-expirations
--         Nécessite l'extension pg_cron (activée dans Supabase
--         via Dashboard → Database → Extensions → pg_cron)
--         et pg_net pour les appels HTTP.
--
--         Remplace <PROJECT_REF> par ton identifiant Supabase
--         et <SERVICE_ROLE_KEY> par la clé service role.
--         Ces valeurs se trouvent dans :
--         Dashboard → Project Settings → API
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Supprimer le job existant s'il y en a un
    PERFORM cron.unschedule('check-urssaf-expirations-hourly')
    FROM cron.job
    WHERE jobname = 'check-urssaf-expirations-hourly';

    -- Planifier toutes les heures (minute 0)
    PERFORM cron.schedule(
      'check-urssaf-expirations-hourly',
      '0 * * * *',
      $cron$
        SELECT net.http_post(
          url        := current_setting('app.supabase_url', true) || '/functions/v1/check-urssaf-expirations',
          headers    := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
          ),
          body       := '{}'::jsonb
        ) AS request_id;
      $cron$
    );
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- Configuration des paramètres pour le cron
-- À exécuter une seule fois après avoir obtenu les valeurs
-- dans Dashboard → Project Settings → API
--
-- ALTER DATABASE postgres SET app.supabase_url = 'https://XXXXX.supabase.co';
-- ALTER DATABASE postgres SET app.supabase_service_role_key = 'eyJ...';
-- ────────────────────────────────────────────────────────────
