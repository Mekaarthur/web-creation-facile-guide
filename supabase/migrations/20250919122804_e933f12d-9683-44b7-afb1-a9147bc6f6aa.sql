-- Ajouter les règles métier clients dans les paramètres de la plateforme
INSERT INTO public.platform_settings (category, key, value, description) VALUES
-- Règles de création de compte
('client_rules', 'account_creation', jsonb_build_object(
  'minimum_age', 18,
  'required_fields', jsonb_build_array('first_name', 'last_name', 'email', 'phone', 'address'),
  'cgu_acceptance_required', true,
  'send_creation_notification', true,
  'verification_required', true
), 'Règles de création et gestion de compte client'),

-- Règles de réservation
('client_rules', 'booking_rules', jsonb_build_object(
  'minimum_duration_hours', 2,
  'platform_only_booking', true,
  'advance_booking_required', true,
  'confirmation_notification', true,
  'details_in_confirmation', jsonb_build_array('service_type', 'date', 'time', 'price', 'provider_info')
), 'Règles de réservation de prestations'),

-- Règles de paiement
('client_rules', 'payment_rules', jsonb_build_object(
  'preauthorization_at_booking', true,
  'charge_after_completion', true,
  'platform_only_payment', true,
  'no_direct_provider_payment', true,
  'supported_methods', jsonb_build_array('card', 'sepa'),
  'currency', 'EUR'
), 'Règles de paiement'),

-- Règles d''annulation
('client_rules', 'cancellation_rules', jsonb_build_object(
  'free_cancellation_hours', 24,
  'first_booking_exception', true,
  'fee_structure', jsonb_build_object(
    'more_than_24h', jsonb_build_object('fee', 0, 'description', 'Aucuns frais'),
    '8_to_24h', jsonb_build_object('fee', 5, 'description', 'Frais forfaitaires de 5€'),
    '4_to_8h', jsonb_build_object('fee', 10, 'description', 'Frais forfaitaires de 10€'),
    '2_to_4h', jsonb_build_object('fee_percent', 50, 'max_fee', 15, 'description', '50% du montant, max 15€'),
    'less_than_2h', jsonb_build_object('fee_percent', 80, 'max_fee', 20, 'description', '80% du montant, max 20€'),
    'after_appointment', jsonb_build_object('fee_percent', 100, 'max_fee', 40, 'description', '100% du montant, max 40€')
  ),
  'late_cancellation_split', jsonb_build_object(
    'provider_share', 50,
    'platform_share', 50,
    'description', 'Partage 50/50 entre prestataire et plateforme'
  ),
  'no_show_timeout_minutes', 30
), 'Règles d''annulation et de non-présentation'),

-- Règles de modification
('client_rules', 'modification_rules', jsonb_build_object(
  'allowed_modifications', jsonb_build_array('date', 'time', 'duration', 'address', 'notes'),
  'modification_deadline_hours', 24,
  'fee_for_late_modification', true,
  'same_fees_as_cancellation', true,
  'provider_approval_required', true
), 'Règles de modification des réservations');