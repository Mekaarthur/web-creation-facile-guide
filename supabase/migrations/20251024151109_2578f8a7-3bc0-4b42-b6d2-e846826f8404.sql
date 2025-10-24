-- Add notes column to provider_rewards table
ALTER TABLE public.provider_rewards
ADD COLUMN IF NOT EXISTS notes TEXT;