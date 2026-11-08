import { test as base, expect, type Page } from '@playwright/test';

// Every test gets Playwright's fresh context. Reject accidental external traffic,
// including popups; controlled integration responses must use this local origin.
export const test = base.extend({
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
  await expect(page.getByText('Konfigurierte Start-URLs:', { exact: false })).toBeVisible();
}

export function metrics(page: Page) {
  return page.locator('.metric');
}
