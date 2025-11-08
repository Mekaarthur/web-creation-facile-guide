-- Fonction pour créer automatiquement un prestataire lors de l'approbation d'une candidature
CREATE OR REPLACE FUNCTION public.create_provider_from_approved_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id UUID;
  temp_password TEXT;
  provider_id UUID;
BEGIN
  -- Vérifier si le statut passe à 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Vérifier si un utilisateur existe déjà avec cet email
    SELECT id INTO new_user_id
    FROM auth.users
    WHERE email = NEW.email
    LIMIT 1;
    
    -- Si l'utilisateur n'existe pas, créer un compte auth
    IF new_user_id IS NULL THEN
      -- Générer un mot de passe temporaire
      temp_password := encode(gen_random_bytes(16), 'hex');
      
      -- Créer l'utilisateur dans auth.users via la fonction admin
      new_user_id := extensions.uuid_generate_v4();
      
      -- Note: Dans un vrai système, utilisez l'API Admin de Supabase
      -- Pour l'instant, on va créer juste le profil et le role
      -- L'admin devra inviter l'utilisateur manuellement
    END IF;
    
    -- Si on a toujours pas d'user_id, créer un profil temporaire
    IF new_user_id IS NULL THEN
      -- Créer un UUID pour le profil en attendant que l'utilisateur s'inscrive
      new_user_id := gen_random_uuid();
    END IF;
    
    -- Créer ou mettre à jour le profil
    INSERT INTO public.profiles (
      user_id,
      first_name,
      last_name,
      email,
      phone_number,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      NEW.first_name,
      NEW.last_name,
      NEW.email,
      NEW.phone,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      email = EXCLUDED.email,
      phone_number = EXCLUDED.phone_number,
      updated_at = NOW();
    
    -- Créer le prestataire
    INSERT INTO public.providers (
      user_id,
      business_name,
      description,
      location,
      is_verified,
      status,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      CONCAT(NEW.first_name, ' ', NEW.last_name),
      CONCAT('Prestataire spécialisé en ', NEW.category, '. ', 
             CAST(NEW.experience_years AS TEXT), ' ans d''expérience. ',
             'Disponibilité: ', NEW.availability),
      'À définir',
      false, -- Non vérifié par défaut, l'admin devra vérifier les documents
      'pending_validation',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      business_name = EXCLUDED.business_name,
      description = EXCLUDED.description,
      updated_at = NOW()
    RETURNING id INTO provider_id;
    
    -- Assigner le rôle provider
    INSERT INTO public.user_roles (
      user_id,
      role,
      created_by,
      created_at
    ) VALUES (
      new_user_id,
      'provider'::app_role,
      auth.uid(), -- L'admin qui a approuvé
      NOW()
    )
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Logger l'action dans l'historique admin
    INSERT INTO public.admin_actions_log (
      admin_user_id,
      entity_type,
      entity_id,
      action_type,
      old_data,
      new_data,
      description
    ) VALUES (
      COALESCE(auth.uid(), new_user_id),
      'job_application',
      NEW.id,
      'approved_and_converted',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', 'approved',
        'provider_id', provider_id,
        'user_id', new_user_id
      ),
      CONCAT('Candidature approuvée et compte prestataire créé pour ', 
             NEW.first_name, ' ', NEW.last_name, 
             ' (', NEW.email, ')')
    );
    
    -- Créer une notification pour les admins
    INSERT INTO public.realtime_notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority
    )
    SELECT 
      ur.user_id,
      'provider_created',
      'Nouveau prestataire créé',
      CONCAT('Le prestataire ', NEW.first_name, ' ', NEW.last_name, 
             ' a été créé suite à l''approbation de sa candidature.'),
      jsonb_build_object(
        'provider_id', provider_id,
        'application_id', NEW.id,
        'email', NEW.email
      ),
      'normal'
    FROM public.user_roles ur
    WHERE ur.role = 'admin'::app_role;
    
    -- Mettre à jour la candidature avec l'ID du prestataire créé
    NEW.admin_comments := COALESCE(NEW.admin_comments, '') || 
                         E'\n[Système] Compte prestataire créé automatiquement le ' || 
                         NOW()::TEXT || 
                         E'\nProvider ID: ' || provider_id::TEXT;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS create_provider_on_approval ON public.job_applications;

CREATE TRIGGER create_provider_on_approval
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.create_provider_from_approved_application();

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION public.create_provider_from_approved_application() IS 
'Crée automatiquement un compte prestataire lorsqu''une candidature est approuvée. 
Cette fonction est déclenchée par un trigger sur job_applications.
Elle crée: un profil utilisateur, un compte prestataire, assigne le rôle, et log l''action.';