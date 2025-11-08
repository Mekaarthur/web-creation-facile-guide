# Triggers de Base de Données pour Notifications Automatiques

Ce fichier contient les triggers SQL à exécuter dans Supabase pour créer automatiquement des notifications admin lors d'événements importants.

## 🔔 Trigger 1: Nouvelle inscription utilisateur (profiles)

```sql
-- Créer une fonction qui envoie une notification admin lors d'une nouvelle inscription
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Pour chaque admin, créer une notification
  FOR admin_record IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO realtime_notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority,
      is_read
    ) VALUES (
      admin_record.user_id,
      'new_user',
      '🧍 Nouvel utilisateur inscrit',
      NEW.first_name || ' ' || NEW.last_name || ' vient de créer un compte',
      jsonb_build_object(
        'user_id', NEW.id,
        'user_name', NEW.first_name || ' ' || NEW.last_name,
        'user_email', NEW.email
      ),
      'normal',
      false
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON profiles;
CREATE TRIGGER trigger_notify_admin_new_user
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_user();
```

## 📅 Trigger 2: Réservation confirmée (bookings)

```sql
-- Notification lorsqu'une réservation change de statut
CREATE OR REPLACE FUNCTION notify_admin_booking_status()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  client_name TEXT;
  service_name TEXT;
BEGIN
  -- Récupérer le nom du client
  SELECT first_name || ' ' || last_name INTO client_name
  FROM profiles WHERE id = NEW.client_id;
  
  -- Récupérer le nom du service
  SELECT name INTO service_name
  FROM services WHERE id = NEW.service_id;
  
  -- Si le statut change vers 'confirmed' ou 'cancelled'
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('confirmed', 'cancelled')) THEN
    FOR admin_record IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO realtime_notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        is_read
      ) VALUES (
        admin_record.user_id,
        CASE 
          WHEN NEW.status = 'confirmed' THEN 'booking_confirmed'
          WHEN NEW.status = 'cancelled' THEN 'booking_cancelled'
        END,
        CASE 
          WHEN NEW.status = 'confirmed' THEN '✅ Réservation confirmée'
          WHEN NEW.status = 'cancelled' THEN '❌ Réservation annulée'
        END,
        client_name || ' - ' || service_name || ' (' || NEW.booking_date::TEXT || ')',
        jsonb_build_object(
          'booking_id', NEW.id,
          'client_name', client_name,
          'service_name', service_name,
          'status', NEW.status,
          'date', NEW.booking_date
        ),
        CASE 
          WHEN NEW.status = 'cancelled' THEN 'high'
          ELSE 'normal'
        END,
        false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_admin_booking_status ON bookings;
CREATE TRIGGER trigger_notify_admin_booking_status
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_admin_booking_status();
```

## 📨 Trigger 3: Nouveau message dans conversations internes

```sql
-- Notification pour nouveau message admin
CREATE OR REPLACE FUNCTION notify_admin_new_message()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  sender_name TEXT;
  conversation_subject TEXT;
BEGIN
  -- Récupérer le nom de l'expéditeur
  SELECT first_name || ' ' || last_name INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;
  
  -- Récupérer le sujet de la conversation
  SELECT subject INTO conversation_subject
  FROM internal_conversations WHERE id = NEW.conversation_id;
  
  -- Notifier tous les admins sauf l'expéditeur
  FOR admin_record IN 
    SELECT user_id FROM user_roles WHERE role = 'admin' AND user_id != NEW.sender_id
  LOOP
    INSERT INTO realtime_notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority,
      is_read
    ) VALUES (
      admin_record.user_id,
      'new_message',
      '📩 Nouveau message',
      sender_name || ': ' || LEFT(NEW.message_text, 50) || '...',
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'sender_name', sender_name,
        'subject', conversation_subject
      ),
      'normal',
      false
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_admin_new_message ON internal_messages;
CREATE TRIGGER trigger_notify_admin_new_message
AFTER INSERT ON internal_messages
FOR EACH ROW
WHEN (NEW.sender_id IS NOT NULL)
EXECUTE FUNCTION notify_admin_new_message();
```

## 🧾 Trigger 4: Facture générée

```sql
-- Notification pour nouvelle facture
CREATE OR REPLACE FUNCTION notify_admin_invoice_created()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO realtime_notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority,
      is_read
    ) VALUES (
      admin_record.user_id,
      'payment',
      '🧾 Facture générée',
      'Facture ' || NEW.invoice_number || ' - ' || NEW.amount_net::TEXT || '€',
      jsonb_build_object(
        'invoice_id', NEW.id,
        'invoice_number', NEW.invoice_number,
        'amount', NEW.amount_net,
        'type', NEW.invoice_type
      ),
      'normal',
      false
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_admin_invoice_created ON client_invoices;
CREATE TRIGGER trigger_notify_admin_invoice_created
AFTER INSERT ON client_invoices
FOR EACH ROW
EXECUTE FUNCTION notify_admin_invoice_created();
```

## 📋 Instructions d'installation

1. **Ouvrir l'éditeur SQL Supabase**
   - Aller dans votre projet Supabase
   - Cliquer sur "SQL Editor"

2. **Exécuter les scripts**
   - Copier-coller chaque bloc SQL ci-dessus
   - Exécuter les scripts un par un
   - Vérifier qu'il n'y a pas d'erreurs

3. **Tester les triggers**
   - Créer un nouveau profil → doit créer une notification
   - Créer une réservation → doit créer une notification
   - etc.

## ⚠️ Notes importantes

- Les triggers utilisent `SECURITY DEFINER` pour avoir les permissions nécessaires
- Ils créent des notifications pour **tous les admins** de la table `user_roles`
- Les notifications sont insérées directement dans `realtime_notifications`
- Le système de temps réel Supabase notifiera automatiquement le frontend

## 🔧 Maintenance

Pour désactiver un trigger temporairement :
```sql
ALTER TABLE profiles DISABLE TRIGGER trigger_notify_admin_new_user;
```

Pour le réactiver :
```sql
ALTER TABLE profiles ENABLE TRIGGER trigger_notify_admin_new_user;
```

Pour supprimer un trigger :
```sql
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON profiles;
DROP FUNCTION IF EXISTS notify_admin_new_user();
```
