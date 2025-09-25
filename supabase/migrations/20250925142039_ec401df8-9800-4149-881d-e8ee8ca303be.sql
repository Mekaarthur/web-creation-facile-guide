-- Créer une table pour la base de connaissances FAQ
CREATE TABLE public.faq_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour les conversations du chatbot
CREATE TABLE public.chatbot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_phone TEXT,
  user_type TEXT NOT NULL DEFAULT 'anonymous', -- 'client', 'provider', 'anonymous'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'resolved', 'escalated'
  escalated_to_human BOOLEAN DEFAULT false,
  escalated_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour les messages du chatbot
CREATE TABLE public.chatbot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'user', 'bot', 'agent'
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'quick_reply', 'escalation'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour les tickets de support
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'resolved'
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer des FAQ de base
INSERT INTO public.faq_knowledge_base (question, answer, category, keywords) VALUES
('Comment annuler une réservation ?', 'Pour annuler une réservation, rendez-vous dans votre espace personnel, section "Mes réservations", puis cliquez sur "Annuler" à côté de la réservation concernée. L''annulation est gratuite jusqu''à 2h avant le début de la prestation.', 'réservations', ARRAY['annuler', 'annulation', 'réservation', 'booking']),
('Comment obtenir un remboursement ?', 'Les remboursements sont possibles selon nos conditions : annulation gratuite jusqu''à 2h avant, remboursement partiel si annulation prestataire, remboursement intégral si problème de qualité avéré. Contactez notre service client pour toute demande.', 'paiements', ARRAY['remboursement', 'remboursé', 'argent', 'paiement']),
('Comment devenir prestataire ?', 'Pour devenir prestataire, cliquez sur "Nous recrutons" puis remplissez le formulaire de candidature. Nous vérifierons vos documents (pièce d''identité, assurance, diplômes) avant validation. Le processus prend 2-5 jours ouvrés.', 'prestataires', ARRAY['devenir prestataire', 'candidature', 'recrutement', 'inscription']),
('Quels sont vos tarifs ?', 'Nos tarifs varient selon le service : garde d''enfants (25€/h), aide ménagère (22€/h), assistance seniors (28€/h), services premium (35€/h). Les frais de déplacement sont inclus dans un rayon de 10km.', 'tarifs', ARRAY['prix', 'tarif', 'coût', 'combien']),
('Comment contacter le service client ?', 'Vous pouvez nous contacter par chat (disponible 24h/7j), email (contact@bikawo.com) ou téléphone (01 XX XX XX XX) du lundi au vendredi 9h-18h. Pour les urgences, utilisez notre numéro d''urgence 24h/24.', 'contact', ARRAY['contacter', 'contact', 'service client', 'aide']),
('Comment modifier ma réservation ?', 'Pour modifier une réservation, allez dans "Mes réservations" et cliquez sur "Modifier". Les modifications sont possibles jusqu''à 4h avant le début de la prestation. Si moins de 4h, contactez directement votre prestataire.', 'réservations', ARRAY['modifier', 'modification', 'changer', 'réservation']),
('Que faire si mon prestataire ne vient pas ?', 'Si votre prestataire ne se présente pas, contactez immédiatement notre service d''urgence. Nous vous assignerons un prestataire de remplacement dans les plus brefs délais et vous serez remboursé des éventuels frais supplémentaires.', 'problèmes', ARRAY['prestataire absent', 'pas venu', 'ne vient pas', 'urgence']),
('Comment évaluer un prestataire ?', 'Après chaque prestation, vous recevrez un email pour évaluer votre prestataire. Vous pouvez noter la qualité, la ponctualité et laisser un commentaire. Cette évaluation aide les autres clients et améliore nos services.', 'évaluations', ARRAY['noter', 'évaluer', 'avis', 'commentaire']),
('Puis-je demander le même prestataire ?', 'Oui ! Après une première prestation réussie, vous pouvez demander le même prestataire lors de vos prochaines réservations. Allez dans "Mes prestataires favoris" ou précisez-le lors de votre réservation.', 'prestataires', ARRAY['même prestataire', 'favori', 'préféré', 'habituel']),
('Comment fonctionne le paiement ?', 'Le paiement se fait de manière sécurisée par carte bancaire lors de la réservation. Nous acceptons Visa, Mastercard et PayPal. Le paiement n''est débité qu''après confirmation de la prestation par le client.', 'paiements', ARRAY['paiement', 'carte bancaire', 'paypal', 'sécurisé']);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.faq_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour faq_knowledge_base
CREATE POLICY "Anyone can view active FAQ"
ON public.faq_knowledge_base
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage FAQ"
ON public.faq_knowledge_base
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Politiques RLS pour chatbot_conversations
CREATE POLICY "Users can view their conversations"
ON public.chatbot_conversations
FOR SELECT
USING (
  auth.uid() = user_id OR 
  (user_email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can create conversations"
ON public.chatbot_conversations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their conversations"
ON public.chatbot_conversations
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  (user_email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Politiques RLS pour chatbot_messages
CREATE POLICY "Users can view their messages"
ON public.chatbot_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbot_conversations 
    WHERE id = chatbot_messages.conversation_id 
    AND (
      user_id = auth.uid() OR 
      user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can create messages"
ON public.chatbot_messages
FOR INSERT
WITH CHECK (true);

-- Politiques RLS pour support_tickets
CREATE POLICY "Users can view their tickets"
ON public.support_tickets
FOR SELECT
USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  assigned_to = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can create tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Agents can manage tickets"
ON public.support_tickets
FOR UPDATE
USING (
  assigned_to = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faq_knowledge_base_updated_at
  BEFORE UPDATE ON public.faq_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbot_conversations_updated_at
  BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();