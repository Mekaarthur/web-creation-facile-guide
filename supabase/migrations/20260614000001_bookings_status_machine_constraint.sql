-- R6: Machine d'états bookings — contrainte CHECK sur les statuts valides
-- Ajoute les nouveaux statuts métier : pending_payment, paid, booking_confirmed,
-- in_progress, payment_failed. Conserve 'confirmed' (legacy, en usage actif).

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (
  status IN (
    'pending_payment',
    'paid',
    'booking_confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'refunded',
    'payment_failed',
    'disputed',
    'pending_provider',
    'pending_urssaf',
    'confirmed'
  )
);
