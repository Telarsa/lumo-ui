---
name: lumo-ui
description: Make an app correct in Persian using Lumo UI — the locale contract, the Jalali grid for shadcn's Calendar, and the served-byte grader. Trigger on Persian/RTL/Jalali/i18n work, on adding a date picker, or when the user mentions Lumo.
---

# Lumo UI — consumer skill (1.0.0)

Lumo is **not a component library** any more: build UI with shadcn/ui (web) or
Material (Flutter), and use Lumo for what they cannot do. Read
`docs/agent-consumer.md` in the Lumo checkout once per session; then:

1. **Install** — ONE git dependency, in `dependencies`:
   `"lumo-ui": "github:Telarsa/lumo-ui#v1.0.0"`. Everything comes from it by
   subpath — `lumo-ui/core`, `lumo-ui/dates`, `lumo-ui/base-ui-ssr`,
   `lumo-ui/gate`, `lumo-ui/theme/*.css`, `lumo-ui/config/eslint`. Use **pnpm**:
   `npm install` fails on the `catalog:` protocol this repo pins with, which is
   deliberate. Next needs one entry — `transpilePackages: ["lumo-ui"]`, the
   package NAME; a subpath there matches nothing and Turbopack then reports
   "Unknown module type". `lumo doctor` checks the pin.
2. **Wire** — `LumoLocaleProvider` (from `lumo-ui/core`) at the root; no `dir`
   prop anywhere — direction is `direction(locale)`. An app on Base UI wraps
   children in Base UI's own `DirectionProvider` with the same value.
3. **Dates** — shadcn's Calendar is react-day-picker; hand it
   `lumoCalendar(locale, stringsFor(locale).calendar)`'s four props and the
   grid counts in Jalali. Never a raw `Date` at an API boundary — use
   `CalendarDate` via `toPickerDate`/`fromPickerDate`.
4. **Numbers and strings** — `formatNumber(value, locale)` for every number a
   reader sees, and make the translator's interpolation format a `number` and
   pass a `string` verbatim (the type is the contract); every announced string
   in the page's language (shadcn copies ship ~13 English ones — dialog/sheet
   "Close", pagination, sidebar — translate them in your copies); Latin islands
   with the helpers from `lumo-ui/core` — `<Latn>`, `latnAttrs`, `latnNodeAttrs`,
   `<Prose>` + `plain()` — never a hand-written copy (two of three shipped the
   same bug) and never `lang="en"` as an excuse.
4b. **Content** — `lumo fix --zwnj --digits --locale fa <dirs>` for the two
   mechanical corrections. Dry run first; read the samples; then `--write`.
5. **Declare the gate's inputs** — `gate.floors.json` beside the app, passed as
   the gate's last argument: `{ "@locales": [...], "@min-documents": <pages> }`.
   `@locales` stops the gate guessing a locale from a path (`/pro` is Old
   Provençal); `@min-documents` catches a build that emitted SOME of its pages.
   Then `lumo doctor` — it checks the pin AND the wiring (transpile, `.ts`
   imports, floors, lint policy) and exits non-zero on anything that would fail
   CI.
6. **Prove** — grade the served bytes:
   `node <lumo-ui>/scripts/grade-app.mjs <app>/.next/server/app fa-IR`
   (single-locale) or
   `lumo gate <static-export>` (locale-segmented). The first byte is the
   oracle; hydration fixes nothing for a crawler or a JS-off reader.
7. **Own Next's error shells** — `/_global-error` and `/_not-found` are served
   as a bare `<html>` with English copy, and `app/global-error.tsx` cannot
   change the first one (Next hardwires the route and strips your layouts). In
   `build`, not in the gate step:
   `node <lumo-ui>/scripts/own-error-shells.mjs .next --error shell.html`
   Add `--not-found` only if your root layout does not already emit
   `<html lang dir>`; a shell that has both is left alone.

Copies from earlier Lumo tags are **owned code** (§50): there is no upstream to
merge, `lumo add`/`upgrade` are gone, and a defect in a copy is fixed in place.

Never: add an English default, pass `dir`, print a raw number in Persian text,
wrap Persian prose in `data-lumo-latn`, or claim a screen-reader result nothing
ran.
