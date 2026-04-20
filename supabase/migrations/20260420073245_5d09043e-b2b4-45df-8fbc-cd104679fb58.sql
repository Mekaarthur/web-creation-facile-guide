CREATE TABLE IF NOT EXISTS public.anomaly_alerts_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anomaly_key TEXT NOT NULL,
  severity TEXT NOT NULL,
  category TEXT,
  count_at_send INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  send_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS anomaly_alerts_sent_key_idx
  ON public.anomaly_alerts_sent(anomaly_key);

CREATE INDEX IF NOT EXISTS anomaly_alerts_sent_last_sent_idx
  ON public.anomaly_alerts_sent(last_sent_at DESC);

ALTER TABLE public.anomaly_alerts_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view anomaly alerts sent"
  ON public.anomaly_alerts_sent
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));