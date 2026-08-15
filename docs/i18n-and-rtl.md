# The locale contract

Lumo is Persian-first with English second; the rules below are what make that true in served bytes, not only after hydration.

## Four independent properties per locale
Direction, digit system, calendar, and script are graded separately (`packages/gate/src/index.ts`): Persian is rtl / arabext / persian / Arabic script; Arabic is rtl / arab / islamic-umalqura / Arabic script; English is ltr / latn / gregory / Latin. None is derived from another — deriving digits from direction is how a rule goes silently Persian-only. The GATE knows the Arabic profile so a future `ar-SA` route is graded correctly on day one; the COMPONENTS ship `Locale = "fa-IR" | "en-US"` today (`packages/core/src/types.ts`) — adding a locale is a core change, not a config flag.

## Rules that are compile-time
- Every announced string is a required prop (`label`, `closeLabel`, `dismissLabel`, `strings` objects). No defaults.
- `LumoNode` excludes `number`: `{count}` in JSX does not compile; write `formatNumber(count, locale)`.
- There is no `dir` prop. `LumoProvider` derives direction from `locale`; `LumoHtml` writes `lang`/`dir`.

## Rules that are build-time (`gate:html`, 14 rules over served bytes)
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

