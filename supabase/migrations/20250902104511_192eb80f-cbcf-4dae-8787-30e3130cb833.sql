-- Ensure espace prestataire backend functionality works correctly
-- Check and add missing provider workflow triggers and functions

-- First, let's ensure we have all necessary tables and relationships
-- Add any missing foreign key constraints for provider operations

-- Add provider_responses table if not exists for mission responses
CREATE TABLE IF NOT EXISTS public.provider_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_assignment_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  response_type TEXT NOT NULL CHECK (response_type IN ('accept', 'decline')),
  response_time INTERVAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mission_assignment_id, provider_id)
);

-- Enable RLS on provider_responses
ALTER TABLE public.provider_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_responses
CREATE POLICY "Providers can manage their responses" ON public.provider_responses
FOR ALL USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Add mission_assignments table if not exists
CREATE TABLE IF NOT EXISTS public.mission_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_request_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  location TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TIME,
  budget_max NUMERIC,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  responses_received INTEGER DEFAULT 0,
  assigned_provider_id UUID REFERENCES public.providers(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'assigned', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on mission_assignments
ALTER TABLE public.mission_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for mission_assignments
CREATE POLICY "Providers can view active assignments" ON public.mission_assignments
FOR SELECT USING (status = 'active' AND expires_at > now());

CREATE POLICY "Admin can manage all assignments" ON public.mission_assignments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update providers table to ensure all needed columns exist
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS performance_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS rotation_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_mission_date DATE,
ADD COLUMN IF NOT EXISTS acceptance_rate NUMERIC DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS missions_accepted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mandat_facturation_accepte BOOLEAN DEFAULT false;

-- Create trigger to auto-update performance scores
DROP TRIGGER IF EXISTS update_provider_scores_trigger ON public.provider_responses;
CREATE TRIGGER update_provider_scores_trigger
  AFTER INSERT OR UPDATE ON public.provider_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_scores();

DROP TRIGGER IF EXISTS update_provider_scores_reviews_trigger ON public.reviews;  
CREATE TRIGGER update_provider_scores_reviews_trigger
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_scores();

-- Create trigger for booking completion to generate invoices
DROP TRIGGER IF EXISTS generate_client_invoice_trigger ON public.bookings;
CREATE TRIGGER generate_client_invoice_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.generate_client_invoice_on_completion();

DROP TRIGGER IF EXISTS generate_provider_invoice_trigger ON public.bookings;
CREATE TRIGGER generate_provider_invoice_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.generate_provider_invoice_on_completion();

-- Create provider invoice table if not exists
CREATE TABLE IF NOT EXISTS public.provider_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  booking_id UUID REFERENCES public.bookings(id),
  invoice_number TEXT NOT NULL DEFAULT '',
  amount_brut NUMERIC NOT NULL DEFAULT 0,
  amount_net NUMERIC NOT NULL DEFAULT 0,
  tva_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'paid', 'cancelled')),
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on provider_invoices
ALTER TABLE public.provider_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_invoices
CREATE POLICY "Providers can view their invoices" ON public.provider_invoices
FOR SELECT USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage all provider invoices" ON public.provider_invoices
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to set provider invoice number
DROP TRIGGER IF EXISTS set_provider_invoice_number_trigger ON public.provider_invoices;
CREATE TRIGGER set_provider_invoice_number_trigger
  BEFORE INSERT ON public.provider_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_provider_invoice_number();

-- Create notification system for real-time updates
DROP TRIGGER IF EXISTS notify_provider_new_mission_trigger ON public.bookings;
CREATE TRIGGER notify_provider_new_mission_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (OLD.provider_id IS NULL AND NEW.provider_id IS NOT NULL)
  EXECUTE FUNCTION public.create_conversation_for_booking();