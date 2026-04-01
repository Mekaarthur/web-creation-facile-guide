-- Add admin UPDATE policy on candidatures_prestataires
CREATE POLICY "Admin can update candidatures"
ON public.candidatures_prestataires
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Add admin DELETE policy on candidatures_prestataires
CREATE POLICY "Admin can delete candidatures"
ON public.candidatures_prestataires
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Add admin INSERT policy on candidatures_prestataires
CREATE POLICY "Admin can insert candidatures"
ON public.candidatures_prestataires
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));