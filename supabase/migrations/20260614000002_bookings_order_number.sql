-- Migration: add human-readable order_number to bookings
-- Format: BIK-YYYY-NNNN (ex: BIK-2026-0001)

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

CREATE SEQUENCE IF NOT EXISTS booking_order_seq
START 1 INCREMENT 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'BIK-' ||
    TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(nextval('booking_order_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();

-- Backfill existing bookings (ordered by created_at)
-- Window functions not allowed in UPDATE directly — use CTE
WITH numbered AS (
  SELECT id,
    'BIK-' ||
    TO_CHAR(created_at, 'YYYY') || '-' ||
    LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0') AS new_order_number
  FROM bookings
  WHERE order_number IS NULL
)
UPDATE bookings b
SET order_number = n.new_order_number
FROM numbered n
WHERE b.id = n.id;
