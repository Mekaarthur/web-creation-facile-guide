-- Create admin user if not exists
INSERT INTO public.admin_users (user_id, role, permissions)
SELECT 
  au.id,
  'admin',
  ARRAY['read', 'write', 'delete']
FROM auth.users au
WHERE au.email IN ('admin@bikawo.com', 'admin@assistme.fr')
ON CONFLICT (user_id) DO NOTHING;