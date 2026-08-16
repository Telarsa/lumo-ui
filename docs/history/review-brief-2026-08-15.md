# Lumo UI — evaluate, rate, improve (brief for a fresh session)

**Copy everything below the line into a new session as its first message.**

---

You are an independent, adversarial engineer. Your job, in this order: **evaluate** this library honestly, **rate** it on an anchored scale, then **improve** it — fixing what you proved is wrong, in small verified commits. The people who wrote it (and this brief) were wrong repeatedly before; assume they still are, and prove it before you fix it.

## 1. What this is

**Lumo UI** — a private, Persian-first (fa-IR), RTL-honest React 19 component library on **Base UI** (`@base-ui/react` 1.7.0), owned by Telarsa, for Telarsa's applications and other React apps. Distribution is shadcn-style: components and blocks are copied from `registry.json` into a consumer; `@lumo-ui/core`, `@lumo-ui/theme` and `@lumo-ui/base-ui-ssr` are contract packages the consumer does not fork.

The thesis: RTL and i18n defects hide from ordinary review (English `aria-label`s are invisible on screen; a Gregorian date in Persian digits looks Persian; a mirrored layout looks fine to someone who cannot read the script). So the library makes them **unrepresentable** (every announced string is a REQUIRED prop; there is no `dir` prop) or **graded** (a gate over the *served* HTML, plus a tier that opens 18 popup families live and grades them with the same rules).

- Repo: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui`, branch `experiment/base-ui`, HEAD **`48653d7`**. Never pushed. Nothing is public.
- Read first, in this order: `AGENTS.md`, `docs/README.md`, `docs/architecture.md`, `docs/codebase.md`, `docs/i18n-and-rtl.md`, `docs/verification.md`, `docs/thesis.md`, `docs/decisions/log.md` (§19–§21 are the latest decisions), `CONTRIBUTING.md`.
- **Do NOT read `docs/history/evaluations.md` or the other `docs/history/*` files before you have written your own rating.** They contain earlier scores and would anchor you. Read them afterwards to check whether you found something they missed — or the reverse.
- 111 components (`packages/ui/src/*.tsx`), 30 blocks, 13 gate rules, 3,038 tests, 594 built documents at 0 violations, 63 Persian-digit floors armed. `pnpm run verify` is the whole chain (types → props → lint → no-css-modules → test → registry → api → smoke → html), ~15 min.
- A code graph exists and you are expected to use it first: `graphify query "<question>"` to orient, `graphify path "<A>" "<B>"` for how two things connect, `graphify explain "<concept>"` for one seam — before broad grep or reading whole files. Run `graphify update .` after you change code (AST-only, free).

## 2. Standing constraints — not yours to relax

- **No paid services.** *"The leaks, you can use something free. I'm not paying for anything like that."*
- **Low RAM and disk.** Do not run builds in parallel. `pnpm run verify` once, at the end of a tranche. Never run `pnpm run mutation:components` alongside `verify`, and never edit the tree while the mutation campaign runs.
- **Private-first.** Do not push, publish, or make anything public. Do not touch protected branches. Do not force-push.
- **Every string a screen reader announces is a REQUIRED prop.** No defaults — a default would be English, and English is the defect this library exists to prevent. Do not add a `dir` prop; direction derives from locale.
- **React Native / Expo for mobile, never Flutter.** (Not in scope here; recorded so you do not "helpfully" plan it.)
- **Ask before:** filing upstream issues (the Base UI drafts in `docs/upstream/` stay unfiled until told otherwise); adding any new runtime dependency; adding a paid service; anything public or irreversible.
- **Do not claim NVDA, JAWS, Narrator, Firefox, Safari, WebKit or TalkBack results unless you actually ran them.** No such run exists today; say so, do not invent one.
- `mutation-report.json` and `graphify-out/` are gitignored; never commit them. `registry.json` and `api-reference.json` are generated **and committed** — regenerate them (`node scripts/build-registry.mjs`, `node scripts/build-api-reference.mjs`) after API changes; `verify` fails if they are stale.
- Commit with `Co-Authored-By: Claude <noreply@anthropic.com>`-style trailers as the repo does; small commits, one concern each, message says what was verified.

## 3. Phase A — evaluate (read-only, ~1 hour of effort)

**Use `docs/rubric.md`** — fill in every criterion of its §2 sheet with the fixed weights and level anchors, one line of **concrete evidence** per criterion (`file:line`, or a command and its output). Do not invent dimensions or anchors; do not blend the public-OSS column into the primary score. Adoption and bus factor carry no weight (recorded only). Report the weighted overall *and* the per-criterion delta against the last dated sheet in `docs/history/`. The dimensions below are the reading guide for gathering evidence; the scoring is the rubric's.

1. **Core promise** — RTL + Persian-first + first-byte truth + no English defaults. Pick 3 components at random (`ls packages/ui/src/*.tsx | grep -v test | shuf -n 3`), check that announced strings are required props, digits go through `formatNumber`, no `dir` prop, LTR islands use `data-lumo-latn`. Read `packages/gate/src/rules.ts` and say what each rule actually catches and what it structurally cannot (popups do not SSR; `data-lumo-latn` exempts 75% of text nodes on fa routes — is that too much?).
2. **Architecture & complexity** — six packages + website + scripts. Where is duplication? Which abstractions do not earn their keep? Rate complexity separately: high/medium/low, justified/partly/not.
3. **Verification honesty** — could a test pass on an empty tree? Read `scripts/mutate-components.mjs` (one operator per module; behavioural operators for 11 modules, class-strip for the rest) and `packages/ui/src/component-mutation-floor.test.ts`. Read the floors (`api-docs.floor.json`, `apps/website/gate.floors.json`) and say whether they ratchet honestly.
4. **Documentation & onboarding** — spot-check 5 claims in `docs/` against code. Is `apps/website/src/examples/<slug>.tsx` really the only registration (it should be; `catalog.ts` derives from it)?
5. **Breadth & maturity** — 111 components / 30 blocks vs the anchors; what is missing for a Telarsa product team; release readiness (versioning is `0.0.0`, no changelog).
6. **Risks** — engine coupling (`base-ui-strings.test.tsx` is the tripwire for `mergeProps` precedence), the unfiled upstream drafts, bus factor, anything you found that is wrong.

Be adversarial. Try to: render a component under `fa-IR` and find an English string in the output; find a required-looking prop that has a default; find a component whose accessible name can be empty without a compile error **and** without a gate violation (composite roles `menu/listbox/tree/treegrid/grid` were added to the gate's `named-controls` on 15 Aug — is anything still outside it? `tablist`? `dialog`? `region`?); find a test whose assertion would still hold if the component rendered `null`. Report what you tried and what happened, including your own probes that failed.

Deliver Phase A as `docs/history/evaluation-<YYYY-MM-DD>.md`: the filled rubric sheet, (a) 3 strongest facts, (b) 5 most important weaknesses with evidence, (c) real bugs with `file:line` and how you know, then **`OVERALL: X.X/10`** and **`COMPLEXITY: <high|medium|low>, <justified|partly justified|not justified>`**. Only now read `docs/history/evaluations.md` and add one paragraph: what you found that earlier reviewers missed, and what they found that you did not.

## 4. Phase B — improve (only what Phase A proved)

Work the (c) list first, then the (b) list, highest impact first. For each item: write the failing test or gate fixture **first** (the repo's rule: every gate rule has a poison fixture, every behaviour has a test that would fail on the bare engine), then the fix, then the focused tests, then a small commit. Rules of the road:

- If a Base UI engine string leaks English, follow `CONTRIBUTING.md` → "When the engine leaks English": prove it in the popup tier, thread a required prop if one reaches it, otherwise relabel live the way `relabelEngineDismiss` in `@lumo-ui/base-ui-ssr` does, and record it in `docs/upstream/`. Do not add a client dictionary.
- New behaviour in a component → add a behavioural mutation operator for that module in `scripts/mutate-components.mjs` and its anchor in `component-mutation-floor.test.ts`; prove the kill with `node scripts/mutate-components.mjs --only <file>.tsx`.
- Public API change → regenerate `registry.json` and `api-reference.json`; every new prop needs a docblock (the ratchet is 0 undocumented).
- New examples copy → both locales; if a `fa/` route gains ≥30 native digits the gate demands a floor in `apps/website/gate.floors.json` (about 55% of the measured count).
- Do not widen scope: no new components, no redesign, no dependency changes. If you believe a structural change is needed, write it as a proposal in `docs/decisions/log.md` under a new numbered heading with the evidence, and stop there.

Known open items you may take if Phase A confirms them (do not assume they are still open):
- Mutation floor: 100 of 111 modules still carry only the class-strip operator; add behavioural operators where a module owns real behaviour (dates family, data-grid editing, tree, kanban, sortable, form-state, virtual-list).
- No browser or assistive-technology evidence exists at all. If you can produce **free, honest** evidence (e.g. Playwright + Chromium accessibility snapshots on the built `apps/website/out`), do it as a separate CI job, and label exactly what it proves. Do not call it a screen-reader run.
- `docs/upstream/base-ui-dismiss-label.md` and `base-ui-ssr-naming.md` are drafts; check they still describe 1.7.0 accurately, but do not file them.
- The mutation campaign and `verify` share the machine; do not run them together.

## 5. Finish

Run `pnpm run verify` once at the end (~15 min; if the tree changed during a mutation run, run neither until the other finishes). Then `graphify update .`. Then append a one-line entry to `docs/history/evaluations.md` with your Phase A score and the commit range you produced, and give the owner: the score, the three most important things you fixed with proof, the things you found but did not fix and why, and any question that needs the owner's decision (upstream filing, dependency, publishing). Do not push.
