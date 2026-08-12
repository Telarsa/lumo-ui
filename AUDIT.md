# Lumo UI — full library audit

**Commit audited:** `e7988b8` · **Date:** 12 August 2026 · **Scope:** 94 `registry:ui` components, 30 blocks, 8 packages, 524 built documents

`pnpm run verify` exits 0 at this commit: 1780 tests, 524 documents graded, 0 gate violations. **Everything in this document is a defect that state does not catch.** That is the point of the exercise.

Two of the findings below go further and undermine the state itself: the anti-vacuity gate rule is **not armed** in either `verify` or CI (§2.7), and the test suite is **not deterministic** — it fails on a clean tree at this commit (§2.8). "Verify exits 0" is a sample, not a property.

---

## 1. Scorecard

| Dimension | Score | The number in one line |
| --- | --- | --- |
| Accessibility / i18n / RTL | **8 / 10** | The logical-axis rule is genuinely closed; three defects still ship on Persian routes. |
| API design & DX | **6 / 10** | Vocabulary is consistent and `className` merging is flawless; inert props are systemic and there is no `ref` story. |
| Design system & docs | **6 / 10** | Token discipline is exceptional; two AA contrast failures and a dark-mode collision ship, and the Persian typography claim is inert. |
| Testing & tooling | **7 / 10** | The gate's self-test is exemplary and proved by mutation; but a rule is armed in a script nobody calls, and green is not reproducible. |
| **Overall** | **≈ 6.75 / 10** | An unusually rigorous internal tool, one polish pass from a professional library. |

### How to read these numbers

They are not marks out of ten against an imaginary ideal. They are marks against *shipped component libraries*. A 6 here is not poor — several 6s sit above shadcn's equivalent. The score is dragged down by defects that are **invisible to the existing safety net**, which is exactly the class this library was built to eliminate.

---

## 2. Shipping defects — verified, user-visible today

Each of these was reproduced against the built export at `apps/website/out`, not inferred from source.

### 2.1 A `Select` serves the raw English key to Persian readers · CRITICAL

`packages/ui/src/select.tsx:48-60`

```
fa/components/select/index.html   →  <span …>thr</span>
view-block/fa/data-toolbar/…      →  newest
view-block/fa/table-view/…        →  newest
```

The RSC payload immediately below carries `sortOptions:[{id:"newest",label:"تازه‌ترین"}]`. A `Select` with a selected key and no `items` prop renders the key itself. It **self-heals on hydration**, so no jsdom test and no axe run sees it, and it is green on all eight gate rules because nothing grades Latin *words* in visible text — only digits.

The component's own docblock says the behaviour was *"left HONEST rather than patched"*. That is a comment where a type belongs.

**Fix:** derive `items` from `SelectItem` children, or make `items` required when `selectedKey` is set.

### 2.2 Every Combobox emits duplicate `id`s · CRITICAL

`packages/ui/src/combobox.tsx`

The `<input role="combobox">` and the trigger `<button role="combobox">` share one `id` within a single instance — 6 duplicated ids on the fa combobox page, 44 across 8 documents. The two elements disagree about their own semantics (`aria-haspopup="listbox"` vs `dialog`). `<label for=…>` resolves by document order, which is to say by luck.

`resolvedIdrefs` cannot see this: it asserts that an idref *resolves*, and a duplicate satisfies that.

**Fix:** give the trigger its own id. Add the duplicate-id gate rule (§5.1).

### 2.3 `data-grid` documents a required prop and types it optional · MAJOR

`packages/ui/src/data-grid.tsx:393` / `:399` / `:453`

```ts
/** Names the rows-per-page control, e.g. «تعداد در هر صفحه». REQUIRED. */
pageSizeLabel?: string | undefined;
…
{pageSizes !== undefined && pageSizes.length > 0 && pageSizeLabel !== undefined ? (
```

Omitting it does not fail — it **silently deletes the rows-per-page control**.

**Fix:** one keystroke, or a discriminated union as `alert.tsx` and `link.tsx` already use.

### 2.4 A conditional hook call · CRITICAL (crash)

`packages/ui/src/toggle-group.tsx:270-272`

```ts
const tabStop = useCompositeTabStop(
  id !== undefined && useContext(ToggleTabStopContext) === String(id),
);
```

`useContext` sits in the right operand of `&&`, so it is not called when `id` is undefined. A `<ToggleButton>` that gains or loses `id` between renders throws *"Rendered fewer hooks than expected."*

`radio-group.tsx:365-367` documents this precise hazard — *"putting `useContext` behind the guard would make it a conditional hook call"* — and avoids it. `segmented-control.tsx` and `rating.tsx` also get it right. Introduced in `74c5a88` (the bulk Base UI migration); it predates the current session's work.

**Fix:** hoist the `useContext` call. See §2.5 for why nothing caught it.

### 2.5 The ESLint policy is real, well-argued, and never runs · MAJOR

`packages/config/eslint/lumo.mjs` exists and is good. Nothing executes it:

- no `eslint.config.*` at the repository root
- no `lint` script in any `package.json`
- `eslint` is not a dependency of any package
- `verify` is: types → no-css-modules → test → registry → smoke → html. **No lint step.**

CONTRIBUTING.md tells contributors *"the rules that will fail your build — a physical utility is caught by lint."* That is not true today. It also means `react-hooks/rules-of-hooks` is unconfigured, which is why §2.4 survived.

### 2.6 `Calendar` bounds are documented as days and implemented as months · CRITICAL

`packages/ui/src/calendar.tsx:200-211` → `:428`, and the same at `range-calendar.tsx:180`, `date-picker.tsx:142`, `date-range-picker.tsx:267`, `date-selector.tsx:533`.

`minValue` is documented *"Earliest selectable day"* and reaches the engine only as `startMonth`. Read from the installed `react-day-picker@10.0.1/dist/esm/helpers/getNavMonth.js`:

```js
if (startMonth) { startMonth = startOfMonth(startMonth); }
```

So `minValue = 15 Mordad` becomes 1 Mordad. Days before the bound in the same month render, are enabled, are clickable, and fire `onChange`. **A Persian date picker accepts dates you told it not to.**

**Fix:** compose `disabled` with `{ before: … }` / `{ after: … }`, or rename the props to `startMonth` / `endMonth`.

### 2.7 The anti-vacuity gate rule is not armed · CRITICAL

`package.json:20`, `.github/workflows/ci.yml:111`, `packages/gate/src/cli.ts:36-48`

```
"gate:html": "… packages/gate/src/cli.ts apps/website/out"
```

No floors argument. `cli.ts` only constructs `persian-digit-floor` when `process.argv[3]` exists, and `rules.ts:967` deliberately excludes it from `RULES`. The floors file **is** passed — by `apps/website/package.json`'s own `gate` script, which nothing invokes. CI runs `gate:html`, so it has the same hole.

Measured by taking the real built landing page and replacing every Persian digit with an en-dash — simulating exactly the defect the rule exists for:

| command | result |
| --- | --- |
| `cli.ts <dir>` — what `verify` and CI run | `lumo-gate — clean`, **0 violations, exit 0** |
| `cli.ts <dir> gate.floors.json` | `fa/index.html: expected at least 8 Persian digits, found 0` |

This is verbatim the incident memorialised in `cli.ts:19-32` — *"a factory, a poison fixture, a passing self-test, a README paragraph … and was never in the RULES array this CLI runs."* **It has recurred one layer out:** the arming moved from the array into an argument, and the argument is missing from the only two callers that gate anything. The stale-floors check is dead for the same reason.

**Fix:** append `apps/website/gate.floors.json` to `gate:html`, then add a self-test asserting the *root script string* contains a floors argument — otherwise it regresses by the same route a third time.

### 2.8 The suite is not deterministic · MAJOR

`packages/ui/vitest.config.ts` sets no `testTimeout`, so vitest's 5000 ms default applies. Independently reproduced: **the suite fails on a clean tree at `e7988b8`**, twice consecutively, with `Test timed out in 5000ms` at 5565 ms.

The failing *set* varies between runs; the population simply sits under the wall. Slowest observed: `context-menu` 4745 ms, `date-selector` 4260 ms, `chart` 3623 ms, `event-calendar` 3589 ms, `alert-dialog` 3486 ms. Under load these reached 8207 ms and 23501 ms.

Nothing is flaky in *logic*; it is flaky in *budget*. The consequence is cultural: a suite that goes red for reasons unrelated to the change teaches a team to re-run rather than read — which is precisely how §2.7 would be rationalised away if it ever did fire.

**Fix:** raise `testTimeout` to ~15000 **and** record why a Base UI overlay mount costs 3–5 s in jsdom (run stats show per-file jsdom construction dominating: `environment 184 s`, `import 162 s`). Raising the timeout alone hides a real cost.

### 2.9 `packages/blocks` — 6,054 lines, never rendered · MAJOR

`packages/blocks/src/blocks.test.ts` is 62 lines guarding 31 blocks, and **no block is ever rendered**. The three checks are filesystem lints: barrel membership, presence of a `Strings` interface, and a two-regex English scan.

Eight probes appended to `footer.tsx`, one at a time:

| probe | caught |
| --- | --- |
| `<div>Sign in</div>` | yes |
| `aria-label="Close the dialog"` | yes |
| `title="Delete account"` | yes |
| `const DEFAULT_TITLE = "Sign in to continue";` | **no** |
| `placeholder={"Search everything"}` | **no** |
| `const COPY = { title: "Get started today" };` | **no** |
| `<div>OK</div>` | **no** |
| `<div>sign in now</div>` | **no** |

The object-literal miss is the one that matters: CONTRIBUTING states *"There is no partial locale and no fallback. A fallback is what puts an English word in a Persian sentence."* An English `DEFAULT_STRINGS = { … }` — the single most natural way to introduce exactly that — passes silently.

---

## 3. Systemic patterns

Three independent audits converged on the same three root causes. These matter more than any individual finding, because each one *generates* findings.

### 3.1 The docblock is doing the type system's job

This is the founding sin the repository was built to eliminate — DECISIONS §0.3, *"a comment explaining a bug two lines above the bug"* — and it is now the dominant residue.

- §2.1's comment says the defect was left "honest" rather than fixed.
- §2.3 says "REQUIRED" in prose where one character would say it in the type.
- The inert-prop banners are hand-maintained and the code moved: `tree.tsx` lists four of six lost props; `popover.tsx` lists five of eleven.

The banners are not dishonest. They are *unmaintainable by construction*, which is an argument for a mechanical check, not against the practice.

### 3.2 Accepted-and-unreachable props are a class, not three incidents

The repository has written excellent postmortems on `isPending`, `preventFocusOnPress` and `isKeyboardDismissDisabled`. A ~30-line static sweep — a prop declared in an exported `*Props` interface and referenced nowhere in its file — returns **35 candidates in seconds**.

The worst are not merely dropped; they leak invalid attributes into served HTML. `form.tsx`'s `elementType` is documented as a feature, does not exist, is not destructured in `Label` or `Description`, and rides `...props` onto a real DOM element. Verified against React 19: *"React does not recognize the `elementType` prop on a DOM element"*, emitting `<label elementType="div">`.

Others found: `isWheelDisabled`, `commitBehavior`, `arrowRef`, `getTargetRect`, `shouldCloseOnPress`, `labelElementType`, `role` on `DisclosurePanel` (which overrides the `role="region"` the component exists for), `autoFocus`, `keyboardNavigationBehavior`, `focusMode`, `allowsArrowNavigation`, `ratingCount`, and `ChartContainer`'s `id` — the last being Lumo-authored, with no engine to blame.

**The single highest-leverage fix in this document is the gate that makes this class stop recurring.**

**Built, 12 Aug 2026** (§5 item 1.1). First run: **45 violations in 16 files**, all closed. What the sweep in this section could not see, and the gate did:

- `disclosure.tsx`'s `role` was not merely inert — it was **delivered**, and it overwrote the `role="region"` the component exists for. Measured before the fix: `<div … aria-labelledby="…" role="group" label="برچسب" labelElementType="h4">`. An accepted-and-DELIVERED prop can be worse than an accepted-and-dropped one.
- `number-field.tsx`'s pair leaked too: `<div data-lumo="" commitBehavior="snap" …>` in served bytes, with React 19 warning on both names. Base UI 1.7.0 has both capabilities under `allowWheelScrub` / `snapOnStep`, so the fix was a translation, not a removal.
- `tooltip.tsx`'s `shouldCloseOnPress` is `Tooltip.Trigger`'s `closeOnClick`, and `delay`/`closeDelay` are on the same part. The file's header said all three were unreachable and cited `Tooltip.Root` and `Tooltip.Provider` — true when it was written, false against the installed 1.7.0. **A measurement is true on the day it is taken**, which is the argument for the gate rather than for a better comment.
- `product-detail.tsx`'s `ratingCount` (listed above) is destructured and used at `:155`/`:212`. It is not a defect and was not one at `e7988b8` either.
- `chart.tsx`'s `id` is read at `:417` to build `chartId`. The claim that `<ChartContainer id="sales">` emits no `id` **attribute** is separate and still stands; it is out of this gate's class, which grades delivery, not destination.

### 3.3 A rule that is described rather than running

Three of this repository's own named failure modes are live simultaneously, and they are the same shape: **the difference between a gate that runs and a gate that is documented.**

- The digit floor is armed in a script nobody calls (§2.7).
- The ESLint policy is a package export nothing consumes (§2.5). Measured: injecting `className="ml-2 text-left"` plus `String(5)` into `rating.tsx` produced **zero** failures across 1512 tests. The only physical-utility enforcement that exists is a `PHYSICAL` regex copy-pasted identically into five test files — covering five of the *lowest-risk* components in the library. `table`, `kanban`, `chart`, `calendar`, `gantt`, `tree`, `data-grid` have no such check.
- `gate:registry` uses `git diff --exit-code registry.json`, which compares the worktree to the **index** — so staged drift passes.

### 3.4 "Two names, one value"

Three separate instances found in one session:

| Collision | Where | Effect |
| --- | --- | --- |
| `surface-hover` ≡ `surface-sunken` (light) | `tokens.css` | An ON toggle looked identical to a hovered OFF one |
| `border` ≡ `surface-hover` (dark) | `tokens.css:313`/`:319`, both `neutral-800` | Every bordered control loses its outline on hover — 1,888 elements |
| `bg-subtle` ≡ `surface-hover` ≡ `surface-sunken` (light) | `tokens.css:232-236` | Three names, one colour |

Contrast between the dark pair: **1.00:1**. This is not a design opinion; it is a missing test.

---

## 4. Per-dimension detail

### 4.1 Accessibility / i18n / RTL — 8/10

**What earns the 8.** A sweep of all 94 components for `ml-/mr-/pl-/pr-`, `left-/right-`, `text-left/right`, `border-l/r`, `rounded-l/r` and direction-sensitive transforms returned **zero code violations** — every hit was a comment explaining why the physical form was not used. Arrow-key direction is correct in all 12 components that need it, and each derives from a `locale` prop rather than `document.dir`, so it is right at first paint. The mirrored-glyph technique (`‹` U+2039 / `›` U+203A, `Bidi_Mirrored`) designs the defect out rather than checking for it.

**Remaining findings beyond §2:**

| Sev | Location | Defect |
| --- | --- | --- |
| Major | `kanban.tsx:409` | `announce()` fires from `pointermove` — a drag across a 10-card column queues ~10 sentences into a polite region. `sortable.tsx:410` is the correct sibling and announces on drop only. |
| Major | `data-grid.tsx:343`, `chart-panel.tsx:149` | `role="status"` is conditionally rendered — the region does not exist until it has something to say. Base UI's own `ComboboxEmpty.mjs` documents the opposite: *"must remain mounted… prefer conditionally rendering its children."* |
| Major | `carousel.tsx:249-263` | Every slide is `role="group"` + `aria-roledescription` with **no accessible name** — 18 of 23 compute empty. No `aria-posinset`/`setsize`, no `aria-current`, no `aria-hidden` on off-screen slides. `namedControls` never sees it: `role=group` is not in `INTERACTIVE`. |
| Minor | `kanban.tsx:638`, `sortable.tsx:468` | `` `${strings.handleLabel} — ${item.label}` `` — the separator between two localised fragments is hardcoded, as is the order. 46 instances in the Persian export. Same class as the Arabic-comma incident. |
| Minor | `calendar.tsx:457` | `role="alert"` (assertive) emitted in the first server byte when `errorMessage` is set. `alert.tsx` itself defaults to `live="off"` for exactly this reason. |
| Minor | `tree.tsx:982` | `aria-label={props["aria-label"] ?? props.textValue}` — both optional, so a row can serve no name. Currently masked by call sites. |
| Nit | `file-upload.tsx` | `aria-label="Remove گزارش سالانه.pdf"` with no bidi isolation (no FSI/PDI, no `dir="auto"`). |

**The gate's headline number overstates its scope.** Measured across the 260 Persian documents:

```
data-lumo-latn exempts:  145,448 of 172,999 text nodes  (84.1% ungraded)
                       1,844,825 of 2,318,717 chars     (79.6% ungraded)
Latin digits inside exempt subtrees:                     7,657
persian-digit-floor armed for:                           12 of 260 routes
```

The exemptions are legitimate — the dominant one is shiki code listings, which are genuinely Latin. But a docs site made mostly of source code means `no-latin-digits` grades about a fifth of served characters, and its anti-vacuity partner covers 4.6% of Persian routes. Neither number is wrong; both are invisible.

### 4.2 API design & DX — 6/10

| Sub-dimension | Score | Basis |
| --- | --- | --- |
| Vocabulary consistency | 8 | `isDisabled`/`isReadOnly`/`isRequired`/`isInvalid` universal; `onChange(value)` with one exception; `size` is `sm\|md\|lg` in 61 of 61 cva groups |
| Escape hatches | 7 | `className` merged last in **244 of 244** components, zero offenders — but no `ref` story, no `render`/`asChild` seam |
| Closed prop surface | 5 | 108 of 244 (44%) declare no rest param. Mostly deliberate; but no `id`, `ref` or `data-testid` on `Tree`, `ListBox`, `Pagination`, `ScrollArea`, `VirtualList`, `Avatar`, `Gantt`, `Kanban`, `Sortable`, `FileUpload` and every date component |
| Inert props | 4 | See §3.2 |
| Type safety | 6 | Discriminated unions used well and repeatedly; `as object` / `as never` sit at exactly the seams that would have caught the inert props |

**There is no `ref` story.** Whether `<Card ref={r}>` compiles is decided by whether that file's author reached for `HTMLAttributes<T>` (21 files, no ref) or `ComponentProps<E>` (10 files, ref). No collection, overlay or date component forwards a ref at all — a consumer cannot focus a drawer panel, measure a popover, or scroll a `VirtualList` to an index.

**Other structural findings:**

- `& never` type carriers at 7 sites break prop spreading under `exactOptionalPropertyTypes` — the exact regression `props.ts:882-889` was written to avoid and correctly avoids with `?: undefined`. Reproduced with the repo's own tsc.
- `SelectPopover` and `Menu` declare a function-child form and render `{children as LumoNode}`; the engine cannot render it. The identical signature works in `ComboBox`/`Autocomplete`/`Command` because Base UI's `ComboboxList` genuinely accepts it — so the docs teach a shape that silently renders nothing in two of five.
- `Disclosure`'s `isExpanded`/`defaultExpanded`/`onExpandedChange` are **completely inert inside a `DisclosureGroup`**, and undocumented.
- `Tree` casts `props as TreeEngineProps` against a hand-written subset nothing keeps in sync, dropping `id`, `style` and all labelling. `aria-label` is `Omit`ted in favour of the required `label`, so a treegrid named by a visible heading is unexpressible.
- `TableProps = Omit<ComponentProps<"table">, …>` includes `ref` and `onKeyDown`, spread **after** the internal ones. A consumer passing either silently disables every arrow key on the grid.
- The open-state trio (`isOpen`/`defaultOpen`/`onOpenChange`) is declared and dropped on six overlay *surfaces*; only the three triggers honour them. `<DialogModal isOpen={open} onOpenChange={setOpen}>` reads perfectly, compiles, and does nothing.
- `UNSTABLE_portalContainer` is dropped on all four overlays, and all four render `<Base*.Portal>` with no props — the one dropped prop with no workaround.

### 4.3 Design system & docs — 6/10

**Blockers:**

| # | Location | Defect | Measurement |
| --- | --- | --- | --- |
| B1 | `tokens.css:240`, `:288`, `:317` | `fg-subtle` fails WCAG AA on every ground in both themes | 4.15:1 light on `bg`; 3.49:1 dark on `surface-hover`. **5,178 occurrences**, 51 component sites. Not in the contrast test's sample. |
| B2 | `tokens.css:239` | `fg-muted` passes only on the page ground | 4.34:1 on `bg-subtle`/`surface-hover`/`surface-sunken`; 4.49:1 dark on `surface-hover` |
| B3 | `tokens.css:313`/`:319` | dark `border` ≡ `surface-hover` | 1.00:1. **1,888 elements** combine `border-border` with `hover:bg-surface-hover`, including the landing page's own secondary CTA |
| B4 | `tokens.css:350` | Persian leading is inert | `line-height:1.75` is inherited; Tailwind's `.text-sm` sets line-height **on the element** and always wins (1.4286). **Corrected on fix:** the counts above are inflated by Next's RSC flight payload, where class names are inert JSON. Real figure — 9,642 elements carry a `text-<size>` utility, 788 also carry an explicit `leading-*`, so **8,854 were shipping Latin leading** |
| B5 | `globals.css` guard | `tracking-tight` (−0.025em) on Persian | **Corrected on fix: 270 real elements, not 540** — half the grep hits were RSC flight payload. And the 135 `<h1>` were *already* covered by a separate `:is(h1…h6):lang(fa)` rule. The true defect was 135 `<a>` plus 68 other elements = **203 newly neutralised**. Coverage is still strictly larger than before |

**`cn()` does not deduplicate Lumo's own namespace.** `twMerge` is unconfigured, so `h-control-md` + `h-control-lg` both survive:

```
h-4          + h-8          →  h-8            ✓
h-control-md + h-control-lg →  h-control-md h-control-lg   ✗
```

Emission order is `lg`(17556) → `md`(17604) → `sm`(17652), so **sm beats md beats lg** — the reverse of size order. Measured across the export: **1,766 elements carry two conflicting `h-control-*` classes; 2 actually render against the author's intent** (a large icon button on the Button page rendering at 36px instead of 44px, defeating the touch-target floor). The other 1,764 are correct *by accident*. The real finding is 1,766 elements whose correctness depends on stylesheet byte order.

**System-level variance** — the signature a designer reads as "grown, not designed":

- **5 press vocabularies** (`active:bg-surface-sunken` ×13, `active:brightness-95` ×4, `active:translate-y-px` ×4, `active:bg-accent/10` ×5, `active:opacity-90/80` ×2), and press feedback exists on only ~15 of ~45 interactive components
- **4 focus mechanisms** despite `theme.css` defining one — including three re-typed copies of `FOCUS_RING_SELF` and hardcoded `outline-accent` that reads `--color-accent` instead of `--lumo-sys-focus`
- **5 overlay elevations** with **zero shadow tokens** — 100% of elevation is Tailwind's default ramp, unreachable by a brand
- **3 disabled opacities** (`opacity-50`, `-60`, `-40`)
- **3 private type tiers** below the scale (`text-[0.625rem]`, `text-[0.6875rem]`, `text-[0.8125rem]`)
- **No scrim token** — `bg-black/50` in `dialog.tsx:165` and `drawer.tsx:134` are the only two untokenised colours in the library
- `border-strong` is **weaker** than `border-control` (1.54:1 vs 3.22:1) — the name promises a ladder the values invert

**Docs site:** Installation is second-to-*last* on a component page; both shadcn and ReUI put it directly under the preview. There is **no mobile navigation for the 94-component list** — below 1024px the sidebar is `hidden` with no replacement, while the docs *prose* pages ship a `lg:hidden` strip that could be copied. Component pages are enormous: `fa/components/event-calendar` is **2.19 MB**, `table` 2.05 MB, total **167 MB of HTML** across 524 documents.

**What is genuinely excellent:** an exhaustive sweep for hex/`rgb()`/`hsl()`/`oklch()` and all 22 Tailwind palette names across 94 components returned **zero** component usages — every palette-name hit is a comment explaining why it is not used. Font handling is textbook: self-hosted variable WOFF2, OFL licences committed, per-`html[lang]` stacks, `font-synthesis: none` because synthesised bold destroys Arabic letterforms. And the component page template beats both competitors — neither shadcn nor ReUI ships a per-component **accessibility evidence** section or a **Persian/English side-by-side**. That is the differentiating slot, and Lumo already stands in it.

---

## 5. The road to 10/10

Ordered by what costs most to fix later, not by severity. Everything in Phase 1 gets more expensive with every component added.

### Phase 1 — Stop the bleeding (est. 1–2 days)

Nothing new gets built until these are done. Each one either ships to users today or makes the next hundred defects cheaper to catch.

| # | Goal | Exit criterion |
| --- | --- | --- |
| 1.1 | **The inert-prop gate.** ~30 lines: fail on a prop declared in an exported `*Props` interface and referenced nowhere in its file. | **DONE** — `packages/gate/src/inert-props.ts`, wired as `gate:props` between `gate:types` and `gate:test` and into CI, with a self-test that asserts the wiring. Returns 0. Three notes on the specification. (a) *"exported"* was too narrow: it finds 16 of 45, because `NumberFieldPropsBase`, `PopoverPropsBase`, `TreePropsBase`, `DisclosurePanelPropsBase` and `TooltipTriggerPropsBase` are module-private and hold most of the defects — the gate follows `extends`/`&`/`\|` from an exported root instead. (b) "referenced nowhere" is scoped per COMPONENT, not per file: `form.tsx` declares `elementType` on three interfaces, and one component's fix would otherwise silence the other two. (c) It is 400 lines, not 30, and the extra is entirely the difference between the three reasons a prop is unreferenced — `carrier` and `forwarded` pass, `dropped`/`dom-leak`/`unverified`/`orphan` fail. **First run: 45 violations across 16 files.** The four historical props are its poison fixtures, and `mute-attempt.bad.tsx` proves the one escape hatch cannot be used as a mute button. |
| 1.2 | **Run the ESLint policy that already exists.** Add `eslint.config.js`, a `lint` script, and `react-hooks`. | `pnpm lint` in `verify`; the three `inset-x-` sites fixed or deliberately exempted; CONTRIBUTING.md's claim becomes true. |
| 1.3 | **Fix the conditional hook** (§2.4). | Hoisted; `rules-of-hooks` green. |
| 1.4 | **Fix the three Persian-route defects** (§2.1, §2.2, §2.3). | `thr`/`newest` gone from the export; 0 duplicate ids; `pageSizeLabel` required. |
| 1.5 | **Fix `Calendar` bounds** (§2.6). | A day-level bound rejects days in the same month; test asserts it in Jalali. |
| 1.6 | **The two contrast failures and the dark collision** (B1, B2, B3). | Contrast test swept over the **full ground × text-token matrix**, both themes, instead of 7 sampled pairs. |
| 1.7 | **Persian leading and tracking** (B4, B5). | **DONE.** Note the fix in this row was WRONG as originally written: `--tw-leading` is registered `@property … inherits:false`, so setting it on `:root:lang(fa)` reaches no descendant — same defect, new variable. The mechanism that works is `--text-*--line-height`, an ordinary inheriting `@theme` variable that is the *fallback arm* of the utility's own `var()`, so an explicit `leading-*` still wins. Guard inverted to a `[class*="tracking-"]` whitelist and moved into the theme's `lumo.script` layer. |
| 1.8 | **Arm the digit floor in `gate:html`** (§2.7). | One line, plus a self-test on the root script string so it cannot un-arm a third time. |
| 1.9 | **Make green reproducible** (§2.8). | `testTimeout` raised; three consecutive clean-tree runs pass; the jsdom mount cost measured and recorded. |
| 1.10 | **Widen the blocks English guard and render each block once** (§2.9). | The object-literal and brace-string probes fail; 31 smoke renders assert a non-empty `fa-IR` tree with no Latin digits. |

### Phase 2 — Make the system a system (est. 3–5 days)

| # | Goal | Exit criterion |
| --- | --- | --- |
| 2.1 | **Decide the `ref` + `id` contract once, in `core`.** Either "omit what you own, spread the rest" (the `Spinner` model) or an explicit `attr()`-forwarded allow-list on every root. | Written into `button.tsx`'s header; enforced by 1.1's gate. This is the only item whose cost is *quadratic* — every component added before the decision must be revisited after it. |
| 2.2 | **One press treatment, one disabled opacity, one focus mechanism.** | A test enumerating the directory (not a list) asserts each vocabulary has exactly one spelling. |
| 2.3 | **Shadow and scrim tokens.** Collapse 5 overlay elevations onto `raised`/`overlay`/`modal`. | `--lumo-sys-shadow-*` and `--lumo-sys-scrim` exist; zero untokenised colours in the library. |
| 2.4 | **`extendTailwindMerge` for the `control-*` namespace.** | `cn("h-control-md","h-control-lg") === "h-control-lg"`, with a test. |
| 2.5 | **Respell the 7 `& never` carriers as `?: undefined`.** | Spreading a props bag compiles everywhere. |
| 2.6 | **Close the remaining inert props** surfaced by 1.1, in one commit while the gate is fresh. | Gate returns 0. |
| 2.7 | **`Omit` the open-state trio off the six overlay surfaces**; `Omit` `ref`/`onKeyDown` from `TableProps`; drop the function-child arm from `Select`/`Menu`. | Each becomes a compile error rather than a silent no-op. |

### Phase 3 — Grade what review currently catches (est. 2–4 days)

| # | Goal | Exit criterion |
| --- | --- | --- |
| 3.1 | **Duplicate-id gate rule.** ~6 lines, obvious poison fixture, fires on the export today. | Rule + fixture; export clean. |
| 3.2 | **Non-native-script-in-visible-text rule**, scoped to pure-Latin text nodes. | Would have caught §2.1 without a human. |
| 3.3 | **Grade the computed accessible name, not the `aria-label` attribute.** | Measured: 17,299 named controls on Persian pages, 474 pure-Latin names, all proper nouns — the library **passes today**, so this is cheap to adopt and locks in a property already held. |
| 3.4 | **Widen `SPOKEN` to `alt` and `placeholder`.** | One-line change; currently clean, so free. |
| 3.5 | **`aria-roledescription` with no accessible name.** | Fires on carousel today (18 hits on one page). |
| 3.6 | **The gate prints its own coverage** — exempt fraction and floor coverage beside the violation count. | *"524 documents, 0 violations"* becomes *"524 documents, 0 violations, 79.6% of Persian characters exempt, floor armed on 12 of 260 routes."* This is the single highest-leverage change in the report: it is the only one that tells you about defects nobody has thought of yet. |

### Phase 4 — Product polish (est. 3–5 days)

| # | Goal | Exit criterion |
| --- | --- | --- |
| 4.1 | Live-region correctness: announce on drop, keep `role="status"` mounted. | Kanban announces once per drag; status regions mounted at first byte. |
| 4.2 | Carousel slide names, `aria-posinset`/`setsize`, `aria-hidden` off-screen. | Every slide computes a non-empty name. |
| 4.3 | Move Installation to second on component pages; add mobile component nav. | Component list reachable below 1024px. |
| 4.4 | Cut page weight — lazy-load the code panel, or emit shiki with CSS classes rather than inline styles. | Median component page under ~300 KB. |
| 4.5 | Reconcile the `tone` vocabulary before the next toned component. | `tone` means one thing; `icon-tile`'s `solid` moves to `variant`; `alert` gains `neutral`. |

### Phase 5 — The claim the library has not yet earned

| # | Goal | Exit criterion |
| --- | --- | --- |
| 5.1 | **Run the ICU probe under Hermes.** `packages/native/src/icu-probe.ts` is written, dependency-free, and has never been run on the target runtime. One Expo dev build answers it. | PASS/FAIL recorded in `packages/native/README.md`. The axis is the *build*, not the hardware. |
| 5.2 | **Decide React Native** on that evidence. | Either a spike with a shape, or a written decline. |
| 5.3 | **Probe Lynx** with the same file. Lynx has `direction` and full logical properties, but **PrimJS has no `Intl`** and QuickJS will not add it; `@formatjs` polyfills are the proposed route and their Jalali *calendar* support is unverified. | A measured answer, not an assumption. |

### What 10/10 actually means here

- **Accessibility/i18n/RTL → 10:** every defect in §4.1 closed, the six Phase-3 rules shipped, and the gate publishing its own coverage so the headline number states its scope. The residue that remains is only what needs a real browser — and the CDP tier `rules.ts` already names is where that goes.
- **API/DX → 10:** the inert-prop gate returns zero and stays zero; the `ref`/`id` contract is written down and enforced; no exported prop is accepted and dropped; every "REQUIRED" in prose is required in the type.
- **Design/docs → 10:** the contrast matrix is swept, not sampled; one press/focus/disabled/elevation vocabulary each; Persian typography visibly different from Latin typography on a Persian page; and a component page that loads fast on a phone.

The honest summary: this library's engineering is above shadcn's bar in several places, and its remaining defects are almost all of one kind — **something true was written in a comment instead of being made unrepresentable.** Phases 1 and 2 convert that habit into machinery. Everything after is polish.

---

## 6. Method and caveats

- Four parallel read-only audits against `e7988b8`, each instructed to verify rather than assert, to cite `file:line`, and to distinguish **proved** from **suspected**.
- All headline findings in §2 were independently re-verified by the lead before inclusion: the built export was re-read, `twMerge` was run directly, the dark token pair was read from source, and `git log -L` was used to date the conditional hook.
- **Claims that collapsed on measurement are recorded, not hidden.** Three findings were withdrawn: "event-calendar paints `today` with no spoken counterpart" (false — `dayName()` folds `todayLabel` in); "Persian aria-labels leak onto English pages" (16 of 18 hits were RSC `<script>` payloads); "634 Persian digits on English pages" (all inside shiki source listings). The `h-control-*` severity was also corrected downward from "871 broken" to "2 wrong, 1,766 fragile."
- **Two process incidents.** An audit agent wrote a poison probe into `packages/core/src/types.ts` (`nu-arabext` → `nu-latn`, which would turn every Persian digit Latin) and did not revert it; it was caught on a routine `git status` and reverted. A second agent self-reported the same in `packages/blocks/src/footer.tsx` and reverted it. Read-only instructions are not self-enforcing when agents share a checkout.
- The testing audit verified the gate's self-test by mutation rather than by reading: inserting `return [];` at the head of all nine rules' `run` functions killed 2/3/4/2/2/3/10/6/3 tests respectively. **All nine rules genuinely fire**, and `rules.ts` was restored byte-identical (md5 verified). It also confirmed the Persian-digit claim is load-bearing: changing `FORMAT_LOCALE` from `nu-arabext` to `nu-latn` killed **94 tests** across two packages.
- **No vacuous test was found.** The hunt was specific — every `it` whose assertions are all weak, every `toContain` on a short literal, every `toBeGreaterThan(0)`. The weak-looking ones are `getByRole(<exact Persian string>)`, where the *query* carries the assertion and throws on miss; the `length > 0` ones are deliberate anti-vacuity guards, several carrying a comment saying so.
