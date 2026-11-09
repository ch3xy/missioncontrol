import type { Page } from '@playwright/test';
import { test, expect, backendUrl, defaultSettings, E2E_TODAY } from '../fixtures/test';

const origin = 'http://127.0.0.1:4300';

async function openToday(page: Page) {
  // 10:00 in Vienna on the test day, so "today" and carry-over are reproducible
  await page.clock.setFixedTime(new Date(`${E2E_TODAY}T09:00:00Z`));
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: 'Heute', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hinzufügen', exact: true })).toBeEnabled();
}

function taskList(page: Page) {
  return page.getByRole('list', { name: 'Aufgaben', exact: true });
}

async function addTask(page: Page, title: string, estimate?: string) {
  await page.getByLabel('Neue Aufgabe', { exact: true }).fill(title);
  if (estimate) {
    await page
      .getByRole('combobox', { name: /^Schätzung/ })
      .first()
      .selectOption({ label: estimate });
  }
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(taskList(page).getByText(title, { exact: true })).toBeVisible();
}

test('Aufgabe anlegen, erledigen, Kapazität und Persistenz nach Reload', async ({ page }) => {
  await openToday(page);
  await addTask(page, 'E2E Angebot schreiben', '1:30 h');
  await addTask(page, 'E2E Ohne Schätzung');
  await expect(
    page.getByText('1:30 h geplant von 8:00 h verfügbar · 0 min erledigt'),
  ).toBeVisible();
  await expect(page.getByText('Ohne Schätzung (nicht mitgezählt): 1')).toBeVisible();

  await page
    .getByRole('combobox', { name: 'Status von „E2E Angebot schreiben“' })
    .selectOption({ label: 'Erledigt' });
  await expect(
    page.getByText('1:30 h geplant von 8:00 h verfügbar · 1:30 h erledigt'),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Status von „E2E Angebot schreiben“' }),
  ).toHaveValue('DONE');
  await expect(page.getByText('1:30 h erledigt', { exact: false })).toBeVisible();
});

test('Leerer Titel wird nicht gespeichert, Bearbeiten ändert Titel und Schätzung', async ({
  page,
}) => {
  await openToday(page);
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(page.getByText('Für heute ist noch nichts geplant.')).toBeVisible();

  await addTask(page, 'E2E Entwurf');
  await page.getByRole('button', { name: '„E2E Entwurf“ bearbeiten' }).click();
  await page.getByLabel('Titel', { exact: true }).fill('E2E Entwurf final');
  await taskList(page)
    .getByRole('combobox', { name: /^Schätzung/ })
    .selectOption({ label: '45 min' });
  await taskList(page).getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(taskList(page).getByText('E2E Entwurf final', { exact: true })).toBeVisible();
  await expect(page.getByText('45 min geplant', { exact: false })).toBeVisible();
});

test('Brain-Dump: festhalten, für heute planen und zurücklegen', async ({ page }) => {
  await openToday(page);
  const dump = page.getByRole('list', { name: 'Brain-Dump', exact: true });
  await page.getByLabel('Gedanken festhalten', { exact: true }).fill('E2E Idee');
  await page.getByRole('button', { name: 'In den Brain-Dump', exact: true }).click();
  await expect(dump.getByText('E2E Idee', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '„E2E Idee“ für heute planen' }).click();
  await expect(taskList(page).getByText('E2E Idee', { exact: true })).toBeVisible();
  await expect(dump.getByText('E2E Idee', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: '„E2E Idee“ in den Brain-Dump verschieben' }).click();
  await expect(dump.getByText('E2E Idee', { exact: true })).toBeVisible();
  await page.reload();
  await expect(dump.getByText('E2E Idee', { exact: true })).toBeVisible();
});

test('Unerledigte Aufgaben von gestern werden zur Übernahme vorgeschlagen', async ({
  page,
  request,
}) => {
  for (const title of ['E2E Gestern offen', 'E2E Gestern zweite']) {
    const created = await request.post(`${backendUrl}/api/v1/tasks`, {
      data: { title, estimateMinutes: 30, planDate: '2026-11-08' },
    });
    expect(created.status()).toBe(201);
  }
  await openToday(page);
  const suggestion = page.getByRole('list', { name: 'Offene Aufgaben von früheren Tagen' });
  await expect(page.getByRole('heading', { name: 'Offen von früheren Tagen: 2' })).toBeVisible();
  // The day of origin, in local time (a date-only value must not shift to the day before)
  await expect(suggestion.getByText('So., 8. Nov. 2026', { exact: false }).first()).toBeVisible();

  await page
    .getByRole('button', { name: '„E2E Gestern zweite“ in den Brain-Dump verschieben' })
    .click();
  await expect(page.getByRole('heading', { name: 'Offen von früheren Tagen: 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Alle übernehmen', exact: true }).click();

  await expect(suggestion).toHaveCount(0);
  await expect(taskList(page).getByText('E2E Gestern offen', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Brain-Dump', exact: true }).getByText('E2E Gestern zweite'),
  ).toBeVisible();
});

test('Reihenfolge ändern bleibt nach Reload erhalten', async ({ page }) => {
  await openToday(page);
  await addTask(page, 'E2E Erste');
  await addTask(page, 'E2E Zweite');
  await page.getByRole('button', { name: '„E2E Zweite“ nach oben' }).click();
  await expect(taskList(page).getByRole('listitem').first()).toContainText('E2E Zweite');
  await page.reload();
  await expect(taskList(page).getByRole('listitem').first()).toContainText('E2E Zweite');
});

test('Board-Ansicht bleibt gewählt, Statuswechsel verschiebt die Karte', async ({
  page,
  isMobile,
}) => {
  await openToday(page);
  await addTask(page, 'E2E Board');
  await page.getByRole('button', { name: 'Board', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Board', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const column = (name: string) => page.getByRole('region', { name, exact: true });
  await expect(column('Offen').getByText('E2E Board', { exact: true })).toBeVisible();

  if (isMobile) {
    await page
      .getByRole('combobox', { name: 'Status von „E2E Board“' })
      .selectOption({ label: 'In Arbeit' });
  } else {
    await column('Offen').getByText('E2E Board', { exact: true }).dragTo(column('In Arbeit'));
  }
  await expect(column('In Arbeit').getByText('E2E Board', { exact: true })).toBeVisible();
  await expect(column('Offen').getByText('E2E Board', { exact: true })).toHaveCount(0);
});

test('Termine reduzieren die verfügbare Kapazität', async ({ page, request }) => {
  await page.route('**/e2e-calendar', (route) =>
    route.fulfill({
      json: [
        {
          id: 'e2e-busy',
          title: 'E2E Termin',
          startsAt: `${E2E_TODAY}T08:00:00Z`,
          endsAt: `${E2E_TODAY}T10:00:00Z`,
          source: 'local-json',
        },
      ],
    }),
  );
  const saved = await request.put(`${backendUrl}/api/v1/settings`, {
    data: {
      ...defaultSettings,
      calendarSource: 'local-json',
      calendarSourceUrl: `${origin}/e2e-calendar`,
    },
  });
  expect(saved.status()).toBe(200);
  await openToday(page);
  await addTask(page, 'E2E Lang', '4:00 h');
  await addTask(page, 'E2E Länger', '3:00 h');
  await expect(
    page.getByText('7:00 h geplant von 6:00 h verfügbar', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText('Tagesziel 8:00 h abzüglich Termine 2:00 h.')).toBeVisible();
  await expect(page.getByText('Es ist mehr geplant, als Zeit verfügbar ist.')).toBeVisible();
});

test('Ohne erreichbaren Tagesplan erscheint ein Hinweis, Ändern ist gesperrt', async ({ page }) => {
  await page.route('**/api/v1/tasks**', (route) => route.abort('connectionrefused'));
  await page.clock.setFixedTime(new Date(`${E2E_TODAY}T09:00:00Z`));
  await page.goto('/today');
  const notice = page
    .getByRole('alert')
    .filter({ hasText: 'Der Tagesplan konnte nicht vom Backend geladen werden.' });
  await expect(notice).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hinzufügen', exact: true })).toBeDisabled();

  await page.unroute('**/api/v1/tasks**');
  await notice.getByRole('button', { name: 'Erneut laden', exact: true }).click();
  await expect(notice).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hinzufügen', exact: true })).toBeEnabled();
});

test('Aufgaben im Tagesplan und im Brain-Dump löschen', async ({ page }) => {
  await openToday(page);
  await addTask(page, 'E2E Weg damit');
  await page.getByLabel('Gedanken festhalten', { exact: true }).fill('E2E Verwerfen');
  await page.getByRole('button', { name: 'In den Brain-Dump', exact: true }).click();
  const dump = page.getByRole('list', { name: 'Brain-Dump', exact: true });
  await expect(dump.getByText('E2E Verwerfen', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '„E2E Weg damit“ löschen' }).click();
  await page.getByRole('button', { name: '„E2E Verwerfen“ löschen' }).click();
  await expect(page.getByText('Für heute ist noch nichts geplant.')).toBeVisible();
  await expect(page.getByText('Der Brain-Dump ist leer.')).toBeVisible();
  await page.reload();
  await expect(taskList(page).getByText('E2E Weg damit')).toHaveCount(0);
  await expect(dump.getByText('E2E Verwerfen')).toHaveCount(0);
});

test('Abgelehnter Statuswechsel zeigt den Grund und den gespeicherten Status', async ({ page }) => {
  await openToday(page);
  await addTask(page, 'E2E Status');
  // Targeted error state: the backend refuses the update
  await page.route('**/api/v1/tasks/*', (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 422,
          contentType: 'application/problem+json',
          json: { title: 'Validation Failed', status: 422, detail: 'status: E2E abgelehnt' },
        })
      : route.fallback(),
  );
  const status = page.getByRole('combobox', { name: 'Status von „E2E Status“' });
  await status.selectOption({ label: 'Erledigt' });
  await expect(page.getByRole('alert')).toContainText(
    'Das Backend hat die Änderung abgelehnt: status: E2E abgelehnt',
  );
  await expect(status).toHaveValue('OPEN');
});

test('Bearbeiten nach Änderung auf einem anderen Gerät überschreibt nichts', async ({
  page,
  request,
}) => {
  await openToday(page);
  await addTask(page, 'E2E Zwei Geräte');
  await page.getByRole('button', { name: '„E2E Zwei Geräte“ bearbeiten' }).click();
  await page.getByLabel('Titel', { exact: true }).fill('E2E Dieses Gerät');

  // Another device renames the task meanwhile (version 0 → 1)
  const list = await request.get(`${backendUrl}/api/v1/tasks?date=${E2E_TODAY}`);
  const [task] = (await list.json()) as { id: string; version: number }[];
  const changed = await request.put(`${backendUrl}/api/v1/tasks/${task.id}`, {
    data: {
      title: 'E2E Anderes Gerät',
      estimateMinutes: null,
      status: 'OPEN',
      version: task.version,
    },
  });
  expect(changed.status()).toBe(200);

  await taskList(page).getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Der Plan hat sich inzwischen geändert');
  // The editor closes and shows the stored title
  await expect(page.getByLabel('Titel', { exact: true })).toHaveCount(0);
  await expect(taskList(page).getByText('E2E Anderes Gerät', { exact: true })).toBeVisible();
});
