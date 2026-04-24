-- Chantier 8 : Hardening des policies publiques (remplacer WITH CHECK true)

-- 1. chatbot_messages
DROP POLICY IF EXISTS "Anyone can create messages" ON public.chatbot_messages;
CREATE POLICY "Anyone can create messages"
ON public.chatbot_messages
FOR INSERT
TO public
WITH CHECK (
  conversation_id IS NOT NULL
  AND message_text IS NOT NULL
  AND length(trim(message_text)) > 0
  AND length(message_text) <= 5000
);

-- 2. client_requests
DROP POLICY IF EXISTS "Anyone can create client requests" ON public.client_requests;
CREATE POLICY "Anyone can create client requests"
ON public.client_requests
FOR INSERT
TO public
WITH CHECK (
  client_email IS NOT NULL AND length(trim(client_email)) > 0
  AND client_name IS NOT NULL AND length(trim(client_name)) > 0
  AND service_description IS NOT NULL AND length(trim(service_description)) > 0
  AND length(service_description) <= 5000
);

-- 3. custom_requests
DROP POLICY IF EXISTS "Anyone can submit custom requests" ON public.custom_requests;
CREATE POLICY "Anyone can submit custom requests"
ON public.custom_requests
FOR INSERT
TO public
WITH CHECK (
  client_email IS NOT NULL AND length(trim(client_email)) > 0
  AND client_name IS NOT NULL AND length(trim(client_name)) > 0
  AND service_description IS NOT NULL AND length(trim(service_description)) > 0
  AND length(service_description) <= 5000
);

-- 4. job_applications
DROP POLICY IF EXISTS "Anyone can submit job applications" ON public.job_applications;
CREATE POLICY "Anyone can submit job applications"
ON public.job_applications
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL AND length(trim(email)) > 0
  AND first_name IS NOT NULL AND length(trim(first_name)) > 0
  AND last_name IS NOT NULL AND length(trim(last_name)) > 0
  AND phone IS NOT NULL AND length(trim(phone)) > 0
  AND motivation IS NOT NULL AND length(trim(motivation)) > 0
);

-- 5. subscribers (newsletter)
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
CREATE POLICY "insert_subscription"
ON public.subscribers
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL
  AND length(trim(email)) > 0
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);