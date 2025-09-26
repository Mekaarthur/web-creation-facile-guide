-- Créer des avis de test avec des IDs de booking valides
INSERT INTO reviews (
    booking_id, client_id, provider_id, rating, comment,
    punctuality_rating, quality_rating, is_approved, created_at
) VALUES
(
    '501771b3-11b4-4832-b0d3-e5ed57636c37',
    'b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b',
    '5744d161-bf7a-47fb-be05-4dec6ae36719',
    5,
    'Excellent service, très professionnelle et ponctuelle. Je recommande vivement !',
    5,
    5,
    false, -- En attente de validation
    NOW() - INTERVAL '1 day'
),
(
    '4605e364-d1e6-411d-8dcb-0c976a35b191',
    'b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b',
    '5744d161-bf7a-47fb-be05-4dec6ae36719',
    4,
    'Bon travail de ménage, appartement impeccable. Prestataire sérieuse.',
    4,
    4,
    false, -- En attente de validation  
    NOW() - INTERVAL '3 hours'
),
(
    '89e5ec01-7a64-412b-8d20-eeee8f938210',
    'a34cdf39-90ca-4c4c-a234-7d6c1c2d54b4',
    '656831a9-84ad-4d0f-8582-b4da491a5882',
    3,
    'Service correct mais en retard de 15 minutes. Travail satisfaisant.',
    3,
    4,
    false, -- En attente de validation
    NOW() - INTERVAL '5 hours'
);