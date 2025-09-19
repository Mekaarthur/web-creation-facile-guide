-- Corriger les RLS policies pour client_requests pour les admins
-- D'abord, supprimer les policies qui peuvent être en conflit
DROP POLICY IF EXISTS "Admin can view client requests" ON public.client_requests;
DROP POLICY IF EXISTS "Admin can view all client requests" ON public.client_requests;
DROP POLICY IF EXISTS "Admin can update client requests" ON public.client_requests;
DROP POLICY IF EXISTS "Admin can manage client requests" ON public.client_requests;

-- Créer une seule policy admin complète
CREATE POLICY "Admins have full access to client requests" 
ON public.client_requests 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Assurer que la table a RLS activé
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

-- Vérifier que la fonction get_current_user_role existe et fonctionne
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Alternative policy utilisant la fonction sécurisée
CREATE POLICY "Admins full access via function" 
ON public.client_requests 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');