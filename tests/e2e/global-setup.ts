/**
 * Playwright globalSetup — génère les auth-state JSON avant chaque run.
 *
 * Pourquoi ici plutôt que des fichiers statiques ?
 *   makeMockJwt() encode expires_at = now + 3600. Un fichier statique
 *   deviendrait invalide après 1 heure ; en régénérant à chaque run,
 *   les tokens sont toujours frais et Supabase JS ne déclenche pas
 *   de refresh réseau parasite pendant les tests.
 *
 * Format Playwright storageState :
 *   { cookies: [], origins: [{ origin, localStorage: [{ name, value }] }] }
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  makeClientSession,
  makeProviderSession,
  makeAdminSession,
  supabaseStorageKey,
} from './helpers/supabase-mocks';

const ORIGIN         = 'http://localhost:5173';
const AUTH_STATES_DIR = join(process.cwd(), 'tests', 'auth-states');

type SessionBody = ReturnType<typeof makeClientSession>;

function buildStorageState(session: SessionBody | null): string {
  const lsEntries = session
    ? [{ name: supabaseStorageKey(), value: JSON.stringify(session) }]
    : [];

  return JSON.stringify(
    { cookies: [], origins: [{ origin: ORIGIN, localStorage: lsEntries }] },
    null,
    2,
  );
}

export default async function globalSetup() {
  mkdirSync(AUTH_STATES_DIR, { recursive: true });

  writeFileSync(
    join(AUTH_STATES_DIR, 'client.json'),
    buildStorageState(makeClientSession()),
  );

  writeFileSync(
    join(AUTH_STATES_DIR, 'provider.json'),
    buildStorageState(makeProviderSession()),
  );

  writeFileSync(
    join(AUTH_STATES_DIR, 'admin.json'),
    buildStorageState(makeAdminSession()),
  );

  // Guest : origines présentes mais localStorage vide — pas de session Supabase
  writeFileSync(
    join(AUTH_STATES_DIR, 'guest.json'),
    buildStorageState(null),
  );
}
