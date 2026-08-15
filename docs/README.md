# Lumo UI documentation

Start with `architecture.md`, then `codebase.md` for where things live. Everything here describes the tree as it is; superseded plans and audits are under `history/` and are not maintained.

| Document | What it answers |
| --- | --- |
| [architecture.md](architecture.md) | Packages, dependency direction, engine choice, styling ownership, distribution boundary |
| [codebase.md](codebase.md) | Where each kind of code lives, how a component is shaped, how to add one |
| [i18n-and-rtl.md](i18n-and-rtl.md) | The locale contract: direction, digits, calendars, required announced strings |
| [verification.md](verification.md) | Every gate in `pnpm run verify`, the popup tier, the mutation floor, what each proves and cannot prove |
| [decisions/log.md](decisions/log.md) | The decision log (ADR-style, append-only) |
| [thesis.md](thesis.md) | Why the library exists |
| [history/](history/) | Retired planning and audit documents, kept for the record |
| [history/evaluations.md](history/evaluations.md) | The independent-review arc of August 2026 and what it changed |

Browser evidence: `evidence/README.md` — what the Playwright job proves and does not.

Versions: `../CHANGELOG.md` — per-tag breaking changes with migration notes; policy at the top. Consumers (people and AI sessions in other projects): `agent-consumer.md` — find, get, use, customise, upgrade; the `lumo` CLI. Rating: `rubric.md` — the fixed weighted sheet every evaluation and comparison uses. APG audit: `apg.md` — per-family keyboard matrix (owned / proved / holes). Plan: `goals.md` — the criterion-by-criterion goal list, ordered by leverage.

Knowledge graph: `graphify query "<question>"` (built into `graphify-out/`, gitignored; rebuild with `/graphify .` or `graphify update .`).
