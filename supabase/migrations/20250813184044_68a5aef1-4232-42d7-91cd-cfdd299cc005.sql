-- Créer l'utilisateur admin de test directement via l'API auth
-- D'abord créer un profil pour l'utilisateur admin
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  email
) VALUES (
  'b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b', -- User ID existant des logs
  'Admin',
  'Test', 
  'anitabikoko1@gmail.com'
) ON CONFLICT (user_id) DO NOTHING;

-- Ajouter le rôle admin à cet utilisateur
INSERT INTO public.user_roles (user_id, role)
VALUES ('b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;