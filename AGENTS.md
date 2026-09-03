# Lumo UI — agent guide

The Persian-first **correctness layer** for products built on shadcn/ui (web)
and Material/Flutter (mobile). Not a component library since 0.3.0 (decisions
§50–§51). MIT, versioned by git tag, not on npm. Monorepo (pnpm). Read
`docs/README.md` for the map and `docs/thesis.md` for what it is in one page.

## Commands
- `pnpm run verify` — the full pipeline, thirteen gates. Run it once at the end;
  never in parallel with a mutation campaign.
- Focused checks while working:
  `pnpm --filter @lumo-ui/<pkg> exec vitest run src/<file>.test.ts`,
  `pnpm --filter @lumo-ui/<pkg> exec tsc --noEmit`.
- `pnpm dev` — the docs site (`apps/website`), which is also `gate:html`'s corpus.
- Grade a product's served bytes:
  `node scripts/grade-app.mjs <app>/.next/server/app <locale>` for a
  single-locale app, or `lumo gate <static-export> [floors.json]`.
- Mutation floor (mobile): `pnpm run mutation:mobile` — do not edit the tree
  while it runs.
- Regenerate committed artifacts after touching their source:
  `node scripts/build-flutter-tokens.mjs`, `build-mobile-styles.mjs`. Never
  hand-edit them.

## Non-negotiable rules
1. Every announced string is a REQUIRED prop. No English defaults — English is
   the defect this project exists to prevent.
2. No `dir` prop, no physical left/right utilities. Direction is
   `direction(locale)`, derived, never passed.
3. A bare number child does not compile (`LumoNode`); use
   `formatNumber(n, locale)`. Its limit is real and documented — template
   literals and host JSX escape it, which is why the gate exists too.
4. Every gate rule ships with a poison fixture, and the fixture is written from
   a FIELD DEFECT, not from the rule. Twice now a fixture shared its
   implementation's blind spot (§50.4, §50.5).
5. Genuinely-Latin content is MARKED (`data-lumo-latn dir="ltr"`), never
   excused with `lang="en"`.
6. The served bytes are the oracle. A change that looks right and grades red is
   wrong; fix the change — the gates are the spec.

## Ask before
Filing an issue in someone else's tracker · cutting or pushing a tag ·
force-pushing or touching protected branches · adding a paid service · adding a
runtime dependency · shrinking `packages/mobile` (Flutter consumers resolve it
by local path, so anything removed from it breaks their build the same day; see
§50.8).

## Do not claim
NVDA, JAWS, VoiceOver, TalkBack, or CI results you did not actually run. There
is no browser-evidence job in this repo any more; accessibility-tree and
served-byte facts are the only ones the gates produce.

## Layout
`packages/core` the locale contract (types, direction, formatNumber, strings,
the locale context) · `packages/theme` tokens + the Tailwind bridge + Persian
type rules · `packages/dates` the Jalali grid for shadcn's Calendar ·
`packages/gate` the served-HTML grader (and the inert-props source tool) ·
`packages/config` the RTL lint policy · `packages/base-ui-ssr` first-byte
compensations for Base UI · `packages/mobile` **Lumo UI Mobile** (Flutter; the
same contract on Material's widget layer, tokens generated from
`packages/theme`, its own semantics grader) · `apps/website` the docs site,
built as a CONSUMER (shadcn copies this repo does not lint-own) ·
`apps/mobile-example` the Material app the semantics grader reads ·
`scripts/` generators and the product grader.

Details: `docs/verification.md` (what each gate proves), `docs/i18n-and-rtl.md`
(the locale contract), `docs/agent-consumer.md` (the consumer workflow),
`docs/decisions/log.md` (why anything is the way it is; §50–§51 is the current
architecture, and the entries before it explain what the code still does).
