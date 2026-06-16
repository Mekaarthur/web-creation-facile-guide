-- R-SEL-18: récurrence proposée après 1ère réservation
-- Stocke la préférence de récurrence du client (hebdo/bi-mensuel/mensuel).
-- La génération automatique des réservations futures (cron + Edge Function) n'est pas couverte ici.

CREATE TABLE IF NOT EXISTS public.recurring_bookings (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            uuid        NOT NULL REFERENCES auth.users(id),
  origin_booking_id    uuid        REFERENCES public.bookings(id),
  service_name         text        NOT NULL,
  package_title        text        NOT NULL,
  financial_category   text        NOT NULL,
  urssaf_eligible       boolean    NOT NULL DEFAULT false,
  price                numeric     NOT NULL CHECK (price > 0),
  frequency            text        NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week          text,
  prefer_same_provider boolean     NOT NULL DEFAULT true,
  address              text        NOT NULL,
  postal_code          text,
  start_date           date        NOT NULL,
  end_date             date,
  status               text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  cancelled_at         timestamptz,
  cancellation_reason  text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_read_own_recurring_bookings" ON public.recurring_bookings
FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "client_insert_own_recurring_bookings" ON public.recurring_bookings
FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "client_update_own_recurring_bookings" ON public.recurring_bookings
FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "admin_all_recurring_bookings" ON public.recurring_bookings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
