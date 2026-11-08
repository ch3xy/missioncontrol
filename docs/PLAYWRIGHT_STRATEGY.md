# Mission Control: Playwright-Strategie

Stand: 08.11.2026. Regeln: [PLAYWRIGHT_RULES.md](PLAYWRIGHT_RULES.md).

## Iststand und Ausführung

Das separate npm-Paket `e2e/` enthält Playwright, eigenen Lockfile, strikten
Typecheck und Projekte für Chromium Desktop sowie mobile Chromium-Emulation
(Pixel 7). Setup und Befehle: [e2e/README.md](../e2e/README.md).

Ein eigener Angular-Testserver auf Port 4300 verwendet keine Entwicklungs-Proxys.
Jeder Test hat einen frischen Browserkontext und isolierten LocalStorage. Locale
und Zeitzone sind explizit gesetzt; Kalenderfälle fixieren die Browserzeit.
Externe Browserrequests sind blockiert. Keine privaten Kalender, Tokens,
persönlichen Endpunkte oder Mutationen anderer Apps werden verwendet.

## Abdeckungsmatrix

Alle implementierten Fälle laufen in beiden Browserprojekten.

| Bereich              | Implementierter Browsernachweis                                                                                                           | Offene Abdeckung                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Shell und Navigation | Dashboard, Kalender und zurück, mobiles Öffnen und Schließen des Menüs                                                                    | Velo-/Dash-Navigation, externe Shortcuts, Sidebar-Persistenz                             |
| Einstellungen        | Velo-/Dash-URL und Tagesziel speichern, Persistenz nach Reload, ungültige URL blockiert Speichern                                         | Backup/Import, Reset, weitere Eingabevalidierung                                         |
| Darstellung          | Deutsch/Englisch und Dunkel mit Reload, Hell, System folgt Browser-Farbschema; alle Fälle auch mobil                                      | weitere responsive Größen und visuelle Regression                                        |
| Velo-/Dash-Karten    | nicht konfiguriert, gültige lokale JSON-Antwort, HTTP-Fehler, ungültiges Schema, erneutes Laden; alte Kennzahlen verschwinden bei Fehlern | Netzwerkabbruch/Timeout, REST-API-Verträge gegen dedizierte Testinstanzen                |
| Kalender             | JSON und ICS, Termin in Wiener Zeitzone, leere Quelle, HTTP-Fehler                                                                        | mehrere Quellen, Wiederholungen, ungültige Inhalte, Monats-/Wochenansicht und Navigation |
| Produktregeln        | Hinweise statt erfundener Kennzahlen ohne Integration und keine alten Zahlen bei Ladefehlern                                              | weitere Teilfehlerkombinationen                                                          |

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
