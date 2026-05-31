/**
 * Shared Supabase mock helpers for Playwright E2E tests.
 *
 * Import what you need:
 *   import { makeProviderSession, json, MOCK_USER_ID } from '../helpers/supabase-mocks';
 */

import type { Route, Page } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MOCK_USER_ID       = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
export const MOCK_PROVIDER_ID   = 'bbbbbbbb-1111-2222-3333-ffffffffffff';
export const MOCK_CLIENT_EMAIL  = 'client@test.bikawo.fr';
export const MOCK_PROVIDER_EMAIL = 'provider@test.bikawo.fr';

/**
 * Supabase localStorage key. Derived from the project URL.
 * Falls back to the real project ref when VITE_SUPABASE_PROJECT_ID is not set.
 */
export function supabaseStorageKey(projectId?: string): string {
  const ref = projectId ?? process.env.VITE_SUPABASE_PROJECT_ID ?? 'cgrosjzmbgxmtvwxictr';
  return `sb-${ref}-auth-token`;
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

/** Build a minimal Supabase-compatible JWT (Node Buffer available in PW test env). */
export function makeMockJwt(
  userId   = MOCK_USER_ID,
  email    = MOCK_CLIENT_EMAIL,
  extra: Record<string, unknown> = {},
): string {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub:   userId,
    email,
    role:  'authenticated',
    aud:   'authenticated',
    exp:   Math.floor(Date.now() / 1000) + 3600,
    ...extra,
  })).toString('base64url');
  return `${header}.${payload}.mockSig`;
}

// ─── Session factories ────────────────────────────────────────────────────────

export interface SessionOptions {
  userId?         : string;
  email?          : string;
  emailConfirmed? : boolean;
  identities?     : unknown[];
  userMeta?       : Record<string, unknown>;
}

/** Build a full Supabase auth-response body for a given user. */
export function makeSessionBody(opts: SessionOptions = {}) {
  const {
    userId         = MOCK_USER_ID,
    email          = MOCK_CLIENT_EMAIL,
    emailConfirmed = true,
    identities     = [{ id: userId, user_id: userId, identity_data: {}, provider: 'email', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
    userMeta       = { first_name: 'Marie', last_name: 'Dupont', user_type: 'client' },
  } = opts;

  return {
    access_token:  makeMockJwt(userId, email),
    token_type:    'bearer',
    expires_in:    3600,
    expires_at:    Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock_refresh_token',
    user: {
      id:                 userId,
      aud:                'authenticated',
      role:               'authenticated',
      email,
      email_confirmed_at: emailConfirmed ? new Date().toISOString() : null,
      phone:              '',
      confirmed_at:       emailConfirmed ? new Date().toISOString() : null,
      last_sign_in_at:    new Date().toISOString(),
      app_metadata:       {},
      user_metadata:      userMeta,
      identities,
      created_at:         new Date().toISOString(),
      updated_at:         new Date().toISOString(),
    },
  };
}

export const makeClientSession  = (opts?: SessionOptions) => makeSessionBody({ email: MOCK_CLIENT_EMAIL,   userMeta: { user_type: 'client' },   ...opts });
export const makeProviderSession = (opts?: SessionOptions) => makeSessionBody({ email: MOCK_PROVIDER_EMAIL, userMeta: { user_type: 'prestataire' }, ...opts });

// ─── Route-fulfillment helpers ────────────────────────────────────────────────

export type Handler = (route: Route) => void;

export const json = (status: number, body: unknown): Handler =>
  (r) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

// Common stubs
export const stubEmpty  : Handler = json(200, []);
export const stubNull   : Handler = json(200, null);
export const stub200    : Handler = json(200, { success: true });

// Auth stubs
export const mockLoginSuccess      = (opts?: SessionOptions): Handler => json(200, makeSessionBody(opts));
export const mockLoginInvalid      : Handler = json(400, { error: 'invalid_grant', message: 'Invalid login credentials' });
export const mockSignupSuccess     = (opts?: SessionOptions): Handler => json(200, makeSessionBody(opts));
export const mockSignupGhostUser   : Handler = json(200, { ...makeSessionBody({ emailConfirmed: false }), user: { ...makeSessionBody({ emailConfirmed: false }).user, identities: [] } });

// DB stubs
export const mockUserRolesClient   : Handler = json(200, [{ role: 'client',   user_id: MOCK_USER_ID }]);
export const mockUserRolesProvider : Handler = json(200, [{ role: 'provider', user_id: MOCK_USER_ID }]);
export const mockUserRolesEmpty    : Handler = json(200, []);

export const mockProviderUnverified: Handler = json(200, [{ id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID, is_verified: false,  status: 'pending', business_name: 'Test Provider', documents_submitted: false, mandat_facturation_accepte: false, formation_completed: false }]);
export const mockProviderVerified  : Handler = json(200, [{ id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID, is_verified: true,   status: 'active',  business_name: 'Test Provider', documents_submitted: true,  mandat_facturation_accepte: true,  formation_completed: true  }]);
export const mockProvidersEmpty    : Handler = json(200, []);

// maybeSingle — Supabase wraps single-row REST response as JSON object (not array)
// when ?select=...&limit=1 with .maybeSingle() is used, the REST layer may return an array; the SDK extracts [0].
// We return an array here so the mock works for both patterns.
export const mockProviderUnverifiedSingle: Handler = json(200, { id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID, is_verified: false, status: 'pending', business_name: 'Test Provider', documents_submitted: false, mandat_facturation_accepte: false, formation_completed: false });
export const mockProviderVerifiedSingle  : Handler = json(200, { id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID, is_verified: true,  status: 'active',  business_name: 'Test Provider', documents_submitted: true,  mandat_facturation_accepte: true,  formation_completed: true  });
export const mockProviderNullSingle      : Handler = json(200, null);

export const mockProviderDocsEmpty: Handler = json(200, []);
export const mockStorageUpload    : Handler = json(200, { Key: 'provider-applications/test/doc.pdf', path: 'test/doc.pdf', fullPath: 'provider-applications/test/doc.pdf' });

// ─── Session injection ────────────────────────────────────────────────────────

/**
 * Inject a Supabase session into localStorage BEFORE the page navigates.
 * Must be called before page.goto().
 * Usage:
 *   await injectSession(page, makeProviderSession());
 *   await page.goto('/provider-onboarding');
 */
export async function injectSession(page: Page, sessionBody: ReturnType<typeof makeSessionBody>) {
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, {
    key:   supabaseStorageKey(),
    value: sessionBody,
  });
}

// ─── Minimal test file helper ─────────────────────────────────────────────────

/** Create a tiny in-memory File-like blob for setInputFiles(). */
export function minimalPdfBuffer(): Buffer {
  // A 13-byte valid PDF skeleton
  return Buffer.from('%PDF-1.4\n%%EOF\n');
}
