# Working with Lumo UI from another project — for people and AI sessions

You are in an app that must be right in Persian (or another RTL language).
Since 0.3.0 (decision §50/§50.6) Lumo is **not a component library**: you build
UI with shadcn/ui (web) or Material (Flutter), and install Lumo for what they
cannot do — the typed locale contract, the Jalali grid, and the served-byte
grader. Components copied from earlier Lumo tags are **owned code**: there is
no upstream to merge, `lumo add`/`diff`/`upgrade` are gone, and a defect in a
copy is fixed in place.

## 0. The install recipe

Lumo is not published to npm. It installs as **ONE git dependency pinned to a
tag**:

```jsonc
// package.json
"dependencies": {
  "lumo-ui": "github:Telarsa/lumo-ui#v1.0.0"
}
```

That is the whole install. It was five specifiers until 0.4.0 — `@lumo-ui/core`,
`@lumo-ui/theme`, `@lumo-ui/dates`, `@lumo-ui/base-ui-ssr` and `lumo-ui` — each
pinned to the same tag, and every one of them was already inside the `lumo-ui`
tarball: the source shipped and had no `exports` map to reach it through, so a
consumer downloaded the same code twice.

Import what you use, by subpath:

```ts
import { formatNumber, LumoHtml, stringsFor } from "lumo-ui/core";
import { lumoCalendar } from "lumo-ui/dates";          // only if the app shows dates
import { useFieldWiring } from "lumo-ui/base-ui-ssr";  // only if Base UI is underneath
```
```css
@import "lumo-ui/theme/tokens.css";
```
```js
// eslint.config.js
import lumo from "lumo-ui/config/eslint";
```

- **Install with pnpm.** `npm install` on this git dependency fails with
  `EUNSUPPORTEDPROTOCOL: Unsupported URL Type "catalog:"` — npm clones the whole
  repository and runs `npm install` inside it, where it meets pnpm's `catalog:`
  protocol. That protocol is deliberate (`pnpm-workspace.yaml` explains it:
  exact pins named once, so an upstream change is a reviewed bump and never a
  silent laptop-vs-CI difference), so it stays. Verified on the pushed tag:
  `pnpm install` resolves all six subpaths and runs `lumo-ui/gate`.
- Over SSH: `git+ssh://git@github.com/Telarsa/lumo-ui.git#v1.0.0`.
- `react-day-picker` and `@base-ui/react` are OPTIONAL peers: nothing asks for
  them unless you import `lumo-ui/dates` or `lumo-ui/base-ui-ssr`.
- Lumo ships TypeScript source: Vite consumes it as is; **Next needs**
  `transpilePackages: ["lumo-ui"]` — the package NAME, not a subpath. A subpath
  there matches nothing and Turbopack then reports "Unknown module type" on a
  file it was never told to compile.
- Lumo ships TypeScript source that imports with explicit `.ts` extensions, so
  any app that IMPORTS a Lumo module needs `"allowImportingTsExtensions": true`
  in its tsconfig. A grader-only consumer — one that runs Lumo's scripts and
  imports nothing — needs neither this nor `transpilePackages`.
- **A private mirror needs a credential per JOB**, and the public repository
  needs none. This is worth knowing only if you fork Lumo privately: the
  `url.insteadOf` rewrite is per-job configuration, so every CI job that
  installs needs its own — including a Flutter job, where `flutter pub get`
  clones the same repository. A job without it fails with
  `could not read Username for 'https://github.com'`, which names neither a
  repository nor a secret. The token goes in the password position;
  `x-access-token` is a literal GitHub accepts as the user.
- **`lumo doctor` checks the rest** — the pin, and the wiring: every importing
  Next app transpiles `lumo-ui` and allows `.ts` imports, every gate script has
  a floors file declaring `@min-documents` and `@locales`, and the lint policy
  is extended. It exits non-zero on anything that would fail CI. Run it before
  the first push; every one of its checks is a CI failure that happened on a
  consumer's first day.
- A fix reaches you as a **new tag**, never a patch: `pnpm patch` cannot target
  a git dependency. Bump the specifiers together.

### 0.1 Wiring checklist (what the consumer trials had to discover)

| Concern | What to do |
|---|---|
| tsconfig | `"allowImportingTsExtensions": true` — contract packages and any owned copies import `./x.tsx` (needs `noEmit`, which Next sets). |
| CSS, greenfield app | `@import "tailwindcss"; @import "lumo-ui/theme/tokens.css"; @import "lumo-ui/theme/theme.css"; @import "lumo-ui/theme/script.css"; @import "lumo-ui/theme/interactive.css";` — in that order. `script.css` is the page-wide Persian typography; `interactive.css` restores `cursor: pointer` that Tailwind v4's Preflight dropped. Both greenfield-only, both unscoped by design. |
| CSS, embedded in an existing site | see §0.2 — do **not** import `script.css`. |
| Fonts | `--lumo-font-persian: var(--your-vazirmatn-variable)` on `:root`. The Latin face is whatever your `--font-sans` is. |
| Dark mode | Tokens flip on `[data-theme="dark"]` or `prefers-color-scheme`; with next-themes: `attribute={["class", "data-theme"]}`. |
| `<html>` | `<LumoHtml lang="fa-IR">` in the layout that knows the locale. Any BCP-47 tag works — direction comes from the tag. |
| Provider | `LumoLocaleProvider` from `lumo-ui/core` (locale + strings only). A language Lumo does not carry makes `strings` REQUIRED — a complete set in that language, no fallback. An app whose components use Base UI wraps children in Base UI's own `DirectionProvider` with `direction(locale)` — one line, same source of truth. (Apps with owned copies from ≤0.2.x keep using their copied `LumoProvider`; it re-exports the same context.) |
| Namespace collision | If another Tailwind theme declares `--color-accent` etc., bind Lumo's tokens to yours in `@layer lumo.brand` rather than fighting over the names. |

### 0.2 Embedding the theme in a site that is not a Tailwind app

The site keeps its own reset, tokens and CSS modules; Lumo must not change one
pixel of it. Proved on a marketing site with its own CSS and no Tailwind: 0
differences over 92 captures (46 routes at two widths, computed styles,
screenshots and normalised HTML).

```css
/* imported FIRST in the site's global stylesheet, before its own `@layer …;` */
@layer lumo.tw-theme, lumo.reset, lumo.ref, lumo.sys, lumo.brand, lumo.script, lumo.components, lumo.overrides;
@import "tailwindcss/theme.css" layer(lumo.tw-theme);
@import "lumo-ui/theme/tokens.css";
@import "lumo-ui/theme/theme.css";
@source "../lumo/components";            /* only the owned copies, if any */
@tailwind utilities source(none);
@layer lumo.brand { :root { --lumo-ref-hue-brand: 30; --lumo-ref-chroma-brand: 0.19; } }
```

Do not import `script.css`/`interactive.css` here: their page-wide rules would
restyle the host wherever the host is silent.

## 1. Dates — the one component gap

shadcn's Calendar **is** react-day-picker. Hand it `lumoCalendar()`'s four
props and the grid counts in the reader's own calendar:

```tsx
import { Calendar } from "@/components/ui/calendar";   // shadcn's, untouched
import { stringsFor } from "lumo-ui/core";
import { lumoCalendar, toPickerDate, fromPickerDate, calendarDay } from "lumo-ui/dates";

const strings = stringsFor(locale);   // built-ins resolve; other languages pass their own
const { dateLib, formatters, labels, weekStartsOn } = lumoCalendar(locale, strings.calendar);

<Calendar dateLib={dateLib} formatters={formatters} labels={labels} weekStartsOn={weekStartsOn} />
```

Never a raw `Date` at an API boundary — a `Date` is an instant that cannot
answer «مرداد». `toPickerDate`/`fromPickerDate`/`calendarDay` are the value
boundary. This package uses **shadcn naming** (`disabled`, not `isDisabled`).

## 1b. Latin islands — the one exemption, as code

`data-lumo-latn` is the ONLY exemption the gate honours: not `lang="en"`, not
`dir="ltr"`. Every product has runs that are Latin by nature — a wordmark, a
mailbox, a phone number, «ISO 27001», «Mt/year» — and marking them is how the
gate is told they are deliberate. The helpers live in `lumo-ui/core` and AGREE
with the gate's own test, which three hand-written copies did not:

```tsx
import { Latn, Name, Prose, plain, latnAttrs, latnNodeAttrs, isLatinRun } from "lumo-ui/core";

<Latn>{company.name}</Latn>              // marked only if the string is Latin; a translation renders bare
<Image alt={person} {...latnAttrs(person)} />   // an attribute cannot be wrapped: the marker goes ON the element
t.rich("…", { b: (c) => <b {...latnNodeAttrs(c)}>{c}</b> })   // a rich-text chunk, already isolated
<Prose>{"پیگیری کنترل‌های ISMS و [[ISO 27001]]"}</Prose>       // an island INSIDE a sentence, marked by the author
<title>{plain(copy)}</title>             // the same copy with the markers stripped
```

`isLatinRun` asks whether the string holds any non-Latin LETTER. Not "any
Arabic character": Persian digits live inside the Arabic block, so a test on the
block called «۹۰ Mt/year» native, never marked it, and the gate failed it
anyway. That was the live bug in two of the three copies.

`Latn` adds no `dir` and no class by default, so marking changes what the gate
reads and nothing a reader sees. `<Latn ltr>` is opt-in for the one case it
improves — a phone number whose leading «+» bidi would otherwise misplace —
because that IS a visual change.

**Without React** — an Astro or Preact site cannot import `lumo-ui/core` (it
needs `react/jsx-runtime`). `lumo-ui/core/latn` exports the pure half:
`isLatinRun`, `latnAttrs`, `latnNodeAttrs`, `plain`, as compiled JavaScript.

```astro
import { latnAttrs } from 'lumo-ui/core/latn'
<a href={source.url} {...latnAttrs(source.title)}>{source.title}</a>
```

**`<code>` is already the mark.** `<code>`, `<kbd>`, `<samp>` and `<var>` hold
machine text by definition, so the gate reads them as marked for every rule
that honours `data-lumo-latn` — text, name residue, digits, spoken attributes,
and the coverage census. Do not add the attribute to them. `<pre>` is NOT in
that set (preformatted is a layout fact; `<pre><code>` is covered by the inner
element), and `lang="en"` never is.

### Numbers a reader reads are written in their digits

Wherever a translator interpolates a value, a `number` must be formatted for
the locale and a `string` inserted verbatim — the TYPE is the contract:

```ts
return typeof value === "number" ? new Intl.NumberFormat(tag).format(value) : String(value);
```

`String(4)` is "4" in every locale, so «{count} ابزار» rendered «4 ابزار» on a
page where every other digit was «۴» — some three thousand findings from a
dozen call sites. One correct place instead of a dozen chances to forget. A
caller that genuinely wants Latin digits (a version, an id) passes a string.

Bare JSX numbers never reach the translator: `{count}` in markup needs
`formatNumber(count, locale)` from `lumo-ui/core` itself.

## 2. The rules that are not optional

1. **Every announced string is in the page's language.** shadcn's copies ship
   ~13 English ones (dialog/sheet "Close", pagination, sidebar, carousel,
   breadcrumb) — translate them in your copies; sonner's Toaster announces
   English until you label it. The gate reads what slipped through.
2. **No `dir` prop, anywhere.** Direction is `direction(locale)`.
3. **Numbers go through `formatNumber(n, locale)`** — a template literal
   (`` `مرحله ${step} از ۳` ``) is the classic escape; the gate catches it in
   the served bytes.
4. **Genuinely-Latin runs are marked, not excused:**
   `<span data-lumo-latn dir="ltr">ORD-4825</span>`. Never `lang="en"` as a
   hatch, and never `data-lumo-latn` around Persian prose.
5. **Grade the served bytes.** That is the oracle; hydration fixes nothing for
   a crawler or a JS-off reader.

## 3. Grading

```
lumo gate <static-export> [gate.floors.json]          # export with locale segments
node <lumo>/scripts/grade-app.mjs <app>/.next/server/app fa-IR   # single-locale app
```

`grade-app` stages every document under the locale you DECLARE, so `lang-dir`
grades each page's own `<html lang>` against your declaration; documents that
already carry a locale segment keep their own.

### The floors file

`gate.floors.json` sits beside the app and is passed as the last argument to
either entry point. Both read the same keys:

```json
{
  "@locales": ["en", "de", "fa"],
  "@min-documents": 592,
  "fa/index.html": 40
}
```

- **`@locales`** — the app's OWN locale set. Without it the gate infers a
  locale from path segments, and inference has a floor: `/pro` is graded as
  Old Provençal, because `pro` is an assigned language code. Declared, a
  segment is a locale if and only if it is in the list.
- **`@min-documents`** — the number of documents the build emits today. The
  gate refuses to grade an empty directory; this catches the likelier accident,
  a build that emitted SOME of its pages and graded the survivors clean. Lower
  it in the same commit that deliberately removes a route.
- **path floors** — reviewed native-digit counts at ~55% of measured on
  number-dense routes, so a regression that puts Latin digits back fails loudly.
  Passing a floors file also switches on the sweep that names number-dense
  routes with no floor.

### `lumo fix` — the two mechanical corrections

```
lumo fix --zwnj --digits --locale fa <content dirs…>          # dry run
lumo fix --zwnj --digits --locale fa --write <content dirs…>  # apply
```

`--zwnj` joins «می کند» to «می‌کند» with the gate's own pattern. `--digits`
converts Latin to native digits in PROSE — lines carrying native text, markdown
table rows, display strings inside MDX expressions, JSON values — and never in
code, inline code, link targets, numeric literals or keys. Dry run by default:
the first pass ever run rewrote `left: 84` to `left: ۸۴` inside an MDX
expression and the build emitted zero pages. Read the samples, then `--write`. React-streamed segments
(`<div hidden id="S:n">`) are graded as content. A finding is a defect in your
page or a gate defect to report — never an allowlist.

### Next's builtin error shells

Next serves two documents no app-router file can reach, both bare `<html>` with
English copy:

```
node <lumo>/scripts/own-error-shells.mjs .next --error error-shell.html [--not-found not-found-shell.html]
```

Run it in `build`, not in the gate step — the point is the bytes a reader
receives, and a rewrite that happens only when you grade is a green gate over a
broken site.

`/_global-error` is hardwired to Next's builtin module and has every user layout
stripped from its route, so writing `app/global-error.tsx` does nothing at all;
this is the only way to change it. `/_not-found` is different — it renders UNDER
the root layout, so if your root layout emits `<html lang dir>` you already ship
a clean one and should not pass `--not-found`. The script checks anyway: a shell
that already declares both `lang` and `dir` is left alone and reported.

Each shell is written to both the graded copy and the copy `pages-manifest.json`
points the server at, because rewriting only the first turns the gate green
while readers keep receiving the old bytes. Under `output: "standalone"` the
bundle carries its OWN third copy — that is the one a Docker image runs — and
those are rewritten too.

The shell is a static file, so it declares ONE language — the same one you
declare to `grade-app`. Reading `headers()` to negotiate a locale makes the
route dynamic and Next then emits no shell at all.

## 4. When Lumo is wrong

An English word the gate missed, a Latin digit it should have seen, a rule
firing on correct Persian — that is a gate defect. Reproduce it with the served
markup and file it against Lumo; the gate's own fixture suite (a poison per
rule) is where the fix lands. Component defects in your owned copies are yours
to fix in place — with a comment naming what was wrong, so the next reader can
tell a fix from a drift.
