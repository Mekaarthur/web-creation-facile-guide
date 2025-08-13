-- Ajouter le rôle admin à l'utilisateur existant
INSERT INTO public.user_roles (user_id, role)
VALUES ('b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;