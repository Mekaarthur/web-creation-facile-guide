-- Insérer des services de test
INSERT INTO public.services (name, category, price_per_hour, description) VALUES
('Ménage à domicile', 'Maison', 25.00, 'Service de ménage professionnel'),
('Garde d\'enfants', 'Enfants', 15.00, 'Garde d\'enfants qualifiée'),
('Aide aux seniors', 'Seniors', 20.00, 'Assistance aux personnes âgées'),
('Jardinage', 'Maison', 30.00, 'Entretien des espaces verts'),
('Cours particuliers', 'Enfants', 35.00, 'Soutien scolaire personnalisé'),
('Assistance administrative', 'Business', 40.00, 'Aide pour tâches administratives'),
('Garde d\'animaux', 'Animaux', 18.00, 'Garde et promenade d\'animaux'),
('Bricolage', 'Maison', 45.00, 'Petits travaux et réparations')
ON CONFLICT (name) DO NOTHING;

-- Insérer des demandes client de test
INSERT INTO public.client_requests (
  form_response_id, 
  client_name, 
  client_email, 
  client_phone,
  service_type, 
  service_description, 
  location, 
  preferred_date,
  preferred_time,
  budget_range,
  urgency_level,
  additional_notes
) VALUES
(
  'test-001', 
  'Marie Dupont', 
  'marie.dupont@email.com', 
  '0123456789',
  'Ménage à domicile', 
  'Besoin d\'un ménage complet pour appartement 3 pièces', 
  'Paris 15ème', 
  CURRENT_DATE + INTERVAL '2 days',
  '14:00',
  '50-100€',
  'normal',
  'Disponible en semaine de préférence'
),
(
  'test-002', 
  'Jean Martin', 
  'jean.martin@email.com', 
  '0987654321',
  'Garde d\'enfants', 
  'Garde de deux enfants (5 et 8 ans) pour soirée', 
  'Lyon 6ème', 
  CURRENT_DATE + INTERVAL '1 day',
  '19:00',
  '30-50€',
  'urgent',
  'Enfants très sages, expérience requise'
),
(
  'test-003', 
  'Sophie Leroy', 
  'sophie.leroy@email.com', 
  '0145678901',
  'Jardinage', 
  'Taille des haies et entretien pelouse', 
  'Marseille 8ème', 
  CURRENT_DATE + INTERVAL '5 days',
  '09:00',
  '100-150€',
  'normal',
  'Jardin de 200m²'
)
ON CONFLICT (form_response_id) DO NOTHING;