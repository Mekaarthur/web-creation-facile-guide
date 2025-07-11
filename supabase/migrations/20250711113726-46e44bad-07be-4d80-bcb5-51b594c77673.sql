-- Add provider_documents table for document storage
CREATE TABLE public.provider_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('auto_entrepreneur', 'casier_judiciaire', 'autres_autorisations')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Providers can view their own documents" 
ON public.provider_documents 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_documents.provider_id));

CREATE POLICY "Providers can upload their own documents" 
ON public.provider_documents 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_documents.provider_id));

CREATE POLICY "Providers can update their own documents" 
ON public.provider_documents 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_documents.provider_id));

-- Add SIRET field to providers table
ALTER TABLE public.providers ADD COLUMN siret_number TEXT;

-- Create booking_slots table for multiple time slots per booking
CREATE TABLE public.booking_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_slots
CREATE POLICY "Users can view their booking slots" 
ON public.booking_slots 
FOR SELECT 
USING (auth.uid() = (SELECT client_id FROM public.bookings WHERE id = booking_slots.booking_id) 
       OR auth.uid() = (SELECT providers.user_id FROM public.providers JOIN public.bookings ON providers.id = bookings.provider_id WHERE bookings.id = booking_slots.booking_id));

CREATE POLICY "Users can create booking slots" 
ON public.booking_slots 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT client_id FROM public.bookings WHERE id = booking_slots.booking_id));

-- Create trigger for updated_at
CREATE TRIGGER update_provider_documents_updated_at
BEFORE UPDATE ON public.provider_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-documents', 'provider-documents', false);

-- Create storage policies
CREATE POLICY "Providers can upload their documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can view their documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can update their documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin can view all documents
CREATE POLICY "Admins can view all provider documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'provider-documents' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND (first_name = 'Admin' OR last_name = 'Admin')
));