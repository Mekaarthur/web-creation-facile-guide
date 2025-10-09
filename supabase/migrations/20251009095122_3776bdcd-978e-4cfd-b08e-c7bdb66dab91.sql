-- Add cancellation fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('client', 'provider'));

-- Create index on cancelled bookings
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled 
ON public.bookings(status, cancelled_at) 
WHERE status = 'cancelled';

-- Add trigger to log cancellation events
CREATE OR REPLACE FUNCTION public.log_booking_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    INSERT INTO public.admin_actions_log (
      entity_type,
      entity_id,
      action_type,
      old_data,
      new_data,
      description,
      admin_user_id
    ) VALUES (
      'booking',
      NEW.id,
      'cancellation',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', NEW.status,
        'cancelled_by', NEW.cancelled_by,
        'reason', NEW.cancellation_reason
      ),
      CONCAT('Booking cancelled by ', NEW.cancelled_by),
      COALESCE(NEW.client_id, ( SELECT user_id FROM providers WHERE id = NEW.provider_id))
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_booking_cancellation ON public.bookings;
CREATE TRIGGER trigger_log_booking_cancellation
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_cancellation();

-- Add compensation for provider if client cancels < 2h before
CREATE OR REPLACE FUNCTION public.compensate_provider_on_late_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hours_until_booking NUMERIC;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.cancelled_by = 'client' AND NEW.provider_id IS NOT NULL THEN
    -- Calculate hours until booking
    hours_until_booking := EXTRACT(EPOCH FROM (
      (NEW.booking_date::date + NEW.start_time::time)::timestamp - NOW()
    )) / 3600;
    
    -- If less than 2 hours, compensate provider
    IF hours_until_booking < 2 THEN
      INSERT INTO public.provider_compensations (
        provider_id,
        booking_id,
        amount,
        reason,
        status
      ) VALUES (
        NEW.provider_id,
        NEW.id,
        NEW.total_price * 0.3, -- 30% compensation
        'Late cancellation by client (< 2h before)',
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for provider compensation
DROP TRIGGER IF EXISTS trigger_compensate_provider_late_cancel ON public.bookings;
CREATE TRIGGER trigger_compensate_provider_late_cancel
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.compensate_provider_on_late_cancellation();