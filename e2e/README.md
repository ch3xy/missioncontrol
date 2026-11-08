# Playwright E2E

Eigenes npm-Paket, bewusst außerhalb von App-Build und Deployment. Vom Repository-Root:

```bash
npm ci
npm ci --prefix e2e
npm --prefix e2e run install:browsers
npm --prefix e2e run typecheck
npm --prefix e2e test
```

`test:chromium` prüft Desktop, `test:mobile` Pixel-7-Emulation mit Chromium.
`report` öffnet den lokalen HTML-Report. Konfiguration gemäß
[Playwright](https://playwright.dev/docs/test-configuration).

Playwright startet und beendet eine eigene Angular-Instanz unter
`http://127.0.0.1:4300`. Ein belegter Port führt zum Fehler; bestehende Server
werden nicht wiederverwendet. Die leere Proxy-Konfiguration verhindert Zugriff
auf die Entwicklungs-Proxys. Jeder Test erhält einen frischen Browserkontext;
externe Browserrequests werden blockiert. Keine persönlichen Einstellungen,
Kalender oder anderen Apps werden verändert. JSON-/ICS-Antworten werden nur in
gezielten Integrationstests abgefangen; das ist keine Fullstack-E2E-Abdeckung.

Zeitzone: Europe/Vienna, Locale: de-AT. Kalendertests verwenden eine feste
Browserzeit. Keine Sleeps und keine Wiederholungen fehlgeschlagener Tests.
Fehlerartefakte und Reports sind gitignored. Noch kein CI-Workflow aktiviert;
bei späterer Aktivierung kurze Artefaktaufbewahrung konfigurieren.

Falls ein Browser bereits installiert ist, kann dessen absoluter Pfad über
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` übergeben werden. Standardmäßig wird der
zur gelockten Playwright-Version gehörende Chromium verwendet. Einen abweichenden
Browserstand immer im Prüfprotokoll vermerken.

Abdeckung, offene Fälle und letzter Lauf: [Strategie](../docs/PLAYWRIGHT_STRATEGY.md).
