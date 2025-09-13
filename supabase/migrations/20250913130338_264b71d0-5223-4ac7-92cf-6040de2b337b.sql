-- Créer la table pour les logs de notifications modernes
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  notification_type TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  entity_type TEXT,
  entity_id UUID,
  status TEXT DEFAULT 'sent',
  email_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les performances  
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_email ON public.notification_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs (status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_entity ON public.notification_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs (sent_at);

-- RLS policies
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins (accès complet)
CREATE POLICY "Admins can manage all notification logs" 
ON public.notification_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy pour les utilisateurs (accès à leurs propres logs)
CREATE POLICY "Users can view their own notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (
  user_email = (
    SELECT email FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE TRIGGER update_notification_logs_updated_at
BEFORE UPDATE ON public.notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();