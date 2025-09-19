-- Add missing FK so PostgREST can infer relationship client_requests.assigned_provider_id -> providers.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_class fr ON fr.oid = c.confrelid
    WHERE r.relname = 'client_requests'
      AND fr.relname = 'providers'
      AND c.contype = 'f'
      AND c.conkey = ARRAY[
        (SELECT attnum FROM pg_attribute 
         WHERE attrelid = 'public.client_requests'::regclass 
           AND attname = 'assigned_provider_id')
      ]
  ) THEN
    ALTER TABLE public.client_requests
      ADD CONSTRAINT client_requests_assigned_provider_id_fkey
      FOREIGN KEY (assigned_provider_id)
      REFERENCES public.providers(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END$$;

-- Helpful index for filtering
CREATE INDEX IF NOT EXISTS idx_client_requests_assigned_provider_id 
  ON public.client_requests(assigned_provider_id);

-- Ensure realtime works well (optional, harmless if already set)
ALTER TABLE public.client_requests REPLICA IDENTITY FULL;
