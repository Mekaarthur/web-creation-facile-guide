-- Créer la table des paramètres de la plateforme
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Insérer les paramètres par défaut
INSERT INTO public.platform_settings (category, key, value, description) VALUES
-- Paramètres généraux
('general', 'site_name', '"Bikawo"', 'Nom du site web'),
('general', 'site_description', '"Plateforme de services à domicile"', 'Description du site'),
('general', 'contact_email', '"contact@bikawo.com"', 'Email de contact principal'),
('general', 'default_language', '"fr"', 'Langue par défaut'),
('general', 'timezone', '"Europe/Paris"', 'Fuseau horaire par défaut'),
('general', 'maintenance_mode', 'false', 'Mode maintenance activé/désactivé'),

-- Paramètres de paiement
('payments', 'stripe_enabled', 'true', 'Stripe activé ou non'),
('payments', 'commission_rate', '15', 'Taux de commission en pourcentage'),
('payments', 'minimum_payout', '50', 'Montant minimum de paiement'),
('payments', 'auto_payout', 'true', 'Paiements automatiques activés'),
('payments', 'currency', '"EUR"', 'Devise utilisée'),

-- Paramètres de notifications
('notifications', 'email_notifications', 'true', 'Notifications email activées'),
('notifications', 'sms_notifications', 'false', 'Notifications SMS activées'),
('notifications', 'push_notifications', 'true', 'Notifications push activées'),
('notifications', 'admin_alerts', 'true', 'Alertes admin activées'),

-- Paramètres de sécurité
('security', 'require_email_verification', 'true', 'Vérification email requise'),
('security', 'two_factor_auth', 'false', 'Authentification à deux facteurs'),
('security', 'session_timeout', '24', 'Timeout de session en heures'),
('security', 'password_min_length', '8', 'Longueur minimale des mots de passe'),

-- Paramètres business
('business', 'auto_assignment', 'true', 'Assignation automatique des prestataires'),
('business', 'max_providers_per_request', '5', 'Nombre max de prestataires par demande'),
('business', 'request_timeout_hours', '24', 'Timeout des demandes en heures'),
('business', 'rating_required', 'true', 'Évaluation obligatoire après service');

-- Activer RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Admin can manage platform settings"
ON public.platform_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();