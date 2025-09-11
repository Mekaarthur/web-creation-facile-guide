-- Create attestations table for client certificates (crédit d'impôt & CAF)
CREATE TABLE IF NOT EXISTS public.attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit_impot','caf')),
  year INTEGER NOT NULL,
  month INTEGER,
  amount NUMERIC NOT NULL DEFAULT 0,
  service_type TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;

-- Policies: clients manage/view their own attestations
CREATE POLICY "Clients can view their attestations"
ON public.attestations FOR SELECT
USING (client_id = auth.uid());

CREATE POLICY "Clients can insert their attestations"
ON public.attestations FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their attestations"
ON public.attestations FOR UPDATE
USING (client_id = auth.uid());

-- Timestamp trigger
CREATE TRIGGER update_attestations_updated_at
BEFORE UPDATE ON public.attestations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_attestations_client ON public.attestations (client_id);
CREATE INDEX IF NOT EXISTS idx_attestations_client_year_type ON public.attestations (client_id, year, type);

-- Create private storage bucket for attestations (if not exists)
INSERT INTO storage.buckets (id, name, public)
SELECT 'attestations', 'attestations', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attestations');

-- Storage policies for attestations bucket
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view their own attestation files'
  ) THEN
    CREATE POLICY "Users can view their own attestation files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'attestations' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own attestation files'
  ) THEN
    CREATE POLICY "Users can upload their own attestation files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'attestations' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own attestation files'
  ) THEN
    CREATE POLICY "Users can update their own attestation files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'attestations' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;