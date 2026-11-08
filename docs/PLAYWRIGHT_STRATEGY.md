# Mission Control: Playwright-Strategie

Stand: 08.11.2026. Regeln: [PLAYWRIGHT_RULES.md](PLAYWRIGHT_RULES.md).

## Iststand und Ziel

Aktuell gibt es keine Playwright-Abhängigkeit, Konfiguration oder Browser-Suite. Die bestehenden Angular-/Vitest-Checks ersetzen keine Browserregression. Diese Änderung dokumentiert die Regeln; sie führt keine neue Suite oder Build-Pflicht ein.

Für die spätere Einrichtung: eigenes `e2e/`-npm-Paket in diesem Repository, eigener lokaler Frontend-Testserver, Typecheck und Chromium-Projekt; frischer Browserkontext mit eigenem LocalStorage pro Test. Kein Backend ergänzen. Lokale synthetische JSON-/ICS-Fixtures dürfen kontrollierte Integrationsantworten liefern; echte Adapterverträge separat gegen dedizierte Velo-/Dash-Testinstanzen prüfen. Keine privaten Kalender, Tokens oder persönlichen Endpunkte verwenden und keine Mutation fremder Apps.

## Geplante Abdeckungsmatrix

| Bereich              | Geplanter Browsernachweis                                                            |
| -------------------- | ------------------------------------------------------------------------------------ |
| Shell und Navigation | Dashboard, Seitenwechsel, Links, Mobilmenü                                           |
| Einstellungen        | konfigurierte URLs, Persistenz nach Reload, ungültige Eingaben                       |
| Darstellung          | Deutsch/Englisch, Hell/Dunkel/System, responsive Ansichten                           |
| Velo-/Dash-Karten    | nicht konfiguriert, gültige Antwort, Ladefehler, ungültiges Schema, Wiederholung     |
| Kalender             | lokale JSON/ICS, mehrere Quellen, Wiederholungen, Zeitzone, leere/fehlerhafte Quelle |
| Produktregeln        | keine erfundenen Zahlen bei Integrationsausfall, verständliche Hinweise              |

Alle Zeilen sind geplant und noch keine automatisierte Playwright-Abdeckung. Produktiver Mock-Fallback bleibt ausgeschlossen; Test-Fixtures ändern diese Produktentscheidung nicht.

## Definition of Done und spätere CI

Neue sichtbare Features und Bugfixes brauchen passende Playwright-Regression im selben Repository/PR, Hauptablauf und relevante Fehler-/Validierungsfälle; Bugfixes reproduzieren den ursprünglichen Fehler. Die Matrix wird mit den tatsächlich implementierten Fällen aktualisiert. Fehlendes Testsetup ist eine zu schließende Lücke, kein bestandener Check.

Vor Abschluss passende Anwendungstests, E2E-Typecheck, komplette Chromium-Suite und relevante Mobilfälle ausführen und App-Commit, Browserstand, Ergebnisse und Einschränkungen dokumentieren. Noch fehlende Prüfschritte ausdrücklich benennen.

Playwright bleibt zunächst außerhalb des normalen Builds und Deploys. Künftiger separater GitHub-Job: denselben Commit auschecken, isolierte Testumgebung starten, Suite ausführen, Fehlerartefakte sichern und immer aufräumen. Erst nach bewusster Aktivierung an PR/Build koppeln und als Required Check einrichten. In diesem Repository wird jetzt kein Workflow aktiviert.
