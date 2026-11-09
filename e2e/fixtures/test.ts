import { test as base, expect, type Page } from '@playwright/test';

/** Test backend started by playwright.config.ts (e2e/backend.yml, own throw-away database). */
export const backendUrl = 'http://127.0.0.1:8092';

/**
 * DEFAULT_SETTINGS of the app (src/app/core/models/settings.model.ts) as the backend stores them, optional
 * fields as empty strings. Keep in sync with the model and V1__create_app_settings.sql of the backend.
 */
export const defaultSettings = {
  veloUrl: 'http://localhost:4201',
  dashUrl: 'http://localhost:4202',
  sevDeskUrl: 'https://my.sevdesk.de',
  calendarSource: 'none',
  calendarSourceUrl: '',
  veloSourceUrl: '',
  dashSourceUrl: '',
  veloApiUrl: '',
  dashApiUrl: '',
  dailyTargetHours: 8,
  autoRefreshMinutes: 5,
  localTool1Label: 'Local Tool 1',
  localTool1Url: '',
  localTool2Label: 'Local Tool 2',
  localTool2Url: '',
};

/** Days the daily-plan tests use (browser clock fixed to E2E_TODAY); tasks there are removed per test. */
export const E2E_TODAY = '2026-11-09';
export const E2E_DAYS = ['2026-11-07', '2026-11-08', E2E_TODAY];

// Every test gets Playwright's fresh context and the default settings in the test backend
// (tests run serially, see playwright.config.ts). Reject accidental external traffic,
// including popups; controlled integration responses must use this local origin.
export const test = base.extend<{ resetSettings: void; resetTasks: void }>({
  resetTasks: [
    async ({ request }, use) => {
      // The test backend has its own throw-away database; still only the known test days are cleaned
      for (const query of [...E2E_DAYS.map((day) => `?date=${day}`), '']) {
        const list = await request.get(`${backendUrl}/api/v1/tasks${query}`);
        expect(list.status(), 'list tasks in the test backend').toBe(200);
        for (const task of (await list.json()) as { id: string; version: number }[]) {
          const removed = await request.delete(
            `${backendUrl}/api/v1/tasks/${task.id}?version=${task.version}`,
          );
          expect(removed.status(), 'delete a test task').toBe(204);
        }
      }
      await use();
    },
    { auto: true },
  ],
  resetSettings: [
    async ({ request }, use) => {
      const response = await request.put(`${backendUrl}/api/v1/settings`, {
        data: defaultSettings,
      });
      expect(response.status(), 'reset settings in the test backend').toBe(200);
      await use();
    },
    { auto: true },
  ],
  context: async ({ context }, use) => {
    await context.route('**/*', async (route) => {
      if (new URL(route.request().url()).origin === 'http://127.0.0.1:4300') {
        await route.continue();
      } else {
        await route.abort('blockedbyclient');
      }
    });
    await use(context);
  },
});
export { expect };

export function card(page: Page, heading: string) {
  // The card section currently has no accessible name; keep structural selection here.
  return page.locator('app-widget-card').filter({
    has: page.getByRole('heading', { name: heading, exact: true }),
  });
}

export async function save(page: Page) {
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Einstellungen gespeichert.' }),
  ).toBeVisible();
}

export function metrics(page: Page) {
  return page.locator('.metric');
}
