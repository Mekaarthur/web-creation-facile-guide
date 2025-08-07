-- Créer la table provider_availability pour le calendrier des prestataires
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_provider_availability_provider FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_availability
CREATE POLICY "Users can view their own availability" 
ON public.provider_availability 
FOR SELECT 
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own availability" 
ON public.provider_availability 
FOR INSERT 
WITH CHECK (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own availability" 
ON public.provider_availability 
FOR UPDATE 
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own availability" 
ON public.provider_availability 
FOR DELETE 
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_provider_availability_updated_at
BEFORE UPDATE ON public.provider_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();