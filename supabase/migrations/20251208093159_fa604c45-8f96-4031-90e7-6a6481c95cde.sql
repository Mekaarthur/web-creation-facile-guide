
-- Mise à jour des noms d'entreprise fictifs vers les noms réels
UPDATE public.providers 
SET business_name = 'Marphil Services', updated_at = now()
WHERE id = '6fc45f2a-a17e-4d5a-ad61-3fbc3e5a2b64';

UPDATE public.providers 
SET business_name = 'Martin Arthur Services', updated_at = now()
WHERE id = '656831a9-84ad-4d0f-8582-b4da491a5882';

-- Log de l'action dans admin_actions_log
INSERT INTO public.admin_actions_log (
  admin_user_id,
  entity_type,
  entity_id,
  action_type,
  old_data,
  new_data,
  description
) VALUES 
(
  'b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b',
  'provider',
  '6fc45f2a-a17e-4d5a-ad61-3fbc3e5a2b64',
  'data_cleanup',
  '{"business_name": "Sophie Martin Garde d''Enfants"}',
  '{"business_name": "Marphil Services"}',
  'Nettoyage données seed - correction nom entreprise'
),
(
  'b51fdfc9-03b1-4ec8-b8f9-a621a1d11a0b',
  'provider',
  '656831a9-84ad-4d0f-8582-b4da491a5882',
  'data_cleanup',
  '{"business_name": "Jean Dupont Jardinage"}',
  '{"business_name": "Martin Arthur Services"}',
  'Nettoyage données seed - correction nom entreprise'
);
