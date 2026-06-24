-- Drop the trigger that duplicates Edge Function work and causes 42P10.
-- The trigger create_provider_on_approval fires when job_applications.status is set
-- to 'approved' and calls create_provider_from_approved_application(), which tries:
--   INSERT INTO user_roles ... ON CONFLICT (user_id, role) DO NOTHING
-- But user_roles has no plain UNIQUE(user_id, role) constraint (only a partial index
-- WHERE is_active = true), so PostgreSQL raises 42P10.
--
-- The Edge Function admin-applications/approveApplication() already handles:
--   - auth user creation/reuse
--   - profile creation/update
--   - provider record creation
--   - user_roles assignment (select-then-insert, no ON CONFLICT)
--   - job_applications status update
-- The trigger is fully redundant and was never needed after the Edge Function was written.

DROP TRIGGER IF EXISTS create_provider_on_approval ON public.job_applications;
DROP FUNCTION IF EXISTS public.create_provider_from_approved_application();
