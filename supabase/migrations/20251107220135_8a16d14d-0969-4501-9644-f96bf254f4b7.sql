-- Create provider_sub_services table to store provider's selected sub-services
CREATE TABLE IF NOT EXISTS public.provider_sub_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  universe_id TEXT NOT NULL,
  sub_service_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, universe_id, sub_service_id)
);

-- Enable Row Level Security
ALTER TABLE public.provider_sub_services ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_sub_services
CREATE POLICY "Providers can view their own sub-services" 
ON public.provider_sub_services 
FOR SELECT 
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can insert their own sub-services" 
ON public.provider_sub_services 
FOR INSERT 
WITH CHECK (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can update their own sub-services" 
ON public.provider_sub_services 
FOR UPDATE 
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can delete their own sub-services" 
ON public.provider_sub_services 
FOR DELETE 
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_provider_sub_services_updated_at
BEFORE UPDATE ON public.provider_sub_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_provider_sub_services_provider_id ON public.provider_sub_services(provider_id);
CREATE INDEX idx_provider_sub_services_universe_id ON public.provider_sub_services(universe_id);
CREATE INDEX idx_provider_sub_services_is_active ON public.provider_sub_services(is_active);