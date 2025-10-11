-- ============================================
-- MIGRATION: Priorité Moyenne - Storage + RPCs Système + Paiements
-- ============================================

-- 1. Créer le bucket storage pour brand-assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le bucket brand-assets
CREATE POLICY "Admin upload brand assets" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update brand assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete brand assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read brand assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'brand-assets');

-- ============================================
-- FONCTIONS RPC OUTILS SYSTÈME
-- ============================================

-- 2. Fonction cleanup_data pour nettoyer les données anciennes
CREATE OR REPLACE FUNCTION public.cleanup_data(cleanup_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Vérifier les permissions admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent effectuer des nettoyages';
  END IF;
  
  CASE cleanup_type
    WHEN 'old_notifications' THEN
      -- Supprimer les notifications lues de plus de 30 jours
      DELETE FROM public.realtime_notifications
      WHERE is_read = true 
        AND created_at < NOW() - INTERVAL '30 days';
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
    WHEN 'expired_carts' THEN
      -- Supprimer les paniers expirés de plus de 7 jours
      DELETE FROM public.carts
      WHERE status = 'expiré' 
        AND expires_at < NOW() - INTERVAL '7 days';
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
    WHEN 'old_conversations' THEN
      -- Supprimer les conversations anonymes abandonnées
      DELETE FROM public.chatbot_conversations
      WHERE user_type = 'anonymous'
        AND status = 'active'
        AND created_at < NOW() - INTERVAL '48 hours'
        AND NOT EXISTS (
          SELECT 1 FROM public.chatbot_messages
          WHERE chatbot_messages.conversation_id = chatbot_conversations.id
        );
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
    WHEN 'old_logs' THEN
      -- Supprimer les logs de plus de 90 jours
      DELETE FROM public.notification_logs
      WHERE created_at < NOW() - INTERVAL '90 days';
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
    WHEN 'all' THEN
      -- Exécuter tous les nettoyages
      PERFORM public.cleanup_data('old_notifications');
      PERFORM public.cleanup_data('expired_carts');
      PERFORM public.cleanup_data('old_conversations');
      PERFORM public.cleanup_data('old_logs');
      deleted_count := 0; -- Total non calculé pour 'all'
      
    ELSE
      RAISE EXCEPTION 'Type de nettoyage non reconnu: %', cleanup_type;
  END CASE;
  
  -- Logger l'action
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    new_data,
    description
  ) VALUES (
    auth.uid(),
    'system_maintenance',
    gen_random_uuid(),
    'cleanup',
    jsonb_build_object(
      'cleanup_type', cleanup_type,
      'deleted_count', deleted_count
    ),
    CONCAT('Nettoyage ', cleanup_type, ': ', deleted_count, ' éléments supprimés')
  );
  
  RETURN deleted_count;
END;
$$;

-- 3. Fonction run_system_diagnostics pour diagnostics système
CREATE OR REPLACE FUNCTION public.run_system_diagnostics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  db_size BIGINT;
  table_stats JSONB;
  performance_stats JSONB;
BEGIN
  -- Vérifier les permissions admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent exécuter les diagnostics';
  END IF;
  
  -- Taille de la base de données
  SELECT pg_database_size(current_database()) INTO db_size;
  
  -- Statistiques des tables principales
  SELECT jsonb_object_agg(
    table_name,
    jsonb_build_object(
      'row_count', row_count,
      'total_size', pg_size_pretty(total_size)
    )
  ) INTO table_stats
  FROM (
    SELECT 
      schemaname || '.' || tablename AS table_name,
      n_live_tup AS row_count,
      pg_total_relation_size(schemaname || '.' || tablename) AS total_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC
    LIMIT 20
  ) t;
  
  -- Statistiques de performance
  SELECT jsonb_build_object(
    'active_users', (SELECT COUNT(DISTINCT user_id) FROM profiles WHERE updated_at > NOW() - INTERVAL '24 hours'),
    'total_bookings', (SELECT COUNT(*) FROM bookings),
    'active_providers', (SELECT COUNT(*) FROM providers WHERE status = 'active' AND is_verified = true),
    'pending_missions', (SELECT COUNT(*) FROM missions WHERE status = 'pending'),
    'unread_notifications', (SELECT COUNT(*) FROM realtime_notifications WHERE is_read = false),
    'active_carts', (SELECT COUNT(*) FROM carts WHERE status = 'active'),
    'expired_carts', (SELECT COUNT(*) FROM carts WHERE status = 'expiré'),
    'pending_payments', (SELECT COUNT(*) FROM payments WHERE status = 'en_attente')
  ) INTO performance_stats;
  
  result := jsonb_build_object(
    'timestamp', NOW(),
    'database_size', pg_size_pretty(db_size),
    'database_size_bytes', db_size,
    'table_statistics', table_stats,
    'performance_metrics', performance_stats,
    'health_status', CASE 
      WHEN db_size < 1000000000 THEN 'excellent'
      WHEN db_size < 5000000000 THEN 'good'
      ELSE 'needs_attention'
    END
  );
  
  -- Logger le diagnostic
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    new_data,
    description
  ) VALUES (
    auth.uid(),
    'system_diagnostics',
    gen_random_uuid(),
    'diagnostics_run',
    result,
    'Diagnostics système exécutés'
  );
  
  RETURN result;
END;
$$;

-- ============================================
-- FONCTIONS RPC PAIEMENTS
-- ============================================

-- 4. Fonction retry_failed_payment pour réessayer un paiement échoué
CREATE OR REPLACE FUNCTION public.retry_failed_payment(p_payment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record RECORD;
  result JSONB;
BEGIN
  -- Vérifier les permissions admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent réessayer les paiements';
  END IF;
  
  -- Récupérer le paiement
  SELECT * INTO payment_record
  FROM public.payments
  WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paiement non trouvé';
  END IF;
  
  -- Vérifier que le paiement est en échec
  IF payment_record.status NOT IN ('echoue', 'en_attente') THEN
    RAISE EXCEPTION 'Le paiement n''est pas en échec (statut actuel: %)', payment_record.status;
  END IF;
  
  -- Mettre à jour le statut pour retry
  UPDATE public.payments
  SET 
    status = 'en_cours',
    updated_at = NOW(),
    admin_notes = CONCAT(
      COALESCE(admin_notes, ''), 
      E'\n[', NOW()::TEXT, '] Retry initié par admin'
    )
  WHERE id = p_payment_id;
  
  -- Logger l'action
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    old_data,
    new_data,
    description
  ) VALUES (
    auth.uid(),
    'payment',
    p_payment_id,
    'retry_payment',
    jsonb_build_object('status', payment_record.status),
    jsonb_build_object('status', 'en_cours'),
    CONCAT('Retry paiement ', payment_record.transaction_id)
  );
  
  result := jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'old_status', payment_record.status,
    'new_status', 'en_cours',
    'message', 'Paiement en cours de retry'
  );
  
  RETURN result;
END;
$$;

-- 5. Fonction confirm_payment_manually pour confirmer manuellement un paiement
CREATE OR REPLACE FUNCTION public.confirm_payment_manually(
  p_payment_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record RECORD;
  result JSONB;
BEGIN
  -- Vérifier les permissions admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent confirmer les paiements';
  END IF;
  
  -- Récupérer le paiement
  SELECT * INTO payment_record
  FROM public.payments
  WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paiement non trouvé';
  END IF;
  
  -- Vérifier que le paiement n'est pas déjà complété
  IF payment_record.status = 'complete' THEN
    RAISE EXCEPTION 'Le paiement est déjà complété';
  END IF;
  
  -- Mettre à jour le paiement
  UPDATE public.payments
  SET 
    status = 'complete',
    payment_date = NOW(),
    updated_at = NOW(),
    admin_notes = CONCAT(
      COALESCE(admin_notes, ''), 
      E'\n[', NOW()::TEXT, '] Confirmé manuellement par admin',
      CASE WHEN p_notes IS NOT NULL THEN CONCAT(E'\nNotes: ', p_notes) ELSE '' END
    )
  WHERE id = p_payment_id;
  
  -- Mettre à jour le booking associé si existant
  IF payment_record.booking_id IS NOT NULL THEN
    UPDATE public.bookings
    SET status = 'confirmed'
    WHERE id = payment_record.booking_id
      AND status IN ('pending', 'assigned');
  END IF;
  
  -- Logger l'action
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    old_data,
    new_data,
    description
  ) VALUES (
    auth.uid(),
    'payment',
    p_payment_id,
    'manual_confirmation',
    jsonb_build_object('status', payment_record.status),
    jsonb_build_object('status', 'complete', 'notes', p_notes),
    CONCAT('Paiement confirmé manuellement: ', payment_record.transaction_id)
  );
  
  result := jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'old_status', payment_record.status,
    'new_status', 'complete',
    'amount', payment_record.amount,
    'message', 'Paiement confirmé avec succès'
  );
  
  RETURN result;
END;
$$;