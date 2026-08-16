# Working with Lumo UI from another project — for people and AI sessions

You are in a React (19) app that wants Persian-first, RTL-honest components.
Lumo is private: components are COPIED into your project (you own the file), and three contract packages are installed (`@lumo-ui/core`,
`@lumo-ui/theme`, `@lumo-ui/base-ui-ssr`) — you never edit those. This page is
the whole workflow; the `lumo` CLI does the mechanical parts.

## 0. Where Lumo is — the install recipe (path A, proved end to end)

Lumo is private and lives in the Telarsa GitHub organisation. Your project
installs it as **git dependencies pinned to a tag** — no registry host, no token
beyond repository access:

```jsonc
// package.json
"dependencies": {
  "@lumo-ui/core":        "github:Telarsa/lumo-ui#v0.1.2&path:packages/core",
  "@lumo-ui/theme":       "github:Telarsa/lumo-ui#v0.1.2&path:packages/theme",
  "@lumo-ui/base-ui-ssr": "github:Telarsa/lumo-ui#v0.1.2&path:packages/base-ui-ssr"
},
"devDependencies": {
  "lumo-ui": "github:Telarsa/lumo-ui#v0.1.2"   // the `lumo` command, the registry, the catalog, package sources
}
```
- pnpm resolves the `&path:` monorepo sub-path; over SSH use
  `git+ssh://git@github.com/Telarsa/lumo-ui.git#v0.1.2&path:packages/core`.
- The contract packages ship TypeScript source: Vite consumes it as is; **Next
  needs** `transpilePackages: ["@lumo-ui/core", "@lumo-ui/theme", "@lumo-ui/base-ui-ssr"]`.
- All four specifiers carry the **same tag** — Lumo versions move together
  (`lumo doctor` checks).
- Everything below assumes `pnpm exec lumo …` (npm: `npx lumo`, yarn: `yarn lumo`,
  bun: `bunx lumo`), or `node ../lumo-ui/scripts/lumo-cli.mjs …` from a sibling clone.
- A fix to Lumo reaches you as a **new tag**, never as a patch: `pnpm patch`
  cannot target a git dependency. Bump the four specifiers together.

### 0.1 Wiring checklist (what the two consumer trials had to discover — 16 Aug 2026)

| Concern | What to do |
|---|---|
| tsconfig | `"allowImportingTsExtensions": true` — copies and contract packages import `./x.tsx` (needs `noEmit`, which Next sets). Nothing else: the copies type-check under create-next-app's `strict` + `lib: esnext` (a gate proves it). |
| CSS, greenfield app | `@import "tailwindcss"; @import "@lumo-ui/theme/tokens.css"; @import "@lumo-ui/theme/theme.css"; @import "@lumo-ui/theme/script.css";` — in that order. `script.css` is Lumo's page-wide Persian typography (root leading, heading leading, `tracking-*` guard, the Persian face on the root and on portals); import it when Lumo owns the page. Tailwind 4 finds the copies' classes by itself when they sit under your source root; add `@source "<dir>"` otherwise. |
| CSS, embedded in an existing site | see §0.2 — do **not** import `script.css`. |
| Fonts | Set `--lumo-font-persian: var(--your-vazirmatn-variable)` on `:root` (next/font, @fontsource…). The Latin face is whatever your `--font-sans` is. |
| Dark mode | Tokens flip on `[data-theme="dark"]` (explicit) or `prefers-color-scheme` (system); a `light` value pins light. With next-themes: `attribute={["class", "data-theme"]}`. |
| `<html>` | `<LumoHtml lang="fa-IR">` in the layout that knows the locale (in a `[locale]` app that is the locale layout; if your `<html>` sits above it, read the locale there — next-intl's `getLocale()` works). A host that also serves a language Lumo has no strings for (`de`) may pass it — `lang` accepts any BCP-47 tag, direction comes from the primary subtag — but must not render Lumo components under that document. |
| Provider | `<LumoProvider locale=…>` is a client component; wrap once (a small `"use client"` boundary around `children` in the locale layout is the usual shape). Its `children` is `LumoNode`; Next's `ReactNode` at the layout seam needs `as LumoNode`… or wrap it in an element. |
| Next config | `transpilePackages: ["@lumo-ui/core", "@lumo-ui/theme", "@lumo-ui/base-ui-ssr"]`. |
| Where copies go | `lumo add … --dir src/components` (remembered in `lumo.lock.json`); ui items land in `<dir>/ui/`, blocks in `<dir>/blocks/`, with imports rewritten to your copies. `add` refuses to overwrite a file it did not write (`--force` to insist). Commit `lumo.lock.json` and `.lumo/originals/` (`*.orig`, so your lint and tsc globs skip them). |
| Lint | Copies pass typescript-eslint `recommended` + react-hooks 7 `recommended` (React Compiler rules included) with warnings as errors — that is `eslint-config-next`; a gate proves it. |
| Server components | `Card`, `Badge`, `Separator`, `Alert`, `Link` and every `*.variants.ts` render from a server component; anything on a Base UI part (`Button`, fields, popups) is a client component — put it in one client island. |
| Grading | `lumo gate <dir>` grades a directory of served HTML — a static export, or files you `curl` from `next start` (a dynamic app has no export). |
| Namespace collision | If the app already has another Tailwind theme with `--color-accent`, `--color-border`, `--radius-*` (a shadcn block, say), whichever `@theme` is declared last wins for the whole app. Bind Lumo's tokens to yours in `@layer lumo.brand` (`--lumo-sys-accent: var(--primary)` …) rather than fighting over the Tailwind names. |

### 0.2 Embedding Lumo in a site that is not a Tailwind app (proved on the Telarsa website, 16 Aug 2026)

The site keeps its own reset, tokens and CSS modules; Lumo must not change one
pixel of it. The recipe, verified by computed-style + screenshot comparison of
every route before and after (0 differences over 92 captures):

```css
/* src/styles/lumo.css — imported FIRST in the site's global stylesheet, before
   the site's own `@layer …;` statement, so every Lumo layer ranks BELOW the
   site's tokens/reset/base and the site wins any collision. */
@layer lumo.tw-theme, lumo.reset, lumo.ref, lumo.sys, lumo.brand, lumo.script, lumo.components, lumo.overrides;
@import "tailwindcss/theme.css" layer(lumo.tw-theme);   /* Tailwind's theme, no preflight */
@import "@lumo-ui/theme/tokens.css";
@import "@lumo-ui/theme/theme.css";
@import "tw-animate-css";
@source "../lumo/components";                            /* ONLY the copies */
@tailwind utilities source(none);                        /* unlayered: beats the site's element resets on Lumo's own class names */
@layer lumo.brand { :root { --lumo-ref-hue-brand: 30; --lumo-ref-chroma-brand: 0.19; } }
```

Do not import `script.css` here: its page-wide `:lang(fa)` rules would restyle
the host wherever the host is silent (a `lang="fa"` locale-switch link grew by
10 px on every English page in the trial). Lumo's components inherit the host's
Persian typography instead, which is what you want. Layer order protects only
properties the site *declares*; anything unscoped Lumo emitted would still land
— that is why the script layer is opt-in.

## 1. Find the right component

```
lumo search date range           # names, titles, intros and "when to use" in fa-IR and en-US
lumo list --tier form            # form | overlay | navigation | feedback | layout | data | display | block
lumo info date-range-picker      # what it is for, when NOT to use it (and what to use instead),
                                 # REQUIRED announced strings, required props, files, deps, docs page
```
`catalog.json` is the same data as JSON; `api-reference.json` has every prop
with its docblock; `registry.json` has files and dependencies.

## 2. Get it

```
lumo add date-range-picker --dir src/components   # copies the item AND its registry closure into src/components/ui/
pnpm add <the exact `name@version` line it printed>
```
`--to` is the project root (default `.`), `--dir` where copies live (default
`components`, remembered in the lock — pass it once). `add` records
`lumo.lock.json` (what, which version, file hashes) and keeps a pristine copy
under `.lumo/originals/*.orig` — that is what makes upgrades safe. It never
overwrites a file it did not write (`REFUSED …`; `--force` to insist). Blocks
(`lumo add booking-summary`) come with their ui closure and import your copies.

## 3. Use it — the five rules that are not optional

1. **Every string a screen reader announces is a REQUIRED prop.** No defaults
   exist because a default would be English. `lumo info <name>` lists them.
   Write them in the page's language.
2. **No `dir` prop.** Wrap the app in `<LumoProvider locale="fa-IR">` (and
   `<LumoHtml lang=…>` at the root); direction is derived. Latin runs (codes,
   ids, URLs, product names) get `data-lumo-latn` — see the mixed-content policy
   in `docs/i18n-and-rtl.md`.
3. **Numbers go through `formatNumber(n, locale)`.** A bare number child does
   not compile (`LumoNode`); a number-typed prop is formatted by the component.
4. **Compose, don't fork, first.** Every component has a `<name>.variants.ts`
   (cva) for looks and takes `className`; blocks show the intended composition.
   Fork the copy only when a variant cannot express it — you own the file.
5. **Grade your served HTML.** `lumo gate ./out gate.floors.json` runs Lumo's
   14 served-HTML rules over a directory of served pages — a static export, or
   HTML you saved from `next start` (Latin digits, English in
   announced strings, unnamed controls, dangling idrefs, calendars, islands…).
   A finding is a defect in your page or a Lumo defect to report — never an
   allowlist.

Router links: `<LumoProvider linkComponent={NextLink}>` once; `Link` in server
components takes `linkComponent` as a prop. Data layer:
`presentQueryResult(query, messages)` turns a TanStack Query result into the
`asyncState` collections accept.

## 4. Customise

- Looks: edit `<name>.variants.ts` (cva) or pass `className`; tokens live in
  `@lumo-ui/theme` (`--color-*`, density, radius) — override tokens, not
  components, for brand changes.
- Behaviour: edit your copy. Keep the required-string props required; keep
  `formatNumber`; keep `data-lumo` markers (the focus ring and gates key on them).
- Run the same proofs Lumo runs: your app's tests can import
  `gradeHtml` from the gate package to grade a rendered fragment under fa-IR.

## 5. Upgrade

```
lumo doctor               # contract-package versions vs the checkout, lockfile vs checkout
lumo diff                 # which copied files changed upstream, and which you edited locally
lumo upgrade              # untouched copies are replaced; edited ones are 3-way merged
                          # (yours · original · new) — conflicts get <<<<<<< markers, never silent
```
Then bump the git tag on all four specifiers to the same version, run
`pnpm install`, your tests, and `lumo gate` on the export. Breaking changes are
listed per version in `CHANGELOG.md` with migration notes.

## 6. When Lumo is wrong

A required string that has a default, an English word served, a Latin digit, a
`dir` you had to pass, an unnamed control the gate did not catch — that is a
Lumo defect. Reproduce it with `renderToStaticMarkup` under `LumoProvider
locale="fa-IR"` (the first byte is the oracle) and file it against Lumo with
the markup; do not patch around it in your copy without a comment that names
the upstream issue.
