-- Ensure provider-documents bucket exists and is public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'provider-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('provider-documents', 'provider-documents', true);
  ELSE
    -- Make sure it is public so public URLs work
    UPDATE storage.buckets SET public = true WHERE id = 'provider-documents';
  END IF;
END $$;

-- Note: Policies for storage.objects likely already exist from prior migrations.
-- Keeping this migration minimal to resolve the immediate "Bucket not found" error.
