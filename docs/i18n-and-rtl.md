# The locale contract

Lumo is Persian-first with English second; the rules below are what make that true in served bytes, not only after hydration.

## Four independent properties per locale
Direction, digit system, calendar, and script are graded separately (`packages/gate/src/index.ts`): Persian is rtl / arabext / persian / Arabic script; Arabic is rtl / arab / islamic-umalqura / Arabic script; English is ltr / latn / gregory / Latin. None is derived from another — deriving digits from direction is how a rule goes silently Persian-only. The GATE grades any BCP-47 tag (an explicit table for `fa-IR`, `ar-SA`, `en-US`, a CLDR-derived profile for the rest); the COMPONENTS accept any tag since 0.2.0 — the two BUILT-IN locales carry Lumo's strings, every other language brings its own (see "Any language" below).

## Rules that are compile-time
- Every announced string is a required prop — in the components YOU own. Lumo
  enforces what it still ships: `stringsFor(locale)` resolves the built-in tags
  and `strings` is REQUIRED by the type for any other, so a new language cannot
  silently fall back to English.
- `LumoNode` excludes `number`: `{count}` in JSX does not compile; write `formatNumber(count, locale)`.
- There is no `dir` prop. `direction(locale)` derives it and `LumoHtml` writes
  `lang`/`dir`; `LumoLocaleProvider` carries the locale and the strings.

## Rules that are build-time (`gate:html`, 14 rules over served bytes)
lang/dir on the root · the imperfective prefix joined with a zero-width non-joiner, not a space · no Latin digits in Persian/Arabic text · no purely-Latin ARIA strings (a Persian phrase with a foreign token passes) · every control named · IDREFs resolve · composite widgets have exactly one Tab stop · native calendar in dates · unique ids · native-script text and names · named roledescription · `data-lumo-latn` islands are actually Latin (a Persian paragraph inside one fails, not hides) · per-route Persian digit floors (auto-admitted for any route with 30+ native digits).

## What the engine gets wrong and how it is compensated
Base UI resolves names in layout effects (absent on the server) → `lumo-ui/base-ui-ssr` resolves them in render. Base UI hardcodes `aria-label="Dismiss"` in combobox popups (mui/base-ui#5263) → `ComboBox`/`MultiSelect` require `dismissLabel` and relabel the live sentinel. An open popup `aria-hidden`s the page including the visible label → inputs also name themselves by `aria-labelledby`. Charts have no direction lever → `chartMirror(locale)` and per-family reflections.

## What is deliberately physical
`data-lumo-latn` marks LTR islands (URLs, code, key caps) that must not mirror and are exempt from digit rules — and are graded for it: an island holding more Persian letters than Latin is a misplaced exemption (`latn-island-purity`). `top-*` stays physical: the block axis does not mirror.

## Latin words inside Persian content — the policy

Persian product copy legitimately carries Latin tokens: brand names, technical
terms with no good equivalent, file formats, product models. The library never
restricts what a string may contain; the gates grade PURITY, so this is what a
consumer sees:

| Content | Gate | Because |
|---|---|---|
| A Persian sentence or label with a foreign token — «گزارش را به صورت PDF دانلود کنید», «ورود با Google» | passes (`native-script-text`, `no-latin-aria`) | the run/attribute contains the reader's script; the token belongs to a translator's judgement, not a rule |
| A run with NO Persian at all — a heading «Dashboard», a value «thr», an `aria-label="Download"` | fails unless the element is a declared island | that is the defect the rules exist for (a raw key, an engine string, an untranslated label) — and a genuine Latin run (brand, code, id) says so with `data-lumo-latn` |
| Latin digits in Persian text — «iPhone 15» | fails `no-latin-digits` | write ۱۵ / `formatNumber`, or mark the product name an island |
| A pure-Latin placeholder — `name@example.com` | fails `no-latin-aria` | it is Latin content: mark that input `data-lumo-latn` (its value is LTR anyway) or phrase the hint in Persian |
| A `data-lumo-latn` island that is mostly Persian, or holds a Persian control inside a `lang="en"` container | fails `latn-island-purity` | the hatch may not hide the reader's own prose |

**And the exemption itself has a ceiling.** `data-lumo-latn` is the one thing
that silences this gate, and `latn-island-purity` above cannot see the abuse
that matters: it fails an island hiding READER-SCRIPT prose, while the useful
abuse hides LATIN defects — which is exactly what the other rules exist to
find. Measured: a Persian page carrying ten violations drops to ONE when a
single `data-lumo-latn` wraps it, and purity says nothing.

So a site may commit a reviewed ceiling in its floors file:

```json
{ "@exempt-ceiling": 24, "fa-IR/index.html": 6 }
```

`gate:html` then fails when the exempt share of characters in non-Latin
documents rises above it. It is OPT-IN — a site with no ceiling keeps the old
behaviour, where the scope line prints and nothing fails — and it is a
BASELINE, not a threshold: a docs site full of code listings is legitimately
more exempt than a product, so the number belongs to the site and may only
fall without someone deciding otherwise. The same shape as the digit floors
directly above it, for the same reason.


## Any language — the contract since 0.2.0 (decision §28)

`Locale` is any BCP-47 tag. Two are **built-in** — `fa-IR` and `en-US` — meaning
Lumo carries their strings (`LumoStrings`: number field, date field, calendar
chrome, tree, chart, phone-input country names) and the engine's seven
templates (`BaseUiStringTemplates`). Every other language is a **consumer
language**, and the rule is the same one that governs announced strings on
components: **the app supplies them, Lumo never defaults.**

```tsx
import { LumoHtml, LumoLocaleProvider, type LumoStrings } from "lumo-ui/core";

const de: LumoStrings = { calendar: {…} };   // the shapes the type requires

<LumoHtml lang="de-AT">…</LumoHtml>
<LumoLocaleProvider locale="de-AT" strings={de}>…</LumoLocaleProvider>
// `strings` is REQUIRED by the type for a tag Lumo does not ship, so a new
// language cannot silently fall back to English.
```

- **Direction** — `direction(locale)`: the platform's `Intl.Locale.getTextInfo`
  when it exists, else CLDR's character order by primary subtag
  (`RTL_PRIMARY`). Never passed.
- **Digits and calendar** — `formatNumber` / `formatDate` format in
  `formatLocale(locale)`: `fa-*` gets `-u-ca-persian-nu-arabext`; any other tag
  is formatted as itself, so `ar-EG` gets Arabic-Indic digits and `de` Latin
  ones from CLDR, without Lumo deciding; a tag that already carries `-u-…` is
  respected.
- **Strings** — `useLumoStrings()` resolves the built-in set or the app's;
  `stringsFor("de")` without the app's set **throws** — a German page rendered
  with Persian or English chrome is the defect, and it must not happen quietly.
- **The gate** grades any tag: the explicit table (`fa-IR`, `ar-SA`, `en-US`)
  first, else a profile derived from the same CLDR data the formatters use
  (numbering system from `Intl.NumberFormat`, calendar from
  `Intl.DateTimeFormat`, script from `Intl.Locale.maximize`). A tag whose script
  the gate cannot name is an error, not Latin by default. `lumo gate` finds the
  locale in the route segment (`/de/…`, `/ar-EG/…`) and refines it from
  `<html lang>`.
- **The docs site** is still two-locale by design; its copy types against
  `BuiltinLocale`.
- **Mobile** — `LumoScope(locale:)` takes the same open tag. The React Native
  package that used to be named here (`LumoNativeProvider`) no longer exists:
  decision §30 chose Flutter, and `packages/mobile` is the mobile library.

What "all languages" does NOT mean: Lumo authoring strings for a third
language. That is the app's translation, in the app's voice, and a required
prop is how the library refuses to guess.

## The same contract on mobile (`packages/mobile`, Flutter/Dart)

The mobile library is a separate implementation, not a port, and it carries the
same four rules — enforced by different instruments, because a Flutter app
serves no HTML.

| The rule | On the web | On mobile |
|---|---|---|
| Every announced string is required | a required prop in your own components, graded in the served bytes by `named-controls` | a required named parameter in your own widgets, graded in the semantics tree by the grader's `named-controls` |
| Direction comes from the locale, never a flag | `direction(locale)`, no `dir` prop | `LumoScope(locale:)` drives `Directionality`; `directionOf` matches whole subtags |
| Numbers are formatted, never bare | `formatNumber(n, locale)`; a bare number in JSX is a type error | `formatNumber(n, locale)` in Dart, or a pre-formatted `String` parameter |
| Dates go through a calendar model | Jalali as a first-class model | `jalali.dart` — the jalaali-js algorithm in pure Dart — with `calendarOf(locale)` mirroring the web's `-u-ca-` rule |

One hazard exists only on mobile: **a Material route helper names its own route
and barrier from `MaterialLocalizations`** — `showDialog`, `showModalBottomSheet`,
`showMenu`, `showDatePicker`. Wire `GlobalMaterialLocalizations.delegate` and
Material says «بستن» and «هشدار»; forget it and a Persian app announces
«Dismiss» and «Back» in English while every string it wrote itself is Persian.

Lumo used to answer this with `showLumoDialog` and friends, which took the names
as required parameters. Those widgets retired with the roster (§54). The answer
now is the grader: `engine-english` reads the semantics tree and fails on chrome
the app never wrote, and `apps/mobile-example` carries that exact
misconfiguration as a test so the rule is known to fire.

The proof is the same in kind on both platforms now, which it was not when this
page was written. The web's claim rests on graded served bytes; the mobile claim
rests on the **semantics tree** — the thing the platform hands a screen reader —
swept by seven rules that a consumer runs on ITS OWN screens through
`package:lumo_ui_mobile/testing.dart`. §53 shipped that grader and §54 gave it a
corpus written by someone other than its author, which is what closed the gap
this paragraph used to describe as open.

The seven: `named-controls`, `persian-digits`, `engine-english`,
`announced-once`, `native-calendar`, and — since the web/mobile rule counts were
compared and found lopsided — `native-script` and `persian-zwnj`, ported from
the web rules of the same name. `native-script` is the one `engine-english`
deliberately does not cover: `engine-english` fires only when EVERY word is
Material's own vocabulary, and its comment already said an untranslated content
word "is a real defect, but it is a different one". On its first run against a
consumer it caught three — «Chest», «Lats», «Upper back» announced in English in
that app's Persian exercise library, the last of them the very string that
comment names.
