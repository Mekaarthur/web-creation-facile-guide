-- Corriger la politique RLS pour job_applications
-- Le problème: la politique actuelle essaie d'accéder à auth.users et se fait bloquer par RLS

-- Supprimer l'ancienne politique défectueuse
DROP POLICY IF EXISTS "Users can view their own job applications" ON public.job_applications;

-- Créer une nouvelle politique simple pour les admins
CREATE POLICY "Admins can view all job applications"
ON public.job_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Créer une politique pour les utilisateurs qui veulent voir leur propre candidature
-- En utilisant l'email du JWT directement sans accéder à auth.users
CREATE POLICY "Users can view their own applications by email"
ON public.job_applications
FOR SELECT
TO authenticated
USING (email = auth.email());
