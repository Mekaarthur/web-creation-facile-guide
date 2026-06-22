-- Remove motivation requirement from job_applications INSERT policy
-- motivation is optional in the product (UX labels it "Optionnel")
-- content validation is Zod's responsibility, not RLS

DROP POLICY IF EXISTS "Anyone can submit job applications" ON public.job_applications;

CREATE POLICY "allow_insert_job_applications"
ON public.job_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND length(trim(email)) > 0
  AND first_name IS NOT NULL AND length(trim(first_name)) > 0
  AND last_name IS NOT NULL AND length(trim(last_name)) > 0
  AND phone IS NOT NULL AND length(trim(phone)) > 0
);
-- motivation removed from WITH CHECK
-- all other required identity fields kept
