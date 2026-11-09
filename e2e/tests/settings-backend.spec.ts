import { test, expect, save } from '../fixtures/test';

const origin = 'http://127.0.0.1:4300';

test('Einstellungen liegen im Backend und gelten auch in einem anderen Browser', async ({
  page,
  browser,
}) => {
  await page.goto('/settings');
  await page.getByLabel('Velo-URL', { exact: true }).fill('http://localhost:14301');
  await save(page);

  // A second, fresh context has no shared browser storage, like another device
  const otherDevice = await browser.newContext({ baseURL: origin });
  await otherDevice.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort('blockedbyclient'),
  );
  try {
    const other = await otherDevice.newPage();
    await other.goto('/settings');
    await expect(other.getByLabel('Velo-URL', { exact: true })).toHaveValue(
      'http://localhost:14301',
    );
  } finally {
    await otherDevice.close();
  }
});

test('Tagesziel mit mehr als zwei Nachkommastellen verhindert Speichern', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Tagesziel', { exact: false }).fill('7.125');
  await page.getByLabel('Velo-URL', { exact: true }).focus();
  await expect(
    page.getByText(
      'Bitte einen Wert zwischen 0,5 und 24 mit höchstens zwei Nachkommastellen eingeben.',
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Speichern', exact: true })).toBeDisabled();
});

test('Vom Backend abgelehnte Werte zeigen den Grund und ändern nichts', async ({ page }) => {
  // Targeted error state: the backend answers PUT with a validation problem (RFC 7807)
  await page.route('**/api/v1/settings', (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 422,
          contentType: 'application/problem+json',
          json: { title: 'Validation Failed', status: 422, detail: 'veloUrl: E2E abgelehnt' },
        })
      : route.fallback(),
  );
  await page.goto('/settings');
  await page.getByLabel('Velo-URL', { exact: true }).fill('http://localhost:14401');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Das Backend hat die Einstellungen abgelehnt: veloUrl: E2E abgelehnt',
  );
  // The input stays for correction; the stored value is unchanged
  await expect(page.getByLabel('Velo-URL', { exact: true })).toHaveValue('http://localhost:14401');
  await page.unroute('**/api/v1/settings');
  await page.reload();
  await expect(page.getByLabel('Velo-URL', { exact: true })).toHaveValue('http://localhost:4201');
});

test('Ohne erreichbares Backend erscheint ein Hinweis, Speichern ist gesperrt', async ({
  page,
}) => {
  await page.route('**/api/v1/settings', (route) => route.abort('connectionrefused'));
  await page.goto('/settings');
  const notice = page.getByRole('alert').filter({
    hasText: 'Die Einstellungen konnten nicht vom Backend geladen werden.',
  });
  await expect(notice).toBeVisible();
  await expect(page.getByRole('button', { name: 'Speichern', exact: true })).toBeDisabled();

  await page.unroute('**/api/v1/settings');
  await notice.getByRole('button', { name: 'Erneut laden', exact: true }).click();
  await expect(notice).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Speichern', exact: true })).toBeEnabled();
});

test('Dashboard zeigt den Backend-Hinweis und lädt nach erneutem Versuch', async ({ page }) => {
  await page.route('**/api/v1/settings', (route) => route.abort('connectionrefused'));
  await page.goto('/');
  const notice = page.getByRole('alert').filter({
    hasText: 'Die Einstellungen konnten nicht vom Backend geladen werden.',
  });
  await expect(notice).toBeVisible();
  await page.unroute('**/api/v1/settings');
  await notice.getByRole('button', { name: 'Erneut laden', exact: true }).click();
  await expect(notice).toHaveCount(0);
});
