import { supabase } from '@/integrations/supabase/client';

/**
 * Récupère l'adresse IP du client via un service externe
 */
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.warn('[AdminLogger] Unable to fetch IP:', error);
    return null;
  }
}

/**
 * Logger une action admin dans la base de données
 */
export async function logAdminAction(
  actionType: 'login' | 'logout' | 'other',
  description: string,
  entityType?: string,
  entityId?: string,
  oldData?: any,
  newData?: any
) {
  try {
    // Récupérer l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[AdminLogger] No user found for logging');
      return;
    }

    // Récupérer l'IP
    const ipAddress = await getClientIP();

    // Récupérer l'email de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .maybeSingle();

    // Logger dans admin_actions_log
    const { error } = await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: user.id,
        entity_type: entityType || actionType,
        entity_id: entityId || user.id,
        action_type: actionType,
        description: description,
        old_data: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        new_data: newData ? JSON.parse(JSON.stringify(newData)) : null,
        ip_address: ipAddress,
        admin_email: profile?.email || user.email,
      });

    if (error) {
      console.error('[AdminLogger] Error logging action:', error);
    } else {
      console.log(`[AdminLogger] Action logged: ${actionType} - ${description}`);
    }
  } catch (error) {
    console.error('[AdminLogger] Failed to log admin action:', error);
  }
}

/**
 * Logger une connexion admin
 */
export async function logAdminLogin(email: string) {
  await logAdminAction(
    'login',
    `Connexion administrateur réussie pour ${email}`,
    'auth',
    undefined,
    null,
    { 
      email,
      timestamp: new Date().toISOString(),
      action: 'admin_login'
    }
  );
}

/**
 * Logger une déconnexion admin
 */
export async function logAdminLogout(email?: string) {
  await logAdminAction(
    'logout',
    `Déconnexion administrateur ${email ? `pour ${email}` : ''}`,
    'auth',
    undefined,
    { 
      email,
      timestamp: new Date().toISOString()
    },
    { 
      action: 'admin_logout',
      timestamp: new Date().toISOString()
    }
  );
}
