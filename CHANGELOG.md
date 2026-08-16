# Changelog

Lumo UI is versioned by git tag; consumers pin the tag in their git dependency
on the contract packages (`@lumo-ui/core`, `@lumo-ui/theme`,
`@lumo-ui/base-ui-ssr`) and upgrade copied components with `lumo upgrade`.
Format: one section per version — **Breaking** (with the migration), **Added**,
**Fixed**, **Verification** — newest first. Dated milestones before the first
tag are on the docs site's changelog page and in `docs/decisions/log.md`.

## Policy

- **All packages move together.** Every package in the workspace carries the same version as the root (`gate:versions` in `verify` refuses a straggler); consumers pin one tag and read one section here per upgrade.
- **Licence: proprietary** — see `LICENSE`. Every package's `license` field says `SEE LICENSE IN LICENSE`.
- **Semver from 0.1.0.** While the major is 0, a MINOR may break: every break is
  listed under *Breaking* with a migration note, and `lumo upgrade` carries
  copied components forward (three-way merge; conflicts leave markers).
- **Deprecation before removal, one minor apart:** a prop or part to be removed
  is marked `@deprecated` in its docblock (it then appears in
  `api-reference.json`) for at least one minor before it goes.
- **Required announced strings never grow a default.** Adding a required
  string prop is a *Breaking* entry, on purpose.

## 0.2.2 — unreleased

### Fixed
- The docs site's mobile previews follow the SITE's theme, not the OS
  (react-native-web's `useColorScheme` reads `prefers-color-scheme`; a dark OS
  put dark-scheme buttons on a light page). `Frame device="phone"` has a phone's
  proportions (`min-h-[44rem]` at 22 rem wide) instead of collapsing to a
  landscape sliver around a short exhibit.

### Added
- **Web | Mobile on component pages.** Every component with a React Native
  implementation (`button`, `switch`, `text-field`, `select`) has a Mobile side
  at `/components/<slug>/mobile/` — the platform is a route, like the locale, so
  the switch in the page header is two links and both pages are served bytes
  the gate grades. The Mobile page: the RN examples in a phone frame (rendered
  through react-native-web, labelled), install (git pin on `@lumo-ui/native`),
  the examples with source, contract notes, **generated props** (the API
  reference now covers `packages/native` as `native/<module>`), device
  evidence. The sidebar marks such components with a phone glyph.
- Native props documented (docblocks; `testID` / `style` joined the house
  vocabulary); the documentation ratchet applies to `packages/native`.

## 0.2.1 — 16 August 2026

### Added
- `@lumo-ui/native` `TextField` (label REQUIRED and set as the input's own
  accessible name — native platforms have no `<label for>`; description as
  hint; error as a live region; text aligned to the reading start) and
  `Select` (Lumo's own: a `combobox` trigger named by the REQUIRED label showing
  the REQUIRED placeholder or the chosen option, a modal sheet of `option`s
  with `aria-selected`, REQUIRED `closeLabel`); `scrim` token generated.
- Docs `/docs/native/`: fields in the live preview, and a "on a device — and
  how you see it" section with the real iOS 18.5 simulator screenshot beside
  the react-native-web preview, each labelled for what it proves.

### Recorded
- Release-build probe row attempted: prebuild + CocoaPods succeed; xcodebuild
  needs the iOS platform installed in Xcode 26.6 (~8 GB) — not started unasked;
  one command afterwards (`packages/native/README.md`).

## 0.2.0 — 16 August 2026

Any language (decision §28). `Locale` is any BCP-47 tag; `fa-IR` and `en-US`
stay built-in (Lumo carries their strings); every other language brings its
own strings, and the type requires them.

### Breaking (with migration)
- **`LumoProvider` for a non-built-in locale requires `strings: LumoAppStrings`**
  (Lumo's `LumoStrings` + the engine's `BaseUiStringTemplates`); `stringsFor`
  and `baseUiStringsFor` throw without them. *Migrate:* nothing for `fa-IR` /
  `en-US`; a new language writes one complete `LumoAppStrings` object.
- **`LumoStrings` grew** `calendar`, `tree`, `chart`, `phoneInput.countries`
  (moved out of the components' internal tables). *Migrate:* if you built a
  `LumoStrings` object yourself, add the groups — the type lists them.
- **`Locale` is no longer a closed union.** Code that relied on exhaustiveness
  over `Locale` (`Record<Locale, …>` tables, `switch`) must use
  `BuiltinLocale`. *Migrate:* `import type { BuiltinLocale as Locale }` where a
  two-locale table is meant (the docs site did exactly this).
- **Deprecated (removed next minor):** `LOCALES` → `BUILTIN_LOCALES`,
  `FORMAT_LOCALE[l]` → `formatLocale(l)`, `isLocale` → `isBuiltinLocale`,
  `documentDirection` → `direction`.

### Added
- `@lumo-ui/native` `Switch` — the direction-sensitive second component (thumb
  on the logical `start`, ON at the reading end; named by label or required
  `accessibilityLabel`; `aria-checked`); the native provider roots a `dir`/`lang`
  View on web so react-native-web resolves logical styles; the docs preview
  shows it. First device probe run recorded (see Fixed).
- `formatLocale`, `isBuiltinLocale`, `BUILTIN_LOCALES`, `primarySubtag`,
  `RTL_PRIMARY` in core; `useLumoStrings`, `LumoAppStrings` in the ui locale
  companion; `direction()` for any tag with the CLDR fallback.
- The gate grades any BCP-47 tag (CLDR-derived profile under the explicit
  table; `localeForPath` accepts any tag segment and refines from `<html lang>`);
  `scriptSystem` accepts several Unicode scripts (Japanese, Korean).
- `docs/i18n-and-rtl.md` "Any language"; the provider type-test and an
  any-language render test (German with its own strings, Egyptian Arabic digits).

### Fixed
- `direction()` no longer throws on a runtime without `Intl.Locale` (Hermes on
  iOS 18.5 / Expo Go — the first device run of the probe): it asks the platform
  inside a guard and falls back to the locale table; `@lumo-ui/native` runs no
  platform code at import time. Probe results recorded verbatim in
  `packages/native/README.md`: digits and the Persian calendar PASS on device.

## 0.1.2 — 16 August 2026

The first two consumer trials (path A, v0.1.1): `example-hotel` — Next 16 with
shadcn and next-intl — and the Telarsa website — Next 16, its own CSS, no
Tailwind. The components held in both; the tooling and one global theme block
did not. Everything below came out of those two days of use, and each item is
now held by a gate. Decision §26 has the full record.

### Breaking (with migration)
- **`@lumo-ui/theme/tokens.css` no longer carries the Persian typography
  block** (root leading, `h1…h6:lang(fa)` leading, the `tracking-*` guard,
  `font-synthesis: none`). It is `@lumo-ui/theme/script.css`, opt-in: page-wide
  by design, and inside `tokens.css` it restyled a host that embeds Lumo (the
  Telarsa site's `lang="fa"` switch link changed on all 46 English routes).
  *Migrate:* a greenfield app adds `@import "@lumo-ui/theme/script.css";` after
  `theme.css`. A site embedding Lumo does not — its own Persian typography now
  reaches Lumo's components, which is the point.
- **`script.css` applies the Persian face** (`font-family: var(--lumo-sys-font-sans)`
  on the root and every `lang="fa"` island), so portalled surfaces (Select
  popover, Dialog, Calendar) render in it too. *Migrate:* set
  `--lumo-font-persian` to your loaded face; remove any body rule you had
  written to get the same effect.
- **`lumo add` stores originals as `.lumo/originals/**/*.orig`** (so a
  consumer's `**/*.tsx` lint/tsc globs skip them) and **refuses to overwrite a
  file it did not write** (`--force` to insist). *Migrate:* nothing — the
  unsuffixed originals of 0.1.1 are still read; the next `upgrade` rewrites them.

### Fixed (consumer contract)
- `@lumo-ui/core` type-checks under `lib: ["dom", "dom.iterable", "esnext"]`
  (create-next-app's default): the `Intl.Locale.getTextInfo` augmentation that
  collided with `lib.esnext.intl.d.ts` is a local intersection type. `Gantt`,
  `NavigationMenu`, `Sidebar` compile under plain `strict` (no
  `exactOptionalPropertyTypes` / `noUncheckedIndexedAccess`).
- Every copyable source passes a Next.js 16 app's ESLint: typescript-eslint
  `recommended` + react-hooks 7 `recommended` (React Compiler rules included),
  warnings as errors — 55 findings in 24 files fixed (empty
  `interface … extends {}` → type aliases; `label: _label` discards gone; refs
  read during render, setState in effects, components created during render,
  mutation of frozen values, missing effect deps restructured).
- **Blocks are consumable:** `lumo add <block>` rewrites `@lumo-ui/ui` imports
  to relative imports of the ui copies (a consumer cannot install the workspace
  package) and derives the block's closure from its imports; the catalog carries
  every block's title, intro, category and docs page; `lumo info` prints
  composition sketches for 106 items (was 17).
- **`lumo gate` runs from a consumer's `node_modules`** — a committed
  JavaScript build (`packages/gate/dist`) with `linkedom` and
  `dom-accessibility-api` as root dependencies (Node refuses to strip types under
  `node_modules`; the gate's deps were dev-only).
- `lumo`: `--dir <components dir>` (remembered in `lumo.lock.json`), `--to`
  defaults to `.` and the commands find the project upward, `deps` takes several
  names, exact `pnpm add name@version` lines from the shipped catalog (contract
  packages excluded — they are git pins), de-duplicated output, `diff` lists
  locally edited copies, `lumo help` / `--help` exit 0, `doctor` finds
  `package.json` above a sub-folder.
- `LumoHtml.lang` accepts any BCP-47 tag for a host's other languages (direction
  by primary subtag; `documentDirection`, `isLocale` exported); Lumo components
  must not render under such a document.
- `SelectField.label` docblock said the label is visible unless hidden; the
  default is announced-only (`showLabel` opts in) — the docblock now says so.

### Added
- **`@lumo-ui/native` — the React Native / Expo start (decision §27):**
  `LumoNativeProvider` (direction from the locale, brand hue/chroma, fonts,
  colour scheme) and `Button` / `IconButton` on `Pressable` + `Text` with the
  web button's contract; `src/tokens.ts` generated from `tokens.css`
  (`gate:native-tokens`); first-byte tests through react-native-web graded by the
  14 rules; the docs site previews it at `/docs/native/` in a phone frame,
  labelled as a browser rendering. The device ICU probe is still open.
- **Gates in `verify`:** `gate:consumer-profile` (tsc under a Next default
  tsconfig over core/base-ui-ssr/ui/blocks), `gate:consumer-lint`
  (`eslint.consumer.config.mjs`, `--max-warnings 0`), `gate:dist` (the gate's
  committed build is fresh). The consumer smoke test gained the same tsconfig
  profile and copies blocks the way `lumo add` does; `@lumo-ui/ui` is no longer
  mapped for it.
- `docs/agent-consumer.md` §0.1 (the wiring checklist both trials had to
  discover: tsconfig, CSS order, fonts, dark mode, `LumoHtml`/`LumoProvider`
  placement, `transpilePackages`, `--dir`, lint, server vs client parts, gating
  a dynamic app, the Tailwind namespace collision) and §0.2 (embedding Lumo in a
  site that is not a Tailwind app — the layer recipe proved on the Telarsa
  website with 0 rendered differences over 92 captures).

### Migration
Bump the four specifiers to `v0.1.2`, `pnpm install`, `lumo upgrade`; then
`script.css` per the first Breaking entry.

## 0.1.1 — 16 August 2026

The install path, decided and proved: **path A — git dependencies pinned to a
tag**, no registry host. `v0.1.0` could not be installed that way (its contract
packages used workspace-only `catalog:`/`workspace:` specifiers), so this patch
exists; nothing else in the API changed.

### Fixed
- `@lumo-ui/core` declares exact dependency versions (equal to the workspace
  catalog — `gate:versions` refuses drift); `@lumo-ui/base-ui-ssr` depends on
  core as a **peer at the release version** (lockstep, checked). Proved:
  `pnpm add "@lumo-ui/core@github:Telarsa/lumo-ui#<tag>&path:packages/core"` and
  the same for theme and base-ui-ssr, plus `lumo-ui` as a dev dependency for the
  `lumo` command; `lumo add dialog --to .`; a page importing all of it compiles.
- The docs site's install commands are `lumo add <name> --to .` (they printed a
  third-party CLI command against a parked domain); `components.json` no longer names
  that host; `registry.json` `homepage` is the repository.
- `lumo doctor` checks all four git pins against the checkout's version.
- Root `package.json` `files` limits what the dev dependency delivers (CLI,
  registry, catalog, package sources, consumer docs).
- **The last third-party-CLI ties are gone:** `registry.json` no longer names
  another project's JSON schema, `components.json` and the old vendoring script
  are removed, and the docs describe Lumo's own registry and CLI. Lumo's
  components are its own; where the docs compare with other libraries they do
  so as a competitor (`docs/rubric.md`).

### Migration
Consumers on `v0.1.0` copies: bump the four specifiers to `v0.1.1`, `pnpm
install`, `lumo upgrade --to .` (no component changed; the lockfile records the
version).

## 0.1.0 — 16 August 2026

The first tagged version: 111 components, 30 blocks, contract packages,
served-HTML gate (14 rules), browser evidence job, `lumo` CLI. Everything below
is relative to the untagged tree consumers may have copied before this date.

### Breaking (with migration)

- **`Dialog` requires `label`** (its announced name); `DialogModal` and `Drawer`
  lift it onto the `role="dialog"` popup. **`Drawer.label` is removed** — one
  name, typed once, on the `Dialog` inside.
  *Migrate:* add `label="…"` to every `<Dialog>`; delete `label` from
  `<Drawer>`. `Dialog` must be a direct child of `DialogModal`/`Drawer`
  (host elements and fragments are looked through; other components are not —
  a wrapper component hides it and the popup logs an error).
- **`Dialog` and `AlertDialog` reject `aria-label`, `aria-labelledby`,
  `aria-describedby`, `aria-details`** (they landed on a descendant div, not the
  popup). *Migrate:* use `label` / `title`; describe with `DialogDescription`.
- **`ContextMenu` requires `aria-label`** (no trigger button names a right-click
  menu). *Migrate:* add it.
- **`ToggleButtonGroup` requires `aria-label`** (the engine renders
  `role="group"`, which names nothing). *Migrate:* add it.
- **`ComboBox` requires `label`** (nothing else names the field). *Migrate:* add it.
- **React Aria compatibility surface removed** across the API: `slot`,
  `excludeFromTabOrder` (use `tabIndex`), `routerOptions`, `isPending`,
  `preventFocusOnPress`, the `?: undefined` carriers, `href`/`hrefLang`/`target`
  on non-links. `DialogClose` is the way to close a dialog from its footer.
  *Migrate:* the type-checker lists every site; each has a direct replacement
  named in the error.
- **`LumoStrings` (`@lumo-ui/core`) keeps only `dateField` and `numberField`;**
  `comboBox`, `searchField`, `calendar`, `datePicker` groups are gone (nothing
  read them on Base UI). *Migrate:* pass the strings as the required props the
  components already have.
- **No component accepts `dir`** (`GlobalDOMAttributes` no longer declares it).
  *Migrate:* direction is `direction(locale)` from `LumoProvider`; a genuinely
  LTR run gets `data-lumo-latn` (and `dir` on your own host element).
- **`Tabs` panels keep the engine's id** (the tab's `aria-controls` now
  resolves); if you targeted `…-tabpanel-…` ids in CSS or tests, use
  `[role="tabpanel"]`.
- **Theme tokens moved:** `positive` 0.520→0.495, `critical` 0.555→0.470,
  `caution` 0.545→0.515 (light), so status text on its own 10 % tint clears
  4.5:1 — measured in `tokens.test.ts`. Docs syntax highlighting uses GitHub's
  high-contrast pair.
- **Licence is proprietary** (`LICENSE` at the root; every package's field says
  `SEE LICENSE IN LICENSE`) — was `MIT` with no LICENSE file.

### Added

- **Browser evidence job** (`pnpm run evidence`, CI): axe on every route in
  Chromium; 20 popup families opened in Chromium/WebKit/Firefox with committed
  ARIA snapshots and the engine's own accessible-name checks; RTL layout by
  geometry. Not a screen-reader run and labelled so.
- **`lumo` CLI** (`scripts/lumo-cli.mjs`, bin `lumo`): `search`, `info`,
  `list`, `deps`, `add`, `diff`, `upgrade` (three-way), `gate`, `doctor`;
  `catalog.json`; `docs/agent-consumer.md`, `skills/lumo-ui/SKILL.md`,
  `llms.txt` — for people and AI sessions in other projects.
- **`LumoProvider linkComponent`** — the app's router link reaches every anchor
  Lumo renders (`Item`, `Command` rows, `MenuItem href`, `NavigationMenuLink`,
  `SidebarItem`; `Link` takes it as a prop in server trees).
- **`presentQueryResult`** — a TanStack Query result becomes the `asyncState`
  every collection accepts, structurally.
- **`usage` (when / when not, both locales) on every component page;** 49
  `.type-test.tsx` files pinning required strings, unions and rejected props;
  `docs/apg.md` keyboard matrix with engine-key tripwires; description/error
  wiring on ComboBox, MultiSelect, TagsInput, Slider, InputOtp; a NodeNext
  consumer profile in the smoke test; per-page `<title>`s on the docs site.
- **Gate:** rule 14 `latn-island-purity`; `no-latin-digits` reads
  `value`/`aria-valuetext`/`placeholder`/`alt`/`title`/`aria-label`/
  `aria-description`; `no-latin-aria` grades purity (a Persian phrase with a
  foreign token passes); `named-controls` grades composite and container roles;
  `no-latin-aria` keyed on script, not direction.

### Fixed (core promise)

- Select's open listbox was unnamed in real engines (it pointed at its
  `role=combobox` trigger, whose name is its value); it points at the field's
  own label. NumberField served `1,234` under `fa-IR`; it formats in the
  provider's locale. PowerSearch's numeric `resultCount` served Latin digits.
  Gantt's zoom/split announced raw values. PhoneInput's and InputOtp's help/
  error text never reached the input; PhoneInput's country switch did not
  re-emit E.164. Tabs pointed every tab's `aria-controls` at nothing after
  hydration. Calendar outside-month days at 2.33:1. ListBox PageUp/PageDown
  were a no-op near the ends. `popupName` could lift a body field's label onto
  an alertdialog. FileUpload/Attachment forced Persian file names LTR.
  **The date family now agrees on calendar:** `DateField`, `DatePicker` and
  `DateRangePicker` display and edit in the reader's calendar (Jalali under
  `fa-IR`, like `Calendar`) and emit in the caller's — a Gregorian value in, a
  Gregorian value out; gate rule 8 fails a Persian date field whose year segment
  announces a Gregorian year (decision §24, closed).

### Verification at this tag

`pnpm run verify` green: 3,349 tests; `gate:props` 190 files 0/0; api reference
0/0 undocumented (119 modules); registry 141 items; catalog checked; smoke
under bundler and NodeNext; 594 documents 0 violations under 14 rules, 63
digit floors. Mutation: 104 behavioural + 7 presentational operators, 111/111
killed. Evidence: 20 popup families × 3 engines, axe on every route.
Rubric (`docs/rubric.md`), last blind pass: 7.5.

### Known and recorded

The install path (git dependency vs private registry) is an owner decision; the
`lumo` CLI works from any reachable checkout. No screen-reader run exists.
