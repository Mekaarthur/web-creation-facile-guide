-- Mettre à jour la table notification_logs existante pour ajouter les nouvelles colonnes
ALTER TABLE public.notification_logs 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS email_id TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE;

-- Mettre à jour les index pour les performances avec la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_email ON public.notification_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_email_id ON public.notification_logs (email_id);

-- Politique RLS pour permettre l'accès via user_email
CREATE POLICY "Users can view notification logs by email" 
ON public.notification_logs 
FOR SELECT 
USING (
  user_email = (
    SELECT email FROM auth.users 
    WHERE id = auth.uid()
  )
);