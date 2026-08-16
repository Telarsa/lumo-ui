# Lumo UI — independent review brief

**You are being asked to find what is wrong with this library, including what is wrong with this document.**

This is not a hand-off to continue the work. It is a brief for an adversarial, multi-agent review: read the code, measure it, and report defects — in the components, in the tooling, in the previous audit, and in the fixes that audit produced. The people who wrote all three were wrong repeatedly, and §8 lists the times they were caught. Assume there are more.

---

## 1. What this is

**Lumo UI** — a private, Persian-first React component library owned by Telarsa. Not published to npm, no public registry. Distribution has two paths:

- **components and blocks** are copied into a consuming project (shadcn-style registry) so they can be edited;
- **`@lumo-ui/core` and `@lumo-ui/theme`** — the contracts — travel as git dependencies pinned to a tag, because editing them is a bug rather than a customisation.

The thesis: **RTL and i18n defects hide from ordinary review.** A mirrored layout looks fine to a reviewer who does not read the script; a Gregorian date in Persian digits looks like a Persian date; an English `aria-label` is invisible on screen. So the library tries to make those defects *unrepresentable* (types) or *graded* (a gate over the served bytes), rather than documented.

- Repo: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui`
- Branch: `experiment/base-ui`. Remote `https://github.com/Telarsa/lumo-ui.git`, private, protected branches. **Nothing has ever been pushed.**
- 94 `registry:ui` components · 30 blocks · 8 packages · 524 built documents · 365 worked examples
- HEAD at handoff: **`f249d70`**. `pnpm run verify` exits 0: **2,464 tests**, 417 files linted, 124 component files prop-graded, 524 documents, 0 violations across 13 gate rules, 12 routes floored.

---

## 2. Standing constraints — these are not negotiable and not yours to relax

- **No paid services.** Verbatim from the owner: *"the leaks, you can use something free. I'm not paying for anything like that."*
- **Low RAM and disk.** Do not spawn long parallel builds without need. `pnpm run verify` takes ~15 minutes; run it once, at the end.
- **React Native / Expo for mobile, never Flutter.**
- **Private-first.** Nothing published, made public, or pushed without an explicit instruction.
- **Every string a screen reader announces is a REQUIRED prop.** No defaults — a default would be English, and English is the defect this library exists to prevent.
- **Ask first:** filing upstream issues · publishing to npm or making the repo public · force-pushing or touching a protected branch · adding a paid service · any new runtime dependency (the bar is *"owning it must fix a defect"*).

---

## 3. Architecture

### 3.1 Packages

| package | owns | runtime deps |
| --- | --- | --- |
| `core` | the prop vocabulary (`props.ts`), `cn()`, `formatNumber`/`formatDate`, `LumoHtml`, `Locale`, `direction()`, `LumoStrings` | `clsx`, `tailwind-merge` |
| `theme` | `tokens.css` (ref → sys tiers), `theme.css` (the Tailwind v4 bridge + the one focus rule + `lumo.script`) | none |
| `ui` | all 94 components | Base UI, `@internationalized/date`, `react-day-picker`, TanStack charts/form/table, `cva`, `embla-carousel-react`, `lucide-react` |
| `blocks` | 30 composed blocks | `core`, `ui` |
| `base-ui-ssr` | `attr()`, `useOpenMirror`, `findChildProp` — the SSR compensations for Base UI | `core` |
| `gate` | `lumo-gate` (13 HTML rules) and `gate:props` (source rules) | `linkedom`, `dom-accessibility-api` |
| `config` | the ESLint policy | none |
| `native` | **not started** — one ICU probe and a README | none |

`apps/website` is a Next.js **static export** (`output: "export"`). There is no server; `pnpm start` serves `out/` via `scripts/serve-static.mjs`. DECISIONS §14 records why.

### 3.2 The engine decision

Every component ran on `react-aria-components` until August 2026 and now runs on **Base UI 1.7.0**. The public API was frozen: a consumer's `isDisabled` / `onChange(value)` / `onPress` call sites had to keep compiling. That is why `core/src/props.ts` exists — it restates React Aria's prop vocabulary so no component type-imports from a library it no longer runs. The reason is a distribution consequence: `registry.json` derives each item's `dependencies` from its imports, so a type-only import would tell every consumer to install React Aria for behaviour that is not there.

**React Aria is gone from all 124 registry items.** It remains a devDependency because six "poison twin" tests still render it for comparison.

### 3.3 Rules that shape every file

- **Logical CSS on the inline axis only** (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`border-s`/`rounded-ss`/`text-start`). The block axis is physical **on purpose**. Enforced by lint.
- **`children?: LumoNode`**, which is `Exclude<ReactNode, number>` — a bare number renders Latin digits, so it is a type error.
- **Never write `<html>`** — `LumoHtml` derives `dir` from the locale, so a wrong direction is unrepresentable.
- **Direction comes from a `locale` prop, never `document.dir`**, so arrow-key logic is correct at first paint.
- **The three-tier token contract** `--lumo-ref-*` → `--lumo-sys-*` → `--lumo-cmp-*`, regex-enforceable.
- **The three-state theme**: bare `:root` (light), `@media (prefers-color-scheme: dark)` guarded by `:not([data-theme="light"])`, and `[data-theme="dark"]`. All three must work.
- **Correctness is measured in the FIRST BYTE**, server-rendered. A defect that self-heals on hydration is the failure mode this project exists for.

### 3.4 The RSC boundary

Functions and class instances cannot cross it. Islands live in `apps/website/src/components/demo-islands.tsx`, whose **imports are hoisted** — only import names not already there. Two consequences that have bitten:

- A `CalendarDate` is a class instance, so ISO strings travel and the island constructs.
- `child.type === SomeComponent` is **false** across the boundary: a revived element keeps `$$typeof`, `props` and nesting, but its `type` is a client-reference object. This shipped a real defect (§8).

### 3.5 The examples system

`apps/website/src/examples/*.tsx`. Contract in `_system/types.ts`: an `EXAMPLES` named export; `render` must be a **bare identifier** naming a top-level `function Name(l: Locale)` in the same file; `id: "<id>"` appears exactly once as a literal. The loader slices source by brace matching, which is why those constraints exist.

`catalog.ts` builds a component's preview as `render: first.render` — **the preview IS the first example.**

---

## 4. Dependencies, and why each is pinned

Pins live in `pnpm-workspace.yaml`'s catalog, most with the reasoning attached. The ones that matter:

| package | pin | why |
| --- | --- | --- |
| `@base-ui/react` | 1.7.0 | The engine. NOTE the rename: `@base-ui-components/react` is dead at `1.0.0-rc.0` and must not be measured. |
| `react-day-picker` | 10.0.1 | Its `/persian` entry point. Supplies the grid and keyboard model; `@internationalized/date` supplies which calendar. |
| `@internationalized/date` | 3.12.3 | Thirteen calendars, including Persian. |
| `@tanstack/charts` | 0.9.0 | Replaced recharts. Imported as `@tanstack/charts/react` — `@tanstack/react-charts` is the dead package. |
| `@tanstack/react-table` | 9.1.2 | Atoms-based; `table.state` is the reactive read, **not** `getState()`. |
| `tailwindcss` | 4.3.3 | v4, no config file; the token bridge is `@theme inline` in CSS. |

**No new runtime dependency without the owner's approval.**

---

## 5. The safety net

`pnpm run verify` = `gate:types` → `gate:props` → `gate:lint` → `gate:no-css-modules` → `gate:test` → `gate:registry` → `gate:smoke` → `gate:html`.

### 5.1 `lumo-gate` — 13 rules over the served bytes

`lang-dir` · `no-latin-digits` · `no-latin-aria` · `named-controls` · `resolved-idrefs` · `composite-tab-stop` (floor) · `composite-single-tab-stop` (ceiling) · `native-calendar` · `unique-ids` · `native-script-text` · `native-script-name` · `named-roledescription` — plus `persian-digit-floor`, which is **not** in `RULES` because it needs per-route floors and is constructed from a CLI argument.

Every rule has a poison fixture and the suite asserts each fixture trips its own rule. Escape hatches: `data-lumo-latn` (a genuinely-Latin subtree) and `data-lumo-gregory`. **`lang="en"` is deliberately NOT a hatch** — see §8.

The gate prints its own coverage. Currently ~77% of Persian text nodes are exempt (mostly shiki code listings), and the floor is armed on 12 of 264 routes. **That line exists so the headline number cannot imply coverage it does not have. Check whether it is honest.**

### 5.2 `gate:props` — source rules

`inert-prop` (a prop declared and never delivered) and `root-contract` (the `ref`/`id` contract). Syntactic TypeScript API, no checker — 124 files in 0.4s.

**It has a known false negative, documented in its own header:** it matches by NAME, so a prop whose name collides with a local or a parameter's uses anywhere in the file is invisible to it. This was found by an agent, not by the gate.

### 5.3 What is genuinely strong, and worth not breaking

- The contrast test computes OKLCH → sRGB → WCAG **from the committed CSS**, over a swept matrix of 62 mark/ground pairs × 3 theme states.
- The gate's self-test was verified by mutation: disabling each rule kills a named set of tests.
- `className` is merged last in **244 of 244** components — the consumer wins by conflict group, not stylesheet order.
- Zero raw colour values in components. Every palette-name hit is a comment explaining why it is not used.
- 31 blocks are rendered and graded by the shipped gate rules, not a local regex copy.

---

## 6. Ratings

From the audit at `AUDIT.md`, and the artifact linked there. **Marks are against shipped component libraries, not an imaginary ideal** — several 6s sat above shadcn's equivalent.

| dimension | before | after phase 1–4 |
| --- | --- | --- |
| Accessibility · i18n · RTL | 8 | 9 |
| Testing & tooling | 7 | 9 |
| API design & DX | 6 | 8 |
| Design system & docs | 6 | 7 |
| **Overall** | **6.75** | **≈8.25** |

**Treat these as claims to be tested, not findings.** They were produced by the same process that produced the four wrong claims in §8. A blind re-rate is more useful than agreement.

---

## 7. What was done — 39 commits on this branch

Grouped, with the reasoning that is not obvious from a diff.

**The migration.** All 94 components moved from React Aria to Base UI, in stages, each with the divergences measured and recorded in `experiments/measurements/`. React Aria left `registry.json` entirely.

**Defects that were shipping to Persian readers.** A `Select` served the raw English key (`thr`, `newest`) as its visible value on three routes. Every Combobox emitted duplicate ids. `Calendar`'s `minValue` was documented as a day bound and implemented as a month bound, so a Persian date picker accepted dates it had been told to reject. `IconTile`'s `warning` tone resolved to **no colour at all**. 202 links pointed at `/fa-IR/…`, a route that is never generated.

**Gates that existed and graded nothing — four separate incidents.** See §8.

**The system made consistent.** Five press vocabularies → one; four focus mechanisms → one (four were already inert — layer order, not specificity, had been overriding them); three disabled opacities → one; five overlay elevations → three tokens; the only two untokenised colours → a scrim token; five `tone` axes → one, with `variant`, `color` and `slot` taking the other meanings.

**Contracts decided once.** The `ref`/`id` contract ("omit what you own, spread the rest", `ComponentProps<E>` mandatory, `ref`/`id` never subtracted). The inert-prop answer (translate → relocate → make unrepresentable; **never `?: never`**, because under `exactOptionalPropertyTypes` it rejects an explicit `undefined` and breaks correct spreads).

**Charts.** They had never animated, because `renderSvg` was constructed inline in JSX so every render looked like a layout change. The tooltip was anchored to the datum rather than the pointer. Both fixed; animation is now on by default with reduced-motion respected absolutely.

---

## 8. How this project gets things wrong — read this before trusting anything

### 8.1 Four "exists, self-tests, grades nothing" incidents

1. `persian-digit-floor` had a factory, a poison fixture, a passing self-test, a README paragraph — and was **not in the `RULES` array the CLI ran**.
2. The same rule then un-armed itself a second way: the arming moved into a **CLI argument**, and the argument was missing from `gate:html`, the only command `verify` and CI invoke. Measured: the real landing page with every Persian digit replaced by an en-dash graded **clean, exit 0**.
3. The **ESLint policy** was a well-argued package export that nothing ran — no config, no script, not a dependency of any package, and both version pins unsatisfiable.
4. A **raw-digit lint selector** had never matched anything, for three independent reasons at once.

Each is now guarded by an assertion that reads the manifest which has to invoke it.

### 8.2 Four claims the audit made that were wrong

| claimed | measured |
| --- | --- |
| "set `--tw-leading`" to fix Persian leading | Would not have worked — it is a registered `@property` with `inherits:false`, so it reaches no descendant. |
| `tracking-tight` on 540 elements | 270; half the grep hits were RSC flight payload, and the `<h1>`s were already covered. |
| the `inset-x-` sites are false positives | The **rule** was wrong: `inset-x-0` compiles to `inset-inline`. No physical side, nothing to migrate to. |
| ~35 inert-prop candidates | 45; the audit's wording finds 16, the rest are on module-private base interfaces. |

### 8.3 Two claims *this session's own fixes* got wrong

- The page-weight diagnosis blamed shiki's inline styles. Measured: shiki is **10%** of the largest page; the **RSC flight payload is 76%**.
- A `Select` fix passed every unit test and **still shipped the defect**, because it matched children with `child.type === SelectItem` — true in a client component, false across the RSC boundary. Caught only by re-reading the built export.

### 8.4 Process failures worth knowing

- **Two agents wrote poison probes into a shared checkout and did not revert them** — one changed `nu-arabext` to `nu-latn`, which would turn every Persian digit Latin. Caught by a routine `git status`. Read-only instructions are not self-enforcing.
- **A commit was made after running one test tier and not `gate:types`**, breaking the build. Checking one tier and reporting green is this project's own subject matter.
- **"verify exits 0" was reported many times before anyone checked it was reproducible.** It was not: the suite failed on a clean tree with a different victim each run, because no `testTimeout` was set.

---

## 9. Traps that have cost real time

- **A green unit suite is not evidence about a static export.** (DECISIONS §15.) And a *partially* clean export is not evidence either.
- **A comment asserting untestability is not evidence.** One claimed a behaviour was "not reachable from jsdom". It was, and that claim is what let a defect ship.
- **`@layer` order beats specificity.** `utilities` is declared before `lumo.components`, so a `:where()` rule with zero specificity in the later layer outranks every `focus-visible:` utility. Four focus mechanisms were dead because of this and had each been reviewed as real.
- **linkedom splits a text node at every entity.** Grading per node instead of per merged run produced 40 phantom findings from `&quot;` fragments.
- **The built CSS is minified onto one line** and Lightning CSS strips quotes from attribute selectors. `grep -c` counts lines, not occurrences. This nearly produced a false bug report.
- **Tailwind mints utilities from code comments.** Classes exist in the emitted CSS solely because a comment quoted them.
- **A source-shape assertion catches its own explanation.** Three checks in this repo first failed on the comment describing the string they forbid.

---

## 10. What is missing

**Open and known:**

- `packages/native` is a README and one ICU probe. **The probe has never been run under Hermes**, and that run decides whether React Native is viable. The axis is the *build*, not the hardware — one Expo dev build answers it.
- Lynx: has `direction` and full logical properties, but **PrimJS has no `Intl`** and QuickJS will not add it. `@formatjs` polyfills are the proposed route and their Jalali *calendar* support is unverified. The same probe answers it.
- `Column` + `ColumnResizer` header cells serve 2 tab stops — needs a grid enter/exit mode this table does not implement.
- `Calendar` has no required `today`; `DayPicker` reads the clock during render for `data-today`.
- `Select` has no `validate` — `TextField`'s signature is `(value: string) => …` and a Select's value is a key, so it does not transfer.
- `Toast` has no action slot.
- 81 components still have a closed prop surface. Seven correctly have no DOM root; the rest are a per-component judgement nobody has made.
- `tabs.tsx` declares the same function-child shape that was just removed from `Select` and `Menu` as unrenderable. **Nobody has measured whether its engine renders it.**
- `props.ts`'s `routerOptions?: never` is the same spelling defect as the seven that were fixed, in a file that documents why not to do it.
- `VirtualList` cannot scroll to an index — a `ref` cannot fix it; it needs an imperative handle.
- Blocks: `ProductDetail`/`ListingGrid` have function-shaped strings that cannot cross the RSC boundary, so `block-islands.tsx` reassembles them from a parallel prop surface — reintroducing the "template with a hole forces Persian into English clause order" pattern the library argues against.

**Declined deliberately, with reasons in the code:** springs and path morphing in charts (they cost an English `aria-roledescription`), a tint token (two roles, not one), removing Tailwind's default shadow rungs, `no-console`, Prettier.

---

## 11. What I want from the review

**Work component by component.** For each: compare against **shadcn/ui**, **ReUI**, **Radix**, **Ark UI**, **Mantine** and anything else relevant — **fetch their current docs, do not work from memory**, since what they ship today is the question. Report what they do that Lumo does not, whether it matters, and what Lumo does better.

Then, across the library:

1. **Re-rate blind.** Do not anchor on §6. Produce your own numbers and reasoning, then diff against mine.
2. **Attack the audit and the fixes**, not just the components. §8 is evidence that both are fallible.
3. **Verify, do not assert.** Every claim needs `file:line` and a quote. Prove a defect *before* fixing it, and prove a fix by **reverting it and naming the assertion that fails**. Report that table. Distinguish **proved** from **suspected** and label both.
4. **Hunt vacuous tests.** A test that passes whether or not the code is correct is worse than none, because it is counted. Mutate to check.
5. **Say what you declined and why.** A well-argued decline is worth more than a change nobody needed.
6. **If you find one of my claims is wrong, say so plainly.** Four are already recorded in §8; finding a fifth is a success, not an embarrassment.

**Do not commit or push.** Report, and let the owner sequence the changes.

---

## 12. Commands

```bash
pnpm install
pnpm run verify          # types → props → lint → no-css-modules → tests → registry → smoke → html
pnpm run gate:props      # source rules only, 0.4s
pnpm run gate:lint
pnpm --filter @lumo-ui/website build
node --experimental-strip-types packages/gate/src/cli.ts apps/website/out apps/website/gate.floors.json
pnpm start               # serves the built export at :4173
```

`verify` takes ~15 minutes and the machine is RAM-constrained. Run it once, at the end. Use targeted `vitest run <file>` while working. **If you mutate a file to test vacuity, restore it exactly and confirm with `git diff --stat`.**
