-- Allow providers to delete their own documents (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'provider_documents' 
      AND policyname = 'Providers can delete their own documents'
  ) THEN
    CREATE POLICY "Providers can delete their own documents" 
    ON public.provider_documents FOR DELETE 
    USING (
      auth.uid() = (
        SELECT providers.user_id FROM public.providers 
        WHERE providers.id = provider_documents.provider_id
      )
    );
  END IF;
END $$;