# .ai — Implementation Reference

Dieses Verzeichnis enthält die maschinenlesbaren Implementierungsdetails von mission control. Aufbau und
Konventionen entsprechen den Schwesterprojekten **dash** und **velo**, damit alle drei Arrow-Produkte mit
demselben Vorgehen weiterentwickelt werden können. Einstieg für Agents: [`../CLAUDE.md`](../CLAUDE.md) bzw.
[`../AGENTS.md`](../AGENTS.md).

## Dateiübersicht

| Datei | Inhalt |
|---|---|
| [stack.md](stack.md) | Tech-Stack mit Versionen und Konfiguration |
| [comparison.md](comparison.md) | Vergleich velo / dash / mission control (Stack, Design, Architektur) |

### Frontend (`frontend/`)

| Datei | Inhalt |
|---|---|
| [frontend/architecture.md](frontend/architecture.md) | Angular-Projektstruktur, State, Routing, Adapter |
| [frontend/design-system.md](frontend/design-system.md) | Design-Tokens, App-Shell, Komponentenklassen, Icons |
| [../docs/arrow-corporate-design.md](../docs/arrow-corporate-design.md) | Corporate Design der Arrow-Produkte (Kopie; Master in dash) |

### Regeln (`rules/`)

| Datei | Inhalt |
|---|---|
| [rules/coding-standards.md](rules/coding-standards.md) | Coding-Richtlinien für das Frontend |

### Bestehende Projektdokumentation (`docs/`)

Fachliche Details bleiben in `docs/` und werden hier nicht dupliziert:

| Datei | Inhalt |
|---|---|
| [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Architekturübersicht, Adapter-Schicht |
| [../docs/LOCAL_JSON_CONTRACTS.md](../docs/LOCAL_JSON_CONTRACTS.md) | JSON-Verträge für velo/dash/Kalender |
| [../docs/DATA_CONTRACTS.md](../docs/DATA_CONTRACTS.md) | Typisierte Datenmodelle |
| [../docs/UI_UX_SPEC.md](../docs/UI_UX_SPEC.md) | UI/UX-Spezifikation |
| [../docs/ASSUMPTIONS.md](../docs/ASSUMPTIONS.md) | Getroffene Annahmen |
| [../docs/MVP_STATUS.md](../docs/MVP_STATUS.md) | Umsetzungsstand |
| [../docs/NO_BACKEND_DECISION.md](../docs/NO_BACKEND_DECISION.md) | Entscheidung: kein Backend im MVP |

## Verwendung

Jede Datei ist in sich vollständig. Für Design-Fragen gilt die Reihenfolge:
`docs/arrow-corporate-design.md` → `frontend/design-system.md` → bestehender Code in dash.

## Letztes Update

2026-10-19
