/**
 * Tests unitaires pour la logique CORS admin (getAdminCorsHeaders)
 *
 * Run : deno test supabase/functions/_tests/cors.test.ts --allow-env
 *
 * Aucune dépendance externe — assertion inline pour éviter les téléchargements.
 */
import {
  getAdminCorsHeaders,
  ALLOWED_ORIGINS_ADMIN,
} from "../_shared/cors.ts";

function assertEquals(actual: unknown, expected: unknown, msg?: string): void {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed${msg ? ` (${msg})` : ""}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function assertExists(value: unknown, msg?: string): void {
  if (value === undefined || value === null) {
    throw new Error(
      `Assertion failed${msg ? ` (${msg})` : ""}: value is ${value}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Tests ALLOWED_ORIGINS_ADMIN
// ---------------------------------------------------------------------------

Deno.test("ALLOWED_ORIGINS_ADMIN contient bikawo.com", () => {
  assertExists(ALLOWED_ORIGINS_ADMIN.find((o) => o === "https://bikawo.com"));
});

Deno.test("ALLOWED_ORIGINS_ADMIN contient admin.bikawo.com", () => {
  assertExists(
    ALLOWED_ORIGINS_ADMIN.find((o) => o === "https://admin.bikawo.com"),
  );
});

// ---------------------------------------------------------------------------
// Tests getAdminCorsHeaders — origine valide reflétée
// ---------------------------------------------------------------------------

Deno.test("getAdminCorsHeaders — origin bikawo.com → reflète bikawo.com", () => {
  const headers = getAdminCorsHeaders("https://bikawo.com");
  assertEquals(headers["Access-Control-Allow-Origin"], "https://bikawo.com");
});

Deno.test("getAdminCorsHeaders — origin admin.bikawo.com → reflète admin.bikawo.com", () => {
  const headers = getAdminCorsHeaders("https://admin.bikawo.com");
  assertEquals(
    headers["Access-Control-Allow-Origin"],
    "https://admin.bikawo.com",
  );
});

// ---------------------------------------------------------------------------
// Tests getAdminCorsHeaders — origines non autorisées → défaut bikawo.com
// ---------------------------------------------------------------------------

Deno.test("getAdminCorsHeaders — origin inconnue → défaut bikawo.com", () => {
  const headers = getAdminCorsHeaders("https://evil.com");
  assertEquals(headers["Access-Control-Allow-Origin"], "https://bikawo.com");
});

Deno.test("getAdminCorsHeaders — origin null → défaut bikawo.com", () => {
  const headers = getAdminCorsHeaders(null);
  assertEquals(headers["Access-Control-Allow-Origin"], "https://bikawo.com");
});

Deno.test("getAdminCorsHeaders — origin vide → défaut bikawo.com", () => {
  const headers = getAdminCorsHeaders("");
  assertEquals(headers["Access-Control-Allow-Origin"], "https://bikawo.com");
});

// ---------------------------------------------------------------------------
// Tests getAdminCorsHeaders — headers obligatoires présents
// ---------------------------------------------------------------------------

Deno.test("getAdminCorsHeaders — Access-Control-Allow-Headers présent", () => {
  const headers = getAdminCorsHeaders("https://bikawo.com");
  assertExists(headers["Access-Control-Allow-Headers"]);
});

Deno.test("getAdminCorsHeaders — Access-Control-Allow-Methods présent", () => {
  const headers = getAdminCorsHeaders("https://bikawo.com");
  assertExists(headers["Access-Control-Allow-Methods"]);
});

// ---------------------------------------------------------------------------
// Tests de simulation OPTIONS preflight pour les 22 fonctions admin-*
// Vérifie que la valeur retournée est utilisable comme headers de réponse HTTP
// ---------------------------------------------------------------------------

const ADMIN_FUNCTIONS = [
  "admin-alerts",
  "admin-analytics",
  "admin-applications",
  "admin-assignment",
  "admin-carts",
  "admin-cleanup-duplicates",
  "admin-clients",
  "admin-configuration",
  "admin-dashboard",
  "admin-manage-roles",
  "admin-messaging-unified",
  "admin-moderation",
  "admin-notifications",
  "admin-payments",
  "admin-pricing",
  "admin-providers",
  "admin-reservations",
  "admin-reviews",
  "admin-system",
  "admin-tools",
  "admin-users-management",
  "admin-zones",
] as const;

for (const funcName of ADMIN_FUNCTIONS) {
  Deno.test(
    `OPTIONS preflight ${funcName} — origin bikawo.com → header correct`,
    () => {
      const corsHeaders = getAdminCorsHeaders("https://bikawo.com");
      const response = new Response(null, { headers: corsHeaders });
      assertEquals(
        response.headers.get("Access-Control-Allow-Origin"),
        "https://bikawo.com",
        funcName,
      );
    },
  );

  Deno.test(
    `OPTIONS preflight ${funcName} — origin admin.bikawo.com → header correct`,
    () => {
      const corsHeaders = getAdminCorsHeaders("https://admin.bikawo.com");
      const response = new Response(null, { headers: corsHeaders });
      assertEquals(
        response.headers.get("Access-Control-Allow-Origin"),
        "https://admin.bikawo.com",
        funcName,
      );
    },
  );
}
