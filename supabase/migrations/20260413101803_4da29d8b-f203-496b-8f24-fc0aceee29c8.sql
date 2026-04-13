-- Fix: Remplacer les politiques RLS qui référencent auth.users par auth.email()
-- pour éviter "permission denied for table users"

-- 1. chatbot_conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can view their conversations"
ON public.chatbot_conversations
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR user_email = auth.email()::text
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can update their conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can update their conversations"
ON public.chatbot_conversations
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id 
  OR user_email = auth.email()::text
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. chatbot_messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.chatbot_messages;
CREATE POLICY "Users can view their messages"
ON public.chatbot_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chatbot_conversations
    WHERE chatbot_conversations.id = chatbot_messages.conversation_id
    AND (
      chatbot_conversations.user_id = auth.uid()
      OR chatbot_conversations.user_email = auth.email()::text
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. notification_logs
DROP POLICY IF EXISTS "Users can view notification logs by email" ON public.notification_logs;
CREATE POLICY "Users can view notification logs by email"
ON public.notification_logs
FOR SELECT TO authenticated
USING (
  user_email = auth.email()::text
);

DROP POLICY IF EXISTS "Secure notification logs access" ON public.notification_logs;
CREATE POLICY "Secure notification logs access"
ON public.notification_logs
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR user_email = auth.email()::text
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4. subscribers
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription"
ON public.subscribers
FOR UPDATE TO authenticated
USING (email = auth.email()::text)
WITH CHECK (email = auth.email()::text);

-- 5. support_tickets
DROP POLICY IF EXISTS "Users can view their tickets" ON public.support_tickets;
CREATE POLICY "Users can view their tickets"
ON public.support_tickets
FOR SELECT TO authenticated
USING (
  user_email = auth.email()::text
  OR assigned_to = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);