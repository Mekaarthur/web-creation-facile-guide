-- Support Client role + refund escalation workflow (R-SC-04)

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_client';

CREATE TABLE IF NOT EXISTS public.refund_escalations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_by     uuid        NOT NULL REFERENCES auth.users(id),
  requested_at     timestamptz NOT NULL DEFAULT now(),
  reason           text        NOT NULL,
  requested_amount numeric(10,2),
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected')),
  resolved_by      uuid        REFERENCES auth.users(id),
  resolved_at      timestamptz,
  resolution_notes text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refund_escalations ENABLE ROW LEVEL SECURITY;

-- Admins have full access to manage escalations
CREATE POLICY "admin_manage_escalations"
ON public.refund_escalations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- SC agents can read their own escalations
CREATE POLICY "sc_read_own_escalations"
ON public.refund_escalations FOR SELECT
USING (
  has_role(auth.uid(), 'support_client'::app_role)
  AND requested_by = auth.uid()
);

-- SC agents can create escalations (server-side uses service role, but belt-and-suspenders)
CREATE POLICY "sc_create_own_escalations"
ON public.refund_escalations FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'support_client'::app_role)
  AND requested_by = auth.uid()
);
