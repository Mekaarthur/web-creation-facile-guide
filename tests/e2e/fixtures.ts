// Playwright fixtures par role — utiliser dans les tests *.role.spec.ts.
// Remplace le pattern repetitif page.route(...) par role dans chaque test.
//
// Usage:
//   import { test, expect } from '../fixtures';
//   test('mon test client', async ({ clientPage }) => {
//     await clientPage.goto('/espace-personnel');
//   });

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  MOCK_USER_ID,
  MOCK_PROVIDER_EMAIL,
  makeClientSession,
  makeAdminSession,
  json,
  stubEmpty,
  mockUserRolesClient,
  mockUserRolesProvider,
  mockUserRolesAdmin,
  mockProviderVerifiedSingle,
} from './helpers/supabase-mocks';

// ---- Types ------------------------------------------------------------------

type RoleFixtures = {
  clientPage:   Page;
  providerPage: Page;
  adminPage:    Page;
  guestPage:    Page;
};

// ---- Internal helpers -------------------------------------------------------

async function wireCommonRoutes(page: Page): Promise<void> {
  // catch-alls first (LIFO — mocks specifiques enregistres APRES)
  await page.route('**/auth/v1/**',      stubEmpty);
  await page.route('**/rest/v1/**',      stubEmpty);
  await page.route('**/functions/v1/**', json(200, {}));
  await page.route('**/storage/v1/**',   json(200, {}));
}

// ---- Fixture definitions ----------------------------------------------------

export const test = base.extend<RoleFixtures>({

  clientPage: async ({ page }, use) => {
    await wireCommonRoutes(page);
    await page.route('**/auth/v1/user**',      json(200, makeClientSession().user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);
    await page.route('**/rest/v1/providers*',  json(200, null));
    await use(page);
  },

  providerPage: async ({ page }, use) => {
    await wireCommonRoutes(page);
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    // Provider verifie par defaut — surcharger dans le test si necessaire
    await page.route('**/rest/v1/providers*',  mockProviderVerifiedSingle);
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await wireCommonRoutes(page);
    await page.route('**/auth/v1/user**',      json(200, makeAdminSession().user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesAdmin);
    await page.route('**/rest/v1/providers*',  json(200, null));
    await use(page);
  },

  guestPage: async ({ page }, use) => {
    await wireCommonRoutes(page);
    // Pas de session — auth/v1/user renvoie 401
    await page.route('**/auth/v1/user**', json(401, { message: 'No session', code: 'not_authenticated' }));
    await use(page);
  },
});

export { expect };
