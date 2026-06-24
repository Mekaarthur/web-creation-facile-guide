import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { sanitizeSearch } from '../_shared/sanitize.ts';
import { getAdminCorsHeaders } from '../_shared/cors.ts';



interface ApplicationRequest {
  action: 'list' | 'get' | 'update_status' | 'approve' | 'reject' | 'get_stats' | 'convert_to_provider';
  applicationId?: string;
  status?: string;
  searchTerm?: string;
  limit?: number;
  newStatus?: string;
  adminComments?: string;
}

// Extracted so both 'approve' and 'convert_to_provider' share identical logic.
async function approveApplication(
  applicationId: string,
  adminComments: string | undefined,
  supabase: ReturnType<typeof createClient>,
  adminUserId: string,
  corsHeaders: Record<string, string>,
  supabaseUrl: string,
  supabaseKey: string,
): Promise<Response> {
  const { data: application, error: fetchError } = await supabase
    .from('job_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (fetchError) throw fetchError;

  // Level 2 — vérification des documents obligatoires côté serveur avant approbation
  const mandatoryDocFields: Array<{ field: string; label: string }> = [
    { field: 'identity_document_url', label: "Pièce d'identité" },
    { field: 'siret_document_url', label: 'Justificatif SIRET' },
    { field: 'rib_iban_url', label: 'RIB/IBAN' },
  ];
  const missingDocs = mandatoryDocFields.filter(d => !application[d.field]);
  if (missingDocs.length > 0) {
    const labels = missingDocs.map(d => d.label).join(', ');
    return new Response(
      JSON.stringify({ error: `Documents obligatoires manquants : ${labels}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', application.email)
    .single();

  let userId = existingProfile?.user_id;

  if (!userId) {
    const tempPassword = crypto.randomUUID().slice(0, 16) + 'A1!';
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: application.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: application.first_name,
        last_name: application.last_name,
      },
    });

    if (createUserError) {
      const msg = createUserError.message?.toLowerCase() ?? '';
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        // Email already in auth.users but not found via profiles.email — find and reuse
        const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const found = users?.find((u: { id: string; email?: string }) => u.email?.toLowerCase() === application.email.toLowerCase());
        if (found) {
          userId = found.id;
        } else {
          throw createUserError;
        }
      } else {
        throw createUserError;
      }
    } else {
      userId = newUser.user.id;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: application.first_name,
        last_name: application.last_name,
        email: application.email,
        phone: application.phone,
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile update error (non-blocking):', profileError);
    }
  }

  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .insert({
      user_id: userId,
      business_name: `${application.first_name} ${application.last_name}`,
      description: application.motivation || '',
      location: application.city || 'À définir',
      status: 'pending_onboarding',
      is_verified: false,
      mandat_facturation_accepte: false,
      formation_completed: false,
      identity_verified: false,
      documents_submitted: application.documents_complete || false,
    })
    .select()
    .single();

  if (providerError) throw providerError;

  // Copier les documents de la candidature vers provider_documents (Level 3 — no double upload)
  const docMapping: Array<{ field: string; type: string }> = [
    { field: 'identity_document_url', type: 'identity_document' },
    { field: 'siret_document_url', type: 'siret_document' },
    { field: 'rib_iban_url', type: 'rib_iban' },
    { field: 'criminal_record_url', type: 'criminal_record' },
    { field: 'certification_nova_url', type: 'certification' },
    { field: 'rc_pro_url', type: 'insurance' },
    { field: 'certifications_url', type: 'certifications_other' },
  ];
  const docsToInsert = docMapping
    .filter(m => application[m.field])
    .map(m => ({
      provider_id: provider.id,
      document_type: m.type,
      file_url: application[m.field] as string,
      file_name: (application[m.field] as string).split('/').pop() ?? m.type,
      status: 'pending',
      upload_date: new Date().toISOString(),
    }));

  if (docsToInsert.length > 0) {
    const { error: docCopyError } = await supabase
      .from('provider_documents')
      .insert(docsToInsert);
    if (docCopyError) {
      console.error('Error copying docs to provider_documents (non-blocking):', docCopyError);
    } else {
      // Marquer documents_submitted pour que l'onboarding saute l'étape upload
      await supabase
        .from('providers')
        .update({ documents_submitted: true, documents_submitted_at: new Date().toISOString() })
        .eq('id', provider.id);
    }
  }

  const serviceCategories = application.service_categories || [application.category];
  if (serviceCategories.length > 0) {
    const { data: matchingServices } = await supabase
      .from('services')
      .select('id, category, name')
      .eq('is_active', true);

    if (matchingServices && matchingServices.length > 0) {
      const serviceInserts = [];
      for (const cat of serviceCategories) {
        const matched = matchingServices.filter(s =>
          s.category.toLowerCase().includes(cat.toLowerCase()) ||
          cat.toLowerCase().includes(s.category.toLowerCase()) ||
          s.name.toLowerCase().includes(cat.toLowerCase())
        );
        for (const svc of matched) {
          serviceInserts.push({
            provider_id: provider.id,
            service_id: svc.id,
            is_active: true,
          });
        }
      }

      if (serviceInserts.length > 0) {
        const unique = serviceInserts.filter((v, i, a) =>
          a.findIndex(t => t.service_id === v.service_id) === i
        );
        const { error: svcError } = await supabase
          .from('provider_services')
          .upsert(unique, { onConflict: 'provider_id,service_id', ignoreDuplicates: true });

        if (svcError) {
          console.error('Error syncing services:', svcError);
        } else {
          console.log(`Synced ${unique.length} services for provider ${provider.id}`);
        }
      }
    }
  }

  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'provider' }, { onConflict: 'user_id,role', ignoreDuplicates: true });

  if (roleError) {
    console.error('Error assigning provider role:', roleError);
  }

  await supabase
    .from('job_applications')
    .update({
      status: 'approved',
      admin_comments: adminComments || 'Candidature approuvée - Compte prestataire créé',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  await supabase
    .from('admin_actions_log')
    .insert({
      admin_user_id: adminUserId,
      entity_type: 'job_application',
      entity_id: applicationId,
      action_type: 'approved_and_converted',
      new_data: {
        status: 'approved',
        provider_id: provider.id,
        user_id: userId,
        synced_services: serviceCategories,
      },
      description: `Candidature approuvée et prestataire créé: ${application.first_name} ${application.last_name}`,
    });

  console.log('Application approved, provider created:', provider.id);

  try {
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: application.email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://bikawo.com'}/update-password`,
      },
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError);
    } else {
      const setupLink = linkData?.properties?.action_link;
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          type: 'provider_application_approved',
          recipientEmail: application.email,
          recipientName: `${application.first_name} ${application.last_name}`,
          data: {
            providerName: application.first_name,
            setupLink: setupLink,
          },
        }),
      });

      if (!emailResponse.ok) {
        console.error('Error sending invitation email:', await emailResponse.text());
      } else {
        console.log('Invitation email sent to:', application.email);
      }
    }
  } catch (emailErr) {
    console.error('Non-blocking email error:', emailErr);
  }

  return new Response(JSON.stringify({
    success: true,
    providerId: provider.id,
    userId: userId,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const body: ApplicationRequest = await req.json();
    console.log('Admin applications action:', body.action);

    // **ACTION: list**
    if (body.action === 'list') {
      let query = supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (body.status) {
        query = query.eq('status', body.status);
      }

      if (body.searchTerm) {
        query = query.or(`first_name.ilike.%${sanitizeSearch(body.searchTerm)}%,last_name.ilike.%${sanitizeSearch(body.searchTerm)}%,email.ilike.%${sanitizeSearch(body.searchTerm)}%`);
      }

      if (body.limit) {
        query = query.limit(body.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ applications: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: get**
    if (body.action === 'get') {
      if (!body.applicationId) throw new Error('applicationId required');

      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', body.applicationId)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ application: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: get_stats**
    if (body.action === 'get_stats') {
      const { data: applications } = await supabase
        .from('job_applications')
        .select('status');

      const stats = {
        total: applications?.length || 0,
        pending: applications?.filter(a => a.status === 'pending').length || 0,
        approved: applications?.filter(a => a.status === 'approved').length || 0,
        rejected: applications?.filter(a => a.status === 'rejected').length || 0,
        documents_pending: applications?.filter(a => a.status === 'documents_pending').length || 0,
      };

      return new Response(JSON.stringify({ stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: update_status**
    if (body.action === 'update_status') {
      if (!body.applicationId || !body.newStatus) {
        throw new Error('applicationId and newStatus required');
      }

      const updateData: any = {
        status: body.newStatus,
        updated_at: new Date().toISOString(),
      };

      if (body.adminComments) {
        updateData.admin_comments = body.adminComments;
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('id', body.applicationId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // **ACTION: approve** — approuver candidature et créer prestataire
    if (body.action === 'approve') {
      if (!body.applicationId) throw new Error('applicationId required');
      return await approveApplication(
        body.applicationId, body.adminComments,
        supabase, user.id, corsHeaders, supabaseUrl, supabaseKey,
      );
    }

    // **ACTION: convert_to_provider** — idempotent alias de approve
    // Appelé depuis ProvidersManagement quand la candidature est déjà approuvée
    // mais le compte prestataire n'a pas encore été créé.
    if (body.action === 'convert_to_provider') {
      if (!body.applicationId) throw new Error('applicationId required');

      // Idempotence : si un provider existe déjà pour cet email, retourner succès
      const { data: app } = await supabase
        .from('job_applications')
        .select('email')
        .eq('id', body.applicationId)
        .single();

      if (app?.email) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', app.email)
          .single();

        if (prof?.user_id) {
          const { data: existingProvider } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', prof.user_id)
            .maybeSingle();

          if (existingProvider) {
            console.log('convert_to_provider: provider already exists', existingProvider.id);
            return new Response(
              JSON.stringify({ success: true, providerId: existingProvider.id, alreadyConverted: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
        }
      }

      return await approveApplication(
        body.applicationId, body.adminComments,
        supabase, user.id, corsHeaders, supabaseUrl, supabaseKey,
      );
    }

    // **ACTION: reject**
    if (body.action === 'reject') {
      if (!body.applicationId) throw new Error('applicationId required');

      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'rejected',
          admin_comments: body.adminComments || 'Candidature rejetée',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.applicationId);

      if (error) throw error;

      await supabase
        .from('admin_actions_log')
        .insert({
          admin_user_id: user.id,
          entity_type: 'job_application',
          entity_id: body.applicationId,
          action_type: 'rejected',
          new_data: { status: 'rejected' },
          description: body.adminComments || 'Candidature rejetée',
        });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in admin-applications:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
