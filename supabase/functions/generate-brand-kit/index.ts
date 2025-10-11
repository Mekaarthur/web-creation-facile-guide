import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { settings } = await req.json();

    if (!settings) {
      throw new Error('Brand settings are required');
    }

    // Générer le contenu du kit de marque
    const brandKitContent = {
      brand_name: settings.identity.brand_name,
      tagline: settings.identity.tagline,
      description: settings.identity.description,
      colors: {
        primary: settings.identity.brand_color_primary,
        secondary: settings.identity.brand_color_secondary,
        accent: settings.identity.brand_color_accent
      },
      typography: {
        primary_font: settings.visual.font_primary,
        secondary_font: settings.visual.font_secondary
      },
      visual_settings: {
        border_radius: settings.visual.border_radius,
        shadows: settings.visual.shadows,
        animations: settings.visual.animations
      },
      assets: {
        logo_url: settings.identity.logo_url,
        favicon_url: settings.identity.favicon_url
      },
      content: settings.content,
      generated_at: new Date().toISOString()
    };

    // Générer un fichier JSON pour le moment
    // Dans une version future, on pourrait générer un vrai ZIP avec des assets
    const jsonContent = JSON.stringify(brandKitContent, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const base64 = btoa(jsonContent);

    // Retourner un data URL pour téléchargement
    const dataUrl = `data:application/json;base64,${base64}`;

    return new Response(
      JSON.stringify({
        success: true,
        download_url: dataUrl,
        filename: `${settings.identity.brand_name.toLowerCase().replace(/\s+/g, '-')}-brand-kit.json`,
        message: 'Brand kit generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating brand kit:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        message: 'Failed to generate brand kit'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});