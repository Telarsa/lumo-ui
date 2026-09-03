# What Lumo UI is for

Lumo is the layer that makes a product **correct in Persian — and enforceable
about it** — on top of component libraries other people maintain. shadcn/ui on
the web, Material (Flutter) on mobile. It stopped being a component library on
30 Aug 2026 (decision §50; executed §50.6): no ecosystem library grades what a
non-English reader actually receives, and that gap — not components — is the
part of Lumo that was ever genuinely new.

## The one-line version

**The served bytes are graded, the locale contract is typed, and the one thing
shadcn cannot do — a Jalali grid — ships as four props.** Everything else is
rented from the ecosystem.

## What it is, concretely

- **`lumo-ui/gate`** — fourteen rules over served HTML: Latin digits, wrong
  calendars, foreign-script accessible names, unnamed controls, keyboard-dead
  composites. No browser needed; React-streamed segments are graded as content.
  axe-core's 105 rules cover none of this. Run it with `lumo gate <dir>` or,
  for a product app, `scripts/grade-app.mjs <built-html> <locale>`.
- **`lumo-ui/core`** — the invariants: the closed locale contract,
  `direction()` (no `dir` prop anywhere), `formatNumber`, `LumoNode`, the
  required-strings interface, and the locale context (`LumoLocaleProvider`).
- **`lumo-ui/dates`** — the gap. `lumoCalendar(locale, strings)` returns the
  four props shadcn's own Calendar (react-day-picker) already accepts, and the
  grid counts in Jalali — or any calendar the tag states. shadcn naming
  (`disabled`, not `isDisabled`), by decision §50 clause 3.
- **`lumo-ui/theme` / `lumo-ui/config` / `lumo-ui/base-ui-ssr`** — the
  tokens with their `:lang(fa)` rules, the dependency-free RTL lint policy, and
  the first-byte compensations for Base UI (§50.1 keeps this while shadcn's
  base style keeps Base UI underneath).
- **`lumo_ui_mobile`** — the same contract on Material's widget layer, with the
  semantics grader (`package:lumo_ui_mobile/testing.dart`, run by `gate:flutter`) as its counterpart
  of the HTML gate. Two Flutter consumers depend on it by path; it is a kept
  package, not a retired one.

## What it is not

- **Not a component library, on either platform.** 114 web components and 30
  blocks were retired at 0.3.0, and the mobile widget roster with them: 73 files
  and 21,326 lines re-implementing what Material already ships. Both Flutter
  consumers took their own copies and neither look changed. Consumers own their
  copies, the older tags stay fetchable, and there will be no upstream component
  changes to merge, which is the point. The reasoning is in decisions §50–§50.6.
- **Not on npm.** It installs as a git dependency pinned to a tag.
- Not a claim of screen-reader verification it has not run. What is proved is
  proved in served bytes and unit renders; an assistive-technology pass is
  still owed.

## What decides whether it is worth using

Whether a product team can build on shadcn/Material, install these packages,
run the grader over their served bytes, and have a Persian reader meet nothing
the build could have caught. The first product contact (§50.5: 51 documents,
306 violations, including a live defect the compile-time layer structurally
cannot reach) is the evidence this bet rests on so far, and §56 is the same
experiment repeated on a live product nobody here wrote.
