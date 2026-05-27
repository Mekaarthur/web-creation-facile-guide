-- Table pour gérer les indisponibilités des prestataires (congés, arrêts, etc.)
CREATE TABLE IF NOT EXISTS public.provider_absences (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID        NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  reason      TEXT        NOT NULL DEFAULT 'autre'
                          CHECK (reason IN ('vacances','maladie','formation','personnel','autre')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.provider_absences ENABLE ROW LEVEL SECURITY;

-- Prestataire : lecture/écriture sur ses propres absences
CREATE POLICY "Providers manage their own absences"
ON public.provider_absences
FOR ALL
TO authenticated
USING (
  provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
)
WITH CHECK (
  provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
);

-- Admins : lecture de toutes les absences
CREATE POLICY "Admins view all absences"
ON public.provider_absences
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index pour les requêtes fréquentes (liste par prestataire + date)
CREATE INDEX IF NOT EXISTS idx_provider_absences_provider_id
  ON public.provider_absences (provider_id, start_date);
