ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_payment_id text;
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment_id ON public.invoices(stripe_payment_id);