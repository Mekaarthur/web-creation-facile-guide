-- Orphans verified: 0 on all three tables before applying.
-- profiles.user_id is UNIQUE (profiles_user_id_key confirmed).

-- chat_conversations.provider_id → profiles.user_id
ALTER TABLE chat_conversations
  ADD CONSTRAINT chat_conversations_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES profiles(user_id)
  DEFERRABLE INITIALLY DEFERRED;

-- internal_conversations.client_id → profiles.user_id
ALTER TABLE internal_conversations
  ADD CONSTRAINT internal_conversations_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES profiles(user_id)
  DEFERRABLE INITIALLY DEFERRED;

-- internal_conversations.provider_id → profiles.user_id (nullable)
ALTER TABLE internal_conversations
  ADD CONSTRAINT internal_conversations_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES profiles(user_id)
  DEFERRABLE INITIALLY DEFERRED;

-- internal_conversations.admin_id → profiles.user_id (nullable)
ALTER TABLE internal_conversations
  ADD CONSTRAINT internal_conversations_admin_id_fkey
  FOREIGN KEY (admin_id)
  REFERENCES profiles(user_id)
  DEFERRABLE INITIALLY DEFERRED;

-- provider_rewards.provider_id → providers.id
ALTER TABLE provider_rewards
  ADD CONSTRAINT provider_rewards_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES providers(id)
  DEFERRABLE INITIALLY DEFERRED;
