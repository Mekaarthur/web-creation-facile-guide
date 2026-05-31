/**
 * Canonical dependencies for Supabase edge functions.
 *
 * New functions should import from here instead of using versioned URLs directly:
 *
 *   import { serve, createAdminClient, corsHeaders } from '../_shared/deps.ts';
 *
 * The import map in deno.json pins every historical version URL to the same
 * release, so existing functions that still use bare versioned URLs are also
 * redirected automatically — no manual edits required.
 */

export { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
export { createClient };
export type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export { corsHeaders } from "./cors.ts";
export { sanitizeSearch } from "./sanitize.ts";

/** Service-role client — full DB access, use only server-side. */
export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
