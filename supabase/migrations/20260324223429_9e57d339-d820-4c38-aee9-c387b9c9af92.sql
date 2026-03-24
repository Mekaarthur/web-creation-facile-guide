-- Add unique constraint on provider_services for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_services_provider_id_service_id_key'
  ) THEN
    ALTER TABLE public.provider_services ADD CONSTRAINT provider_services_provider_id_service_id_key UNIQUE (provider_id, service_id);
  END IF;
END $$;
