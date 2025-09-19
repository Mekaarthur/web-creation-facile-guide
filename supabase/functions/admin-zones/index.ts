import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZoneAction {
  action: 'list' | 'create' | 'update' | 'delete' | 'initialize_default_zones';
  zoneData?: {
    nom_zone: string;
    codes_postaux: string[];
    type_zone: string;
    rayon_km?: number;
    active?: boolean;
  };
  zoneId?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'No authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabasePublic.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Access denied: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, zoneData, zoneId }: ZoneAction = await req.json();
    console.log('Zone action:', action, 'Data:', zoneData, 'ID:', zoneId);

    switch (action) {
      case 'list':
        const { data: zones, error: listError } = await supabase
          .from('zones_geographiques')
          .select('*')
          .order('nom_zone');

        if (listError) throw listError;

        return new Response(JSON.stringify({ 
          success: true, 
          data: zones || [] 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'create':
        if (!zoneData) {
          return new Response(JSON.stringify({ error: 'Zone data required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: newZone, error: createError } = await supabase
          .from('zones_geographiques')
          .insert([zoneData])
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify({ 
          success: true, 
          data: newZone,
          message: 'Zone géographique créée avec succès' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'update':
        if (!zoneId || !zoneData) {
          return new Response(JSON.stringify({ error: 'Zone ID and data required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: updatedZone, error: updateError } = await supabase
          .from('zones_geographiques')
          .update(zoneData)
          .eq('id', zoneId)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ 
          success: true, 
          data: updatedZone,
          message: 'Zone géographique modifiée avec succès' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'delete':
        if (!zoneId) {
          return new Response(JSON.stringify({ error: 'Zone ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error: deleteError } = await supabase
          .from('zones_geographiques')
          .delete()
          .eq('id', zoneId);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Zone géographique supprimée avec succès' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'initialize_default_zones':
        // Initialize default zones for departments: 75, 91, 92, 93, 94, 95, 78, 60, 77
        const defaultZones = [
          {
            nom_zone: "75 - Paris",
            codes_postaux: Array.from({length: 20}, (_, i) => `750${String(i + 1).padStart(2, '0')}`),
            type_zone: "departement",
            rayon_km: 30,
            active: true
          },
          {
            nom_zone: "91 - Essonne",
            codes_postaux: ["91000"],
            type_zone: "departement",
            rayon_km: 35,
            active: true
          },
          {
            nom_zone: "92 - Hauts-de-Seine", 
            codes_postaux: ["92000"],
            type_zone: "departement",
            rayon_km: 25,
            active: true
          },
          {
            nom_zone: "93 - Seine-Saint-Denis",
            codes_postaux: ["93000"],
            type_zone: "departement", 
            rayon_km: 30,
            active: true
          },
          {
            nom_zone: "94 - Val-de-Marne",
            codes_postaux: ["94000"],
            type_zone: "departement",
            rayon_km: 30,
            active: true
          },
          {
            nom_zone: "95 - Val-d'Oise",
            codes_postaux: ["95000"],
            type_zone: "departement",
            rayon_km: 40,
            active: true
          },
          {
            nom_zone: "78 - Yvelines",
            codes_postaux: ["78000"],
            type_zone: "departement",
            rayon_km: 45,
            active: true
          },
          {
            nom_zone: "77 - Seine-et-Marne",
            codes_postaux: ["77000"],
            type_zone: "departement",
            rayon_km: 60,
            active: true
          }
        ];

        // Check if zones already exist
        const { data: existingZones, error: checkError } = await supabase
          .from('zones_geographiques')
          .select('nom_zone');

        if (checkError) throw checkError;

        const existingNames = new Set(existingZones?.map(z => z.nom_zone) || []);
        const zonesToCreate = defaultZones.filter(zone => !existingNames.has(zone.nom_zone));

        if (zonesToCreate.length === 0) {
          return new Response(JSON.stringify({ 
            success: true,
            message: 'Toutes les zones par défaut existent déjà' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: createdZones, error: initError } = await supabase
          .from('zones_geographiques')
          .insert(zonesToCreate)
          .select();

        if (initError) throw initError;

        return new Response(JSON.stringify({ 
          success: true,
          data: createdZones,
          message: `${zonesToCreate.length} zones par défaut créées avec succès` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Admin zones error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});