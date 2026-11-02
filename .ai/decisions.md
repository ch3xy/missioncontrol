# Entscheidungen

Kurzprotokoll von Produkt- und Architekturentscheidungen, die sich nicht aus dem Code ablesen lassen.
Neueste oben.

## 2026-11-02 — KI-Nutzungskarte: mögliche Lösung über statische JSON

**Status:** Lösungsvorschlag, vorerst nicht umgesetzt. Die Karte bleibt zurückgestellt (siehe Eintrag vom
2026-10-19).

**Idee:** Auf dem Dashboard die Nutzung von Claude Code und Codex CLI zeigen, eventuell anstelle der Karte
„Dash Kunden“ (Eyebrow „Pipeline“). Beim Ersetzen fielen aktive Kunden und offene Projekte vom Dashboard weg;
das ist noch nicht entschieden.

**Lösungsansatz:** Dasselbe Muster wie bei den iCloud-Kalendern, die App bleibt frontend-only.

1. Ein kleines Skript auf dem Mac liest die lokalen Logs und erzeugt eine `ai-usage.json`, die nur Summen
   enthält (Tokens, Limits, Zeitstempel). Ein launchd-Job startet es zum Beispiel alle 15 Minuten.
2. Die Datei kommt per `scp` nach `/missioncontrol/` auf arrow-pi und wird dort statisch ausgeliefert.
3. Ein Adapter nach dem bestehenden Muster (Setting für die URL, Local-JSON mit Type Guard,
   `IntegrationStatus`) versorgt die Karte. Sie zeigt Limits als Balken, Tokens pro Tag oder Woche und den
   Stand der Daten.

**Warum eigenes Skript statt ccusage:**

- Die README von ccusage (Stand 20.0.47) nennt für Claude und Codex Tokens und Kosten sowie für Claude
  5-Stunden-Blöcke, aber keine Codex-Limits. Die wären der nützlichste Wert und bräuchten ohnehin eigenen Code.
- Eine Probeauswertung kam für Tokens und Codex-Limits mit rund 40 Zeilen ohne Abhängigkeiten aus.
- ccusage liefe unbeaufsichtigt mit Zugriff auf alle Logs. Falls es doch dazukommt: Version fest pinnen, nicht
  über `npx ccusage@latest`.
- Dollarwerte sind beim Abo nur ein API-Gegenwert, nicht die tatsächlichen Kosten. ccusage selbst wurde nicht
  ausgeführt, die Angaben beruhen nur auf der README.

**Offene Punkte und Einschränkungen:**

- **Claude-Limits:** Sie stehen nicht in den Logs. Laut Community-Quellen liefert Claude Code sie über die
  Statusline (`rate_limits.five_hour` und `seven_day`), teils werden sie dort aber als fehlend gemeldet. Das
  ist auf der eigenen Version noch zu prüfen. Für den Start reichen bei Claude die Tokens.
- **Veraltete Limits:** Codex schreibt Limits nur während einer Sitzung. Ist `resets_at` vorbei, muss die Karte
  „abgelaufen“ statt des alten Werts zeigen.
- **Lücken:** Chats im Browser und in den Desktop-Apps fehlen, bei zugeklapptem Mac bleibt der Stand stehen.
- **Zugriff:** Die JSON ist wie die `.ics`-Dateien ohne Login für alle lesbar, die mission control erreichen.
  Deshalb nur Summen, keine Prompts, Pfade oder Projektnamen.
- **Deploy:** Noch nicht geprüft sind eine mögliche Routen-Änderung in `pi-ops` und der SSH-Zugang für den
  Upload.

Log-Formate und Datenschutzregeln stehen unter „Erkenntnisse aus dem Prototyp“ im Eintrag vom 2026-10-19.

## 2026-10-21 — Private iCloud-Kalender über Sync auf dem Server

**Status:** umgesetzt (mission control); Caddy-/Compose-Änderung in `pi-ops` dokumentiert, nicht angewendet.

**Entscheidung:** iCloud-Kalender werden nicht öffentlich geteilt. vdirsyncer auf arrow-pi liest sie per
CalDAV (app-spezifisches Passwort, nur lesend) und schreibt je Kalender eine `.ics`-Datei, die Caddy unter
`/missioncontrol/calendars/` ausliefert. mission control lädt mehrere ICS-URLs (eine pro Zeile) und führt
sie zusammen. Anleitung: `docs/ICLOUD_CALENDAR.md`.

**Warum:** Öffentliche iCloud-Links sind für jeden mit dem Link lesbar und scheitern im Browser zusätzlich an
CORS. CalDAV direkt aus dem Browser würde das Apple-ID-Passwort im LocalStorage ablegen und widerspricht
„frontend-only, keine Secrets im Frontend“. Ein eigenes Backend wäre für reines Lesen überdimensioniert.

**Folgen:** Die `.ics`-Dateien sind ohne Login für alle lesbar, die mission control erreichen — nur im
Heimnetz/VPN betreiben oder die Route schützen. Wiederkehrende Termine expandiert mission control selbst
(`ical.js`, siehe `docs/ASSUMPTIONS.md`, „Recurring calendar events“).

## 2026-10-19 — Keine Mock-Daten mehr

**Status:** umgesetzt.

**Entscheidung:** Die eingebauten Mock-Daten für Kalender, velo und dash sind entfernt. Ohne konfigurierte
Quelle zeigt eine Karte „Nicht konfiguriert“; ist eine Quelle nicht erreichbar oder liefert sie unerwartete
Daten, zeigt sie eine Warnung und keine Zahlen.

**Warum:** Seit velo und dash per REST-API angebunden sind, würde ein Mock-Fallback bei einem API-Ausfall
erfundene Zahlen neben echten zeigen. Das ist irreführender als eine leere Karte mit Warnung.

**Folgen:** Ersetzt Regel 8 in `AGENTS.md` („Use mock data when real integrations are unavailable“).
Kalenderquelle `mock` heißt jetzt `none` (Standard); alte Einstellungen werden beim Laden umgestellt.
Lokale JSON- und ICS-Quellen samt Beispielen in `public/examples/` bleiben erhalten.

## 2026-10-19 — KI-Nutzungskarte (Claude / ChatGPT) zurückgestellt

**Status:** zurückgestellt, nicht umgesetzt. Möglicher Lösungsansatz: siehe Eintrag vom 2026-11-02.

**Wunsch:** Auf dem Dashboard die aktuelle Nutzung der Abos von Claude (Pro) und ChatGPT anzeigen.

**Warum zurückgestellt:**

- Abos (Claude Pro/Max, ChatGPT Plus/Pro) haben keine öffentliche Nutzungs-API. Die einzige Quelle sind die
  lokalen Logs der CLI-Tools (`~/.claude/projects/**/*.jsonl`, `~/.codex/sessions/**/rollout-*.jsonl`).
  Die kann der Browser nicht lesen; es braucht ein lokales Node-Skript, das sie zu JSON aggregiert.
- Das passt nur zum Dev-Server. Läuft mission control auf dem Server `arrow.local`, liegen App und Logs auf
  verschiedenen Rechnern. Lösbar wäre das nur über einen zusätzlichen lokalen Helper (HTTP auf `127.0.0.1`
  mit CORS, Daemon per launchd) oder über ein Hochladen der JSON auf den Server (SSH, Webserver-Konfiguration).
  Beides ist für den Nutzen zu viel Infrastruktur.
- Die Daten wären lückenhaft: Chats im Browser und in den Desktop-Apps fehlen, und Claude Code loggt seine
  Abo-Limits nicht (nur Tokens; das 5-Stunden-Fenster müsste geschätzt werden).

**Wann wieder aufgreifen:** bei einem Umstieg auf die API-Variante. Dann gibt es offizielle Usage-/Cost-
Endpunkte der Anbieter. Diese brauchen aber Admin-API-Keys, die nicht im Browser liegen dürfen
(keine Secrets im Frontend). Vorher ist zu klären, wo der Key liegt und wer die Daten abruft. Das wäre
der erste Bruch mit „frontend-only“ und braucht eine eigene Entscheidung (siehe
[`../docs/NO_BACKEND_DECISION.md`](../docs/NO_BACKEND_DECISION.md)).

**Erkenntnisse aus dem Prototyp** (für eine spätere Umsetzung):

- Claude Code: Zeilen mit `type: "assistant"` enthalten `timestamp`, `requestId` und
  `message.{id, model, usage}`. `usage` hat `input_tokens`, `cache_creation_input_tokens`,
  `cache_read_input_tokens` und `output_tokens`. Pro Content-Block wird die Zeile wiederholt, deshalb nach
  `message.id` + `requestId` deduplizieren. Keine Limit-Angaben.
- Codex CLI: Events `type: "event_msg"` mit `payload.type: "token_count"` enthalten
  `payload.info.last_token_usage` (`input_tokens`, `cached_input_tokens`, `output_tokens`) und
  `payload.rate_limits` mit `primary` (5 h) und `secondary` (Woche), jeweils `used_percent`,
  `window_minutes` und `resets_at` (Epoch-Sekunden), sowie `plan_type`.
- Sinnvolle Token-Definition: neue Eingabe (inkl. Cache-Schreiben) plus Ausgabe; Cache-Lesen ausklammern,
  sonst dominieren sie die Summen.
- Datenschutz: Nur Summen ausgeben (keine Prompts, Projektnamen, Pfade); Credential-Dateien wie
  `~/.codex/auth.json` nicht lesen; Ausgabedatei git-ignorieren.
- Das UI folgte dem bestehenden Adapter-Muster (Setting `aiUsageSourceUrl`, Local-JSON mit Type Guard,
  Mock-Fallback, `IntegrationStatus`) und passt so ohne Sonderweg ins Dashboard.
