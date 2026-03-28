-- 1. Add unique constraint for document validation upsert to work
ALTER TABLE public.application_document_validations
ADD CONSTRAINT application_document_validations_app_doc_unique
UNIQUE (application_id, document_type);

-- 2. Fix add_user_role to work from service_role context (edge functions)
CREATE OR REPLACE FUNCTION public.add_user_role(target_user_id uuid, new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (edge functions) OR admin users
  IF current_setting('role', true) != 'service_role' THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can assign roles';
    END IF;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 3. Ensure admin can insert providers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'providers' AND policyname = 'Admin can insert providers') THEN
    CREATE POLICY "Admin can insert providers"
    ON public.providers FOR INSERT
    TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 4. Ensure admin can insert profiles (for approve flow)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admin can insert profiles') THEN
    CREATE POLICY "Admin can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 5. Ensure admin can insert provider_services
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_services' AND policyname = 'Admin can manage provider services') THEN
    CREATE POLICY "Admin can manage provider services"
    ON public.provider_services FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;