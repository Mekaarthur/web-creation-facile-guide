-- ============================================
-- MIGRATION: Renforcement sécurité admin et RLS (v2)
-- ============================================

-- 1. user_roles: RLS et policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles via function" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage roles via function"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. admin_actions_log: RLS
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view logs" ON public.admin_actions_log;
DROP POLICY IF EXISTS "Only admins can insert logs" ON public.admin_actions_log;

CREATE POLICY "Only admins can view logs"
  ON public.admin_actions_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert logs"
  ON public.admin_actions_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. security_audit_log: RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view security logs" ON public.security_audit_log;

CREATE POLICY "Only admins can view security logs"
  ON public.security_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. realtime_notifications: Policy admin
DROP POLICY IF EXISTS "Admin notifications" ON public.realtime_notifications;

CREATE POLICY "Admin notifications"
  ON public.realtime_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Fonction pour vérifier si l'utilisateur connecté est admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  );
$$;

-- 6. Index pour optimiser
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
  ON public.user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS idx_user_roles_admin 
  ON public.user_roles(role) WHERE role = 'admin';

-- 7. complaints: RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;

CREATE POLICY "Users can view their own complaints"
  ON public.complaints FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Admins can view all complaints"
  ON public.complaints FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. internal_conversations et internal_messages: RLS
ALTER TABLE public.internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Admins can manage all conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "View own messages" ON public.internal_messages;

CREATE POLICY "Users can view their conversations"
  ON public.internal_conversations FOR SELECT TO authenticated
  USING (
    client_id = auth.uid() 
    OR provider_id = auth.uid() 
    OR admin_id = auth.uid()
  );

CREATE POLICY "Admins can manage all conversations"
  ON public.internal_conversations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "View own messages"
  ON public.internal_messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() 
    OR receiver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.internal_conversations ic
      WHERE ic.id = internal_messages.conversation_id
      AND (ic.admin_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
    )
  );