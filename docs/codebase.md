# Codebase map

## Where things live

```
packages/core/src        Locale, direction(), LumoNode, formatNumber/formatDate, prop vocabulary (props.ts), string catalog (strings.ts)
packages/theme/src       CSS tokens (--lumo-ref-* → --lumo-sys-* → --lumo-cmp-*), Tailwind bridge, base layer
packages/base-ui-ssr/src Base UI compensations: first-byte naming (resolved in render, not layout effects) and the live dismiss-sentinel relabel
packages/ui/src          111 components; one file per component, optional <name>.variants.ts (cva, directive-free), tests beside
packages/blocks/src      30 product compositions built only from ui
packages/gate/src        rules.ts (14 served-HTML rules), inert-props.ts (source gate), cli.ts, index.ts (locale grading table)
packages/config          ESLint policy (no physical left/right utilities in shared components)
apps/website             Static export docs site; examples in src/examples/<name>.tsx; islands for interactive demos
scripts/                 build-registry.mjs, build-api-reference.mjs, mutate-components.mjs, smoke-consumer.mjs
```

Generated, committed, and diff-checked in CI: `registry.json`, `api-reference.json`. Never edit by hand.

## The shape of a component

- `"use client"` unless the file explains why it renders on the server.
- Props interface extends `ComponentProps<"tag">` of the element it renders, `Omit`ing what it owns (say why on the line for `ref`/`id`).
- Every announced string is a required prop. No English defaults, ever.
- `locale` is derived by `LumoProvider`; there is no `dir` prop anywhere. Direction comes from `direction(locale)`.
- Numbers pass through `formatNumber(n, locale)`; a bare number in JSX is a type error (`LumoNode`).
- Behavior is rented from Base UI; the public API is Lumo's (`isDisabled`, value-first callbacks). No React Aria compatibility surface remains.
- Styling: Tailwind utilities via `cva()`, caller `className` merged last, logical inline utilities only.

## Adding a component

1. `packages/ui/src/<name>.tsx` (+ `<name>.variants.ts` if it has cva variants), export from `index.ts`.
2. Tests beside it: observe behavior and ARIA, and assert the module's own root carries its classes (the mutation floor strips `className=`).
3. `apps/website/src/examples/<name>.tsx` with `meta.intro` in both locales — the first example is the page preview.
4. `node scripts/build-registry.mjs && node scripts/build-api-reference.mjs`; every new prop needs a docblock (the ratchet is 0).
5. If it opens a popup, add a case to `popup-interiors.test.tsx`.

## Hubs (from the knowledge graph)

Most-imported inside `ui`: `form.tsx`, `chart.variants.ts`, `dialog.tsx`, `table.tsx`, `menu.tsx`, `popover.tsx`. Highest fan-out: `event-calendar.tsx`, `chart.tsx`, `table.tsx`, the date family. Core symbols the whole tree leans on: `cn`, `LumoNode`, `Locale`, `formatNumber`, `direction`.

## Integrations (adapters)

- **Router link** — `LumoProvider linkComponent={NextLink}` (or any component taking `LumoLinkRenderProps`). Client families that render an anchor (`Item`, `Command` rows, `NavigationMenuLink`, `SidebarItem`) read it from context. `Link` and `Breadcrumbs` are server components and cannot read a client context: pass `linkComponent` to `Link` explicitly in server-rendered trees. Default everywhere: the platform `<a>`.
- **Data layer** — `presentQueryResult(queryResult, messages)` turns a TanStack Query / SWR-shaped result (`isPending`, `isError`, `data`, `fetchStatus`, `refetch`, infinite-query fields) into the `asyncState` every collection accepts, with the same required, caller-authored copy as `presentAsyncCollection`. Structural — no dependency on either library. Use it where `useAsyncCollection` would double-fetch what the app already owns.
- **Forms** — `Form`, `Field`, `FieldInput` and `useFieldControl()` are the wiring; TanStack Form is used through `form-state.tsx`; every input on the shared wiring gets label/description/error connected in the first byte (`field-description-parity.test.tsx` covers the self-wired ones: ComboBox, MultiSelect, TagsInput, Slider).
