import { test, expect, save, metrics } from '../fixtures/test';

test('Navigation und Mobilmenü führen zum Kalender und zurück', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Übersicht', exact: true })).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Kalender', exact: true }).click();
  await expect(page).toHaveURL('/calendar');
  await expect(page.getByRole('heading', { name: 'Kalender', exact: true })).toBeVisible();
  if (isMobile) {
    await expect(page.getByRole('button', { name: 'Menü öffnen' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await page.getByRole('button', { name: 'Menü öffnen' }).click();
  }
  await page.getByRole('navigation').getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page).toHaveURL('/');
});

test('Ohne Quellen erscheinen Hinweise und keine erfundenen Kennzahlen', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('status').filter({ hasText: 'Keine velo-API-URL konfiguriert.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'Keine dash-API-URL konfiguriert.' }),
  ).toHaveCount(2);
  await expect(metrics(page)).toHaveCount(0);
});

test('URLs und Tagesziel bleiben nach Reload gespeichert', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Velo-URL', { exact: true }).fill('http://localhost:14201');
  await page.getByLabel('Dash-URL', { exact: true }).fill('http://localhost:14202');
  await page.getByLabel('Tagesziel', { exact: false }).fill('6');
  await save(page);
  await page.reload();
  await expect(page.getByLabel('Velo-URL', { exact: true })).toHaveValue('http://localhost:14201');
  await expect(page.getByLabel('Dash-URL', { exact: true })).toHaveValue('http://localhost:14202');
  await expect(page.getByLabel('Tagesziel', { exact: false })).toHaveValue('6');
});

test('Ungültige URL verhindert Speichern und überschreibt keine Einstellungen', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByLabel('Velo-URL', { exact: true }).fill('javascript:alert(1)');
  await page.getByLabel('Dash-URL', { exact: true }).focus();
  await expect(
    page.getByText('Bitte eine gültige http(s)-URL ohne Benutzername oder Passwort eingeben.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Speichern', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel('Velo-URL', { exact: true })).toHaveValue('http://localhost:4201');
});

test('Sprache und Theme persistieren, System folgt dem Browser', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Dunkel', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: 'English', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: 'Light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('radio', { name: 'System', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
