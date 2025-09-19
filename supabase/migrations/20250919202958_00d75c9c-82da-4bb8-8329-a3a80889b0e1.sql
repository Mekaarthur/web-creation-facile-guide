-- Corriger la structure de la table internal_conversations pour une meilleure relation avec profiles
-- D'abord, ajoutons des colonnes manquantes et corrigeons les relations

-- Vérifier et ajuster la table internal_conversations si nécessaire
ALTER TABLE public.internal_conversations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

-- Assurer que les données existantes ont des valeurs par défaut appropriées
UPDATE public.internal_conversations 
SET 
  status = COALESCE(status, 'active'),
  subject = COALESCE(subject, 'Conversation'),
  last_message_at = COALESCE(last_message_at, created_at)
WHERE status IS NULL OR subject IS NULL OR last_message_at IS NULL;

-- Créer un index pour améliorer les performances sur les jointures
CREATE INDEX IF NOT EXISTS idx_internal_conversations_client_id ON public.internal_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_internal_conversations_provider_id ON public.internal_conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_internal_conversations_admin_id ON public.internal_conversations(admin_id);

-- Assurer que les messages ont des valeurs par défaut appropriées
UPDATE public.internal_messages 
SET 
  message_type = COALESCE(message_type, 'text'),
  is_read = COALESCE(is_read, false)
WHERE message_type IS NULL OR is_read IS NULL;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_internal_messages_conversation_id ON public.internal_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_sender_id ON public.internal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_is_read ON public.internal_messages(is_read);

-- Créer une vue pour simplifier les requêtes de conversations avec détails utilisateurs
CREATE OR REPLACE VIEW public.conversations_with_details AS
SELECT 
  ic.*,
  COALESCE(cp.first_name || ' ' || cp.last_name, 'Client ' || SUBSTR(ic.client_id::text, 1, 8)) as client_name,
  COALESCE(cp.email, 'email@inconnu.com') as client_email,
  COALESCE(p.business_name, 'Prestataire ' || SUBSTR(ic.provider_id::text, 1, 8)) as provider_name,
  COALESCE(ap.first_name || ' ' || ap.last_name, 'Admin ' || SUBSTR(ic.admin_id::text, 1, 8)) as admin_name
FROM public.internal_conversations ic
LEFT JOIN public.profiles cp ON cp.user_id = ic.client_id
LEFT JOIN public.providers p ON p.id = ic.provider_id
LEFT JOIN public.profiles ap ON ap.user_id = ic.admin_id;

-- Fonction pour créer une conversation avec toutes les vérifications nécessaires
CREATE OR REPLACE FUNCTION public.create_internal_conversation(
  p_client_id UUID,
  p_provider_id UUID DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL,
  p_subject TEXT DEFAULT 'Nouvelle conversation',
  p_initial_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_conversation_id UUID;
BEGIN
  -- Créer la conversation
  INSERT INTO public.internal_conversations (
    client_id,
    provider_id,
    admin_id,
    subject,
    status,
    last_message_at
  ) VALUES (
    p_client_id,
    p_provider_id,
    COALESCE(p_admin_id, auth.uid()),
    p_subject,
    'active',
    now()
  ) RETURNING id INTO new_conversation_id;
  
  -- Ajouter le message initial si fourni
  IF p_initial_message IS NOT NULL AND p_initial_message != '' THEN
    INSERT INTO public.internal_messages (
      conversation_id,
      sender_id,
      receiver_id,
      message_text,
      message_type,
      is_read
    ) VALUES (
      new_conversation_id,
      COALESCE(p_admin_id, auth.uid()),
      p_client_id,
      p_initial_message,
      'text',
      false
    );
  END IF;
  
  RETURN new_conversation_id;
END;
$$;

-- Fonction pour compter les messages non lus par conversation
CREATE OR REPLACE FUNCTION public.get_unread_messages_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.internal_messages
    WHERE conversation_id = p_conversation_id
      AND receiver_id = p_user_id
      AND is_read = false
  );
END;
$$;