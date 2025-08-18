-- Ensure RLS is enabled and proper policies exist for client_requests so new public requests are saved and admins can see them

ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'client_requests' AND policyname = 'Anyone can create client requests'
  ) THEN
    CREATE POLICY "Anyone can create client requests"
      ON public.client_requests
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'client_requests' AND policyname = 'Admin can manage client requests'
  ) THEN
    CREATE POLICY "Admin can manage client requests"
      ON public.client_requests
      FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- Explicit SELECT policy for admins (safe if ALL policy is adjusted later)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'client_requests' AND policyname = 'Admin can view client requests'
  ) THEN
    CREATE POLICY "Admin can view client requests"
      ON public.client_requests
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;