-- Tables pour le rôle Modérateur (moderator existe déjà dans l'enum)
-- R-MO-03: moderation_decisions — note obligatoire horodatée
-- R-MO-04: signalement_escalations — escalade urgent vers Super Admin

CREATE TABLE IF NOT EXISTS public.moderation_decisions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id         uuid        NOT NULL REFERENCES auth.users(id),
  action_type          text        NOT NULL,
  target_id            uuid        NOT NULL,
  target_type          text        NOT NULL,
  note                 text        NOT NULL,
  decision             text        NOT NULL CHECK (decision IN ('approved', 'rejected', 'escalated', 'pending_ao')),
  pending_ao_conversion boolean    NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderator_read_own_decisions" ON public.moderation_decisions
FOR SELECT USING (has_role(auth.uid(), 'moderator'::app_role) AND moderator_id = auth.uid());

CREATE POLICY "moderator_insert_decisions" ON public.moderation_decisions
FOR INSERT WITH CHECK (has_role(auth.uid(), 'moderator'::app_role) AND moderator_id = auth.uid());

CREATE POLICY "admin_all_decisions" ON public.moderation_decisions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.signalement_escalations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     uuid        NOT NULL,
  escalated_by  uuid        NOT NULL REFERENCES auth.users(id),
  reason        text        NOT NULL,
  priority      text        NOT NULL DEFAULT 'urgent' CHECK (priority IN ('urgent', 'high')),
  status        text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by   uuid        REFERENCES auth.users(id),
  reviewed_at   timestamptz,
  review_notes  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signalement_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderator_read_own_escalations" ON public.signalement_escalations
FOR SELECT USING (has_role(auth.uid(), 'moderator'::app_role) AND escalated_by = auth.uid());

CREATE POLICY "admin_all_signalement_escalations" ON public.signalement_escalations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
