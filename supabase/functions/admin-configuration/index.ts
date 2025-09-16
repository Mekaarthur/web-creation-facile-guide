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
    console.log('Admin configuration action:', action, 'Data:', requestData);

    switch (action) {
      case 'get_platform_settings':
        return await getPlatformSettings(supabase, requestData);
      case 'update_platform_settings':
        return await updatePlatformSettings(supabase, requestData);
      case 'get_service_settings':
        return await getServiceSettings(supabase, requestData);
      case 'update_service_settings':
        return await updateServiceSettings(supabase, requestData);
      case 'get_payment_settings':
        return await getPaymentSettings(supabase, requestData);
      case 'update_payment_settings':
        return await updatePaymentSettings(supabase, requestData);
      case 'get_notification_settings':
        return await getNotificationSettings(supabase, requestData);
      case 'update_notification_settings':
        return await updateNotificationSettings(supabase, requestData);
      case 'get_security_settings':
        return await getSecuritySettings(supabase, requestData);
      case 'update_security_settings':
        return await updateSecuritySettings(supabase, requestData);
      case 'get_business_settings':
        return await getBusinessSettings(supabase, requestData);
      case 'update_business_settings':
        return await updateBusinessSettings(supabase, requestData);
      case 'export_settings':
        return await exportSettings(supabase, requestData);
      case 'import_settings':
        return await importSettings(supabase, requestData);
      default:
        throw new Error(`Action non reconnue: ${action}`);
    }
  } catch (error) {
    console.error('Erreur dans admin-configuration:', error);
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

async function getPlatformSettings(supabase: any, {}: any) {
  try {
    // Pour l'instant, retourner des paramètres par défaut
    // Dans une vraie implémentation, ces données viendraient d'une table system_settings
    const settings = {
      general: {
        platform_name: 'Bikawo',
        platform_description: 'Plateforme de services à domicile de confiance',
        support_email: 'support@bikawo.com',
        maintenance_mode: false,
        registration_enabled: true,
        guest_checkout_enabled: false,
        multi_language_enabled: false,
        default_language: 'fr',
        timezone: 'Europe/Paris'
      },
      branding: {
        logo_url: '/logo.png',
        favicon_url: '/favicon.ico',
        primary_color: '#e65100',
        secondary_color: '#f5f5f4',
        accent_color: '#f97316',
        font_family: 'Inter'
      },
      contact: {
        company_name: 'Bikawo SAS',
        address: '123 Rue de la Paix, 75001 Paris',
        phone: '+33 1 23 45 67 89',
        email: 'contact@bikawo.com',
        website: 'https://bikawo.com',
        social_media: {
          facebook: 'https://facebook.com/bikawo',
          instagram: 'https://instagram.com/bikawo',
          linkedin: 'https://linkedin.com/company/bikawo'
        }
      },
      legal: {
        terms_url: 'https://bikawo.com/terms',
        privacy_url: 'https://bikawo.com/privacy',
        cookies_url: 'https://bikawo.com/cookies',
        legal_notices_url: 'https://bikawo.com/legal',
        gdpr_enabled: true,
        cookie_consent_enabled: true
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        settings: settings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres plateforme:', error);
    throw error;
  }
}

async function updatePlatformSettings(supabase: any, { settings, adminUserId }: any) {
  try {
    // Simuler la mise à jour des paramètres
    const updatedSettings = {
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId
    };

    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'platform_settings',
        action_type: 'update',
        description: 'Paramètres de la plateforme mis à jour',
        new_data: updatedSettings
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paramètres de la plateforme mis à jour avec succès',
        settings: updatedSettings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres plateforme:', error);
    throw error;
  }
}

async function getServiceSettings(supabase: any, {}: any) {
  try {
    // Récupérer les services depuis la base de données
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;

    // Configuration des services
    const serviceSettings = {
      default_duration: 2, // heures
      booking_advance_notice: 24, // heures
      cancellation_policy: 24, // heures avant annulation gratuite
      auto_assignment_enabled: true,
      provider_search_radius: 25, // km
      max_providers_per_request: 5,
      rating_required: true,
      minimum_rating_to_book: 3.0,
      services: services || []
    };

    return new Response(
      JSON.stringify({
        success: true,
        settings: serviceSettings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres services:', error);
    throw error;
  }
}

async function updateServiceSettings(supabase: any, { settings, adminUserId }: any) {
  try {
    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'service_settings',
        action_type: 'update',
        description: 'Paramètres des services mis à jour',
        new_data: settings
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paramètres des services mis à jour avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres services:', error);
    throw error;
  }
}

async function getPaymentSettings(supabase: any, {}: any) {
  try {
    const paymentSettings = {
      stripe_enabled: true,
      paypal_enabled: false,
      bank_transfer_enabled: true,
      minimum_payment: 10.00,
      maximum_payment: 1000.00,
      commission_rate: 15, // pourcentage
      provider_payout_delay: 7, // jours
      auto_payout_enabled: false,
      currency: 'EUR',
      tax_rate: 20, // pourcentage TVA
      invoice_prefix: 'BKW',
      payment_methods: [
        { id: 'card', name: 'Carte bancaire', enabled: true, processing_fee: 2.9 },
        { id: 'sepa', name: 'Virement SEPA', enabled: true, processing_fee: 0.5 },
        { id: 'paypal', name: 'PayPal', enabled: false, processing_fee: 3.4 }
      ]
    };

    return new Response(
      JSON.stringify({
        success: true,
        settings: paymentSettings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres paiement:', error);
    throw error;
  }
}

async function updatePaymentSettings(supabase: any, { settings, adminUserId }: any) {
  try {
    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'payment_settings',
        action_type: 'update',
        description: 'Paramètres de paiement mis à jour',
        new_data: settings
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paramètres de paiement mis à jour avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres paiement:', error);
    throw error;
  }
}

async function getNotificationSettings(supabase: any, {}: any) {
  try {
    const notificationSettings = {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      email_provider: 'resend',
      sms_provider: 'twilio',
      notification_types: {
        booking_confirmation: {
          email: true,
          sms: false,
          push: true,
          template: 'booking_confirmation'
        },
        booking_reminder: {
          email: true,
          sms: true,
          push: true,
          template: 'booking_reminder',
          send_hours_before: 24
        },
        payment_confirmation: {
          email: true,
          sms: false,
          push: false,
          template: 'payment_confirmation'
        },
        provider_assignment: {
          email: true,
          sms: false,
          push: true,
          template: 'provider_assignment'
        },
        review_request: {
          email: true,
          sms: false,
          push: false,
          template: 'review_request',
          send_hours_after: 2
        }
      },
      email_settings: {
        from_name: 'Bikawo',
        from_email: 'no-reply@bikawo.com',
        reply_to: 'support@bikawo.com',
        footer_text: 'Bikawo - Services à domicile de confiance'
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        settings: notificationSettings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres notifications:', error);
    throw error;
  }
}

async function updateNotificationSettings(supabase: any, { settings, adminUserId }: any) {
  try {
    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'notification_settings',
        action_type: 'update',
        description: 'Paramètres de notification mis à jour',
        new_data: settings
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paramètres de notification mis à jour avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres notifications:', error);
    throw error;
  }
}

async function getSecuritySettings(supabase: any, {}: any) {
  try {
    const securitySettings = {
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: false,
        expire_after_days: 0 // 0 = jamais
      },
      session_settings: {
        session_timeout: 24, // heures
        concurrent_sessions_allowed: 3,
        remember_me_duration: 30 // jours
      },
      verification_settings: {
        email_verification_required: true,
        phone_verification_required: false,
        provider_identity_verification: true,
        provider_insurance_verification: true
      },
      security_features: {
        two_factor_auth_enabled: false,
        login_attempt_limit: 5,
        lockout_duration: 30, // minutes
        ip_whitelist_enabled: false,
        suspicious_activity_detection: true
      },
      data_protection: {
        data_encryption_enabled: true,
        gdpr_compliance: true,
        data_retention_period: 36, // mois
        anonymous_analytics: true,
        cookie_consent_required: true
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        settings: securitySettings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres sécurité:', error);
    throw error;
  }
}

async function updateSecuritySettings(supabase: any, { settings, adminUserId }: any) {
  try {
    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'security_settings',
        action_type: 'update',
        description: 'Paramètres de sécurité mis à jour',
        new_data: settings
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paramètres de sécurité mis à jour avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres sécurité:', error);
    throw error;
  }
}

async function getBusinessSettings(supabase: any, {}: any) {
  try {
    const businessSettings = {
      operational_hours: {
        monday: { start: '08:00', end: '20:00', enabled: true },
        tuesday: { start: '08:00', end: '20:00', enabled: true },
        wednesday: { start: '08:00', end: '20:00', enabled: true },
        thursday: { start: '08:00', end: '20:00', enabled: true },
        friday: { start: '08:00', end: '20:00', enabled: true },
        saturday: { start: '09:00', end: '18:00', enabled: true },
        sunday: { start: '10:00', end: '16:00', enabled: false }
      },
      service_areas: [
        {
          name: 'Paris',
          postal_codes: ['75001', '75002', '75003', '75004', '75005'],
          active: true
        },
        {
          name: 'Banlieue proche',
          postal_codes: ['92', '93', '94'],
          active: true
        }
      ],
      pricing_rules: {
        weekend_surcharge: 20, // pourcentage
        evening_surcharge: 15, // pourcentage (après 18h)
        holiday_surcharge: 50, // pourcentage
        minimum_service_duration: 1, // heure
        travel_cost_per_km: 0.50
      },
      quality_control: {
        mandatory_insurance: true,
        background_check_required: true,
        minimum_rating_to_stay_active: 3.0,
        review_response_required: false,
        quality_score_calculation: 'weighted' // weighted, simple
      },
      provider_onboarding: {
        auto_approval_enabled: false,
        document_verification_required: true,
        interview_required: true,
        trial_period_days: 30,
        initial_rating: 5.0
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        settings: businessSettings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres business:', error);
    throw error;
  }
}

async function updateBusinessSettings(supabase: any, { settings, adminUserId }: any) {
  try {
    // Logger l'action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'business_settings',
        action_type: 'update',
        description: 'Paramètres business mis à jour',
        new_data: settings
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paramètres business mis à jour avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres business:', error);
    throw error;
  }
}

async function exportSettings(supabase: any, { categories, adminUserId }: any) {
  try {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      categories: {},
      exported_by: adminUserId
    };

    // Exporter les catégories demandées
    for (const category of categories) {
      switch (category) {
        case 'platform':
          const platformResponse = await getPlatformSettings(supabase, {});
          const platformData = await platformResponse.json();
          (exportData.categories as any).platform = platformData.settings;
          break;
        case 'services':
          const servicesResponse = await getServiceSettings(supabase, {});
          const servicesData = await servicesResponse.json();
          (exportData.categories as any).services = servicesData.settings;
          break;
        case 'payments':
          const paymentsResponse = await getPaymentSettings(supabase, {});
          const paymentsData = await paymentsResponse.json();
          (exportData.categories as any).payments = paymentsData.settings;
          break;
        case 'notifications':
          const notificationsResponse = await getNotificationSettings(supabase, {});
          const notificationsData = await notificationsResponse.json();
          (exportData.categories as any).notifications = notificationsData.settings;
          break;
        case 'security':
          const securityResponse = await getSecuritySettings(supabase, {});
          const securityData = await securityResponse.json();
          (exportData.categories as any).security = securityData.settings;
          break;
        case 'business':
          const businessResponse = await getBusinessSettings(supabase, {});
          const businessData = await businessResponse.json();
          (exportData.categories as any).business = businessData.settings;
          break;
      }
    }

    // Logger l'export
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'settings',
        action_type: 'export',
        description: `Export des paramètres: ${categories.join(', ')}`,
        new_data: { categories: categories }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paramètres exportés avec succès',
        data: JSON.stringify(exportData, null, 2),
        filename: `bikawo_settings_${new Date().toISOString().split('T')[0]}.json`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'export des paramètres:', error);
    throw error;
  }
}

async function importSettings(supabase: any, { settingsData, overwrite = false, adminUserId }: any) {
  try {
    const importResults = [];

    try {
      const settings = typeof settingsData === 'string' ? 
        JSON.parse(settingsData) : 
        settingsData;

      // Importer chaque catégorie
      for (const [category, categorySettings] of Object.entries(settings.categories || {})) {
        try {
          switch (category) {
            case 'platform':
              await updatePlatformSettings(supabase, { 
                settings: categorySettings, 
                adminUserId 
              });
              importResults.push({ category, status: 'success' });
              break;
            case 'services':
              await updateServiceSettings(supabase, { 
                settings: categorySettings, 
                adminUserId 
              });
              importResults.push({ category, status: 'success' });
              break;
            case 'payments':
              await updatePaymentSettings(supabase, { 
                settings: categorySettings, 
                adminUserId 
              });
              importResults.push({ category, status: 'success' });
              break;
            case 'notifications':
              await updateNotificationSettings(supabase, { 
                settings: categorySettings, 
                adminUserId 
              });
              importResults.push({ category, status: 'success' });
              break;
            case 'security':
              await updateSecuritySettings(supabase, { 
                settings: categorySettings, 
                adminUserId 
              });
              importResults.push({ category, status: 'success' });
              break;
            case 'business':
              await updateBusinessSettings(supabase, { 
                settings: categorySettings, 
                adminUserId 
              });
              importResults.push({ category, status: 'success' });
              break;
            default:
              importResults.push({ 
                category, 
                status: 'skipped', 
                message: 'Catégorie non reconnue' 
              });
          }
        } catch (error) {
          importResults.push({ 
            category, 
            status: 'error', 
            message: error.message 
          });
        }
      }

      // Logger l'import
      await supabase
        .from('admin_actions_log')
        .insert({
          admin_user_id: adminUserId,
          entity_type: 'settings',
          action_type: 'import',
          description: 'Import des paramètres de configuration',
          new_data: { 
            results: importResults,
            overwrite: overwrite
          }
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Import des paramètres terminé',
          results: importResults,
          summary: {
            total: importResults.length,
            successful: importResults.filter(r => r.status === 'success').length,
            errors: importResults.filter(r => r.status === 'error').length,
            skipped: importResults.filter(r => r.status === 'skipped').length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      throw new Error('Format de données invalide');
    }
  } catch (error) {
    console.error('Erreur lors de l\'import des paramètres:', error);
    throw error;
  }
}