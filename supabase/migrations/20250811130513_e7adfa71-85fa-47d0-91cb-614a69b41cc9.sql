-- Mise à jour des statuts pour le workflow complet
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_in_location TEXT,
ADD COLUMN IF NOT EXISTS check_out_location TEXT,
ADD COLUMN IF NOT EXISTS before_photos TEXT[],
ADD COLUMN IF NOT EXISTS after_photos TEXT[],
ADD COLUMN IF NOT EXISTS provider_notes TEXT;