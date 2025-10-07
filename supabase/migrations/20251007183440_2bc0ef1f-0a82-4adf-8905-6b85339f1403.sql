-- Comprehensive security fix - Handles existing policies safely
-- This migration restricts access to all sensitive business and financial data

-- =============================================================================
-- 1. FIX PROVIDERS TABLE
-- =============================================================================

-- Drop ALL possible existing policies
DROP POLICY IF EXISTS "Public can view basic provider info" ON public.providers;
DROP POLICY IF EXISTS "Public can view limited provider info" ON public.providers;
DROP POLICY IF EXISTS "Providers can manage their own profile" ON public.providers;
DROP POLICY IF EXISTS "Everyone can view verified providers" ON public.providers;
DROP POLICY IF EXISTS "Providers can update their profile" ON public.providers;
DROP POLICY IF EXISTS "Admins can manage all providers" ON public.providers;
DROP POLICY IF EXISTS "Secure provider info access" ON public.providers;

-- Create new restrictive policies
CREATE POLICY "Public limited provider view"
ON public.providers FOR SELECT TO public
USING (is_verified = true AND status = 'active');

CREATE POLICY "Providers own profile management"
ON public.providers FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full provider access"
ON public.providers FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================================
-- 2. FIX FINANCIAL_TRANSACTIONS
-- =============================================================================

DROP POLICY IF EXISTS "Admin can view all financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Clients can view their financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Providers can view their financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "System can manage financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Clients can view their own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Providers can view their own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.financial_transactions;

CREATE POLICY "Client own transactions view"
ON public.financial_transactions FOR SELECT TO authenticated
USING (auth.uid() = client_id);

CREATE POLICY "Provider own transactions view"
ON public.financial_transactions FOR SELECT TO authenticated
USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = financial_transactions.provider_id));

CREATE POLICY "Admin all transactions view"
ON public.financial_transactions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================================
-- 3. FIX INTERNAL_CONVERSATIONS
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "System can manage conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.internal_conversations;

CREATE POLICY "Conversation participants view"
ON public.internal_conversations FOR SELECT TO authenticated
USING (
  auth.uid() = client_id 
  OR auth.uid() = admin_id
  OR auth.uid() = (SELECT user_id FROM public.providers WHERE id = internal_conversations.provider_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Conversation participants update"
ON public.internal_conversations FOR UPDATE TO authenticated
USING (
  auth.uid() = client_id 
  OR auth.uid() = admin_id
  OR auth.uid() = (SELECT user_id FROM public.providers WHERE id = internal_conversations.provider_id)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = client_id 
  OR auth.uid() = admin_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Conversation participants create"
ON public.internal_conversations FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = client_id 
  OR auth.uid() = admin_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================================================
-- 4. FIX FINANCIAL_RULES
-- =============================================================================

DROP POLICY IF EXISTS "Everyone can view active financial rules" ON public.financial_rules;
DROP POLICY IF EXISTS "Admin can manage financial rules" ON public.financial_rules;
DROP POLICY IF EXISTS "Authenticated users can view financial rules" ON public.financial_rules;
DROP POLICY IF EXISTS "Only admins can manage financial rules" ON public.financial_rules;

CREATE POLICY "Authenticated financial rules view"
ON public.financial_rules FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admin financial rules management"
ON public.financial_rules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================================
-- 5. FIX ZONES_GEOGRAPHIQUES
-- =============================================================================

DROP POLICY IF EXISTS "Zones géographiques visibles par tous" ON public.zones_geographiques;
DROP POLICY IF EXISTS "Authenticated users can view service zones" ON public.zones_geographiques;
DROP POLICY IF EXISTS "Only admins can manage zones" ON public.zones_geographiques;

CREATE POLICY "Authenticated zones view"
ON public.zones_geographiques FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin zones management"
ON public.zones_geographiques FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
