-- Ensure custom_requests has all columns needed by CustomRequestForm
-- Uses IF NOT EXISTS so this is safe to run even if the columns already exist
ALTER TABLE public.custom_requests
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS pickup_address text,
  ADD COLUMN IF NOT EXISTS preferred_datetime timestamp with time zone;
