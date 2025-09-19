-- Ajouter les règles d'entrée pour la qualification des prestataires
INSERT INTO public.platform_settings (category, key, value, description) VALUES
('qualification', 'legal_status_required', 'true', 'Statut légal obligatoire (micro-entrepreneur, société...)'),
('qualification', 'identity_verification', 'true', 'Vérification obligatoire de la pièce d''identité'),
('qualification', 'insurance_required', 'true', 'Assurance responsabilité civile obligatoire'),
('qualification', 'diploma_required_regulated', 'true', 'Diplômes obligatoires pour les métiers réglementés'),
('qualification', 'initial_selection_enabled', 'true', 'Sélection initiale pour garantir qualité et sécurité'),
('qualification', 'background_check_required', 'false', 'Vérification des antécédents'),
('qualification', 'minimum_experience_years', '0', 'Nombre minimum d''années d''expérience requises'),

-- Ajouter les règles d'appariement (matching client ↔ prestataire)
('matching', 'geographic_zone_priority', 'true', 'Prioriser la zone géographique dans le matching'),
('matching', 'availability_check_enabled', 'true', 'Vérifier les disponibilités du prestataire'),
('matching', 'service_type_matching', 'true', 'Correspondance exacte du type de prestation'),
('matching', 'provider_choice_enabled', 'true', 'Le prestataire reste libre d''accepter ou refuser'),
('matching', 'max_distance_km', '25', 'Distance maximum en km pour le matching'),
('matching', 'response_timeout_hours', '24', 'Délai de réponse du prestataire en heures'),
('matching', 'rating_weight', '30', 'Poids de la note dans l''algorithme (%)'),
('matching', 'distance_weight', '40', 'Poids de la distance dans l''algorithme (%)'),
('matching', 'availability_weight', '30', 'Poids de la disponibilité dans l''algorithme (%)'),

-- Ajouter les paramètres de validation des documents
('validation', 'auto_validation_enabled', 'false', 'Validation automatique des documents'),
('validation', 'manual_review_required', 'true', 'Révision manuelle des candidatures requise'),
('validation', 'validation_timeout_days', '5', 'Délai de validation en jours'),
('validation', 'rejected_reapplication_days', '30', 'Délai avant nouvelle candidature après rejet');