# Lumo UI — agent guide

Persian-first, RTL-honest React 19 component library on Base UI. Private, `0.0.0`, not on npm. Monorepo (pnpm). Read `docs/README.md` for the map.

## Commands
- `pnpm run verify` — the full pipeline (~15 min, low-RAM machine: run once at the end, never in parallel with the mutation campaign).
- Focused checks while working: `pnpm --filter @lumo-ui/ui exec vitest run src/<file>.test.tsx`, `pnpm --filter @lumo-ui/ui exec tsc --noEmit`, `pnpm run gate:props`.
- Regenerate artifacts after touching component props/files: `node scripts/build-registry.mjs && node scripts/build-api-reference.mjs`.
- Mutation floor: `pnpm run mutation:components` (~20 min; do not edit the tree while it runs).
- Knowledge graph: `graphify query "<question>"` before grepping; `graphify update .` after code changes.

## Non-negotiable rules
1. Every announced string is a REQUIRED prop. No English defaults — English is the defect this library exists to prevent.
2. No `dir` prop, no physical left/right utilities in shared components. Direction is `direction(locale)`.
3. A bare number in JSX does not compile (`LumoNode`); use `formatNumber(n, locale)`.
4. A prop that reaches nothing is not declared. `gate:props` fails closed; do not mute it — deliver, relocate, or make it `?: undefined` and say why.
5. Every gate rule ships with a poison fixture; every SSR compensation ships with a bare-engine twin.
6. Generated files (`registry.json`, `api-reference.json`) are never edited by hand.

## Ask before
Filing upstream issues · publishing or making anything public · force-pushing / touching protected branches · adding a paid service · adding a runtime dependency.

## Do not claim
Browser, NVDA, JAWS, VoiceOver, TalkBack, Firefox, Safari, or hosted CI results you did not actually run.

## Layout
`packages/core` contracts · `packages/theme` tokens · `packages/base-ui-ssr` engine SSR fixes · `packages/ui` components · `packages/blocks` compositions · `packages/gate` graders · `apps/website` docs site · `scripts/` generators. Details: `docs/codebase.md`, `docs/architecture.md`, `docs/verification.md`, `docs/i18n-and-rtl.md`.
