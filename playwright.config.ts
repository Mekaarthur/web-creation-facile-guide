import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? 'html' : 'list',

  // Génère les auth-state files avant tout (tokens fresh à chaque run)
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // ffmpeg requis pour la vidéo — activé uniquement en CI pour éviter un binaire local
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },

  projects: [
    // ── Projets navigateur (tests existants — injectSession manuel) ──────────
    // Default: use system Edge (avoids Playwright browser download in restricted networks)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
      testIgnore: /\.role\.spec\.ts$|admin-bulk-assign\.spec\.ts|cart-validation\.spec\.ts/,
    },

    // Full cross-browser suite — run explicitly with --project=firefox/webkit
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /\.role\.spec\.ts$|admin-bulk-assign\.spec\.ts|cart-validation\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /\.role\.spec\.ts$|admin-bulk-assign\.spec\.ts|cart-validation\.spec\.ts/,
    },

    // ── Projets par rôle (tests *.role.spec.ts — session pré-injectée via storageState) ──
    // Avantages : pas de injectSession() dans chaque test, token toujours frais,
    // séparation claire client / prestataire / admin / invité.
    // Usage : npx playwright test --project=client-auth
    {
      name: 'client-auth',
      use: {
        ...devices['Desktop Chrome'], channel: 'msedge',
        storageState: 'tests/auth-states/client.json',
      },
      testMatch: /\.role\.spec\.ts$/,
    },
    {
      name: 'provider-auth',
      use: {
        ...devices['Desktop Chrome'], channel: 'msedge',
        storageState: 'tests/auth-states/provider.json',
      },
      testMatch: /\.role\.spec\.ts$/,
    },
    {
      name: 'admin-auth',
      use: {
        ...devices['Desktop Chrome'], channel: 'msedge',
        storageState: 'tests/auth-states/admin.json',
      },
      testMatch: /\.role\.spec\.ts$/,
    },
    {
      name: 'guest',
      use: {
        ...devices['Desktop Chrome'], channel: 'msedge',
        storageState: 'tests/auth-states/guest.json',
      },
      testMatch: /\.role\.spec\.ts$/,
    },
  ],

  webServer: {
    command: 'pnpm --filter @bikawo/public dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
