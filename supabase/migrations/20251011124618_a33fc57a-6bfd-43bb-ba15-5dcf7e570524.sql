-- Fix profiles table RLS to prevent PII exposure
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Users can view their own profile or public info" ON public.profiles;

-- Create strict RLS policies
CREATE POLICY "Users can only view own profile" 
ON public.profiles
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix financial_transactions RLS to ensure strict isolation
-- Drop existing policies to recreate with better security
DROP POLICY IF EXISTS "Client own transactions view" ON public.financial_transactions;
DROP POLICY IF EXISTS "Provider own transactions view" ON public.financial_transactions;
DROP POLICY IF EXISTS "Admin all transactions view" ON public.financial_transactions;

-- Recreate with strict isolation
CREATE POLICY "Clients can only view their own transactions" 
ON public.financial_transactions
FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Providers can only view their own transactions" 
ON public.financial_transactions
FOR SELECT 
USING (
  auth.uid() = (
    SELECT user_id FROM public.providers 
    WHERE id = financial_transactions.provider_id
  )
);

CREATE POLICY "Admins can view all financial transactions" 
ON public.financial_transactions
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure no updates/deletes allowed except by admins
CREATE POLICY "Only admins can update financial transactions" 
ON public.financial_transactions
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete financial transactions" 
ON public.financial_transactions
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));