# CLAUDE.md — mission control

Projekt-Regeln und Prioritäten stehen in [AGENTS.md](AGENTS.md) — sie gelten vollständig.

## Implementierungsreferenz — `.ai/`

| Datei | Inhalt |
|---|---|
| [.ai/README.md](.ai/README.md) | Index aller `.ai`-Dateien |
| [.ai/stack.md](.ai/stack.md) | Tech-Stack, Versionen, Konfiguration, Befehle |
| [.ai/comparison.md](.ai/comparison.md) | Vergleich velo / dash / mission control |
| [.ai/decisions.md](.ai/decisions.md) | Entscheidungsprotokoll (z. B. KI-Nutzungskarte zurückgestellt) |
| [.ai/frontend/architecture.md](.ai/frontend/architecture.md) | Angular-Struktur, Routing, State, Adapter |
| [.ai/frontend/design-system.md](.ai/frontend/design-system.md) | Tokens, App-Shell, Komponentenklassen, Icons |
| [.ai/rules/coding-standards.md](.ai/rules/coding-standards.md) | Coding-Richtlinien |
| [docs/arrow-corporate-design.md](docs/arrow-corporate-design.md) | Corporate Design aller Arrow-Produkte (Kopie, Master in dash) |

## Kurzfassung

- mission control ist das „cockpit“ der Arrow-Produkte (velo, dash) — frontend-only, local-first.
- Stack und Design-System sind identisch mit dash (Angular 22, Zoneless, Signals, OnPush, Lucide, Inter, SCSS-Tokens).
- Node immer über `nvm use` (26.3.1); Checks: `npm run lint`, `npm run test -- --watch=false`, `npm run build`.
- UI ist deutsch (Standard, de-AT-Formate) und auf Englisch umschaltbar; Texte nur über `core/i18n/translations.ts`.
- Die Nachbarprojekte `../velo` und `../dash` sind Referenz und werden von hier aus nicht verändert.
