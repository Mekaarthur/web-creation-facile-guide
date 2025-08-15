-- Add new columns to custom_requests table
ALTER TABLE custom_requests 
ADD COLUMN preferred_datetime timestamp with time zone,
ADD COLUMN pickup_address text,
ADD COLUMN delivery_address text;