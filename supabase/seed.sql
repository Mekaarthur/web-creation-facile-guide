-- Script de données de test pour la plateforme Assist
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Insérer des services de base
INSERT INTO public.services (name, description, category, price_per_hour, is_active) VALUES
('Ménage à domicile', 'Service de ménage complet pour votre domicile', 'Maison', 25.00, true),
('Garde d''enfants', 'Garde d''enfants professionnelle à domicile', 'Enfants', 15.00, true),
('Jardinage', 'Entretien de jardin et espaces verts', 'Maison', 30.00, true),
('Aide aux seniors', 'Accompagnement et aide aux personnes âgées', 'Seniors', 20.00, true),
('Soutien scolaire', 'Cours particuliers et aide aux devoirs', 'Enfants', 25.00, true),
('Assistance administrative', 'Aide pour démarches administratives', 'Business', 35.00, true),
('Garde d''animaux', 'Garde et promenade d''animaux de compagnie', 'Animaux', 18.00, true),
('Conciergerie premium', 'Services de conciergerie haut de gamme', 'Premium', 50.00, true),
('Assistance voyage', 'Organisation et accompagnement voyage', 'Voyage', 40.00, true);

-- Insérer des profils utilisateurs de test
INSERT INTO public.profiles (user_id, first_name, last_name) VALUES
('11111111-1111-1111-1111-111111111111', 'Marie', 'Dupont'),
('22222222-2222-2222-2222-222222222222', 'Jean', 'Martin'),
('33333333-3333-3333-3333-333333333333', 'Sophie', 'Bernard'),
('44444444-4444-4444-4444-444444444444', 'Pierre', 'Durand'),
('55555555-5555-5555-5555-555555555555', 'Alice', 'Moreau'),
('66666666-6666-6666-6666-666666666666', 'Thomas', 'Petit');

-- Insérer des prestataires de test
INSERT INTO public.providers (user_id, business_name, description, location, hourly_rate, rating, is_verified, total_earnings, monthly_earnings, missions_completed, missions_accepted, acceptance_rate) VALUES
('11111111-1111-1111-1111-111111111111', 'CleanPro Services', 'Spécialiste du ménage résidentiel et commercial depuis 10 ans', 'Paris 15ème', 28.00, 4.8, true, 2500.00, 850.00, 45, 50, 90.0),
('22222222-2222-2222-2222-222222222222', 'KidsCare Plus', 'Garde d''enfants certifiée avec formation petite enfance', 'Boulogne-Billancourt', 18.00, 4.9, true, 1800.00, 600.00, 32, 35, 91.4),
('33333333-3333-3333-3333-333333333333', 'Green Garden', 'Paysagiste professionnel pour tous vos espaces verts', 'Versailles', 32.00, 4.7, true, 3200.00, 1100.00, 28, 30, 93.3),
('44444444-4444-4444-4444-444444444444', 'SeniorCare Assistance', 'Aide à domicile spécialisée pour personnes âgées', 'Neuilly-sur-Seine', 22.00, 4.6, true, 1950.00, 650.00, 38, 42, 90.5),
('55555555-5555-5555-5555-555555555555', 'EduSoutien', 'Professeure certifiée donnant des cours particuliers', 'Paris 16ème', 30.00, 4.9, true, 2100.00, 750.00, 25, 26, 96.2),
('66666666-6666-6666-6666-666666666666', 'AdminExpert', 'Consultant en démarches administratives', 'La Défense', 40.00, 4.5, false, 1200.00, 400.00, 15, 18, 83.3);

-- Associer des services aux prestataires
INSERT INTO public.provider_services (provider_id, service_id, price_override, is_active) VALUES
-- Marie (CleanPro Services) - Ménage
((SELECT id FROM public.providers WHERE user_id = '11111111-1111-1111-1111-111111111111'), (SELECT id FROM public.services WHERE name = 'Ménage à domicile'), 28.00, true),

-- Jean (KidsCare Plus) - Garde d'enfants et soutien scolaire
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), (SELECT id FROM public.services WHERE name = 'Garde d''enfants'), 18.00, true),
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), (SELECT id FROM public.services WHERE name = 'Soutien scolaire'), 22.00, true),

-- Sophie (Green Garden) - Jardinage
((SELECT id FROM public.providers WHERE user_id = '33333333-3333-3333-3333-333333333333'), (SELECT id FROM public.services WHERE name = 'Jardinage'), 32.00, true),

-- Pierre (SeniorCare) - Aide aux seniors
((SELECT id FROM public.providers WHERE user_id = '44444444-4444-4444-4444-444444444444'), (SELECT id FROM public.services WHERE name = 'Aide aux seniors'), 22.00, true),

-- Alice (EduSoutien) - Soutien scolaire
((SELECT id FROM public.providers WHERE user_id = '55555555-5555-5555-5555-555555555555'), (SELECT id FROM public.services WHERE name = 'Soutien scolaire'), 30.00, true),

-- Thomas (AdminExpert) - Assistance administrative
((SELECT id FROM public.providers WHERE user_id = '66666666-6666-6666-6666-666666666666'), (SELECT id FROM public.services WHERE name = 'Assistance administrative'), 40.00, true);

-- Ajouter des disponibilités pour les prestataires
INSERT INTO public.provider_availability (provider_id, day_of_week, start_time, end_time, is_available) VALUES
-- Marie (CleanPro Services) - Lundi à Vendredi 8h-18h
((SELECT id FROM public.providers WHERE user_id = '11111111-1111-1111-1111-111111111111'), 1, '08:00', '18:00', true),
((SELECT id FROM public.providers WHERE user_id = '11111111-1111-1111-1111-111111111111'), 2, '08:00', '18:00', true),
((SELECT id FROM public.providers WHERE user_id = '11111111-1111-1111-1111-111111111111'), 3, '08:00', '18:00', true),
((SELECT id FROM public.providers WHERE user_id = '11111111-1111-1111-1111-111111111111'), 4, '08:00', '18:00', true),
((SELECT id FROM public.providers WHERE user_id = '11111111-1111-1111-1111-111111111111'), 5, '08:00', '18:00', true),

-- Jean (KidsCare Plus) - Lundi à Samedi 7h-20h
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), 1, '07:00', '20:00', true),
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), 2, '07:00', '20:00', true),
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), 3, '07:00', '20:00', true),
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), 4, '07:00', '20:00', true),
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), 5, '07:00', '20:00', true),
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), 6, '09:00', '17:00', true),

-- Sophie (Green Garden) - Mardi à Samedi 9h-17h
((SELECT id FROM public.providers WHERE user_id = '33333333-3333-3333-3333-333333333333'), 2, '09:00', '17:00', true),
((SELECT id FROM public.providers WHERE user_id = '33333333-3333-3333-3333-333333333333'), 3, '09:00', '17:00', true),
((SELECT id FROM public.providers WHERE user_id = '33333333-3333-3333-3333-333333333333'), 4, '09:00', '17:00', true),
((SELECT id FROM public.providers WHERE user_id = '33333333-3333-3333-3333-333333333333'), 5, '09:00', '17:00', true),
((SELECT id FROM public.providers WHERE user_id = '33333333-3333-3333-3333-333333333333'), 6, '09:00', '17:00', true);

-- Insérer quelques demandes clients de test
INSERT INTO public.client_requests (form_response_id, client_name, client_email, client_phone, service_type, service_description, location, preferred_date, preferred_time, budget_range, urgency_level, additional_notes, status) VALUES
('form_001', 'Isabelle Rousseau', 'isabelle.rousseau@email.com', '0123456789', 'Ménage à domicile', 'Besoin d''un ménage complet pour appartement 3 pièces', 'Paris 14ème', '2025-01-20', '14:00', '50-80€', 'normal', 'Appartement au 3ème étage sans ascenseur', 'new'),
('form_002', 'Marc Legrand', 'marc.legrand@email.com', '0123456790', 'Garde d''enfants', 'Garde pour 2 enfants (5 et 8 ans) le mercredi après-midi', 'Boulogne-Billancourt', '2025-01-22', '13:30', '30-50€', 'normal', 'Les enfants aiment les activités manuelles', 'new'),
('form_003', 'Catherine Dubois', 'catherine.dubois@email.com', '0123456791', 'Jardinage', 'Taille des haies et entretien pelouse', 'Versailles', '2025-01-25', '10:00', '80-120€', 'urgent', 'Jardin de 200m² environ', 'new'),
('form_004', 'Henri Moreau', 'henri.moreau@email.com', '0123456792', 'Aide aux seniors', 'Accompagnement pour courses et ménage léger', 'Neuilly-sur-Seine', '2025-01-18', '09:00', '40-60€', 'normal', 'Personne de 82 ans, très autonome', 'new');

-- Insérer quelques notifications de test
INSERT INTO public.provider_notifications (provider_id, title, message, type, is_read) VALUES
((SELECT id FROM public.providers WHERE user_id = '11111111-1111-1111-1111-111111111111'), 'Nouvelle demande', 'Demande de ménage à Paris 14ème disponible', 'new_request', false),
((SELECT id FROM public.providers WHERE user_id = '22222222-2222-2222-2222-222222222222'), 'Nouvelle demande', 'Garde d''enfants à Boulogne-Billancourt', 'new_request', false),
((SELECT id FROM public.providers WHERE user_id = '33333333-3333-3333-3333-333333333333'), 'Demande urgente', 'Jardinage urgent à Versailles', 'urgent_request', false);

-- Mettre à jour les timestamps de dernière activité
UPDATE public.providers 
SET last_activity_at = now() - interval '2 hours' 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

UPDATE public.providers 
SET last_activity_at = now() - interval '1 day' 
WHERE user_id = '22222222-2222-2222-2222-222222222222';

UPDATE public.providers 
SET last_activity_at = now() - interval '3 hours' 
WHERE user_id = '33333333-3333-3333-3333-333333333333';

COMMIT;