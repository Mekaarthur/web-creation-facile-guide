import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlatformSettingsRequest {
  action: 'get' | 'update' | 'reset';
  settings?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { action, settings }: PlatformSettingsRequest = await req.json()

    switch (action) {
      case 'get':
        return await getSettings(supabase)
      
      case 'update':
        return await updateSettings(supabase, settings!, user.id)
      
      case 'reset':
        return await resetSettings(supabase, user.id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('Error in platform-settings function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getSettings(supabase: any) {
  try {
    const { data: settingsData, error } = await supabase
      .from('platform_settings')
      .select('category, key, value')

    if (error) throw error

    // Transform flat settings into nested structure
    const settings = {
      general: {},
      payments: {},
      notifications: {},
      security: {},
      business: {}
    }

    settingsData.forEach((setting: any) => {
      if (settings[setting.category as keyof typeof settings]) {
        (settings[setting.category as keyof typeof settings] as any)[setting.key] = setting.value
      }
    })

    return new Response(
      JSON.stringify({ success: true, settings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting settings:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function updateSettings(supabase: any, settings: Record<string, any>, adminUserId: string) {
  try {
    const updates: Array<{ category: string; key: string; value: any }> = []

    // Flatten the nested settings structure
    Object.entries(settings).forEach(([category, categorySettings]) => {
      if (typeof categorySettings === 'object' && categorySettings !== null) {
        Object.entries(categorySettings as Record<string, any>).forEach(([key, value]) => {
          updates.push({ category, key, value })
        })
      }
    })

    // Update each setting
    for (const update of updates) {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          category: update.category,
          key: update.key,
          value: update.value
        }, {
          onConflict: 'category,key'
        })

      if (error) throw error
    }

    // Log the admin action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'platform_settings',
        entity_id: null,
        action_type: 'settings_updated',
        new_data: settings,
        description: 'Platform settings updated'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Settings updated successfully',
        updatedCount: updates.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error updating settings:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function resetSettings(supabase: any, adminUserId: string) {
  try {
    // Default settings values
    const defaultSettings = [
      { category: 'general', key: 'site_name', value: 'Bikawo' },
      { category: 'general', key: 'site_description', value: 'Plateforme de services à domicile' },
      { category: 'general', key: 'contact_email', value: 'contact@bikawo.com' },
      { category: 'general', key: 'default_language', value: 'fr' },
      { category: 'general', key: 'timezone', value: 'Europe/Paris' },
      { category: 'general', key: 'maintenance_mode', value: false },
      
      { category: 'payments', key: 'stripe_enabled', value: true },
      { category: 'payments', key: 'commission_rate', value: 15 },
      { category: 'payments', key: 'minimum_payout', value: 50 },
      { category: 'payments', key: 'auto_payout', value: true },
      { category: 'payments', key: 'currency', value: 'EUR' },
      
      { category: 'notifications', key: 'email_notifications', value: true },
      { category: 'notifications', key: 'sms_notifications', value: false },
      { category: 'notifications', key: 'push_notifications', value: true },
      { category: 'notifications', key: 'admin_alerts', value: true },
      
      { category: 'security', key: 'require_email_verification', value: true },
      { category: 'security', key: 'two_factor_auth', value: false },
      { category: 'security', key: 'session_timeout', value: 24 },
      { category: 'security', key: 'password_min_length', value: 8 },
      
      { category: 'business', key: 'auto_assignment', value: true },
      { category: 'business', key: 'max_providers_per_request', value: 5 },
      { category: 'business', key: 'request_timeout_hours', value: 24 },
      { category: 'business', key: 'rating_required', value: true }
    ]

    // Reset all settings to defaults
    for (const setting of defaultSettings) {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          category: setting.category,
          key: setting.key,
          value: setting.value
        }, {
          onConflict: 'category,key'
        })

      if (error) throw error
    }

    // Log the admin action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'platform_settings',
        entity_id: null,
        action_type: 'settings_reset',
        new_data: { reset_to: 'defaults' },
        description: 'Platform settings reset to defaults'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Settings reset to defaults successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error resetting settings:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}