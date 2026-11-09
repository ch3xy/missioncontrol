import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // The settings live in one shared test backend, so tests run one after another (PLAYWRIGHT_RULES)
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  globalTeardown: './global-teardown.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4300',
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    colorScheme: 'light',
    serviceWorkers: 'block',
    launchOptions: { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      // Own backend (e2e/backend.yml, port 8092) on a throw-away database (port 5435); needs Docker and Java 25
      command:
        // `down` first removes a database left over by an aborted run
        'docker compose -f docker-compose.e2e.yml down --volumes && docker compose -f docker-compose.e2e.yml up -d --wait && ./mvnw -q -DskipTests package && exec java -jar target/missioncontrol.jar --spring.config.additional-location=file:../e2e/backend.yml',
      cwd: '../backend',
      url: 'http://127.0.0.1:8092/api/v1/health',
      reuseExistingServer: false,
      // First run includes the Maven build with a cold dependency cache
      timeout: 600_000,
    },
    {
      command:
        'node node_modules/@angular/cli/bin/ng.js serve --host 127.0.0.1 --port 4300 --proxy-config e2e/proxy.conf.json',
      cwd: '..',
      url: 'http://127.0.0.1:4300',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
