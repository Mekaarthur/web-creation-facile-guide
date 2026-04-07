
-- 1. Supprimer la politique SELECT trop permissive sur provider_locations
-- (elle expose les adresses de tous les prestataires à tout le monde)
DROP POLICY IF EXISTS "Anyone can view provider locations" ON public.provider_locations;

-- 2. Ajouter une politique RLS sur platform_stats_access (RLS activé mais aucune politique)
-- Seuls les admins peuvent y accéder
CREATE POLICY "Only admins can access platform stats"
ON public.platform_stats_access
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Déplacer pg_net du schéma public vers extensions
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net SCHEMA extensions;

-- 4. Nettoyer les politiques dupliquées sur user_roles
-- (3 politiques ALL identiques, on en garde une seule)
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
-- On garde "Admins manage roles via function"

-- 5. Nettoyer les politiques SELECT dupliquées sur user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
-- On garde "Admins can view all user roles"
