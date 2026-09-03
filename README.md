<div align="center">

# Lumo UI

**Right-to-left is the easy half.**
Lumo grades the bytes a Persian reader actually receives — the digits, the
calendar, the direction, and the name a screen reader announces — before any
JavaScript runs.

[![CI](https://github.com/Telarsa/lumo-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Telarsa/lumo-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Made by [Telarsa](https://telarsa.com)

</div>

---

## What it is, and what it is not

Lumo is **not a component library**. Components come from shadcn/ui on the web
and Material on Flutter, and they stay yours. Lumo is the layer those libraries
cannot be:

| | |
| --- | --- |
| **A locale contract** | one typed source for direction, digits, calendar and the strings a locale must provide |
| **A gate** | 15 rules that grade built HTML — no browser, no server, no snapshot |
| **A lint policy** | the first line, so most defects never reach the gate |
| **Two codemods** | `lumo fix` for the joiner and the digits; `lumo doctor` for the wiring |

Turning a page right-to-left is a stylesheet. The part nobody checks is what
the reader is actually handed: `4 ابزار` where every other digit is `۴`, a
status select that ships the raw key `thr`, a calendar drawing 77 of 77 day
cells in Latin digits. Each of those hydrates into something plausible in a
browser, so only the served bytes can catch them.

## Install

```bash
pnpm add -D github:Telarsa/lumo-ui#v1.0.0
```

pnpm only: the workspace uses `catalog:`, which npm cannot parse. In a Next.js
app add `transpilePackages: ["lumo-ui"]` — Lumo ships TypeScript source, and
your bundler compiles it in place.

## Grade a build

```bash
node node_modules/lumo-ui/scripts/grade-app.mjs dist en gate.floors.json
```

It walks the built HTML, works out each document's locale from its path and its
`<html lang>`, and reports what a reader would receive that they should not.
`gate.floors.json` is the reviewed baseline beside your app:

```jsonc
{
  "@locales": ["en", "fa"],        // the app's own locales; nothing is guessed
  "@min-documents": 592,           // a build that shrank is a build that failed
  "@exempt-ceiling": 12,           // the deliberately-Latin fraction has a ceiling
  "fa/index.html": 22              // a number-dense route keeps its digits
}
```

## The rules

Fifteen, each earned by a defect that shipped:

- **Script and digits** — visible text, accessible names and spoken attributes in
  the reader's script; native digits where the locale uses them.
- **Direction and language** — `dir` derived from `lang`, never typed, and never
  disagreeing with it.
- **Calendar** — a Gregorian month name in Persian prose, unless the content
  declares itself deliberately Gregorian.
- **Accessibility that only looks wired** — dangling `aria-describedby`, a tab
  list with no tabbable tab, duplicate ids, a control with no accessible name.
- **Regression floors** — per-route digit counts and a minimum document count, so
  a quiet collapse fails instead of passing clean.

`data-lumo-latn` is the **only** exemption the gate honours — not `lang="en"`,
not `dir="ltr"`. It marks a run that is deliberately foreign: a wordmark, a hash,
`SHA-256`. `<code>`, `<kbd>`, `<samp>` and `<var>` already are that mark. And the
hatch is itself graded: an island whose text is really prose in the reader's
script fails, and `@exempt-ceiling` caps how much of a page may hide behind it.

## Helpers

```ts
import { LumoHtml, Latn, Prose, formatNumber, direction } from 'lumo-ui/core'
import { latnAttrs } from 'lumo-ui/core/latn'   // React-free, for Astro or Preact

<LumoHtml lang={locale}>                        // owns dir; you never type it
<Latn>{company.name}</Latn>                     // marked only if it is Latin
<Image alt={person} {...latnAttrs(person)} />   // an attribute cannot be wrapped
```

`isLatinRun` asks whether a string holds any **non-Latin letter** — not whether
it holds an Arabic character, because Persian digits live in the Arabic block
and a test on the block calls «۹۰ Mt/year» native.

## Wiring, checked

```bash
node node_modules/lumo-ui/scripts/lumo-cli.mjs doctor --to .
node node_modules/lumo-ui/scripts/lumo-cli.mjs fix --zwnj --digits --locale fa content/
```

`doctor` checks the things that are invisible until they break: the credential
on every CI job that installs, `transpilePackages`, the floors file and its
settings, the lint policy. `fix` is a dry run until you pass `--write`.

## Flutter

`packages/mobile` carries the same contract on Material: tokens, `LumoScope`,
the Jalali and digit formatters, and a semantics grader for widget tests — the
mobile equivalent of grading served bytes.

## Packages

| package | what it is |
| --- | --- |
| `core` | the invariants: locale contract, `direction()`, `formatNumber`, `LumoHtml`, the Latin-island helpers |
| `theme` | three token tiers, the Tailwind bridge, `:lang(fa)` rules |
| `dates` | `lumoCalendar()` — a Jalali grid through the four props shadcn's Calendar already accepts |
| `gate` | the grader and its CLI |
| `config` | the lint policy, no plugin dependencies |
| `base-ui-ssr` | first-byte compensations for Base UI |
| `mobile` | `lumo_ui_mobile`, the Flutter side |

## Contributing

`pnpm run verify` is the whole contract: thirteen gates, and if it is green the
change is shippable. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT — see [LICENSE](LICENSE). Use it in anything, including commercially.

<div align="center">
<sub>Built by <a href="https://telarsa.com">Telarsa</a></sub>
</div>
