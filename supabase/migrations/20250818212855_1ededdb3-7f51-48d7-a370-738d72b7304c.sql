-- Allow admins to view all chat messages for support purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Admin can view all chat messages'
  ) THEN
    CREATE POLICY "Admin can view all chat messages"
      ON public.chat_messages
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;