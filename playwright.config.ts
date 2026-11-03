import { defineConfig, devices } from '@playwright/test'

// Not vite preview's default (4173): a preview of another build left running there would be
// tested in place of this one.
const port = 4318

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'en-US',
    timezoneId: 'America/Toronto',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // A system Chromium can stand in for Playwright's own build where that is not installed.
        launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
      },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  // The tests run against the production build, served as GitHub Pages serves it, so they cover
  // the 404.html fallback and the content security policy.
  webServer: {
    command: `npm run build && node scripts/serve.ts`,
    env: { PORT: String(port) },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
})
