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
            nom_zone: "Paris (75)",
            codes_postaux: Array.from({length: 20}, (_, i) => `750${String(i + 1).padStart(2, '0')}`),
            type_zone: "departement",
            rayon_km: 30
          },
          {
            nom_zone: "Essonne (91)",
            codes_postaux: ["91000", "91100", "91120", "91130", "91140", "91150", "91160", "91170", "91190", "91200", "91210", "91220", "91230", "91240", "91250", "91260", "91270", "91280", "91290", "91300", "91310", "91320", "91330", "91340", "91350", "91360", "91370", "91380", "91390", "91400", "91410", "91420", "91430", "91440", "91450", "91460", "91470", "91480", "91490", "91500", "91510", "91520", "91530", "91540", "91550", "91560", "91570", "91580", "91590", "91600", "91610", "91620", "91630", "91640", "91650", "91660", "91670", "91680", "91690", "91700", "91710", "91720", "91730", "91740", "91750", "91760", "91770", "91780", "91790", "91800", "91810", "91820", "91830", "91840", "91850", "91860", "91870", "91880", "91890", "91940", "91970"],
            type_zone: "departement",
            rayon_km: 35
          },
          {
            nom_zone: "Hauts-de-Seine (92)", 
            codes_postaux: ["92000", "92100", "92110", "92120", "92130", "92140", "92150", "92160", "92170", "92190", "92200", "92210", "92220", "92230", "92240", "92250", "92260", "92270", "92290", "92300", "92310", "92320", "92330", "92340", "92350", "92360", "92370", "92380", "92390", "92400", "92410", "92420", "92430", "92500", "92600", "92700", "92800", "92900"],
            type_zone: "departement",
            rayon_km: 25
          },
          {
            nom_zone: "Seine-Saint-Denis (93)",
            codes_postaux: ["93000", "93100", "93110", "93120", "93130", "93140", "93150", "93160", "93170", "93190", "93200", "93210", "93220", "93230", "93240", "93250", "93260", "93270", "93290", "93300", "93310", "93320", "93330", "93340", "93350", "93360", "93370", "93380", "93390", "93400", "93410", "93420", "93430", "93440", "93450", "93460", "93470", "93500", "93600", "93700", "93800"],
            type_zone: "departement", 
            rayon_km: 30
          },
          {
            nom_zone: "Val-de-Marne (94)",
            codes_postaux: ["94000", "94100", "94110", "94120", "94130", "94140", "94150", "94160", "94170", "94190", "94200", "94210", "94220", "94230", "94240", "94250", "94260", "94270", "94290", "94300", "94310", "94320", "94340", "94350", "94360", "94370", "94380", "94390", "94400", "94410", "94420", "94430", "94440", "94450", "94460", "94470", "94480", "94490", "94500", "94510", "94520", "94530", "94550", "94600", "94700", "94800", "94880"],
            type_zone: "departement",
            rayon_km: 30
          },
          {
            nom_zone: "Val-d'Oise (95)",
            codes_postaux: ["95000", "95100", "95110", "95120", "95130", "95140", "95150", "95160", "95170", "95190", "95200", "95210", "95220", "95230", "95240", "95250", "95260", "95270", "95280", "95290", "95300", "95310", "95320", "95330", "95340", "95350", "95360", "95370", "95380", "95390", "95400", "95410", "95420", "95430", "95440", "95450", "95460", "95470", "95480", "95490", "95500", "95510", "95520", "95530", "95540", "95550", "95560", "95570", "95580", "95590", "95600", "95610", "95620", "95630", "95640", "95650", "95660", "95670", "95680", "95690", "95700", "95710", "95720", "95730", "95740", "95750", "95760", "95770", "95780", "95790", "95800", "95810", "95820", "95830", "95840", "95850", "95860", "95870", "95880", "95890"],
            type_zone: "departement",
            rayon_km: 40
          },
          {
            nom_zone: "Yvelines (78)",
            codes_postaux: ["78000", "78100", "78110", "78120", "78125", "78130", "78140", "78150", "78160", "78170", "78180", "78190", "78200", "78210", "78220", "78230", "78240", "78250", "78260", "78270", "78280", "78290", "78300", "78310", "78320", "78330", "78340", "78350", "78360", "78370", "78380", "78390", "78400", "78410", "78420", "78430", "78440", "78450", "78460", "78470", "78480", "78490", "78500", "78510", "78520", "78530", "78540", "78550", "78560", "78570", "78580", "78590", "78600", "78610", "78620", "78630", "78640", "78650", "78660", "78670", "78680", "78690", "78700", "78710", "78720", "78730", "78740", "78750", "78760", "78770", "78780", "78790", "78800", "78810", "78820", "78830", "78840", "78850", "78860", "78870", "78880", "78890", "78940", "78950", "78955", "78960", "78970", "78980", "78990"],
            type_zone: "departement",
            rayon_km: 45
          },
          {
            nom_zone: "Oise (60)",
            codes_postaux: ["60000", "60100", "60110", "60120", "60130", "60140", "60150", "60160", "60170", "60180", "60190", "60200", "60210", "60220", "60230", "60240", "60250", "60260", "60270", "60280", "60290", "60300", "60310", "60320", "60330", "60340", "60350", "60360", "60370", "60380", "60390", "60400", "60410", "60420", "60430", "60440", "60450", "60460", "60470", "60480", "60490", "60500", "60510", "60520", "60530", "60540", "60550", "60560", "60570", "60580", "60590", "60600", "60610", "60620", "60630", "60640", "60650", "60660", "60670", "60680", "60690", "60700", "60710", "60720", "60730", "60740", "60750", "60760", "60770", "60780", "60790", "60800", "60810", "60820", "60830", "60840", "60850", "60860", "60870", "60880", "60890"],
            type_zone: "departement",
            rayon_km: 50
          },
          {
            nom_zone: "Seine-et-Marne (77)",
            codes_postaux: ["77000", "77100", "77110", "77120", "77130", "77140", "77150", "77160", "77170", "77180", "77190", "77200", "77210", "77220", "77230", "77240", "77250", "77260", "77270", "77280", "77290", "77300", "77310", "77320", "77330", "77340", "77350", "77360", "77370", "77380", "77390", "77400", "77410", "77420", "77430", "77440", "77450", "77460", "77470", "77480", "77490", "77500", "77510", "77520", "77530", "77540", "77550", "77560", "77570", "77580", "77590", "77600", "77610", "77620", "77630", "77640", "77650", "77660", "77670", "77680", "77690", "77700", "77710", "77720", "77730", "77740", "77750", "77760", "77770", "77780", "77790", "77800", "77810", "77820", "77830", "77840", "77850", "77860", "77870", "77880", "77890", "77940", "77950", "77960", "77970", "77980", "77990"],
            type_zone: "departement",
            rayon_km: 60
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