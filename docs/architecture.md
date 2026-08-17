# Lumo UI — how the pieces fit

Lumo is a Persian-first component library for React 19. Components are copied
into a product through Lumo's registry (`registry.json`, read by the `lumo` CLI); the locale, type, token and
verification contracts stay packaged so consumers cannot silently fork the
rules that make Persian output correct.

## Repository map

```
packages/core          @lumo-ui/core          locale/types/formatting contracts
packages/theme         @lumo-ui/theme         tokens, Tailwind bridge, base CSS
packages/ui            @lumo-ui/ui            111 registry components
packages/blocks        @lumo-ui/blocks        30 product compositions
packages/base-ui-ssr   @lumo-ui/base-ui-ssr   first-byte Base UI compensations
packages/gate          @lumo-ui/gate          source and built-HTML graders
packages/config        @lumo-ui/config        executable ESLint policy
packages/mobile        lumo_ui_mobile         Lumo UI Mobile — 145 widgets (Flutter/Dart; decision §30)
apps/website                                   static showcase and documentation
apps/mobile-gallery                            one Flutter web app serving every mobile demo
```

Two libraries, one contract. The web library is React on Base UI; the mobile
library is Flutter on Material's widget layer. They are not a shared codebase and
deliberately so (decision §30, best in class per platform) — what they share is
the contract, the tokens, and the standard of proof.

## Dependency direction

The dependency graph is deliberate rather than a one-layer slogan:

- `core` has React as a peer and owns `LumoNode`, `Locale`, direction,
  formatting, shared prop vocabulary and required string catalogues. Its only
  runtime helpers are `clsx` and `tailwind-merge`; it does not import `ui` or
  `theme`.
- `theme` is CSS and token contracts with no runtime dependency on components.
- `base-ui-ssr` depends on `core` and contains version-specific workarounds for
  Base UI behavior that is wrong in server-rendered bytes.
- `ui` depends on `core`, `base-ui-ssr`, Base UI and the few named product
  engines used by dates, charts, tables, forms and inputs. It does not depend on
  `blocks` or the website.
- `blocks` composes `ui`; the website consumes both. `gate` and `config` grade
  the graph without becoming runtime dependencies of copied components.

This direction is checked by TypeScript, registry derivation and a clean-room
consumer compile for every generated item.

## Component engine and public contract

Interactive primitives run on Base UI 1.7.0. Lumo keeps its own public React
contract: `isDisabled`, value-first change callbacks, locale-derived direction
and required caller-authored announced strings. Adapters translate that contract
to Base UI and isolate engine-specific SSR fixes in `@lumo-ui/base-ui-ssr`.

React Aria Components is not a runtime engine. It remains a development-only
comparison dependency for poison-twin measurements against the retired
implementation.

## Styling and ownership

Components use Tailwind v4 utilities, usually assembled through `cva()`, and
merge the caller's `className` last. Base UI and Lumo state are exposed through
semantic and `data-*` attributes so variants can respond without a parallel
JavaScript `classes` object. Inline-axis spacing and placement use logical
utilities; lint rejects physical left/right utilities in shared components.

The token flow is `--lumo-ref-*` → `--lumo-sys-*` → `--lumo-cmp-*`. Consumers
may theme the system tier, while components consume semantic tokens rather than
raw palette values.

## Distribution boundary

The registry copies component and block source because product teams are
expected to edit those surfaces. `@lumo-ui/core`, `@lumo-ui/theme` and the SSR
adapter remain packages because a local edit to locale, token or engine-patch
contracts would create incompatible Lumo dialects. `registry.json` derives file
and dependency closure from source, and the smoke gate compiles every copied
payload outside the workspace.

Lumo is private to Telarsa. It is not published to npm and does not currently
serve a public registry.

## First-byte verification

`apps/website` is a Next.js static export built with Lumo itself. This is both a
showcase and a test consumer. `lumo-gate` grades the exported HTML before
hydration for locale/direction, Persian digits, accessible names, calendar
identity, id references and composite tab stops. Unit tests cover hydrated
interaction and popup interiors that portals cannot place in static markup.

The complete local contract is `pnpm run verify`: types, inert/root props,
lint, styling policy, package tests, registry/API freshness, clean-room consumer
compiles and the built-HTML gate.

## The mobile library

`packages/mobile` (`lumo_ui_mobile`) is Flutter/Dart: 145 widgets across 76
family files, with a test file per family and 669 tests. It is not a port of the
React source and shares no runtime code with it. What crosses the boundary is:

- **Tokens, generated.** `scripts/build-flutter-tokens.mjs` reads
  `packages/theme/src/tokens.css` and emits `packages/mobile/lib/src/tokens.g.dart`
  — the same `--lumo-sys-*` semantics resolved for Flutter: oklch → sRGB for both
  schemes, rem → logical pixels for radii and control heights, and the three
  elevation tiers with their separate dark ramps. `gate:flutter-tokens` fails if
  the committed file does not match a fresh generation, so the two platforms
  cannot disagree about what `md` means.
- **The contract, graded.** The same rules the web library lives by — every
  announced string is a required parameter, direction comes from the locale and
  never from a `dir` flag, no bare numbers — hold in Dart.
  `gate:flutter-contract` enforces four of them statically over `lib/src`, with
  poison fixtures that must fail, including a rule against Material's route
  helpers (`showDialog`, `showModalBottomSheet`) because each names its own
  barrier in English from `MaterialLocalizations`.
- **The proof, in kind.** The web library's claim rests on graded served HTML;
  a Flutter app serves no HTML, so the mobile counterpart is the semantics tree.
  Names, roles, states and values are asserted per family in both `fa-IR` and
  `en-US`, plus five cross-cutting sweeps over the whole directory (elevation
  tokens, reduce-motion, silent validation errors, const-constructor asserts,
  radius tokens) and three permanent floors (tap-target size, cramped layout,
  token contrast).

The mobile side of the docs site is `apps/mobile-gallery`: one Flutter web build
serving every demo, addressed as
`/mobile-preview/index.html?demo=&lang=&theme=` and framed per component page.
It is built, never committed — `scripts/ensure-mobile-gallery.mjs` hashes its
inputs (including `packages/mobile/lib`) and rebuilds only on a miss.

## Current state

The generated catalogue contains 111 registry components and 30 blocks, 141
items in total; the mobile library adds 145 widgets. The deepest product
surfaces include Jalali date entry and calendars, DataGrid/Table, Gantt,
EventCalendar, upload lifecycle, virtual and async collections, filters,
questionnaires and four advanced chart families.

The remaining adoption constraints are explicit: **no public distribution**
(neither npm nor pub.dev; both libraries install from pinned git), **no
assistive-technology evidence on either platform** — the browser `evidence` job
covers Chromium, WebKit and Firefox accessibility trees, which is not a screen
reader, and the mobile side has no TalkBack or VoiceOver run at all — and **no
mobile equivalent of the served-HTML grader**: the mobile semantics claims rest
on per-family tests rather than on one grader sweeping every family by rule.
