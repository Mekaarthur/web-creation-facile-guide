-- 1. D'abord créer les prestataires
INSERT INTO providers (
    user_id, business_name, description, location, hourly_rate, 
    is_verified, status, rating, missions_completed, acceptance_rate,
    work_radius, postal_codes, service_zones
) VALUES 
(
    'a34cdf39-90ca-4c4c-a234-7d6c1c2d54b4',
    'Jean Dupont Jardinage',
    'Spécialiste en entretien de jardins et espaces verts',
    'Paris 16ème',
    25.00,
    true,
    'active',
    4.8,
    15,
    95.00,
    25,
    ARRAY['75016', '75015', '75007'],
    ARRAY['jardinage', 'entretien_espaces_verts']
),
(
    '3260321f-1f3c-43bd-b1ee-ab75244b17fd', 
    'Sophie Martin Garde d''Enfants',
    'Garde d''enfants expérimentée avec références',
    'Paris 17ème',
    18.00,
    true,
    'active', 
    4.9,
    25,
    98.00,
    20,
    ARRAY['75017', '75016', '75008'],
    ARRAY['garde_enfants', 'bika_kids']
);

-- 2. Valider le prestataire existant
UPDATE providers 
SET status = 'active', 
    is_verified = true,
    business_name = 'Marie Philippe Services',
    description = 'Services de ménage et assistance domicile',
    location = 'Paris 15ème',
    hourly_rate = 20.00
WHERE user_id = 'b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b';

-- 3. Créer des réservations simples
INSERT INTO bookings (
    client_id, provider_id, service_id, booking_date, start_time, end_time,
    total_price, address, notes, status
) VALUES
(
    'b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b',
    (SELECT id FROM providers WHERE business_name = 'Marie Philippe Services' LIMIT 1),
    (SELECT id FROM services LIMIT 1),
    CURRENT_DATE + INTERVAL '2 days',
    '14:00:00',
    '17:00:00',
    75.00,
    '123 Avenue de la République, 75015 Paris',
    'Appartement 3 pièces, accès code 1234',
    'confirmed'
),
(
    'a34cdf39-90ca-4c4c-a234-7d6c1c2d54b4',
    (SELECT id FROM providers WHERE business_name = 'Jean Dupont Jardinage' LIMIT 1),
    (SELECT id FROM services LIMIT 1),
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00', 
    '12:00:00',
    90.00,
    '45 Rue des Lilas, 75016 Paris',
    'Taille des haies et entretien pelouse',
    'pending'
);