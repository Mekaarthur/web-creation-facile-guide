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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...requestData } = await req.json();
    console.log('Admin applications action:', action, 'Data:', requestData);

    switch (action) {
      case 'list':
        return await listApplications(supabase, requestData);
      case 'get_details':
        return await getApplicationDetails(supabase, requestData);
      case 'update_status':
        return await updateApplicationStatus(supabase, requestData);
      case 'approve':
        return await approveApplication(supabase, requestData);
      case 'reject':
        return await rejectApplication(supabase, requestData);
      case 'request_documents':
        return await requestDocuments(supabase, requestData);
      case 'schedule_interview':
        return await scheduleInterview(supabase, requestData);
      case 'get_stats':
        return await getApplicationStats(supabase, requestData);
      case 'bulk_action':
        return await bulkAction(supabase, requestData);
      case 'convert_to_provider':
        return await convertToProvider(supabase, requestData);
      case 'export':
        return await exportApplications(supabase, requestData);
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-applications:', error);
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

async function listApplications(supabase: any, { status = 'all', limit = 50, offset = 0, searchTerm, sortBy = 'created_at', sortOrder = 'desc' }: any) {
  try {
    let query = supabase
      .from('job_applications')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        city,
        postal_code,
        status,
        created_at,
        service_categories,
        hourly_rate,
        availability_days,
        has_vehicle,
        has_insurance
      `)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data: applications, error } = await query;
    if (error) throw error;

    // Enrichir avec des données calculées
    const enrichedApplications = (applications || []).map(app => ({
      ...app,
      full_name: `${app.first_name} ${app.last_name}`,
      services_count: app.service_categories?.length || 0,
      availability_count: app.availability_days?.length || 0,
      is_complete: !!(app.email && app.phone && app.service_categories?.length > 0),
      days_since_application: Math.floor((new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        applications: enrichedApplications,
        total: enrichedApplications.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du listage des candidatures:', error);
    throw error;
  }
}

async function getApplicationDetails(supabase: any, { applicationId }: any) {
  try {
    // Récupérer tous les détails de la candidature
    const { data: application, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error) throw error;

    // Récupérer les documents associés
    const { data: documents } = await supabase
      .from('provider_documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    // Récupérer l'historique des actions administratives
    const { data: actionHistory } = await supabase
      .from('admin_actions_log')
      .select(`
        id,
        action_type,
        description,
        created_at,
        admin_user_id,
        old_data,
        new_data
      `)
      .eq('entity_type', 'job_application')
      .eq('entity_id', applicationId)
      .order('created_at', { ascending: false });

    // Enrichir l'historique avec les noms des admins
    const enrichedHistory = await Promise.all(
      (actionHistory || []).map(async (action) => {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', action.admin_user_id)
          .single();

        return {
          ...action,
          admin_name: adminProfile ? 
            `${adminProfile.first_name} ${adminProfile.last_name}` : 
            'Admin inconnu'
        };
      })
    );

    // Calculer un score de qualité de candidature
    const qualityScore = calculateApplicationQuality(application);

    return new Response(
      JSON.stringify({
        success: true,
        application: {
          ...application,
          documents: documents || [],
          action_history: enrichedHistory,
          quality_score: qualityScore
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    throw error;
  }
}

async function updateApplicationStatus(supabase: any, { applicationId, status, adminUserId, notes }: any) {
  try {
    // Récupérer l'ancien statut
    const { data: oldApplication } = await supabase
      .from('job_applications')
      .select('status, email, first_name, last_name')
      .eq('id', applicationId)
      .single();

    if (!oldApplication) {
      throw new Error('Candidature introuvable');
    }

    // Mettre à jour le statut
    const updateData: any = { 
      status: status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.admin_comments = notes;
    }

    const { error } = await supabase
      .from('job_applications')
      .update(updateData)
      .eq('id', applicationId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'job_application',
        entity_id: applicationId,
        action_type: 'status_change',
        old_data: { status: oldApplication.status },
        new_data: { status, notes },
        description: `Statut modifié de ${oldApplication.status} vers ${status}${notes ? ': ' + notes : ''}`
      });

    // Envoyer une notification par email selon le nouveau statut
    await sendStatusNotification(supabase, {
      email: oldApplication.email,
      firstName: oldApplication.first_name,
      status: status,
      notes: notes
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Statut de la candidature mis à jour avec succès' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
}

async function approveApplication(supabase: any, { applicationId, adminUserId, notes }: any) {
  try {
    // Récupérer les détails de la candidature
    const { data: application } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new Error('Candidature introuvable');
    }

    // Mettre à jour le statut à 'validated'
    const { error: updateError } = await supabase
      .from('job_applications')
      .update({ 
        status: 'validated',
        admin_comments: notes,
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) throw updateError;

    // Créer automatiquement le profil prestataire
    const { data: newProvider, error: providerError } = await supabase.rpc('create_provider_from_application', {
      application_id: applicationId
    });

    if (providerError) {
      console.error('Erreur lors de la création du prestataire:', providerError);
      // On continue même si la création automatique échoue
    }

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'job_application',
        entity_id: applicationId,
        action_type: 'approve',
        new_data: { provider_id: newProvider },
        description: `Candidature approuvée et prestataire créé${notes ? ': ' + notes : ''}`
      });

    // Envoyer email de validation
    await supabase
      .from('communications')
      .insert({
        type: 'email',
        destinataire_email: application.email,
        sujet: 'Candidature approuvée - Bienvenue chez Bikawo !',
        contenu: `Bonjour ${application.first_name},

Excellente nouvelle ! Votre candidature pour devenir prestataire Bikawo a été approuvée.

Votre compte prestataire est maintenant actif et vous pouvez commencer à recevoir des missions.

${notes ? 'Notes de notre équipe: ' + notes : ''}

Bienvenue dans l'équipe Bikawo !

Cordialement,
L'équipe Bikawo`,
        template_name: 'provider_approved',
        status: 'en_attente'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Candidature approuvée et prestataire créé avec succès',
        provider_id: newProvider
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'approbation:', error);
    throw error;
  }
}

async function rejectApplication(supabase: any, { applicationId, adminUserId, reason }: any) {
  try {
    const { data: application } = await supabase
      .from('job_applications')
      .select('email, first_name')
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new Error('Candidature introuvable');
    }

    // Mettre à jour le statut
    const { error } = await supabase
      .from('job_applications')
      .update({ 
        status: 'rejected',
        admin_comments: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'job_application',
        entity_id: applicationId,
        action_type: 'reject',
        description: `Candidature rejetée: ${reason}`
      });

    // Envoyer email de refus
    await supabase
      .from('communications')
      .insert({
        type: 'email',
        destinataire_email: application.email,
        sujet: 'Candidature - Décision concernant votre dossier',
        contenu: `Bonjour ${application.first_name},

Nous vous remercions pour l'intérêt que vous portez à Bikawo.

Après examen de votre candidature, nous ne sommes malheureusement pas en mesure de donner une suite favorable à votre demande pour le moment.

${reason ? 'Motif: ' + reason : ''}

Nous vous encourageons à renouveler votre candidature dans le futur.

Cordialement,
L'équipe Bikawo`,
        template_name: 'application_rejected',
        status: 'en_attente'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Candidature rejetée avec succès' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
    throw error;
  }
}

async function requestDocuments(supabase: any, { applicationId, adminUserId, documentsRequested, message }: any) {
  try {
    const { data: application } = await supabase
      .from('job_applications')
      .select('email, first_name')
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new Error('Candidature introuvable');
    }

    // Mettre à jour le statut
    const { error } = await supabase
      .from('job_applications')
      .update({ 
        status: 'documents_requested',
        admin_comments: `Documents demandés: ${documentsRequested.join(', ')}\nMessage: ${message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'job_application',
        entity_id: applicationId,
        action_type: 'request_documents',
        new_data: { documents: documentsRequested },
        description: `Documents demandés: ${documentsRequested.join(', ')}`
      });

    // Envoyer email de demande de documents
    await supabase
      .from('communications')
      .insert({
        type: 'email',
        destinataire_email: application.email,
        sujet: 'Documents requis pour votre candidature Bikawo',
        contenu: `Bonjour ${application.first_name},

Nous examinons actuellement votre candidature pour devenir prestataire Bikawo.

Pour poursuivre le processus, nous avons besoin des documents suivants :
${documentsRequested.map(doc => `- ${doc}`).join('\n')}

${message ? 'Message de notre équipe:\n' + message : ''}

Veuillez nous transmettre ces documents dès que possible via votre espace candidat.

Cordialement,
L'équipe Bikawo`,
        template_name: 'documents_requested',
        status: 'en_attente'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demande de documents envoyée avec succès' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la demande de documents:', error);
    throw error;
  }
}

async function scheduleInterview(supabase: any, { applicationId, adminUserId, interviewDate, interviewType, notes }: any) {
  try {
    const { data: application } = await supabase
      .from('job_applications')
      .select('email, first_name, phone')
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new Error('Candidature introuvable');
    }

    // Mettre à jour avec les infos d'entretien
    const { error } = await supabase
      .from('job_applications')
      .update({ 
        status: 'interview_scheduled',
        admin_comments: `Entretien programmé: ${interviewDate} (${interviewType})\nNotes: ${notes}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) throw error;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'job_application',
        entity_id: applicationId,
        action_type: 'schedule_interview',
        new_data: { interview_date: interviewDate, interview_type: interviewType },
        description: `Entretien programmé le ${interviewDate} (${interviewType})`
      });

    // Envoyer email de confirmation d'entretien
    await supabase
      .from('communications')
      .insert({
        type: 'email',
        destinataire_email: application.email,
        sujet: 'Entretien programmé - Candidature Bikawo',
        contenu: `Bonjour ${application.first_name},

Nous sommes heureux de vous informer qu'un entretien a été programmé dans le cadre de votre candidature.

Détails de l'entretien:
- Date: ${new Date(interviewDate).toLocaleDateString('fr-FR')}
- Heure: ${new Date(interviewDate).toLocaleTimeString('fr-FR')}
- Type: ${interviewType}

${notes ? 'Informations complémentaires:\n' + notes : ''}

Nous vous contacterons prochainement pour confirmer les modalités.

Cordialement,
L'équipe Bikawo`,
        template_name: 'interview_scheduled',
        status: 'en_attente'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Entretien programmé avec succès' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la programmation d\'entretien:', error);
    throw error;
  }
}

async function getApplicationStats(supabase: any, { timeRange = '30d' }: any) {
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

    const { data: applications } = await supabase
      .from('job_applications')
      .select('status, created_at, service_categories')
      .gte('created_at', startDate.toISOString());

    const { data: newApplications } = await supabase
      .from('job_applications')
      .select('id')
      .gte('created_at', startDate.toISOString());

    const totalApplications = applications?.length || 0;
    const pendingApplications = applications?.filter(a => a.status === 'pending')?.length || 0;
    const approvedApplications = applications?.filter(a => a.status === 'validated')?.length || 0;
    const rejectedApplications = applications?.filter(a => a.status === 'rejected')?.length || 0;
    const interviewApplications = applications?.filter(a => a.status === 'interview_scheduled')?.length || 0;

    // Analyse par service
    const serviceStats: { [key: string]: number } = {};
    applications?.forEach(app => {
      app.service_categories?.forEach((service: string) => {
        serviceStats[service] = (serviceStats[service] || 0) + 1;
      });
    });

    const topServices = Object.entries(serviceStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([service, count]) => ({ service, count }));

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: totalApplications,
          new: newApplications?.length || 0,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
          interviews: interviewApplications,
          approval_rate: totalApplications > 0 ? Math.round((approvedApplications / totalApplications) * 100) : 0,
          top_services: topServices
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du calcul des stats candidatures:', error);
    throw error;
  }
}

async function bulkAction(supabase: any, { applicationIds, action, adminUserId, data }: any) {
  try {
    const results = [];

    for (const applicationId of applicationIds) {
      try {
        let result;
        switch (action) {
          case 'approve':
            result = await approveApplication(supabase, { applicationId, adminUserId, notes: data?.notes });
            break;
          case 'reject':
            result = await rejectApplication(supabase, { applicationId, adminUserId, reason: data?.reason });
            break;
          case 'update_status':
            result = await updateApplicationStatus(supabase, { applicationId, status: data?.status, adminUserId, notes: data?.notes });
            break;
          default:
            throw new Error(`Action en lot non supportée: ${action}`);
        }
        
        results.push({ applicationId, status: 'success' });
      } catch (error) {
        results.push({ applicationId, status: 'error', error: error.message });
      }
    }

    // Logger l'action en lot
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'job_application',
        action_type: 'bulk_action',
        description: `Action en lot: ${action} sur ${applicationIds.length} candidatures`,
        new_data: { action, applications_count: applicationIds.length, successful: results.filter(r => r.status === 'success').length }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Action en lot terminée',
        results: results,
        summary: {
          total: applicationIds.length,
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'error').length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'action en lot:', error);
    throw error;
  }
}

async function convertToProvider(supabase: any, { applicationId, adminUserId }: any) {
  try {
    // Récupérer les détails de la candidature
    const { data: application } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new Error('Candidature introuvable');
    }

    if (application.status === 'converted') {
      throw new Error('Cette candidature a déjà été convertie en prestataire');
    }

    // Créer le prestataire via la fonction RPC
    const { data: newProviderId, error: providerError } = await supabase.rpc('create_provider_from_application', {
      application_id: applicationId
    });

    if (providerError) {
      console.error('Erreur lors de la création du prestataire:', providerError);
      throw new Error('Erreur lors de la création du prestataire: ' + providerError.message);
    }

    // Mettre à jour le statut de la candidature
    const { error: updateError } = await supabase
      .from('job_applications')
      .update({ 
        status: 'converted',
        admin_comments: 'Converti en prestataire',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) throw updateError;

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'job_application',
        entity_id: applicationId,
        action_type: 'convert_to_provider',
        new_data: { provider_id: newProviderId },
        description: `Candidature convertie en prestataire (ID: ${newProviderId})`
      });

    // Envoyer email de confirmation
    await supabase
      .from('communications')
      .insert({
        type: 'email',
        destinataire_email: application.email,
        sujet: 'Bienvenue dans l\'équipe Bikawo !',
        contenu: `Bonjour ${application.first_name},

Excellente nouvelle ! Votre candidature a été approuvée et votre compte prestataire est maintenant actif.

Vous pouvez dès à présent :
- Accéder à votre espace prestataire
- Recevoir des missions
- Gérer votre planning et vos services

Bienvenue dans l'équipe Bikawo !

Cordialement,
L'équipe Bikawo`,
        template_name: 'provider_conversion',
        status: 'en_attente'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Candidature convertie en prestataire avec succès',
        provider_id: newProviderId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
    throw error;
  }
}

async function exportApplications(supabase: any, { format = 'csv', filters }: any) {
  try {
    let query = supabase
      .from('job_applications')
      .select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.dateRange) {
      query = query.gte('created_at', filters.dateRange.start)
                  .lte('created_at', filters.dateRange.end);
    }

    const { data: applications, error } = await query;
    if (error) throw error;

    // Générer le CSV
    const csvHeaders = [
      'ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Ville', 'Code postal',
      'Statut', 'Services', 'Tarif horaire', 'Véhicule', 'Assurance',
      'Date candidature'
    ];

    const csvRows = (applications || []).map(app => [
      app.id,
      app.first_name,
      app.last_name,
      app.email,
      app.phone,
      app.city,
      app.postal_code,
      app.status,
      app.service_categories?.join('; ') || '',
      app.hourly_rate,
      app.has_vehicle ? 'Oui' : 'Non',
      app.has_insurance ? 'Oui' : 'Non',
      app.created_at
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: csvContent,
        filename: `candidatures_${new Date().toISOString().split('T')[0]}.csv`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw error;
  }
}

// Fonctions utilitaires
function calculateApplicationQuality(application: any): number {
  let score = 0;
  const maxScore = 100;

  // Informations de base (30 points)
  if (application.first_name && application.last_name) score += 5;
  if (application.email) score += 5;
  if (application.phone) score += 5;
  if (application.city && application.postal_code) score += 10;
  if (application.description && application.description.length > 50) score += 5;

  // Services et compétences (25 points)
  if (application.service_categories && application.service_categories.length > 0) {
    score += Math.min(application.service_categories.length * 5, 15);
  }
  if (application.hourly_rate && application.hourly_rate > 0) score += 10;

  // Disponibilité (20 points)
  if (application.availability_days && application.availability_days.length > 0) {
    score += Math.min(application.availability_days.length * 3, 15);
  }
  if (application.coverage_radius && application.coverage_radius > 0) score += 5;

  // Documents et équipements (25 points)
  if (application.has_vehicle) score += 8;
  if (application.has_insurance) score += 8;
  if (application.profile_photo_url) score += 3;
  if (application.identity_document_url) score += 3;
  if (application.insurance_document_url) score += 3;

  return Math.min(score, maxScore);
}

async function sendStatusNotification(supabase: any, { email, firstName, status, notes }: any) {
  const statusMessages = {
    'pending': 'Votre candidature est en cours d\'examen.',
    'reviewing': 'Votre candidature est actuellement examinée par notre équipe.',
    'documents_requested': 'Des documents complémentaires sont requis pour votre candidature.',
    'interview_scheduled': 'Un entretien a été programmé pour votre candidature.',
    'validated': 'Félicitations ! Votre candidature a été approuvée.',
    'rejected': 'Votre candidature n\'a malheureusement pas été retenue.'
  };

  const subject = status === 'validated' ? 
    'Candidature approuvée - Bienvenue chez Bikawo !' :
    'Mise à jour de votre candidature Bikawo';

  const message = statusMessages[status as keyof typeof statusMessages] || 'Votre candidature a été mise à jour.';

  await supabase
    .from('communications')
    .insert({
      type: 'email',
      destinataire_email: email,
      sujet: subject,
      contenu: `Bonjour ${firstName},

${message}

${notes ? 'Informations complémentaires:\n' + notes : ''}

Cordialement,
L'équipe Bikawo`,
      template_name: `status_${status}`,
      status: 'en_attente'
    });
}