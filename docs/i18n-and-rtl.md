# The locale contract

Lumo is Persian-first with English second; the rules below are what make that true in served bytes, not only after hydration.

## Four independent properties per locale
Direction, digit system, calendar, and script are graded separately (`packages/gate/src/index.ts`): Persian is rtl / arabext / persian / Arabic script; Arabic is rtl / arab / islamic-umalqura / Arabic script; English is ltr / latn / gregory / Latin. None is derived from another — deriving digits from direction is how a rule goes silently Persian-only.

## Rules that are compile-time
- Every announced string is a required prop (`label`, `closeLabel`, `dismissLabel`, `strings` objects). No defaults.
- `LumoNode` excludes `number`: `{count}` in JSX does not compile; write `formatNumber(count, locale)`.
- There is no `dir` prop. `LumoProvider` derives direction from `locale`; `LumoHtml` writes `lang`/`dir`.

## Rules that are build-time (`gate:html`, 14 rules over served bytes)
lang/dir on the root · no Latin digits in Persian/Arabic text · no Latin ARIA strings · every control named · IDREFs resolve · composite widgets have exactly one Tab stop · native calendar in dates · unique ids · native-script text and names · named roledescription · `data-lumo-latn` islands are actually Latin (a Persian paragraph inside one fails, not hides) · per-route Persian digit floors (auto-admitted for any route with 30+ native digits).

## What the engine gets wrong and how it is compensated
Base UI resolves names in layout effects (absent on the server) → `@lumo-ui/base-ui-ssr` resolves them in render. Base UI hardcodes `aria-label="Dismiss"` in combobox popups (mui/base-ui#5263) → `ComboBox`/`MultiSelect` require `dismissLabel` and relabel the live sentinel. An open popup `aria-hidden`s the page including the visible label → inputs also name themselves by `aria-labelledby`. Charts have no direction lever → `chartMirror(locale)` and per-family reflections.

## What is deliberately physical
`data-lumo-latn` marks LTR islands (URLs, code, key caps) that must not mirror and are exempt from digit rules — and are graded for it: an island holding more Persian letters than Latin is a misplaced exemption (`latn-island-purity`). `top-*` stays physical: the block axis does not mirror.
