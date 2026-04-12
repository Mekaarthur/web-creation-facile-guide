
-- Fix chat_conversations: provider_id is providers.id, not auth.uid()
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;

CREATE POLICY "Users can view their conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  auth.uid() = client_id
  OR auth.uid() = (SELECT user_id FROM providers WHERE id = chat_conversations.provider_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
