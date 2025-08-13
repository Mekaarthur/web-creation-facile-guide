-- Étendre la table job_applications avec tous les champs requis
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS service_categories TEXT[],
ADD COLUMN IF NOT EXISTS availability_days TEXT[],
ADD COLUMN IF NOT EXISTS availability_hours TEXT,
ADD COLUMN IF NOT EXISTS coverage_address TEXT,
ADD COLUMN IF NOT EXISTS coverage_radius INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
ADD COLUMN IF NOT EXISTS forfait_rates JSONB,
ADD COLUMN IF NOT EXISTS identity_document_url TEXT,
ADD COLUMN IF NOT EXISTS diploma_urls TEXT[],
ADD COLUMN IF NOT EXISTS insurance_document_url TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS application_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS siret_number TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Créer une table pour les bucket de stockage des documents prestataires si elle n'existe pas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('provider-applications', 'provider-applications', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour le bucket provider-applications
CREATE POLICY "Users can upload their application documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'provider-applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their application documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'provider-applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admin can view all application documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'provider-applications' AND has_role(auth.uid(), 'admin'));

-- Fonction pour créer automatiquement un profil prestataire depuis une candidature validée
CREATE OR REPLACE FUNCTION public.create_provider_from_application(application_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  application_data RECORD;
  user_data RECORD;
  new_provider_id UUID;
BEGIN
  -- Récupérer les données de la candidature
  SELECT * INTO application_data
  FROM public.job_applications
  WHERE id = application_id AND status = 'validated';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not validated';
  END IF;
  
  -- Créer ou récupérer l'utilisateur
  SELECT * INTO user_data
  FROM auth.users 
  WHERE email = application_data.email
  LIMIT 1;
  
  -- Si l'utilisateur n'existe pas, créer le profil quand même (sera lié plus tard)
  INSERT INTO public.providers (
    user_id,
    business_name,
    description,
    location,
    postal_codes,
    service_zones,
    hourly_rate,
    work_radius,
    profile_photo_url,
    identity_document_url,
    insurance_document_url,
    diploma_document_url,
    status,
    quality_agreement_signed,
    created_at
  ) VALUES (
    user_data.id, -- Peut être NULL si l'utilisateur n'existe pas encore
    application_data.business_name,
    application_data.description,
    CONCAT(application_data.city, ' ', application_data.postal_code),
    ARRAY[application_data.postal_code],
    application_data.service_categories,
    application_data.hourly_rate,
    application_data.coverage_radius,
    application_data.profile_photo_url,
    application_data.identity_document_url,
    application_data.insurance_document_url,
    CASE WHEN array_length(application_data.diploma_urls, 1) > 0 
         THEN application_data.diploma_urls[1] 
         ELSE NULL END,
    'active',
    true,
    now()
  ) RETURNING id INTO new_provider_id;
  
  -- Créer les disponibilités du prestataire
  IF application_data.availability_days IS NOT NULL THEN
    INSERT INTO public.provider_availability (
      provider_id,
      day_of_week,
      start_time,
      end_time,
      is_available
    )
    SELECT 
      new_provider_id,
      CASE day_name
        WHEN 'lundi' THEN 1
        WHEN 'mardi' THEN 2
        WHEN 'mercredi' THEN 3
        WHEN 'jeudi' THEN 4
        WHEN 'vendredi' THEN 5
        WHEN 'samedi' THEN 6
        WHEN 'dimanche' THEN 0
      END,
      '09:00:00'::time,
      '18:00:00'::time,
      true
    FROM unnest(application_data.availability_days) AS day_name
    WHERE day_name IN ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche');
  END IF;
  
  -- Marquer la candidature comme convertie
  UPDATE public.job_applications 
  SET 
    status = 'converted',
    admin_comments = CONCAT(COALESCE(admin_comments, ''), '\nConverti en prestataire le ', now()::date)
  WHERE id = application_id;
  
  RETURN new_provider_id;
END;
$$;