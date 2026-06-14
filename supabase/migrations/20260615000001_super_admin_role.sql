-- Super Admin role: enum value, uniqueness trigger, governance table

-- 1. Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Update has_role: super_admin implicitly satisfies admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin' AND role = 'super_admin')
      )
  )
$$;

-- 3. Enforce R-SA-01: max 1 super_admin at any time
CREATE OR REPLACE FUNCTION public.enforce_single_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'super_admin' THEN
    IF TG_OP = 'INSERT' THEN
      IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
        RAISE EXCEPTION 'R-SA-01 : Un seul Super Admin est autorisé par plateforme.';
      END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.role != 'super_admin' THEN
      IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin' AND user_id != NEW.user_id) THEN
        RAISE EXCEPTION 'R-SA-01 : Un seul Super Admin est autorisé par plateforme.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_super_admin ON public.user_roles;
CREATE TRIGGER enforce_single_super_admin
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_super_admin();

-- 4. Governance table: tracks R-SA-02, R-SA-05, R-SA-06 compliance dates
CREATE TABLE IF NOT EXISTS public.super_admin_governance (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enrolled      boolean      NOT NULL DEFAULT false,
  last_review_at    timestamptz,
  last_pw_change_at timestamptz  NOT NULL DEFAULT now(),
  notes             text,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admin_governance ENABLE ROW LEVEL SECURITY;

-- Super admin manages own governance record
CREATE POLICY "super_admin_governance_own"
ON public.super_admin_governance FOR ALL
USING  (auth.uid() = user_id AND has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'super_admin'::app_role));

-- Any admin can read for display
CREATE POLICY "admin_governance_read"
ON public.super_admin_governance FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
