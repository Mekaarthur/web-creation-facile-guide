-- Add support for flexible booking with custom hours and dates
ALTER TABLE public.bookings 
ADD COLUMN flexible_hours boolean DEFAULT false,
ADD COLUMN custom_duration integer,
ADD COLUMN hourly_rate numeric;

-- Create table for custom booking preferences
CREATE TABLE public.custom_booking_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  preferred_dates date[],
  preferred_times text[],
  duration_hours integer NOT NULL,
  special_requirements text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on custom_booking_preferences
ALTER TABLE public.custom_booking_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_booking_preferences
CREATE POLICY "Users can view their booking preferences" 
ON public.custom_booking_preferences 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings 
    WHERE client_id = auth.uid() 
    OR provider_id = (SELECT id FROM public.providers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Clients can create booking preferences" 
ON public.custom_booking_preferences 
FOR INSERT 
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE client_id = auth.uid()
  )
);

CREATE POLICY "Users can update their booking preferences" 
ON public.custom_booking_preferences 
FOR UPDATE 
USING (
  booking_id IN (
    SELECT id FROM public.bookings 
    WHERE client_id = auth.uid() 
    OR provider_id = (SELECT id FROM public.providers WHERE user_id = auth.uid())
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_booking_preferences_updated_at
BEFORE UPDATE ON public.custom_booking_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();