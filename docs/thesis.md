# What Lumo UI is for

Lumo is a React 19 component system for applications whose readers are not English-first — Persian today, Arabic-script and other RTL languages next — built so that being correct in those languages is enforced by the build, not promised by a README. It exists because no library in the ecosystem is headless in its *language*: every one of them is headless in styling and English in every string a screen reader announces.

## The one-line version

**Every announced string is a required prop; every geometry is logical; every served byte is graded.** A component that would ship an English `aria-label`, a physical `left`, or a Latin digit on a Persian page does not compile, does not lint, or does not build.

## What it is, concretely

- **A React 19 library on Base UI.** Behavior — focus, dismissal, collision, typeahead, roving tabindex — is rented from an engine with a real team behind it. The public API is Lumo's own (`isDisabled`, value-first callbacks, `locale`), not a compatibility shadow of anyone else's.
- **Copy-in distribution, shadcn-shaped.** 111 components and 30 product blocks ship as source through a registry, so a consumer owns and edits the code that meets their validation and data. `@lumo-ui/core` (locale, direction, `LumoNode`, formatting, strings) and `@lumo-ui/base-ui-ssr` (first-byte compensations for the engine) are dependencies, because they are contracts you want maintained beneath you.
- **Persian-first, RTL-honest, in the first byte.** Direction, digit system, calendar and script are four independent properties per locale. Jalali arithmetic goes through `@internationalized/date`; numbers through `formatNumber(n, locale)`; a bare number in JSX is a type error.
- **A verification system that is part of the product.** Thirteen rules over served HTML, a source gate for accepted-but-undelivered props, per-route digit floors, a live popup tier, a clean-room consumer compile, and a mutation floor — each with a poison fixture that must fail. Nothing else in the ecosystem grades served bytes for locale correctness; this is the part of Lumo that is genuinely new.

## Who it is for

Telarsa's own React products first, and any React application that has to be right in Persian or another RTL language without a team of reviewers reading every screen. It is not a general-purpose replacement for shadcn/ui or Mantine for English-first apps; those are better served by their own ecosystems. Lumo earns its weight only where the language rules do work.

## What it is not

- Not on npm and not public — private-first by decision, until it is good enough to represent Telarsa.
- Not a CSS-only or a two-backend library. The earlier idea — a Preact/Zag two-layer system with a CSS tier and an opt-in behavior tier, sequenced behind another product — is retired; it lives in `history/thesis-2026-07-preact-zag.md`. The two-layer *insight* survives in a different shape: styling is CSS you can theme, behavior is code you can copy and edit.
- Not a claim of browser or screen-reader verification it has not run. What is proved is proved in served bytes and jsdom; a real assistive-technology pass is still owed.

## What decides whether it is a product

Whether an application team outside the library's authors can install a component, meet a Persian screen-reader user, and have nothing to fix. Everything in `docs/verification.md` is a proxy for that one test.
