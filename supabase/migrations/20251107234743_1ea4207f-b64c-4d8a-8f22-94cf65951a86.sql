-- =======================
-- ASSIGNER LE RÔLE PROVIDER AUX PRESTATAIRES EXISTANTS
-- =======================

-- Ajouter le rôle 'provider' à tous les utilisateurs qui ont une entrée dans la table providers
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT DISTINCT p.user_id, 'provider'::app_role, NOW()
FROM public.providers p
WHERE p.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'provider'::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;