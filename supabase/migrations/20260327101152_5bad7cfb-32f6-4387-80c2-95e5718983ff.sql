-- Admin can view all attestations
CREATE POLICY "Admin can view all attestations"
ON public.attestations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can manage all attestations
CREATE POLICY "Admin can manage all attestations"
ON public.attestations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow anonymous users to view active services (for public catalog)
CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
TO anon
USING (is_active = true);

-- Admin INSERT for financial_transactions (needed for URSSAF flow)
CREATE POLICY "Admins can insert financial transactions"
ON public.financial_transactions FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin INSERT for invoices
CREATE POLICY "Admins can insert invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Clients can insert their own invoices (for URSSAF declarations)
CREATE POLICY "Clients can insert their invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

-- Clients can view their own invoices
CREATE POLICY "Clients can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (client_id = auth.uid());