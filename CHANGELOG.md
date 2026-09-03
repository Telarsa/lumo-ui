# Changelog

Lumo is distributed as a git dependency pinned to a tag, so a consumer reads one
entry per upgrade. Versions are lockstep: every package in the repository, the
Flutter package included, carries the version this file leads with.

## 1.0.0

The first public release. Everything below is what a consumer gets, described
from scratch rather than as a diff, because there is no earlier public version
to diff against.

### What Lumo is

A correctness layer for products that serve a right-to-left or non-Latin
language, Persian first. It is not a component library: components come from
shadcn/ui on the web and Material on Flutter, and they stay yours. Lumo is the
part those libraries do not do, in three pieces:

- a typed **locale contract**, so a wrong direction, an English default or a
  bare number is a compile error rather than a review comment;
- a **gate** that grades the HTML a reader is actually served, before any
  JavaScript runs;
- a **lint policy** that catches the cheap half in the editor.

Turning a page right-to-left is a stylesheet. What nobody checks is what the
reader is handed: `4 ابزار` on a page where every other digit is `۴`, a select
that ships the raw key `thr`, a calendar drawing 77 of 77 day cells in Latin
digits, an icon button whose only name is `aria-label="menu"` on a Persian
route. Each of those looks plausible in a browser after hydration, so only the
served bytes catch them.

### Install

```bash
pnpm add -D github:Telarsa/lumo-ui#v1.0.0
```

One dependency; everything is reached by subpath (`lumo-ui/core`,
`lumo-ui/dates`, `lumo-ui/base-ui-ssr`, `lumo-ui/gate`, `lumo-ui/theme/*.css`,
`lumo-ui/config/eslint`). Requirements, and the reasons:

- **pnpm.** The workspace pins its dependencies through `catalog:`, which npm
  cannot parse when it clones a git dependency and installs inside it.
- **Next.js:** `transpilePackages: ["lumo-ui"]`, the package name and not a
  subpath. Lumo ships TypeScript source and your bundler compiles it in place.
- **tsconfig:** `"allowImportingTsExtensions": true` for any app that imports a
  Lumo module. An app that only runs the grader imports nothing and needs
  neither of these.
- `react` (>=19), `@base-ui/react` and `react-day-picker` are optional peers.
  Nothing asks for them unless you import the subpath that uses them.

### The locale contract (`lumo-ui/core`)

`Locale` is any BCP-47 tag. Two are built in, `fa-IR` and `en-US`, meaning Lumo
carries their strings; every other language is one the app supplies, and the
type makes `strings` required for it, so a new language cannot quietly fall back
to English.

- `direction(locale)` derives direction from the tag, through
  `Intl.Locale.getTextInfo` where the platform has it and CLDR character order
  otherwise. **There is no `dir` prop anywhere in Lumo**, on purpose: a
  direction that can be passed is a direction that can be passed wrongly.
- `LumoHtml` writes `lang` and `dir` on the document; `LumoLocaleProvider`
  carries the locale and the strings.
- `formatNumber(value, locale)` and `formatDate(value, locale)` format in
  `formatLocale(locale)`, which gives `fa-*` the Persian calendar and Arabic
  extended digits and formats every other tag as itself. A tag that already
  states a `-u-` extension is respected.
- `LumoNode` excludes `number`, so a bare `{count}` in JSX does not compile.
  The limit is real and stated: a template literal or host JSX escapes the type,
  which is one of the reasons the gate exists as well.
- `stringsFor(locale)` resolves a built-in set and throws for a language the app
  has not supplied, because a German page rendered with English chrome is the
  defect and must not happen quietly.
- Latin islands: `<Latn>`, `<Name>`, `<Prose>`, `plain()`, `latnAttrs()`,
  `latnNodeAttrs()` and `isLatinRun()` mark the runs that are Latin by nature
  (a wordmark, an email address, a part number) so the gate knows they are
  deliberate. `isLatinRun` asks whether a string holds a non-Latin **letter**,
  not whether it holds a non-Latin character, because Persian digits live in the
  Arabic block and a test on the block calls «۹۰ Mt/year» native. Three
  hand-written copies of this helper got that wrong before it shipped here.
  `lumo-ui/core/latn` is the same helpers compiled and React-free, for an Astro
  or Preact site.

### The gate (`lumo-ui/gate`, `lumo gate`, `scripts/grade-app.mjs`)

Fourteen rules over served HTML, plus a fifteenth when you pass a floors file.
No browser, no server, no snapshots: it parses the bytes the build emitted.

```bash
lumo gate <static-export> [gate.floors.json]                  # locale-segmented export
node node_modules/lumo-ui/scripts/grade-app.mjs <built-html> fa-IR   # single-locale app
```

The rules: `lang`/`dir` on the root · no Latin digits in non-Latin text · no
purely-Latin ARIA strings · every control named · IDREFs resolve · a composite
widget has at least one Tab stop and no more than one · dates drawn in the
locale's calendar · unique ids · native-script text · native-script accessible
names · a named `aria-roledescription` · `data-lumo-latn` islands that are
actually Latin · the imperfective prefix joined with a zero-width non-joiner
rather than a space. With a floors file, a per-route native-digit floor as well.

The floors file is the app's own declaration and sits beside it:

```json
{ "@locales": ["en", "de", "fa"], "@min-documents": 592, "fa/index.html": 40 }
```

`@locales` stops the gate inferring a locale from a path segment (`/pro` is a
real language code, Old Provençal). `@min-documents` catches the likelier
accident, a build that emitted some of its pages and graded the survivors
clean. `@exempt-ceiling` bounds the one escape hatch: `data-lumo-latn` silences
the digit and script rules, and a page carrying ten violations drops to one when
a single attribute wraps it, so a site may commit a reviewed share that may only
fall.

Every rule ships with a poison fixture, and each fixture is written from a
defect found in the field rather than beside the implementation. That
distinction is not decorative: twice a fixture shared its rule's blind spot and
the rule graded clean on markup people actually write.

`scripts/own-error-shells.mjs` rewrites Next's builtin `/_global-error` and
`/_not-found` shells, which are served as a bare `<html>` with English copy and
which `app/global-error.tsx` cannot reach: Next hardwires that route to its own
module and strips every user layout from it. Run it in `build`, not in the gate
step, or the gate goes green while readers keep receiving the old bytes.
`docs/upstream/next-builtin-error-shells.md` is the reproduction and the ask.

### The lint policy (`lumo-ui/config/eslint`)

One dependency-free flat-config fragment, five checks, all
`no-restricted-syntax` selectors: a physical direction utility in a class
position (including inside a template literal and behind any variant prefix), a
raw number rendered as a JSX child, a hand-written `<html>` element, and `Intl`
called with no explicit locale, which silently uses the host's locale rather
than the reader's. It reads source, so it is the fast filter; the gate is the
proof.

### `lumo doctor` and `lumo fix`

- `lumo doctor` checks the pin and the wiring: every importing Next app
  transpiles `lumo-ui` and allows `.ts` imports, every gate script has a floors
  file declaring `@locales` and `@min-documents`, and the lint policy is
  extended. It exits non-zero on anything that would fail CI. Every check in it
  is a failure a consumer hit on its first day.
- `lumo fix --zwnj --digits --locale fa <dirs>` makes the two mechanical
  corrections: joining «می کند» to «می‌کند», and converting Latin digits to
  native ones in prose while leaving code, inline code, link targets, numeric
  literals and keys alone. It is a dry run unless you pass `--write`, because
  the first pass ever run rewrote `left: 84` to `left: ۸۴` inside an MDX
  expression and the build emitted zero pages.

### Dates (`lumo-ui/dates`)

shadcn's Calendar is react-day-picker. `lumoCalendar(locale, strings.calendar)`
returns the four props it already accepts, and the grid counts in the reader's
calendar, Jalali under `fa-*`. `toPickerDate` / `fromPickerDate` / `calendarDay`
are the value boundary, because a `Date` is an instant and cannot answer
«مرداد». The package follows shadcn naming (`disabled`, not `isDisabled`). The
arithmetic is checked against `Intl` across a 40-year sweep.

### Flutter (`lumo_ui_mobile`)

The same contract on Material's widget layer, as a separate implementation
rather than a port: `LumoScope(locale:)` drives `Directionality`,
`formatNumber` and a pure-Dart Jalali calendar cover the formatting, and the
design tokens are generated from the same CSS the web reads, so the two
platforms cannot disagree about what `md` or `accent` mean.

Its counterpart of the HTML gate is a semantics grader, shipped as
`package:lumo_ui_mobile/testing.dart`, which a consumer points at its own
screens. Seven rules over the semantics tree: `named-controls`,
`persian-digits`, `engine-english`, `announced-once`, `native-calendar`,
`native-script` and `persian-zwnj`. `engine-english` is the one that catches the
hazard unique to the platform: a Material route helper names its own route and
barrier from `MaterialLocalizations`, so an app that forgets
`GlobalMaterialLocalizations.delegate` announces «Dismiss» and «Back» in English
while every string it wrote itself is Persian.

### What is deliberately not claimed

No screen-reader result. Accessibility trees and served bytes are graded; no
NVDA, JAWS, VoiceOver or TalkBack run stands behind anything here, and none is
claimed. `docs/verification.md` says what each gate proves and what it cannot.
