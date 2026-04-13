-- Ajouter la colonne pour le document auto-entrepreneur
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS siret_document_url TEXT;