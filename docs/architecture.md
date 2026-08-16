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
packages/mobile        lumo_ui_mobile         Lumo UI Mobile (Flutter/Dart; decision §30)
apps/website                                   static showcase and documentation
```

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

## Current state

The generated catalogue contains 111 registry components and 30 blocks, 141
items in total. The deepest product surfaces include Jalali date entry and
calendars, DataGrid/Table, Gantt, EventCalendar, upload lifecycle, virtual and
async collections, filters, questionnaires and four advanced chart families.
The remaining adoption constraints are explicit: no public distribution, no
completed native package, and no claimed cross-browser assistive-technology
matrix.
