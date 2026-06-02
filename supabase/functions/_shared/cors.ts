export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bikawo.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export const corsHeadersDev = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Pour les fonctions appelées par des tiers (stripe-webhook, cron, triggers DB)
export const CORS_ALLOW_ALL = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const isDev = Deno.env.get("ENVIRONMENT") !== "production";

export const activeCorsHeaders = isDev ? corsHeadersDev : corsHeaders;
