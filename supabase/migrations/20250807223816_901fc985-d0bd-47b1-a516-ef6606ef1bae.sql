-- Table pour les conversations de chat
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Améliorer la table chat_messages existante
ALTER TABLE public.chat_messages 
ADD COLUMN conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
ADD COLUMN status TEXT DEFAULT 'sent',
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reply_to_id UUID REFERENCES public.chat_messages(id);

-- Table pour les notifications en temps réel
CREATE TABLE public.realtime_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour le statut en ligne des utilisateurs
CREATE TABLE public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline', -- online, offline, away, busy
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_page TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour chat_conversations
CREATE POLICY "Users can view their conversations" ON public.chat_conversations
FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);

CREATE POLICY "Users can create conversations for their bookings" ON public.chat_conversations
FOR INSERT WITH CHECK (
  auth.uid() = client_id OR 
  auth.uid() = (SELECT providers.user_id FROM providers WHERE providers.id = provider_id)
);

-- Politiques RLS pour realtime_notifications
CREATE POLICY "Users can view their notifications" ON public.realtime_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.realtime_notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.realtime_notifications
FOR INSERT WITH CHECK (true);

-- Politiques RLS pour user_presence
CREATE POLICY "Users can view all presence" ON public.user_presence
FOR SELECT USING (true);

CREATE POLICY "Users can update their presence" ON public.user_presence
FOR ALL USING (auth.uid() = user_id);

-- Triggers pour maintenir les timestamps
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour créer automatiquement une conversation lors d'un nouveau booking
CREATE OR REPLACE FUNCTION public.create_conversation_for_booking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_conversations (booking_id, client_id, provider_id)
  VALUES (
    NEW.id, 
    NEW.client_id, 
    (SELECT user_id FROM public.providers WHERE id = NEW.provider_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement une conversation
CREATE TRIGGER create_conversation_on_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_conversation_for_booking();

-- Fonction pour mettre à jour last_message_at dans les conversations
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations 
  SET last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour last_message_at
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Activer realtime pour les tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.realtime_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;