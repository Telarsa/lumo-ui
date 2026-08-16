# Lumo UI — agent guide

Persian-first, RTL-honest React 19 component library on Base UI. Private, versioned by git tag (`v0.1.0` first), not on npm. Monorepo (pnpm). Read `docs/README.md` for the map.

## Commands
- `pnpm run verify` — the full pipeline (~15 min, low-RAM machine: run once at the end, never in parallel with the mutation campaign).
- Focused checks while working: `pnpm --filter @lumo-ui/ui exec vitest run src/<file>.test.tsx`, `pnpm --filter @lumo-ui/ui exec tsc --noEmit`, `pnpm run gate:props`.
- Regenerate artifacts after touching component props/files or example meta: `node scripts/build-registry.mjs && node scripts/build-api-reference.mjs && node scripts/build-catalog.mjs`.
- Consumer-side: `node scripts/lumo-cli.mjs search|info|list|deps|add|diff|upgrade|gate|doctor` — the workflow another project's session follows is `docs/agent-consumer.md` (also `skills/lumo-ui/SKILL.md`, `llms.txt`).
- Mutation floor: `pnpm run mutation:components` (~20 min; do not edit the tree while it runs).
- Browser evidence: `pnpm run evidence` (Playwright: Chromium/WebKit/Firefox over the built site; ~25 min; browsers via `pnpm exec playwright install chromium webkit firefox`; never alongside verify or mutation). What it proves: `docs/evidence/README.md`.
- Knowledge graph (use it first, it is cheaper than grep): `graphify query "<question>"` to orient, `graphify path "<A>" "<B>"` for how two things connect, `graphify explain "<concept>"` for one seam; `graphify update .` after code changes (AST-only, free).

## Non-negotiable rules
1. Every announced string is a REQUIRED prop. No English defaults — English is the defect this library exists to prevent.
2. No `dir` prop, no physical left/right utilities in shared components. Direction is `direction(locale)`.
3. A bare number in JSX does not compile (`LumoNode`); use `formatNumber(n, locale)`.
4. A prop that reaches nothing is not declared. `gate:props` fails closed; do not mute it — deliver, relocate, or make it `?: undefined` and say why.
5. Every gate rule ships with a poison fixture; every SSR compensation ships with a bare-engine twin.
6. Generated files (`registry.json`, `api-reference.json`) are never edited by hand.

## Rating and comparison
Every evaluation — blind, post-fix, or against another library — fills in `docs/rubric.md` (fixed weights, written level anchors, one line of evidence per criterion). Report the sheet and the per-criterion delta against the last dated sheet in `docs/history/`; do not invent a scale, and the author of a fix never scores it. The goal the sheet measures: worth building Telarsa's products on, and a contender beside the established libraries — adoption and bus factor carry no weight.

## Ask before
Filing upstream issues · publishing or making anything public · force-pushing / touching protected branches · adding a paid service · adding a runtime dependency.

## Do not claim
NVDA, JAWS, VoiceOver, TalkBack, or hosted CI results you did not actually run. Chromium/WebKit/Firefox facts come only from the `evidence` job's output — cite the run.

## Layout
`packages/core` contracts · `packages/theme` tokens · `packages/base-ui-ssr` engine SSR fixes · `packages/ui` components · `packages/blocks` compositions · `packages/gate` graders · `apps/website` docs site · `packages/mobile` **Lumo UI Mobile**, the mobile component library (Flutter/Dart; decision §30 — the same contract, tokens generated from `packages/theme`, semantics-tree tests, `gate:flutter`) · `packages/native` the frozen React Native experiment (do not extend) · `scripts/` generators. Details: `docs/codebase.md`, `docs/architecture.md`, `docs/verification.md`, `docs/i18n-and-rtl.md`.
