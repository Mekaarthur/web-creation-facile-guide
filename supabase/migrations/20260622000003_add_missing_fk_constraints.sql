-- profiles.user_id is already UNIQUE (profiles_user_id_key -- confirmed)
-- Data integrity verified: 0 orphan rows in bookings, chat_conversations, providers

-- FK: bookings.client_id -> profiles.user_id
-- Enables PostgREST: profiles!bookings_client_profile_fkey(...)
ALTER TABLE bookings
  ADD CONSTRAINT bookings_client_profile_fkey
  FOREIGN KEY (client_id)
  REFERENCES profiles(user_id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- FK: chat_conversations.client_id -> profiles.user_id
-- Enables PostgREST: profiles!chat_conversations_client_id_fkey(...)
ALTER TABLE chat_conversations
  ADD CONSTRAINT chat_conversations_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES profiles(user_id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- FK: providers.user_id -> profiles.user_id
-- Enables PostgREST: providers nested join to profiles
ALTER TABLE providers
  ADD CONSTRAINT providers_user_profile_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(user_id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;
