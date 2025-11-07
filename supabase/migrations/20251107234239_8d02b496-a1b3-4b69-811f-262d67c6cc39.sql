-- =======================
-- ÉTAPE 2: FONCTIONS ET POLITIQUES DE SÉCURITÉ
-- =======================

-- 1. Activer RLS sur user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can create initial roles" ON public.user_roles;

-- 3. Remplacer les fonctions de gestion des rôles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'provider' THEN 2
      WHEN 'client' THEN 3
      WHEN 'moderator' THEN 4
      WHEN 'user' THEN 5
    END
  LIMIT 1
$$;

-- 4. Fonction pour ajouter un rôle
CREATE OR REPLACE FUNCTION public.add_user_role(
  target_user_id uuid,
  new_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role, created_by, created_at)
  VALUES (target_user_id, new_role, auth.uid(), NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Créer entrée provider si nécessaire
  IF new_role = 'provider' THEN
    INSERT INTO public.providers (user_id, status, is_verified, created_at, updated_at)
    SELECT target_user_id, 'pending_validation', false, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.providers WHERE user_id = target_user_id);
  END IF;
END;
$$;

-- 5. Fonction pour retirer un rôle
CREATE OR REPLACE FUNCTION public.remove_user_role(
  target_user_id uuid,
  old_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  IF (SELECT COUNT(*) FROM public.user_roles WHERE user_id = target_user_id) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last role of a user';
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = old_role;
END;
$$;

-- 6. Nouvelles politiques RLS pour user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create initial roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- 7. Trigger pour auto-assigner le rôle "client" aux nouveaux users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer profil
  INSERT INTO public.profiles (user_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assigner rôle client par défaut
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, 'client', NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 9. Documentation
COMMENT ON FUNCTION public.get_user_roles IS 'Retourne tous les rôles d''un utilisateur';
COMMENT ON FUNCTION public.get_primary_role IS 'Retourne le rôle principal (priorité: admin > provider > client)';
COMMENT ON FUNCTION public.add_user_role IS 'Ajoute un rôle à un utilisateur (admins seulement)';
COMMENT ON FUNCTION public.remove_user_role IS 'Retire un rôle à un utilisateur (admins seulement)';