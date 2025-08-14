-- Tables pour le système de paiements complet

-- Table des paniers (carts)
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_estimated NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'validé', 'expiré', 'annulé', 'payé')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des items du panier
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des paiements 
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES public.carts(id),
  booking_id UUID REFERENCES public.bookings(id),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'virement', 'especes')),
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'payé', 'échoué', 'remboursé', 'annulé')),
  transaction_id TEXT UNIQUE,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_date TIMESTAMPTZ,
  refund_date TIMESTAMPTZ,
  refund_amount NUMERIC(10,2),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des communications (emails et notifications)
CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'notification_push', 'notification_interne')),
  template_name TEXT,
  destinataire_id UUID REFERENCES auth.users(id),
  destinataire_email TEXT,
  destinataire_phone TEXT,
  sujet TEXT,
  contenu TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'envoyé', 'échoué', 'lu')),
  related_entity_type TEXT CHECK (related_entity_type IN ('cart', 'payment', 'booking', 'application')),
  related_entity_id UUID,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table d'historique des actions admin
CREATE TABLE public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour carts
CREATE POLICY "Clients can manage their own carts" ON public.carts
FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Admin can view all carts" ON public.carts
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update all carts" ON public.carts
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies pour cart_items
CREATE POLICY "Clients can manage their cart items" ON public.cart_items
FOR ALL USING (cart_id IN (SELECT id FROM public.carts WHERE client_id = auth.uid()));

CREATE POLICY "Admin can view all cart items" ON public.cart_items
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies pour payments
CREATE POLICY "Clients can view their payments" ON public.payments
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admin can manage all payments" ON public.payments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create payments" ON public.payments
FOR INSERT WITH CHECK (true);

-- RLS Policies pour communications
CREATE POLICY "Users can view their communications" ON public.communications
FOR SELECT USING (auth.uid() = destinataire_id);

CREATE POLICY "Admin can manage all communications" ON public.communications
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create communications" ON public.communications
FOR INSERT WITH CHECK (true);

-- RLS Policies pour admin_actions_log
CREATE POLICY "Admin can view action logs" ON public.admin_actions_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can create action logs" ON public.admin_actions_log
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers pour updated_at
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour expirer automatiquement les paniers
CREATE OR REPLACE FUNCTION public.expire_old_carts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.carts 
  SET status = 'expiré', updated_at = now()
  WHERE status = 'active' 
    AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Fonction pour calculer le total d'un panier
CREATE OR REPLACE FUNCTION public.calculate_cart_total(cart_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total_amount NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(total_price), 0)
  INTO total_amount
  FROM public.cart_items
  WHERE cart_id = cart_id_param;
  
  RETURN total_amount;
END;
$$;

-- Trigger pour mettre à jour automatiquement le total du panier
CREATE OR REPLACE FUNCTION public.update_cart_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.carts 
    SET total_estimated = public.calculate_cart_total(OLD.cart_id),
        updated_at = now()
    WHERE id = OLD.cart_id;
    RETURN OLD;
  ELSE
    UPDATE public.carts 
    SET total_estimated = public.calculate_cart_total(NEW.cart_id),
        updated_at = now()
    WHERE id = NEW.cart_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER cart_items_update_total
  AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_cart_total();

-- Index pour les performances
CREATE INDEX idx_carts_client_status ON public.carts(client_id, status);
CREATE INDEX idx_carts_expires_at ON public.carts(expires_at) WHERE status = 'active';
CREATE INDEX idx_payments_status_date ON public.payments(status, payment_date DESC);
CREATE INDEX idx_communications_status_type ON public.communications(status, type);
CREATE INDEX idx_admin_actions_date ON public.admin_actions_log(created_at DESC);