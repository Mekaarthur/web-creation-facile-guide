-- Add payout frequency preference to providers
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS payout_frequency text DEFAULT 'weekly' CHECK (payout_frequency IN ('weekly', 'monthly'));
