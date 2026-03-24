-- Add Stripe Connect account ID to providers table
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Add provider_paid_via field to financial_transactions to track payment method
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS paid_via text DEFAULT 'manual';
