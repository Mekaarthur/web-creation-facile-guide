-- Ajouter les colonnes pour le suivi de la soumission des documents
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS documents_submitted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS documents_submitted_at timestamptz;