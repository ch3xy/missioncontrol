# Entscheidungen

Kurzprotokoll von Produkt- und Architekturentscheidungen, die sich nicht aus dem Code ablesen lassen.
Neueste oben.

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

**Status:** zurückgestellt, nicht umgesetzt.

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
