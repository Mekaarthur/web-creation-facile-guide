ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS no_show_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS replacement_search_status text DEFAULT 'not_started';

COMMENT ON COLUMN public.bookings.no_show_reported_at IS 'Moment où le client a signalé l''absence du prestataire';
COMMENT ON COLUMN public.bookings.replacement_search_status IS 'Statut de la recherche de remplaçant: not_started, searching, found, not_found';