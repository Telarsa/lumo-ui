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
  "@lumo-ui/core":        "github:Telarsa/lumo-ui#v0.1.1&path:packages/core",
  "@lumo-ui/theme":       "github:Telarsa/lumo-ui#v0.1.1&path:packages/theme",
  "@lumo-ui/base-ui-ssr": "github:Telarsa/lumo-ui#v0.1.1&path:packages/base-ui-ssr"
},
"devDependencies": {
  "lumo-ui": "github:Telarsa/lumo-ui#v0.1.1"   // the `lumo` command, the registry, the catalog, package sources
}
```
- pnpm resolves the `&path:` monorepo sub-path; over SSH use
  `git+ssh://git@github.com/Telarsa/lumo-ui.git#v0.1.1&path:packages/core`.
- The contract packages ship TypeScript source: Vite consumes it as is; **Next
  needs** `transpilePackages: ["@lumo-ui/core", "@lumo-ui/theme", "@lumo-ui/base-ui-ssr"]`.
- All four specifiers carry the **same tag** — Lumo versions move together
  (`lumo doctor` checks).
- Everything below assumes `pnpm exec lumo …` (npm: `npx lumo`, yarn: `yarn lumo`,
  bun: `bunx lumo`), or `node ../lumo-ui/scripts/lumo-cli.mjs …` from a sibling clone.

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
lumo add date-range-picker --to .          # copies the item AND its registry closure into components/ui/
pnpm add <the npm packages it printed>     # exact versions: pnpm-workspace.yaml `catalog:` in the checkout
```
`add` records `lumo.lock.json` (what, which version, file hashes) and keeps a
pristine copy under `.lumo/originals/` — that is what makes upgrades safe.

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
   14 served-HTML rules over your static export (Latin digits, English in
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
lumo doctor --to .        # contract-package versions vs the checkout, lockfile vs checkout
lumo diff --to .          # which copied files changed upstream, and whether you edited them
lumo upgrade --to .       # untouched copies are replaced; edited ones are 3-way merged
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
