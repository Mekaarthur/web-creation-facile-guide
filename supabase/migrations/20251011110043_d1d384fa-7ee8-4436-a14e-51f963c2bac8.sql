-- RPC pour valider un panier manuellement et créer les bookings
CREATE OR REPLACE FUNCTION public.validate_cart_manually(
  p_cart_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cart_record RECORD;
  cart_item RECORD;
  new_booking_id UUID;
  bookings_created INTEGER := 0;
  result JSONB;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Seuls les admins peuvent valider des paniers';
  END IF;
  
  -- Récupérer le panier
  SELECT * INTO cart_record
  FROM public.carts
  WHERE id = p_cart_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Panier non trouvé';
  END IF;
  
  -- Vérifier que le panier n'est pas déjà validé
  IF cart_record.status = 'validé' THEN
    RAISE EXCEPTION 'Ce panier a déjà été validé';
  END IF;
  
  -- Créer un booking pour chaque cart_item
  FOR cart_item IN 
    SELECT ci.*, s.name as service_name, s.category
    FROM public.cart_items ci
    JOIN public.services s ON s.id = ci.service_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    -- Créer le booking
    INSERT INTO public.bookings (
      client_id,
      service_id,
      booking_date,
      start_time,
      end_time,
      address,
      total_price,
      status,
      notes,
      created_at
    ) VALUES (
      cart_record.client_id,
      cart_item.service_id,
      COALESCE(cart_item.booking_date, CURRENT_DATE + INTERVAL '1 day'),
      COALESCE(cart_item.start_time, '09:00'::TIME),
      COALESCE(cart_item.end_time, '17:00'::TIME),
      COALESCE(cart_item.address, 'À définir'),
      cart_item.total_price,
      'pending',
      CONCAT(
        'Créé depuis panier validé manuellement',
        CASE WHEN p_admin_notes IS NOT NULL THEN ' - ' || p_admin_notes ELSE '' END,
        CASE WHEN cart_item.notes IS NOT NULL THEN E'\nNotes client: ' || cart_item.notes ELSE '' END
      ),
      NOW()
    ) RETURNING id INTO new_booking_id;
    
    bookings_created := bookings_created + 1;
    
    -- Notifier le client
    INSERT INTO public.realtime_notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority
    ) VALUES (
      cart_record.client_id,
      'cart_validated',
      'Panier validé',
      CONCAT('Votre panier a été validé et ', bookings_created, ' réservation(s) créée(s).'),
      jsonb_build_object(
        'cart_id', p_cart_id,
        'booking_id', new_booking_id
      ),
      'normal'
    );
  END LOOP;
  
  -- Mettre à jour le statut du panier
  UPDATE public.carts
  SET 
    status = 'validé',
    updated_at = NOW()
  WHERE id = p_cart_id;
  
  -- Logger l'action admin
  INSERT INTO public.admin_actions_log (
    admin_user_id,
    entity_type,
    entity_id,
    action_type,
    new_data,
    description
  ) VALUES (
    auth.uid(),
    'cart',
    p_cart_id,
    'validate_manually',
    jsonb_build_object(
      'bookings_created', bookings_created,
      'cart_total', cart_record.total_estimated,
      'admin_notes', p_admin_notes
    ),
    CONCAT('Panier validé manuellement - ', bookings_created, ' réservation(s) créée(s)')
  );
  
  result := jsonb_build_object(
    'success', true,
    'bookings_created', bookings_created,
    'cart_id', p_cart_id,
    'total_amount', cart_record.total_estimated
  );
  
  RETURN result;
END;
$$;

-- Améliorer la RPC expire_old_carts existante
CREATE OR REPLACE FUNCTION public.expire_old_carts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER := 0;
BEGIN
  -- Expirer les paniers actifs dont la date d'expiration est dépassée
  UPDATE public.carts
  SET 
    status = 'expiré',
    updated_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Logger l'action si des paniers ont été expirés
  IF expired_count > 0 THEN
    INSERT INTO public.admin_actions_log (
      admin_user_id,
      entity_type,
      entity_id,
      action_type,
      new_data,
      description
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      'carts',
      gen_random_uuid(),
      'auto_expire',
      jsonb_build_object('expired_count', expired_count),
      CONCAT(expired_count, ' panier(s) expiré(s) automatiquement')
    );
  END IF;
  
  RETURN expired_count;
END;
$$;