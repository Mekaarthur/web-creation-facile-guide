-- Create table for custom client requests
CREATE TABLE IF NOT EXISTS public.custom_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  service_description TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TEXT,
  budget_range TEXT,
  location TEXT NOT NULL,
  urgency_level TEXT DEFAULT 'normal',
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit custom requests" 
ON public.custom_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can view all custom requests" 
ON public.custom_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid()
));

-- Create table for job applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  experience_years INTEGER,
  availability TEXT NOT NULL,
  motivation TEXT NOT NULL,
  has_transport BOOLEAN DEFAULT false,
  certifications TEXT,
  cv_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit job applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can view all job applications" 
ON public.job_applications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_custom_requests_updated_at
BEFORE UPDATE ON public.custom_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();