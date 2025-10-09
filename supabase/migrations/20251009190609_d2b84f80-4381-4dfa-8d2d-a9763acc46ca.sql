-- Adapt existing missions table for intelligent matching
ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS match_score NUMERIC,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create missing indices
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_expires_at ON public.missions(expires_at);

-- Enable RLS if not already enabled
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Create missing policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'missions' 
    AND policyname = 'Providers can view their assigned missions'
  ) THEN
    CREATE POLICY "Providers can view their assigned missions"
      ON public.missions
      FOR SELECT
      TO authenticated
      USING (
        assigned_provider_id IN (
          SELECT id FROM public.providers WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'missions' 
    AND policyname = 'Providers can update their mission responses'
  ) THEN
    CREATE POLICY "Providers can update their mission responses"
      ON public.missions
      FOR UPDATE
      TO authenticated
      USING (
        assigned_provider_id IN (
          SELECT id FROM public.providers WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        assigned_provider_id IN (
          SELECT id FROM public.providers WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create function to check and activate backup providers
CREATE OR REPLACE FUNCTION public.check_mission_timeouts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER := 0;
  mission_record RECORD;
  backup_mission RECORD;
BEGIN
  FOR mission_record IN
    SELECT m.*, cr.service_type, cr.location
    FROM public.missions m
    JOIN public.client_requests cr ON cr.id = m.client_request_id
    WHERE m.status = 'pending'
      AND m.expires_at < now()
      AND m.responded_at IS NULL
  LOOP
    UPDATE public.missions
    SET status = 'timeout', updated_at = now()
    WHERE id = mission_record.id;
    
    expired_count := expired_count + 1;
    
    SELECT * INTO backup_mission
    FROM public.missions
    WHERE client_request_id = mission_record.client_request_id
      AND status = 'backup'
      AND priority > mission_record.priority
    ORDER BY priority ASC
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE public.missions
      SET 
        status = 'pending',
        assigned_at = now(),
        expires_at = now() + INTERVAL '30 minutes',
        updated_at = now()
      WHERE id = backup_mission.id;
      
      INSERT INTO public.provider_notifications (
        provider_id,
        title,
        message,
        type,
        created_at
      ) VALUES (
        backup_mission.assigned_provider_id,
        '🔥 Mission urgente activée',
        CONCAT('Mission ', mission_record.service_type, ' à ', mission_record.location, ' vous a été assignée suite à un timeout.'),
        'backup_activated',
        now()
      );
    ELSE
      INSERT INTO public.realtime_notifications (
        user_id,
        type,
        title,
        message,
        priority,
        created_at
      )
      SELECT 
        ur.user_id,
        'mission_failed',
        '⚠️ Mission sans prestataire',
        CONCAT('La mission ', mission_record.service_type, ' à ', mission_record.location, ' n''a trouvé aucun prestataire disponible.'),
        'high',
        now()
      FROM public.user_roles ur
      WHERE ur.role = 'admin'::app_role;
    END IF;
  END LOOP;
  
  RETURN expired_count;
END;
$$;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_missions_updated_at'
  ) THEN
    CREATE TRIGGER update_missions_updated_at
      BEFORE UPDATE ON public.missions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;