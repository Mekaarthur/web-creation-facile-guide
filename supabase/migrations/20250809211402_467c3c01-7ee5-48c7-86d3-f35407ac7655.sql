-- Créer un trigger pour envoyer des emails de confirmation automatiquement
CREATE OR REPLACE FUNCTION public.send_confirmation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Envoyer une notification pour déclencher l'email de confirmation
  INSERT INTO public.realtime_notifications (
    user_id,
    type,
    title,
    message,
    data,
    priority
  ) VALUES (
    NEW.id,
    'email_confirmation',
    'Confirmez votre email',
    'Cliquez sur le lien dans votre email pour activer votre compte',
    jsonb_build_object(
      'email', NEW.email,
      'user_id', NEW.id,
      'action', 'confirm_signup'
    ),
    'high'
  );
  
  RETURN NEW;
END;
$function$;