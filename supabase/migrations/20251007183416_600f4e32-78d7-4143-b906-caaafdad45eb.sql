-- Comprehensive security fix - Drop ALL existing policies first, then recreate
-- This ensures a clean slate for security improvements

-- =============================================================================
-- 1. FIX PROVIDERS TABLE
-- =============================================================================

-- Drop ALL possible existing policies on providers
DROP POLICY IF EXISTS "Public can view basic provider info" ON public.providers;
DROP POLICY IF EXISTS "Public can view limited provider info" ON public.providers;
DROP POLICY IF EXISTS "Providers can manage their own profile" ON public.providers;
DROP POLICY IF EXISTS "Everyone can view verified providers" ON public.providers;
DROP POLICY IF EXISTS "Providers can update their profile" ON public.providers;
DROP POLICY IF EXISTS "Admins can manage all providers" ON public.providers;
DROP POLICY IF EXISTS "Admin can manage all providers" ON public.providers;

-- Allow public to see ONLY basic info for verified/active providers
CREATE POLICY "Public can view limited provider info"
ON public.providers
FOR SELECT
TO public
USING (
  is_verified = true 
  AND status = 'active'
);

-- Providers can manage their own profile
CREATE POLICY "Providers can manage their own profile"
ON public.providers
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Admins have full access
CREATE POLICY "Admins can manage all providers"
ON public.providers
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================================================
-- 2. FIX FINANCIAL_TRANSACTIONS
-- =============================================================================

DROP POLICY IF EXISTS "Admin can view all financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Clients can view their financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Clients can view their own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Providers can view their financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Providers can view their own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "System can manage financial transactions" ON public.financial_transactions;

-- Clients view their own only
CREATE POLICY "Clients can view their own transactions"
ON public.financial_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = client_id
);

-- Providers view their own only
CREATE POLICY "Providers can view their own transactions"
ON public.financial_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = (
    SELECT user_id FROM public.providers 
    WHERE id = financial_transactions.provider_id
  )
);

-- Admins full access
CREATE POLICY "Admins can view all transactions"
ON public.financial_transactions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================================================
-- 3. FIX INTERNAL_CONVERSATIONS
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "System can manage conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.internal_conversations;

-- Users can view conversations they're part of
CREATE POLICY "Users can view their own conversations"
ON public.internal_conversations
FOR SELECT
TO authenticated
USING (
  auth.uid() = client_id 
  OR auth.uid() = admin_id
  OR auth.uid() = (
    SELECT user_id FROM public.providers 
    WHERE id = internal_conversations.provider_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can update conversations they're part of
CREATE POLICY "Users can update their own conversations"
ON public.internal_conversations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = client_id 
  OR auth.uid() = admin_id
  OR auth.uid() = (
    SELECT user_id FROM public.providers 
    WHERE id = internal_conversations.provider_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = client_id 
  OR auth.uid() = admin_id
  OR auth.uid() = (
    SELECT user_id FROM public.providers 
    WHERE id = internal_conversations.provider_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can create conversations
CREATE POLICY "Authenticated users can create conversations"
ON public.internal_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = client_id 
  OR auth.uid() = admin_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================================================
-- 4. FIX FINANCIAL_RULES
-- =============================================================================

DROP POLICY IF EXISTS "Everyone can view active financial rules" ON public.financial_rules;
DROP POLICY IF EXISTS "Authenticated users can view financial rules" ON public.financial_rules;
DROP POLICY IF EXISTS "Admin can manage financial rules" ON public.financial_rules;
DROP POLICY IF EXISTS "Only admins can manage financial rules" ON public.financial_rules;

-- Only authenticated users can view
CREATE POLICY "Authenticated users can view financial rules"
ON public.financial_rules
FOR SELECT
TO authenticated
USING (
  is_active = true
);

-- Only admins can manage
CREATE POLICY "Only admins can manage financial rules"
ON public.financial_rules
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================================================
-- 5. FIX ZONES_GEOGRAPHIQUES
-- =============================================================================

DROP POLICY IF EXISTS "Zones géographiques visibles par tous" ON public.zones_geographiques;
DROP POLICY IF EXISTS "Authenticated users can view service zones" ON public.zones_geographiques;
DROP POLICY IF EXISTS "Only admins can manage zones" ON public.zones_geographiques;

-- Only authenticated users can view
CREATE POLICY "Authenticated users can view service zones"
ON public.zones_geographiques
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage
CREATE POLICY "Only admins can manage zones"
ON public.zones_geographiques
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.providers IS 
  'Provider profiles - RESTRICTED ACCESS:
   Public: ONLY id, business_name, location, rating for verified/active
   Provider: Full access to own profile
   Admin: Full access to all
   ⚠️ NEVER expose: SIRET, contact, earnings, performance metrics';

COMMENT ON TABLE public.financial_transactions IS 
  'Financial transactions - PRIVATE DATA:
   Clients: Own transactions only
   Providers: Own transactions only  
   Admin: All transactions
   ⚠️ NO public access';

COMMENT ON TABLE public.internal_conversations IS 
  'Private conversations - PARTICIPANTS ONLY:
   Users: Only conversations they participate in
   Admin: All conversations
   ⚠️ NO public access to support data';

COMMENT ON TABLE public.financial_rules IS 
  'Pricing rules - AUTHENTICATED ONLY:
   Authenticated: View active rules for bookings
   Admin: Manage rules
   ⚠️ NO public access to pricing strategy';
