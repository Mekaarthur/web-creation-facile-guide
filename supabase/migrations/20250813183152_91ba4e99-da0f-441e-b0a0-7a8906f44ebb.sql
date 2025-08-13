-- Create a test admin user for testing purposes
-- This allows the user to test admin functionality immediately
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'test@admin.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Admin", "last_name": "Test"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Add admin role to this test user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'test@admin.com'
ON CONFLICT (user_id, role) DO NOTHING;