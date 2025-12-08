
-- Nettoyage complet des données fictives/test

-- 1. Supprimer les tables dépendantes d'abord
DELETE FROM provider_status_history;
DELETE FROM provider_documents;
DELETE FROM provider_notifications;
DELETE FROM provider_invoices;
DELETE FROM provider_compensations;

-- 2. Supprimer les alertes et logs
DELETE FROM system_alerts;
DELETE FROM zone_alerts;

-- 3. Supprimer les messages et conversations
DELETE FROM internal_messages;
DELETE FROM internal_conversations;
DELETE FROM chat_messages;
DELETE FROM chat_conversations;
DELETE FROM chatbot_messages;
DELETE FROM chatbot_conversations;

-- 4. Supprimer les dépendances des bookings
DELETE FROM booking_slots;
DELETE FROM financial_transactions;
DELETE FROM nps_surveys;
DELETE FROM complaints;
DELETE FROM counter_proposals;
DELETE FROM custom_booking_preferences;
DELETE FROM emergency_assignments;
DELETE FROM invoices;

-- 5. Supprimer les reviews
DELETE FROM reviews;

-- 6. Supprimer les bookings
DELETE FROM bookings;

-- 7. Supprimer les candidatures et missions
DELETE FROM candidatures_prestataires;
DELETE FROM missions;
DELETE FROM client_requests;

-- 8. Supprimer les binômes et médiations
DELETE FROM mediations;
DELETE FROM binomes_history;
DELETE FROM binomes;

-- 9. Supprimer les referrals et rewards
DELETE FROM referrals;
DELETE FROM client_rewards;

-- 10. Supprimer les zones associées
DELETE FROM prestataire_zones;
DELETE FROM zone_prestataires;
DELETE FROM zone_clients;

-- 11. Supprimer les job applications et validations
DELETE FROM application_document_validations;
DELETE FROM job_applications;

-- 12. Supprimer les providers
DELETE FROM providers;

-- 13. Supprimer les carts
DELETE FROM cart_items;
DELETE FROM carts;

-- 14. Supprimer les notifications
DELETE FROM notifications;
DELETE FROM realtime_notifications;
DELETE FROM notification_logs;

-- 15. Supprimer autres données
DELETE FROM incidents;
DELETE FROM communications;
DELETE FROM attestations;
DELETE FROM custom_requests;
DELETE FROM gdpr_exports;
DELETE FROM content_reports;
DELETE FROM action_history;
DELETE FROM admin_actions_log;
DELETE FROM security_audit_log;
