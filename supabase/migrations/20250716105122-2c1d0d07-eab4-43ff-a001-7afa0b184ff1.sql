-- Create table for client requests from Google Forms
CREATE TABLE public.client_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_response_id TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  service_type TEXT NOT NULL,
  service_description TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TEXT,
  budget_range TEXT,
  location TEXT NOT NULL,
  urgency_level TEXT DEFAULT 'normal',
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_provider_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Providers can view all client requests" 
ON public.client_requests 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.providers
  )
);

CREATE POLICY "Providers can update assigned requests" 
ON public.client_requests 
FOR UPDATE 
USING (
  auth.uid() = (
    SELECT user_id FROM public.providers 
    WHERE id = assigned_provider_id
  )
);

CREATE POLICY "System can insert client requests" 
ON public.client_requests 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_requests_updated_at
BEFORE UPDATE ON public.client_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();