# Mission Control: Playwright-Strategie

Stand: 09.11.2026. Regeln: [PLAYWRIGHT_RULES.md](PLAYWRIGHT_RULES.md).

## Iststand und Ausführung

Das separate npm-Paket `e2e/` enthält Playwright, eigenen Lockfile, strikten
Typecheck und Projekte für Chromium Desktop sowie mobile Chromium-Emulation
(Pixel 7). Setup und Befehle: [e2e/README.md](../e2e/README.md).

Ein eigener Angular-Testserver auf Port 4300 verwendet keine Entwicklungs-Proxys;
`/api` geht an ein eigenes Test-Backend (`e2e/backend.yml`, Port 8092) auf einer
Wegwerf-PostgreSQL (`backend/docker-compose.e2e.yml`, Port 5435, tmpfs), die der
Global Teardown entfernt. Die Einstellungen sind global, deshalb laufen die
Tests seriell (`workers: 1`) und setzen sie vor jedem Test per API auf die
Standardwerte zurück. Jeder Test hat einen frischen Browserkontext und
isolierten LocalStorage für UI-Zustand. Locale
und Zeitzone sind explizit gesetzt; Kalenderfälle fixieren die Browserzeit.
Externe Browserrequests sind blockiert. Keine privaten Kalender, Tokens,
persönlichen Endpunkte oder Mutationen anderer Apps werden verwendet.

## Abdeckungsmatrix

Alle implementierten Fälle laufen in beiden Browserprojekten.

| Bereich                   | Implementierter Browsernachweis                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Offene Abdeckung                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Shell und Navigation      | Dashboard, Kalender und zurück, mobiles Öffnen und Schließen des Menüs                                                                                                                                                                                                                                                                                                                                                                                                                   | Velo-/Dash-Navigation, externe Shortcuts, Sidebar-Persistenz                             |
| Einstellungen             | Velo-/Dash-URL und Tagesziel speichern, Persistenz nach Reload und in zweitem Browserkontext (Backend), ungültige URL und Tagesziel mit mehr als zwei Nachkommastellen blockieren Speichern, Ablehnung durch das Backend (422, gezielt abgefangen) mit Grund, Backend nicht erreichbar mit Hinweis und erneutem Laden (auch Dashboard)                                                                                                                                                   | Backup/Import, Reset, weitere Eingabevalidierung                                         |
| Darstellung               | Deutsch/Englisch und Dunkel mit Reload, Hell, System folgt Browser-Farbschema; alle Fälle auch mobil                                                                                                                                                                                                                                                                                                                                                                                     | weitere responsive Größen und visuelle Regression                                        |
| Velo-/Dash-Karten         | nicht konfiguriert, gültige lokale JSON-Antwort, HTTP-Fehler, ungültiges Schema, erneutes Laden; alte Kennzahlen verschwinden bei Fehlern                                                                                                                                                                                                                                                                                                                                                | Netzwerkabbruch/Timeout, REST-API-Verträge gegen dedizierte Testinstanzen                |
| Kalender                  | JSON und ICS, Termin in Wiener Zeitzone, leere Quelle, HTTP-Fehler                                                                                                                                                                                                                                                                                                                                                                                                                       | mehrere Quellen, Wiederholungen, ungültige Inhalte, Monats-/Wochenansicht und Navigation |
| Tagesplan („Heute“)       | Aufgabe mit/ohne Schätzung anlegen, Status ändern, Persistenz nach Reload, leerer Titel, Bearbeiten, Reihenfolge, Brain-Dump planen und zurücklegen, Übernahme-Vorschlag (einzeln in Brain-Dump, alle übernehmen), Board-Ansicht persistent mit Drag-and-drop (Desktop) bzw. Statusauswahl (mobil), Kapazität abzüglich Termin und Überbuchung, Backend nicht erreichbar, Löschen, abgelehnter Statuswechsel (422, gezielt abgefangen), Bearbeiten nach Änderung auf zweitem Gerät (409) | andere Tage                                                                              |
| Übersicht: Mini-Tagesplan | Anlegen (heute/Brain-Dump), Starten, Erledigen, Fortschritt, Persistenz nach Reload, Link zum Tagesplan                                                                                                                                                                                                                                                                                                                                                                                  | Übernahme-Hinweis, Backend nicht erreichbar und Fehlermeldung (nur Unit-Tests)           |
| Produktregeln             | Hinweise statt erfundener Kennzahlen ohne Integration und keine alten Zahlen bei Ladefehlern                                                                                                                                                                                                                                                                                                                                                                                             | weitere Teilfehlerkombinationen                                                          |

Die gezielt abgefangenen JSON-/ICS-Antworten sind synthetische Test-Fixtures,
kein produktiver Mock-Fallback. Diese Fälle prüfen das Frontend inklusive
Adapter und sind keine Fullstack-E2E-Abdeckung. Echte Velo-/Dash-Testinstanzen
sind hier nicht eingerichtet.

## Definition of Done und spätere CI

Neue sichtbare Features und Bugfixes brauchen passende Playwright-Regression im
selben Repository/PR, Hauptablauf und relevante Fehler-/Validierungsfälle;
Bugfixes reproduzieren den ursprünglichen Fehler. Die Matrix wird mit den
tatsächlich implementierten Fällen aktualisiert.

Vor Abschluss passende Anwendungstests, E2E-Typecheck, komplette Chromium-Suite
und relevante Mobilfälle ausführen und App-Commit, lokale Änderungen,
Browserstand, Ergebnisse und Einschränkungen dokumentieren. Nicht ausgeführte
Prüfungen ausdrücklich benennen.

Playwright bleibt ein expliziter separater Prüfschritt außerhalb des normalen
Builds und Deploys. Kein CI-Workflow oder Required Check wird aktiviert.
Künftige CI soll denselben App-Commit bauen/testen, isolierte Instanzen starten,
Fehlerartefakte kurz aufbewahren und den Stack immer entfernen.

## Prüfprotokoll 08.11.2026

- App-Basis: Commit `a0813a3fc250dd27aa3142ec252bd0708a05a202` mit lokalen Änderungen. Bereits vor Arbeitsbeginn war `angular.json` geändert; diese Änderung wurde beibehalten. Hinzugefügt wurden das E2E-Paket und die zugehörige Dokumentation/Ignore-Regeln; kein produktiver App-Code geändert.
- Playwright 1.65.0; lokal vorhandenes Google Chrome for Testing 157.0.8103.15, Chromium-Revision 1252, Linux ARM64, über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` gestartet.
- Der Download des zu Playwright gehörenden Chromium 158 (Revision 1254) wurde durch den Netzwerk-Proxy mit HTTP 403 blockiert. Dieser Browserstand wurde deshalb nicht geprüft; der Standard-Installationsweg ist dokumentiert.
- Finaler Gesamtlauf: `npm --prefix e2e test` mit obigem Browserpfad: **18/18 bestanden**, davon 9 Desktop und 9 mobile Chromium-Emulation, 23,5 Sekunden, ohne Retries.
- `npm run test -- --watch=false`: **90/90 bestanden**, 19 Testdateien.
- `npm run build`, `npm run lint`, `npm --prefix e2e run typecheck` und zusätzlicher Prettier-Check für das E2E-Paket: **bestanden**.
- Echte Velo-/Dash-Instanzen, weitere Browser und physische Mobilgeräte wurden nicht geprüft. Die offenen Fälle stehen in der Matrix; kein CI-Job aktiviert.

## Bestätigungslauf 08.11.2026, 15:51 Europe/Vienna

- Erneut auf App-Basis `a0813a3fc250dd27aa3142ec252bd0708a05a202` mit den oben beschriebenen lokalen E2E-/Dokumentationsänderungen ausgeführt. Die bereits vorhandene Änderung `cli.analytics: false` in `angular.json` war beim Lauf vorhanden und bleibt außerhalb des E2E-Commits.
- Gesamte Playwright-Suite: **18/18 bestanden**, 9 Desktop und 9 Pixel-7-Emulation, **24,2 Sekunden**, ohne Retries.
- Ausführung: `npm --prefix e2e test` mit `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` auf das lokal installierte Chrome for Testing **157.0.8103.15**, Revision 1252, Linux ARM64. Der zur Playwright-Version gehörende Standardbrowser wurde auch bei diesem Lauf nicht geprüft.
- Zusätzlich erneut erfolgreich: Anwendungstests **90/90 in 19 Dateien**, `npm run build`, `npm run lint`, `npm --prefix e2e run typecheck` und Prettier-Prüfung für alle TypeScript-, JSON- und Markdown-Dateien im E2E-Paket.
- Keine Prüfung echter Velo-/Dash-Instanzen, weiterer Browser oder physischer Mobilgeräte; CI bleibt deaktiviert. Die offenen Fälle der Abdeckungsmatrix bleiben bestehen.

## Prüfprotokoll 09.11.2026 (Frontend-Anbindung an das Backend)

- App-Basis: Commit `4df34a5` mit den lokalen Änderungen der Frontend-Anbindung (SettingsService über Backend, Test-Backend für Playwright).
- Playwright 1.65.0; lokal vorhandenes Google Chrome for Testing 157.0.8103.15, Revision 1252, Linux ARM64, über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Der Download von Revision 1254 schlug erneut fehl; der Standardbrowser wurde nicht geprüft.
- `npm --prefix e2e test`: **28/28 bestanden** (14 Desktop, 14 Pixel-7-Emulation), seriell gegen das Test-Backend (`e2e/backend.yml`), 56,4 Sekunden, ohne Retries; Datenbank-Container und Ports waren danach entfernt.
- `npm run test -- --watch=false`: **100/100 bestanden**, 19 Testdateien; `npm run lint`, `npm run build`, `npm --prefix e2e run typecheck`: **bestanden**.
- Echte Velo-/Dash-Instanzen, weitere Browser und physische Mobilgeräte wurden nicht geprüft; CI bleibt deaktiviert.

## Prüfprotokoll 09.11.2026 (Tagesplan „Heute“)

- App-Basis: Commit `5a217ab` mit den lokalen Änderungen des Tagesplans (Backend-Modul `task`, Seite `/today`).
- Browser wie oben (Chrome for Testing 157, Revision 1252, über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`).
- `npm --prefix e2e test`: **50/50 bestanden** (25 Desktop, 25 Pixel-7-Emulation), seriell gegen das Test-Backend; Testaufgaben liegen nur an den festen Testtagen 07.–09.11.2026 und im Brain-Dump und werden vor jedem Test entfernt.
- `npm run test -- --watch=false`: **122/122 bestanden**, 23 Testdateien; `npm run lint`, `npm run build`, `npm --prefix e2e run typecheck`, `./mvnw verify` (47 Tests): **bestanden**.

## Prüfprotokoll 10.11.2026 (Mini-Tagesplan in der Übersicht)

- App-Basis: Commit `48c27bb` mit den lokalen Änderungen des Widgets `app-today-widget` auf der Übersichtsseite.
- Browser wie oben (Chrome for Testing 157, Revision 1252, über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`).
- `npm --prefix e2e test`: **52/52 bestanden** (26 Desktop, 26 Pixel-7-Emulation), seriell gegen das Test-Backend.
- `npm run lint`, `npm run test -- --watch=false` (131 Tests), `npm run build`, `npm --prefix e2e run typecheck`: **bestanden**.
