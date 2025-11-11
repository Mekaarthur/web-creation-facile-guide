import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le rôle admin
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé - Droits administrateur requis' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...requestData } = await req.json();
    console.log('Admin providers action:', action, 'Data:', requestData);

    switch (action) {
      case 'list':
        return await listProviders(supabase, requestData);
      case 'update_status':
        return await updateProviderStatus(supabase, requestData);
      case 'verify':
        return await verifyProvider(supabase, requestData);
      case 'get_stats':
        return await getProviderStats(supabase, requestData);
      case 'update_details':
        return await updateProviderDetails(supabase, requestData);
      case 'approve':
        return await approveProvider(supabase, requestData);
      case 'reject':
        return await rejectProvider(supabase, requestData);
      case 'get_provider_details':
        return await getProviderDetails(supabase, requestData);
      case 'create_provider_direct':
        return await createProviderDirect(supabase, requestData);
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-providers:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function listProviders(supabase: any, { status = 'all', limit = 50, offset = 0, searchTerm }: any) {
  try {
    let query = supabase
      .from('providers')
      .select(`
        id,
        user_id,
        business_name,
        location,
        rating,
        missions_completed,
        total_earnings,
        status,
        is_verified,
        created_at,
        hourly_rate,
        description
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (searchTerm) {
      query = query.or(`business_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data: providers, error } = await query;

    if (error) throw error;

    // Enrichir avec les données utilisateur et services
    const enrichedProviders = await Promise.all(
      (providers || []).map(async (provider) => {
        try {
          // User profile - use maybeSingle() to avoid errors if profile doesn't exist
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone')
            .eq('user_id', provider.user_id)
            .maybeSingle();

          // Services proposés
          const { data: services } = await supabase
            .from('provider_services')
            .select(`
              services(name, category)
            `)
            .eq('provider_id', provider.id)
            .eq('is_active', true);

          // Filter out null/undefined services and extract unique categories
          const validServices = (services || [])
            .filter(s => s?.services?.category)
            .map(s => s.services.category);
          const uniqueUniverses = [...new Set(validServices)];

          return {
            ...provider,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            email: profile?.email || '',
            phone: profile?.phone || '',
            services: (services || []).filter(s => s?.services).map(s => s.services) || [],
            universes: uniqueUniverses,
            average_rating: provider.rating || 0,
            total_missions: provider.missions_completed || 0,
            total_earned: provider.total_earnings || 0
          };
        } catch (error) {
          console.error(`Error enriching provider ${provider.id}:`, error);
          // Return basic provider data if enrichment fails
          return {
            ...provider,
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            services: [],
            universes: [],
            average_rating: provider.rating || 0,
            total_missions: provider.missions_completed || 0,
            total_earned: provider.total_earnings || 0
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ success: true, providers: enrichedProviders }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du listage des prestataires:', error);
    throw error;
  }
}

async function updateProviderStatus(supabase: any, { providerId, status, adminUserId, reason }: any) {
  try {
    // Récupérer l'ancien statut
    const { data: oldProvider } = await supabase
      .from('providers')
      .select('status')
      .eq('id', providerId)
      .single();

    // Mettre à jour le statut
    const { error } = await supabase
      .from('providers')
      .update({ status: status })
      .eq('id', providerId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'provider',
        entity_id: providerId,
        action_type: 'status_update',
        old_data: { status: oldProvider?.status },
        new_data: { status },
        description: `Statut modifié de ${oldProvider?.status} vers ${status}: ${reason || 'Aucune raison spécifiée'}`
      });

    // Ajouter à l'historique des statuts
    await supabase
      .from('provider_status_history')
      .insert({
        provider_id: providerId,
        old_status: oldProvider?.status,
        new_status: status,
        admin_user_id: adminUserId,
        reason: reason
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Statut mis à jour avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
}

async function verifyProvider(supabase: any, { providerId, adminUserId }: any) {
  try {
    const { error } = await supabase
      .from('providers')
      .update({ 
        is_verified: true,
        status: 'active'
      })
      .eq('id', providerId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'provider',
        entity_id: providerId,
        action_type: 'verify',
        description: 'Prestataire vérifié et activé'
      });

    // Notifier le prestataire
    const { data: provider } = await supabase
      .from('providers')
      .select('user_id')
      .eq('id', providerId)
      .single();

    if (provider) {
      await supabase
        .from('realtime_notifications')
        .insert({
          user_id: provider.user_id,
          type: 'provider_verified',
          title: 'Compte vérifié',
          message: 'Félicitations ! Votre compte prestataire a été vérifié et activé.',
          priority: 'high'
        });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Prestataire vérifié avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    throw error;
  }
}

async function updateProviderDetails(supabase: any, { providerId, updates, adminUserId }: any) {
  try {
    // Récupérer les anciennes données
    const { data: oldProvider } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single();

    // Mettre à jour
    const { error } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', providerId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'provider',
        entity_id: providerId,
        action_type: 'update_details',
        old_data: oldProvider,
        new_data: updates,
        description: 'Détails du prestataire mis à jour par admin'
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Détails mis à jour avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des détails:', error);
    throw error;
  }
}

async function getProviderStats(supabase: any, { timeRange = '30d' }: any) {
  try {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    const { data: providers } = await supabase
      .from('providers')
      .select('status, is_verified, created_at, rating, mandat_facturation_accepte, formation_completed, identity_verified');

    const { data: newProviders } = await supabase
      .from('providers')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const totalProviders = providers?.length || 0;
    const activeProviders = providers?.filter(p => p.status === 'active')?.length || 0;
    const verifiedProviders = providers?.filter(p => p.is_verified)?.length || 0;
    const suspendedProviders = providers?.filter(p => p.status === 'inactive')?.length || 0;
    const newProvidersCount = newProviders?.length || 0;
    
    // Compter les prestataires en onboarding (pending_onboarding OU qui n'ont pas complété tous les steps)
    const pendingProviders = providers?.filter(p => 
      p.status === 'pending_onboarding' || 
      p.status === 'pending_validation' ||
      p.status === 'documents_validated' ||
      (p.status !== 'active' && p.status !== 'inactive' && (!p.mandat_facturation_accepte || !p.formation_completed || !p.identity_verified))
    )?.length || 0;
    
    const averageRating = providers?.filter(p => p.rating > 0)?.length > 0 
      ? providers.filter(p => p.rating > 0).reduce((sum, p) => sum + p.rating, 0) / providers.filter(p => p.rating > 0).length
      : 0;

    // Calculer les missions et revenus totaux
    const { data: missions } = await supabase
      .from('bookings')
      .select('total_price, status')
      .in('status', ['completed', 'confirmed', 'in_progress']);

    const totalMissions = missions?.length || 0;
    const totalRevenue = missions?.reduce((sum, m) => sum + (m.total_price || 0), 0) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: totalProviders,
          pending: pendingProviders,
          active: activeProviders,
          suspended: suspendedProviders,
          total_missions: totalMissions,
          total_revenue: totalRevenue,
          average_rating: Math.round(averageRating * 10) / 10
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du calcul des stats prestataires:', error);
    throw error;
  }
}

async function approveProvider(supabase: any, { providerId }: any) {
  try {
    const { error } = await supabase
      .from('providers')
      .update({ 
        status: 'active',
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId);

    if (error) throw error;

    // Ajouter à l'historique
    await supabase
      .from('provider_status_history')
      .insert({
        provider_id: providerId,
        old_status: 'pending',
        new_status: 'active',
        reason: 'Approuvé par admin'
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Prestataire approuvé avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'approbation:', error);
    throw error;
  }
}

async function rejectProvider(supabase: any, { providerId }: any) {
  try {
    const { error } = await supabase
      .from('providers')
      .update({ 
        status: 'rejected',
        is_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId);

    if (error) throw error;

    // Ajouter à l'historique
    await supabase
      .from('provider_status_history')
      .insert({
        provider_id: providerId,
        old_status: 'pending',
        new_status: 'rejected',
        reason: 'Rejeté par admin'
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Prestataire rejeté avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
    throw error;
  }
}

async function getProviderDetails(supabase: any, { providerId }: any) {
  try {
    // Récupérer les détails du prestataire
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError) throw providerError;

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, phone, email')
      .eq('user_id', provider.user_id)
      .single();

    // Récupérer les réservations
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id, 
        status, 
        booking_date, 
        total_price,
        services:service_id (name)
      `)
      .eq('provider_id', providerId)
      .order('booking_date', { ascending: false })
      .limit(10);

    // Récupérer les avis
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, is_approved')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Récupérer les documents
    const { data: documents } = await supabase
      .from('provider_documents')
      .select('id, document_type, file_name, status, created_at')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    return new Response(
      JSON.stringify({
        success: true,
        provider: {
          ...provider,
          profiles: profile,
          bookings: bookings || [],
          reviews: reviews || [],
          documents: documents || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    throw error;
  }
}

async function createProviderDirect(supabase: any, { providerData }: any) {
  try {
    const { email, first_name, last_name, phone, business_name, category, location } = providerData;
    
    console.log('Creating provider directly:', { email, first_name, last_name });

    // Vérifier si l'email existe déjà
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.find((u: any) => u.email === email);

    let userId;
    
    if (userExists) {
      userId = userExists.id;
      console.log('User already exists:', userId);
    } else {
      // Créer un nouvel utilisateur avec un mot de passe temporaire
      const tempPassword = `Temp${Math.random().toString(36).slice(2)}@Pass`;
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          phone
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        throw new Error(`Erreur lors de la création de l'utilisateur: ${userError.message}`);
      }

      userId = newUser.user.id;
      console.log('New user created:', userId);

      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          first_name,
          last_name,
          email,
          phone
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw new Error(`Erreur lors de la création du profil: ${profileError.message}`);
      }
    }

    // Créer le prestataire
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .insert({
        user_id: userId,
        business_name: business_name || `${first_name} ${last_name}`,
        location: location || '',
        status: 'approved',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (providerError) {
      console.error('Error creating provider:', providerError);
      throw new Error(`Erreur lors de la création du prestataire: ${providerError.message}`);
    }

    // Assigner le rôle provider
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'provider'
      });

    if (roleError && !roleError.message?.includes('duplicate')) {
      console.error('Error assigning role:', roleError);
    }

    // Log de l'action admin
    await supabase
      .from('admin_actions_log')
      .insert({
        action_type: 'create_provider_direct',
        action_data: { provider_id: provider.id, email },
        description: `Prestataire créé directement: ${first_name} ${last_name}`
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Prestataire créé avec succès',
        provider_id: provider.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la création directe du prestataire:', error);
    throw error;
  }
}