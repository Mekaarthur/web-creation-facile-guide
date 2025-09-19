import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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

    if (req.method === 'GET') {
      return await getSettings(supabase)
    } else if (req.method === 'POST') {
      const { action, settings, category } = await req.json()
      
      switch (action) {
        case 'save':
          return await saveSettings(supabase, settings, user.id)
        case 'reset':
          return await resetSettings(supabase, category, user.id)
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
      }
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
      .select('*')
      .order('category, key')

    if (error) throw error

    // Convert to structured format
    const settings = {
      general: {},
      payments: {},
      notifications: {},
      security: {},
      business: {}
    }

    settingsData?.forEach((setting: any) => {
      const category = setting.category as keyof typeof settings
      if (category in settings) {
        // Parse JSON value
        let value = setting.value
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch {
            // Keep as string if not valid JSON
          }
        }
        (settings[category] as any)[setting.key] = value
      }
    })

    return new Response(
      JSON.stringify({ success: true, settings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching settings:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function saveSettings(supabase: any, settings: any, adminUserId: string) {
  try {
    const updates = []

    // Flatten settings object
    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(categorySettings as any)) {
        updates.push({
          category,
          key,
          value: JSON.stringify(value)
        })
      }
    }

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

    // Log the action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'platform_settings',
        entity_id: null,
        action_type: 'settings_updated',
        new_data: { settings_count: updates.length, updated_at: new Date().toISOString() }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Paramètres sauvegardés avec succès',
        updated_count: updates.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error saving settings:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function resetSettings(supabase: any, category: string, adminUserId: string) {
  try {
    // Default values for reset
    const defaultSettings: Record<string, any> = {
      general: {
        site_name: 'Bikawo',
        site_description: 'Plateforme de services à domicile',
        contact_email: 'contact@bikawo.com',
        default_language: 'fr',
        timezone: 'Europe/Paris',
        maintenance_mode: false
      },
      payments: {
        stripe_enabled: true,
        commission_rate: 15,
        minimum_payout: 50,
        auto_payout: true,
        currency: 'EUR'
      },
      notifications: {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        admin_alerts: true
      },
      security: {
        require_email_verification: true,
        two_factor_auth: false,
        session_timeout: 24,
        password_min_length: 8
      },
      business: {
        auto_assignment: true,
        max_providers_per_request: 5,
        request_timeout_hours: 24,
        rating_required: true
      }
    }

    let categoriesToReset = category === 'all' ? Object.keys(defaultSettings) : [category]
    let resetCount = 0

    for (const cat of categoriesToReset) {
      if (cat in defaultSettings) {
        for (const [key, value] of Object.entries(defaultSettings[cat])) {
          const { error } = await supabase
            .from('platform_settings')
            .upsert({
              category: cat,
              key,
              value: JSON.stringify(value)
            }, {
              onConflict: 'category,key'
            })

          if (error) throw error
          resetCount++
        }
      }
    }

    // Log the action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: adminUserId,
        entity_type: 'platform_settings',
        entity_id: null,
        action_type: 'settings_reset',
        new_data: { 
          reset_category: category, 
          reset_count: resetCount, 
          reset_at: new Date().toISOString() 
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Paramètres ${category === 'all' ? 'généraux' : 'de ' + category} réinitialisés`,
        reset_count: resetCount
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
