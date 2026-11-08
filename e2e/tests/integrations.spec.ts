import { test, expect, card, save } from '../fixtures/test';
import { velo, dash } from '../fixtures/summaries';

const origin = 'http://127.0.0.1:4300';

for (const integration of [
  {
    name: 'Velo',
    heading: 'velo Cashflow',
    data: velo,
    value: /2\.?468/,
    source: 'Velo-Quell-URL',
  },
  { name: 'Dash', heading: 'dash Zeit', data: dash, value: /3,0 h/, source: 'Dash-Quell-URL' },
]) {
  test(`${integration.name}: JSON laden, Fehler ohne alte Zahlen, erneut laden`, async ({
    page,
  }) => {
    let state: 'ok' | 'http' | 'schema' = 'ok';
    await page.route('**/e2e-summary.json', (route) =>
      route.fulfill({
        status: state === 'http' ? 503 : 200,
        json: state === 'schema' ? { unexpected: true } : integration.data,
      }),
    );
    await page.goto('/settings');
    await page.getByLabel(integration.source, { exact: true }).fill(`${origin}/e2e-summary.json`);
    await save(page);
    await page.goto('/');
    const widget = card(page, integration.heading);
    await expect(widget.getByText(integration.value)).toBeVisible();
    for (const failure of ['http', 'schema'] as const) {
      state = failure;
      await page.getByRole('button', { name: 'Aktualisieren', exact: true }).click();
      await expect(widget.getByRole('status')).toContainText(
        failure === 'http'
          ? `${integration.name}-JSON konnte nicht geladen werden.`
          : `${integration.name}-JSON entspricht nicht dem erwarteten Format.`,
      );
      await expect(widget.getByText(integration.value)).toHaveCount(0);
      state = 'ok';
      await page.getByRole('button', { name: 'Aktualisieren', exact: true }).click();
      await expect(widget.getByText(integration.value)).toBeVisible();
    }
  });
}

for (const source of ['local-json', 'ics']) {
  test(`Kalender ${source}: Termin in Wiener Zeitzone, leere und fehlerhafte Quelle`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-11-08T08:00:00Z'));
    let state: 'ok' | 'empty' | 'error' = 'ok';
    await page.route('**/e2e-calendar', (route) =>
      route.fulfill({
        status: state === 'error' ? 503 : 200,
        contentType: source === 'ics' ? 'text/calendar' : 'application/json',
        body:
          source === 'ics'
            ? [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                ...(state === 'empty'
                  ? []
                  : [
                      'BEGIN:VEVENT',
                      'UID:e2e-own-event',
                      'SUMMARY:E2E Planung',
                      'DTSTART:20261108T090000Z',
                      'DTEND:20261108T100000Z',
                      'END:VEVENT',
                    ]),
                'END:VCALENDAR',
              ].join('\r\n')
            : JSON.stringify(
                state === 'empty'
                  ? []
                  : [
                      {
                        id: 'e2e-own-event',
                        title: 'E2E Planung',
                        startsAt: '2026-11-08T09:00:00Z',
                        source: 'local-json',
                      },
                    ],
              ),
      }),
    );
    await page.goto('/settings');
    await page.getByRole('combobox', { name: /^Kalenderquelle/ }).selectOption(source);
    await page
      .getByRole('textbox', { name: /^Kalender-Quell-URLs/ })
      .fill(`${origin}/e2e-calendar`);
    await save(page);
    await page.goto('/');
    const widget = card(page, 'Kalender');
    await expect(widget.getByText('E2E Planung', { exact: true })).toBeVisible();
    await expect(widget.getByText('10:00', { exact: true })).toBeVisible();
    state = 'empty';
    await page.getByRole('button', { name: 'Aktualisieren', exact: true }).click();
    await expect(widget.getByText('E2E Planung')).toHaveCount(0);
    await expect(widget.getByText(/Heute keine Termine mehr/)).toBeVisible();
    state = 'error';
    await page.getByRole('button', { name: 'Aktualisieren', exact: true }).click();
    await expect(widget.getByRole('status')).toContainText('konnte nicht geladen werden');
    await expect(widget.getByText('E2E Planung')).toHaveCount(0);
  });
}
