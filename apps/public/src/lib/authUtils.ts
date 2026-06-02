import { supabase } from '@/integrations/supabase/client';

export async function checkEmailExists(
  email: string,
  phone?: string
): Promise<{ exists: false } | { exists: true; field?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('check-email-exists', {
      body: { email, ...(phone ? { phone } : {}) },
    });
    if (error) {
      console.warn('check-email-exists error:', error);
      return { exists: false };
    }
    if ((data as any)?.exists) {
      return { exists: true, field: (data as any)?.field };
    }
    return { exists: false };
  } catch {
    console.warn('check-email-exists invocation failed');
    return { exists: false };
  }
}

export function mapAuthError(error: { message: string }): Error {
  const msg = error.message;
  if (msg.includes('Invalid login credentials'))
    return new Error('Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.');
  if (msg.includes('Email not confirmed'))
    return new Error("Votre email n'est pas encore confirmé. Vérifiez votre boîte mail (y compris les spams).");
  if (msg.includes('User not found'))
    return new Error('Aucun compte trouvé avec cet email. Veuillez créer un compte.');
  if (msg.includes('already') || msg.includes('exists'))
    return new Error('Cette adresse email est déjà utilisée.');
  return new Error(msg || 'Erreur de connexion. Veuillez réessayer.');
}
