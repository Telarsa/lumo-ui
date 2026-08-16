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
