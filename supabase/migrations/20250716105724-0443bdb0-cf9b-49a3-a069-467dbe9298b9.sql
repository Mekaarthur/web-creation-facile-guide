-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON public.client_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_requests_created_at ON public.client_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_client_requests_service_type ON public.client_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_client_requests_location ON public.client_requests(location);

-- Add function to automatically create booking from client request
CREATE OR REPLACE FUNCTION public.create_booking_from_request(
  request_id UUID,
  provider_id UUID,
  service_id UUID
) RETURNS UUID AS $$
DECLARE
  new_booking_id UUID;
  request_data RECORD;
BEGIN
  -- Get request data
  SELECT * INTO request_data
  FROM public.client_requests
  WHERE id = request_id AND status = 'new';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Create booking
  INSERT INTO public.bookings (
    client_id,
    provider_id,
    service_id,
    booking_date,
    start_time,
    end_time,
    total_price,
    address,
    notes,
    status
  ) VALUES (
    (SELECT user_id FROM public.profiles WHERE email = request_data.client_email LIMIT 1),
    provider_id,
    service_id,
    COALESCE(request_data.preferred_date, CURRENT_DATE + INTERVAL '1 day'),
    COALESCE(request_data.preferred_time::time, '09:00:00'::time),
    COALESCE(request_data.preferred_time::time, '09:00:00'::time) + INTERVAL '2 hours',
    0.00, -- Price will be calculated later
    request_data.location,
    CONCAT('Demande automatique: ', request_data.service_description, 
           CASE WHEN request_data.additional_notes IS NOT NULL 
           THEN '. Notes: ' || request_data.additional_notes 
           ELSE '' END),
    'pending'
  ) RETURNING id INTO new_booking_id;
  
  -- Update request status
  UPDATE public.client_requests 
  SET status = 'converted', assigned_provider_id = provider_id, updated_at = now()
  WHERE id = request_id;
  
  RETURN new_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to notify providers about new requests
CREATE OR REPLACE FUNCTION public.notify_providers_new_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all verified providers
  INSERT INTO public.provider_notifications (
    provider_id,
    title,
    message,
    type,
    booking_id
  )
  SELECT 
    p.id,
    'Nouvelle demande client',
    CONCAT('Nouveau client recherche: ', NEW.service_type, ' à ', NEW.location),
    'new_request',
    NULL
  FROM public.providers p
  WHERE p.is_verified = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new client requests
DROP TRIGGER IF EXISTS trigger_notify_providers_new_request ON public.client_requests;
CREATE TRIGGER trigger_notify_providers_new_request
  AFTER INSERT ON public.client_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_providers_new_request();

-- Add function to automatically match providers based on location and service type
CREATE OR REPLACE FUNCTION public.get_matching_providers(
  p_service_type TEXT,
  p_location TEXT,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE(
  provider_id UUID,
  business_name TEXT,
  rating NUMERIC,
  location TEXT,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.business_name,
    p.rating,
    p.location,
    (CASE 
      WHEN LOWER(p.location) = LOWER(p_location) THEN 100
      WHEN LOWER(p.location) LIKE '%' || LOWER(p_location) || '%' THEN 80
      WHEN LOWER(p_location) LIKE LOWER(p_location) || '%' THEN 70
      ELSE 50
    END) as match_score
  FROM public.providers p
  WHERE p.is_verified = true
    AND p.description IS NOT NULL
    AND (
      LOWER(p.description) LIKE '%' || LOWER(p_service_type) || '%'
      OR p_service_type = 'Autre'
    )
  ORDER BY match_score DESC, p.rating DESC, p.total_earnings DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for client_requests
ALTER TABLE public.client_requests REPLICA IDENTITY FULL;

-- Add the table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'client_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_requests;
  END IF;
END $$;