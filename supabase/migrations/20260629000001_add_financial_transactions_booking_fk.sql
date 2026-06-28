-- Ajoute la FK manquante financial_transactions.booking_id → bookings.id
-- Nécessaire pour que PostgREST puisse résoudre le join embedded
-- (0 orphans vérifiés avant application)
ALTER TABLE financial_transactions
  ADD CONSTRAINT financial_transactions_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT;
