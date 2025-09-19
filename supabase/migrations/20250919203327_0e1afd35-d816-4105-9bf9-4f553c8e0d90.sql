-- Insérer quelques données de test pour la messagerie admin
-- ATTENTION: Ces données sont uniquement pour les tests

-- Test conversations (utiliser des UUIDs valides existants si possible)
INSERT INTO public.internal_conversations (
  id,
  client_id,
  admin_id,
  subject,
  status,
  created_at,
  last_message_at
) VALUES 
  (
    gen_random_uuid(),
    (SELECT user_id FROM public.profiles LIMIT 1), -- Premier utilisateur trouvé
    (SELECT user_id FROM public.profiles WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LIMIT 1), -- Premier admin trouvé
    'Support technique - Problème de connexion',
    'active',
    now() - interval '2 hours',
    now() - interval '30 minutes'
  ),
  (
    gen_random_uuid(),
    (SELECT user_id FROM public.profiles OFFSET 1 LIMIT 1), -- Deuxième utilisateur
    (SELECT user_id FROM public.profiles WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LIMIT 1),
    'Question sur les tarifs',
    'active',
    now() - interval '1 day',
    now() - interval '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Messages de test
INSERT INTO public.internal_messages (
  conversation_id,
  sender_id,
  receiver_id,
  message_text,
  message_type,
  is_read,
  created_at
)
SELECT 
  ic.id,
  ic.client_id,
  ic.admin_id,
  'Bonjour, j''ai un problème avec mon compte. Pourriez-vous m''aider ?',
  'text',
  false,
  ic.created_at + interval '5 minutes'
FROM public.internal_conversations ic
WHERE ic.subject LIKE '%technique%'
LIMIT 1;

INSERT INTO public.internal_messages (
  conversation_id,
  sender_id,
  receiver_id,
  message_text,
  message_type,
  is_read,
  created_at
)
SELECT 
  ic.id,
  ic.admin_id,
  ic.client_id,
  'Bonjour ! Je vais vous aider avec votre problème. Pouvez-vous me donner plus de détails ?',
  'text',
  true,
  ic.created_at + interval '15 minutes'
FROM public.internal_conversations ic
WHERE ic.subject LIKE '%technique%'
LIMIT 1;

-- S'assurer qu'il y a au moins un admin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;