# The locale contract

Lumo is Persian-first with English second; the rules below are what make that true in served bytes, not only after hydration.

## Four independent properties per locale
Direction, digit system, calendar, and script are graded separately (`packages/gate/src/index.ts`): Persian is rtl / arabext / persian / Arabic script; Arabic is rtl / arab / islamic-umalqura / Arabic script; English is ltr / latn / gregory / Latin. None is derived from another — deriving digits from direction is how a rule goes silently Persian-only. The GATE grades any BCP-47 tag (an explicit table for `fa-IR`, `ar-SA`, `en-US`, a CLDR-derived profile for the rest); the COMPONENTS accept any tag since 0.2.0 — the two BUILT-IN locales carry Lumo's strings, every other language brings its own (see "Any language" below).

## Rules that are compile-time
- Every announced string is a required prop (`label`, `closeLabel`, `dismissLabel`, `strings` objects). No defaults.
- `LumoNode` excludes `number`: `{count}` in JSX does not compile; write `formatNumber(count, locale)`.
- There is no `dir` prop. `LumoProvider` derives direction from `locale`; `LumoHtml` writes `lang`/`dir`.

## Rules that are build-time (`gate:html`, 13 rules over served bytes)
lang/dir on the root · no Latin digits in Persian/Arabic text · no purely-Latin ARIA strings (a Persian phrase with a foreign token passes) · every control named · IDREFs resolve · composite widgets have exactly one Tab stop · native calendar in dates · unique ids · native-script text and names · named roledescription · `data-lumo-latn` islands are actually Latin (a Persian paragraph inside one fails, not hides) · per-route Persian digit floors (auto-admitted for any route with 30+ native digits).

## What the engine gets wrong and how it is compensated
Base UI resolves names in layout effects (absent on the server) → `@lumo-ui/base-ui-ssr` resolves them in render. Base UI hardcodes `aria-label="Dismiss"` in combobox popups (mui/base-ui#5263) → `ComboBox`/`MultiSelect` require `dismissLabel` and relabel the live sentinel. An open popup `aria-hidden`s the page including the visible label → inputs also name themselves by `aria-labelledby`. Charts have no direction lever → `chartMirror(locale)` and per-family reflections.

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


## Any language — the contract since 0.2.0 (decision §28)

`Locale` is any BCP-47 tag. Two are **built-in** — `fa-IR` and `en-US` — meaning
Lumo carries their strings (`LumoStrings`: number field, date field, calendar
chrome, tree, chart, phone-input country names) and the engine's seven
templates (`BaseUiStringTemplates`). Every other language is a **consumer
language**, and the rule is the same one that governs announced strings on
components: **the app supplies them, Lumo never defaults.**

```tsx
import type { LumoAppStrings } from "@/components/ui/locale.ts";
const de: LumoAppStrings = { numberField: {…}, dateField: {…}, calendar: {…}, tree: {…}, chart: {…}, phoneInput: {…}, engine: {…} };

<LumoHtml lang="de-AT">…</LumoHtml>
<LumoProvider locale="de-AT" strings={de}>…</LumoProvider>   // `strings` is REQUIRED by the type for a non-built-in tag
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
| Every announced string is required | required prop; `gate:props` | required named parameter; `gate:flutter-contract` rule `english-default` rejects a defaulted announced string, and `english-literal` rejects an English literal in an announced position |
| Direction comes from the locale, never a flag | `direction(locale)`, no `dir` prop | `LumoScope(locale:)` drives `Directionality`; rule `physical-direction` rejects `EdgeInsets.only(left:)`, `Alignment.centerLeft`, `TextAlign.left` and their kin in favour of the directional forms |
| Numbers are formatted, never bare | `formatNumber(n, locale)`; a bare number in JSX is a type error | `formatNumber(n, locale)` in Dart, or a pre-formatted `String` parameter |
| Dates go through a calendar model | Jalali as a first-class model | `jalali.dart` — the jalaali-js algorithm in pure Dart — with `calendarOf(locale)` mirroring the web's `-u-ca-` rule |

One rule exists only on mobile: **never use a Material route helper**
(`showDialog`, `showModalBottomSheet`, `showMenu`, `showDatePicker`). Each names
its own route and barrier from `MaterialLocalizations` — «Dialog», «Dismiss» —
in English, under a Persian app. `showLumoDialog`, `showLumoSheet`,
`showLumoPopover` take those names as required parameters instead, and
`gate:flutter-contract` fails the build on the Material forms.

The proof is different in kind. The web's claim rests on graded served bytes;
the mobile claim rests on the **semantics tree**, asserted per family in both
locales — name announced exactly once, role, state, value — plus directory-wide
sweeps. That is a weaker instrument than one grader sweeping every document by
rule, and `docs/goals.md` Tier M item M2 is the plan to close that gap.
