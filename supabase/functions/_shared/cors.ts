export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://bikawo.com",
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

// Origines autorisées pour les Edge Functions admin (app publique + backoffice admin)
export const ALLOWED_ORIGINS_ADMIN = [
  "https://bikawo.com",
  "https://admin.bikawo.com",
];

/**
 * Retourne les headers CORS en reflétant l'origine de la requête si elle est dans la liste admin.
 * Utilisé par toutes les fonctions admin-* pour supporter bikawo.com ET admin.bikawo.com.
 */
export function getAdminCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin !== null && ALLOWED_ORIGINS_ADMIN.includes(origin)
      ? origin
      : ALLOWED_ORIGINS_ADMIN[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}
