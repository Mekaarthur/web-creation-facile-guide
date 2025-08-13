-- Créer une table pour l'historique des actions
CREATE TABLE public.action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'client_request', 'job_application', 'booking', etc.
  entity_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'status_change', 'comment_added', 'document_uploaded', etc.
  old_value TEXT,
  new_value TEXT,
  admin_user_id UUID REFERENCES auth.users(id),
  admin_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter des colonnes pour la localisation et le paiement aux demandes clients
ALTER TABLE public.client_requests 
ADD COLUMN city TEXT,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN payment_amount NUMERIC DEFAULT 0.00,
ADD COLUMN payment_method TEXT;

-- Ajouter des colonnes similaires aux candidatures
ALTER TABLE public.job_applications
ADD COLUMN city TEXT;

-- Créer une table pour la messagerie interne
CREATE TABLE public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'file', 'system'
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Créer une table pour les conversations internes
CREATE TABLE public.internal_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_request_id UUID REFERENCES public.client_requests(id),
  job_application_id UUID REFERENCES public.job_applications(id),
  booking_id UUID REFERENCES public.bookings(id),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  provider_id UUID REFERENCES auth.users(id),
  admin_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'archived'
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Créer une table pour les notifications
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL, -- 'email', 'sms', 'push'
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  entity_type TEXT, -- 'client_request', 'job_application', etc.
  entity_id UUID,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour action_history
CREATE POLICY "Admin can view all action history" ON public.action_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert action history" ON public.action_history
  FOR INSERT WITH CHECK (true);

-- Politiques RLS pour internal_messages
CREATE POLICY "Users can view their messages" ON public.internal_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can send messages" ON public.internal_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their messages" ON public.internal_messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Politiques RLS pour internal_conversations
CREATE POLICY "Users can view their conversations" ON public.internal_conversations
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = provider_id OR 
    auth.uid() = admin_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can manage conversations" ON public.internal_conversations
  FOR ALL USING (true);

-- Politiques RLS pour notification_logs
CREATE POLICY "Admin can view all notifications" ON public.notification_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their notifications" ON public.notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage notifications" ON public.notification_logs
  FOR ALL USING (true);

-- Fonction pour enregistrer les actions dans l'historique
CREATE OR REPLACE FUNCTION public.log_action(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action_type TEXT,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_admin_comment TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_log_id UUID;
BEGIN
  INSERT INTO public.action_history (
    entity_type,
    entity_id,
    action_type,
    old_value,
    new_value,
    admin_user_id,
    admin_comment
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action_type,
    p_old_value,
    p_new_value,
    auth.uid(),
    p_admin_comment
  ) RETURNING id INTO new_log_id;
  
  RETURN new_log_id;
END;
$$;

-- Trigger pour enregistrer automatiquement les changements de statut
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Pour les demandes clients
  IF TG_TABLE_NAME = 'client_requests' AND OLD.status != NEW.status THEN
    PERFORM public.log_action(
      'client_request',
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      'Changement de statut automatique'
    );
  END IF;
  
  -- Pour les candidatures
  IF TG_TABLE_NAME = 'job_applications' AND OLD.status != NEW.status THEN
    PERFORM public.log_action(
      'job_application',
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      'Changement de statut automatique'
    );
  END IF;
  
  -- Pour les paiements
  IF TG_TABLE_NAME = 'client_requests' AND COALESCE(OLD.payment_status, '') != COALESCE(NEW.payment_status, '') THEN
    PERFORM public.log_action(
      'client_request',
      NEW.id,
      'payment_status_change',
      OLD.payment_status,
      NEW.payment_status,
      'Changement de statut de paiement'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer les triggers
CREATE TRIGGER log_client_request_changes
  AFTER UPDATE ON public.client_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_change();

CREATE TRIGGER log_job_application_changes
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_change();