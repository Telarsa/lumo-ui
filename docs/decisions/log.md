# Decisions, and the evidence for them

Why the code is the way it is, and what was measured to decide it. Each entry
carries its date; where something was not measured it says so.

**Reading this log.** It was cut down when the repository was published. Lumo
spent its first month as a component library, and the decisions that built that
library, the plans and the review sheets that went with them, were removed: they
describe code that no longer exists, and §50 is the entry that retired it. What
is left explains something you can still read in `packages/`. The section
numbers are the originals, so the gaps are real and the citations in the source
still resolve.

The entries before §50 were measured against that library, so they name
`packages/ui` and `packages/blocks`, which no longer exist. They are kept
because what they decided does: the gate rules, the lint policy, the theme's
tokens and the shape of the props still in `packages/core`.

---

## §0.1 Strings are props, not a dictionary, and the reason is SSR

**Amended 9 August 2026 after measuring.** The engine underneath at the time was
React Aria, and it has since been replaced twice; the conclusion outlived both,
so this entry stays. The plan it corrects was a complete 147-key `fa-IR`
dictionary injected via React Aria's `LocalizedStringProvider`. That does not
work for server-rendered pages, and the reason is structural rather than a
configuration mistake:

`LocalizedStringProvider` **renders no children**. It is not a context provider —
it emits a `<script>` that sets `window[Symbol.for('react-aria.i18n.strings')]`.
The dictionary is therefore a *client* payload and reaches nothing during
`renderToStaticMarkup`. Verified: a dictionary with all 147 keys stamped with a
sentinel produced **zero** sentinel hits across ComboBox, Select, Menu, Table,
Tree, GridList, NumberField and TagGroup. A consumer's provider mini-sites must
be SEO-indexed, so "correct after hydration" is not correct.

A second reason to avoid the dictionary: function-valued entries are serialised
with `toString()`, so any closure over module scope emits broken JavaScript into
the page.

**So Lumo passes strings as props**, typed in `packages/core/src/strings.ts`,
where a missing key is a compile error. Of the 8 measured leaks, **5 are
prop-reachable and are covered**. The remaining 3 are `CalendarCell`'s
`"Today, <date>"` and `DateSegment`'s `aria-valuetext="Empty"` — both compose
internally and ignore the props, verified by passing them and observing no
change. Both belong to Calendar/DateField and both are announced on interaction
rather than read from the first byte, so a client dictionary would have been the
right tool for them.

Correcting an earlier claim: NumberField's `aria-roledescription="Number field"`
**is** reachable — it sits on the `<input>`, not on `<Group>`. Passing it to
`Group` emits both values and the English one survives as a duplicate attribute.
**There is no unreachable English in any V1 component.**

The principle the dictionary version was reaching for still holds and is
implemented in the type: every declared locale must be complete, there is no
partial type and no fallback, because a fallback is what puts an English word in
a Persian sentence.

---

## §0.2 Private first, then published

**Decided 9 August 2026; the second half decided 2 September 2026.** Lumo was
built private-first: used inside one organisation, distributed as a git
dependency pinned to a tag, with no npm publish and no public registry. The
reasoning was that a published promise is the thing a very small team cannot
keep. HeadlessUI's Vue target sat a full major and 23 months behind its React
one while carrying 5.46M downloads a month; staying private meant Lumo owed no
one an upgrade path. The clause that mattered was the last one: build every
artifact so that publishing stays possible, and treat privacy as a door left
open rather than a bridge burned.

At 1.0.0 the door is used. The repository is public under MIT.

**What publishing does not change.** Distribution is still a git dependency
pinned to a tag rather than an npm release, so a consumer reads one CHANGELOG
entry per upgrade and there is no version range anywhere to drift through. The
install is pnpm's, for the reason §61 records. And the packages still carry no
promise of a component roster, because there is none to carry.

## §0.4 The default theme is achromatic, compact, and honours the system

**Decided 10 August 2026.** Lumo's own default is black, white and grey — chroma
zero — with New York's proportions: density 0.9, radius scale 0.75.

**Why no colour by default.** A library that ships a hue imposes it on fifteen
products, and every one of them then fights it. A brand supplies a hue by setting
exactly two custom properties, `--lumo-ref-hue-brand` and
`--lumo-ref-chroma-brand`. Because lightness stays owned by the ramp, re-hueing
cannot break a contrast ratio that was measured against the ground — that is the
whole point of the three-tier split.

The accent is therefore ink: near-black on light, near-white on dark. A solid
button reads as weight rather than as colour.

**Three theme states, not two.** Light, dark, and *system* — system being the
default and the state most visitors are actually in. A binary toggle cannot
express "follow the OS", and a site that silently overrides that setting ignores
a preference the reader already stated once.

The tokens were written for all three from the start: bare `:root` carries light,
`prefers-color-scheme: dark` guarded by `:not([data-theme="light"])` handles the
unstamped case, and `[data-theme="dark"]` lets an explicit choice win in both
directions. A blocking inline script applies the stored value before first paint,
because the alternative is a white flash on every navigation for anyone who chose
dark.


---

## §13 — What "one Tab stop" means, and the two rules the gate needed

Recorded 11 Aug 2026, on the commit that made `pnpm run verify` pass end to end
for the first time: 446 documents, 0 violations.

`composite-tab-stop` had been reporting 12 violations for weeks, described in
`experiments/measurements/composite-tab-stop-open.json` as "recorded rather
than silenced". They were two entirely different things, and treating them as
one is why they sat there.

**Four of them were the RULE being wrong.** React Aria's collections make the
COLLECTION tabbable while nothing inside is focused, and marshal focus into the
first item on entry — `useSelectableCollection` computes
`tabIndex = manager.focusedKey == null ? 0 : -1` in the render body and
`useSelectableItem` computes the mirror in the same pass, so the two swap
atomically and there is never a moment with two stops. The served shape is
`role="listbox" tabindex="0"` with all options at `-1`, which is a tab stop.
The rule's header had described that case in words from the beginning; it only
ever DETECTED it via `aria-activedescendant`, which React Aria does not use.

**Eight of them were real.** Base UI's combobox serves an input claiming to own
a popup and never saying which one — `aria-controls` and
`aria-activedescendant` are both written from a ref callback after mount. So in
the served bytes there is a listbox with three unfocusable options and nothing
referencing it. `useComboboxWiring` mints the id during render and hands it to
both halves.

Two rules came out of this that generalise beyond the gate:

1. **A rule that reports a false positive is a bug in the rule, not a licence
   to narrow it until the build is green.** The distinction is whether the
   exemption describes a shape that is genuinely reachable. `tabindex="0"` on
   the container is; "a combobox happens to share my parentElement" is not, and
   that draft was rejected — it is blindness by adjacency, and it would have
   made the rule miss a standalone listbox with no tab stop at all.

2. **An exemption and the markup it exempts land in the same commit.** A rule
   narrowed to fit markup that does not exist yet has stopped grading anything.
   The `aria-controls` arm was unreachable by any page in the export until
   `useComboboxWiring` shipped; if it had gone in first, its only test would
   have been a synthetic fixture — the vacuous-pass shape `gate.test.ts`'s own
   header warns about.

Both exemptions carry negative twins: a container at `tabindex="-1"` still
fires, a combobox with no `aria-controls` still fires, one pointing elsewhere
still fires, and a disabled or `tabindex="-1"` owner still fires. Those five
tests are what stop the next "tidy-up" from widening `=== "0"` to
`hasAttribute("tabindex")`, which would silently swallow the eight real ones.

TRIPWIRE for deleting `useComboboxWiring`: Base UI computing its list id during
render and passing it down its own context, so `aria-controls` is a prop rather
than a ref-callback write. Nothing needs measuring for that — the id is a
`useId()` either way.

---

## §15 — The ceiling exists, and it is the same contract §13 wrote down

Recorded 12 Aug 2026. §13 settled what "one Tab stop" means and produced
`composite-tab-stop`, which grades a FLOOR: a widget with NO stop is
unreachable. Nothing graded the other side, and a composite serving N+1 stops
is the same contract broken the other way — the role promising a collapse that
the markup does not perform.

**Thirty over-stopped composites were in the export the day this was asked**,
counted over 524 documents by tabbable descendants per roving container:

```
toolbar        12
menubar         6
grid            6
row (in grid)   6   ← the grid's own two elements, counted again one level down
```

Triaged individually, they were **four component defects and one measurement
artefact**, and not one of them needed an exemption:

1. `ToolbarItem` served `tabIndex={0}` on EVERY item until mount. It closed the
   total failure by reproducing the degraded one — the React Aria TagGroup
   overshoot that `useCompositeTabStop`'s own header names and `tag-group.tsx`
   was written to fix.
2. `MenubarButton` did the same for every trigger.
3. `ToggleButton` destructured a closed prop list and spread nothing, so a
   `<ToolbarItem><ToggleButton/></ToolbarItem>` dropped the composite's `ref`,
   `tabIndex` and `data-focusable` on the floor: no registration, no arrow-key
   reach, and a natively-tabbable `<button>` left over. This one did NOT
   self-heal on hydration.
4. `ColumnResizer` carried no `tabindex`, so every resizable column added a stop
   to a grid whose header opens "a `role="grid"` takes ONE Tab stop". The same
   defect `TableWidgetCell` closed one commit earlier, in the one place the
   carve-out could not reach.
5. `role="row"` is not a composite. Grading it double-counts its grid.

Three findings that generalise, in the order they cost time:

**A rule's floor and its ceiling must be written together or the fix for one
becomes the other.** Every one of the first two defects was a deliberate,
argued, documented answer to `composite-tab-stop`. The docblocks were long and
the reasoning was wrong in a way only the missing half could show.

**A container cannot identify its own children across an RSC boundary.** The
first fix had `Toolbar` designate the first `ToolbarItem` among its children —
`TagList`'s pattern, deterministic, no claim on render order. It passed every
unit test and changed nothing on the built site: `Toolbar` is `"use client"`,
the worked examples are a server module, and the children arrive as unresolved
client references. Probed on the real build, `part.type` is an `"object"` with
no `name` and no marker property, so neither `===` nor a static marker can
work. `tag-group.tsx` is not wrong to use the pattern — it designates by a
`id` PROP, and props cross the boundary as data. Component TYPES do not.

The working shape is the one Base UI itself uses: the ITEM claims, through a
counter the container resets in its render body, read once per mount through
`useState`'s initialiser. `useCompositeListItem` calls this "guess the index
from the render order" in the same situation and for the same reason.

**A green unit suite is not evidence about a static export.** Two fixes in a row
were green in `packages/ui` and inert in `apps/website/out`. The gate is the
only tier that could tell.

`composite-single-tab-stop` ships with ONE exemption,
`[data-lumo-extra-tab-stop]`, used once: the toolbar page's worked
demonstration of an unregistered child, whose extra Tab stop is the lesson. It
discounts one CONTROL, not the container, and not the widget — a marked control
beside a real second stop still fires, and the attribute on the container does
nothing at all. Both narrowings carry negative twins, per §13.

---

## §16 — Lint runs, and the policy it runs is narrower than the one it replaced

`packages/config/eslint/lumo.mjs` was written, argued, exported and documented,
and nothing in this repository executed it: no `eslint.config.*` at the root, no
`lint` script, `eslint` not a dependency of any package, no step in `verify` and
none in CI. CONTRIBUTING.md meanwhile told contributors *"a physical utility is
caught by lint. There is no exception."*

This is the third instance of one shape in this repository. `cli.ts`'s header
memorialises the first (`persian-digit-floor` had a factory, a fixture, a
self-test and a README paragraph, and was not in the `RULES` array). A
library-wide audit found the second (the same rule re-armed by an argument, and the argument
missing from the only caller that gates anything). This is the third, and it is
the largest: an entire policy file rather than one rule.

### The shape

One `eslint.config.js` at the ROOT, spreading `lumo.mjs` rather than restating
it, plus a `lint` script and a `gate:lint` step in `verify` between `gate:props`
and `gate:no-css-modules`.

Root rather than per-package, because the policy is a property of the CONTRACT
and not of a package: a per-package config is a place for a package to quietly
not have one, and `packages/native` and `packages/config` — neither of which
builds — are exactly the two that would have missed out. It lints 417 files
across every package and the site.

Beside `gate:props` rather than after the tests, because both grade SOURCE and
because of the asymmetry that makes this class of defect expensive: a conditional
hook makes tests fail for a reason that does not name itself, and a physical
utility makes tests **pass** while the Persian page mirrors wrong. Neither is
worth discovering after a full suite.

Three devDependencies, all root-only, none reaching the registry or a consumer:
`eslint` (the runner), `typescript-eslint` (**parser only** — the policy stays
plugin-free, but espree cannot read `.tsx`; no typed-lint program is configured,
so there is no type-check pass), and `eslint-plugin-react-hooks`
(`rules-of-hooks`, which is not expressible as a syntax selector and whose
absence is why a conditional `useContext` shipped in `toggle-group.tsx`). No
formatter. Both existing catalog entries for eslint were **unsatisfiable** —
`^9.40.0` and `^9.0.0` against published maxima of `9.39.5` and `8.67.0` — which
is independent evidence that nothing had ever installed them.

### What the first real run found, and why the rule changed rather than the code

Thirty-seven physical-utility errors. **Thirty-four were prose**: sentences
containing "right-click", "right-to-left", "bottom-right", and a dozen doc lines
that say *"text-start rather than text-left"* precisely to teach the rule. Three
were class strings, and all three were false positives as well.

It also missed the dangerous direction entirely. The token boundary was
`(?:.*\s)?` — literal whitespace — so **any** Tailwind variant prefix hid the
utility behind it: `md:ml-4` and `after:-inset-x-2` did not match. And the
`ltr:`/`rtl:` escape was a lookahead over the WHOLE string, so one `rtl:` class
excused every other class beside it.

A rule that fires on English prose and stays silent on `md:ml-4` is inverted, and
inverted is worse than absent, because its output teaches people that lint output
is noise. Two narrowings:

1. **Context.** These are CLASS rules, so they now only look inside class
   positions — a `className`/`classNames` JSX attribute, or an argument to
   `cva`/`cn`/`clsx`/`cx`/`tv`/`twMerge`/`twJoin`. That is where classes live
   here: three hundred and sixty `cn(` call sites and three hundred and fifty
   nine `cva(`. Stated cost: a class string parked in a bare `const` is now
   unseen. Every string literal in `packages/ui/src` and `packages/blocks/src`
   was scanned to confirm there are none.
2. **Tokens.** The pattern matches a whitespace-delimited class token and steps
   over its variant prefixes, so `md:ml-4`, `after:-ml-2` and
   `group-hover:text-right` are caught, and the sanctioned escape applies to the
   token carrying it rather than to the whole string.

### Two entries left the list, and the reason is a compiler, not an opinion

Every entry in `PHYSICAL` was compiled against the pinned tailwindcss 4.3.3 and
kept only if its output names a physical side. Two do not:

```
inset-x-0   →  inset-inline: 0px                     not left/right
space-x-4   →  margin-inline-start / -end            not margin-left
```

`inset-x-` produced all three class-string hits in the first run —
`calendar.variants.ts:75` and `resizable.tsx:97-98`, which the audit called
"arguably false positives since `inset-x-0` is symmetric". The compiler says
something stronger than symmetric: on this Tailwind the utility emits no
physical side at all, and there is no logical utility to migrate those sites TO.
So the rule changed and the three call sites did not. (`space-x-` WAS
`margin-left` on Tailwind 3. If this repo ever moves back, both entries return
with it.)

### A fourth dead rule, found by wiring up the third

The raw-digit selector matched nothing, ever. Three faults in one line:
`Literal[value=/…/]` — esquery only applies a regex to a STRING attribute, and a
numeric literal's `value` is a number, so the test was never attempted;
`NumericLiteral` — a Babel node type that ESTree does not have; and `.left` —
only the left operand of a `+`, so `{n + 1}` was invisible. It is now
`Literal[raw=…]`, both operands, and scoped to a JSX CHILD rather than any
expression container, because `maxLength={6}` is an attribute and is correct.

Its old comment claimed to be "the mechanical cure for `{day.day}`". No selector
can be: `day.day` is an identifier and nothing syntactic knows it holds a number.
That case is cured by the TYPE — `children?: LumoNode`, which does not accept
`number` — and the comment now says so.

### The five duplicated test regexes stay

`message`, `bubble`, `item`, `attachment` and `marker` each carry an identical
copy-pasted `PHYSICAL` regex, and until now they were the only physical-utility
enforcement that existed anywhere. They are kept, because they are not a weaker
copy of the lint rule — they grade a different artifact. Lint reads SOURCE
literals in class positions. Those tests read the RENDERED `class` attribute
after `cn`/`cva` resolution, so they see a class that arrived through a variable,
through a shared variants module, or from a dependency's own default — none of
which any selector can follow. They also assert something lint cannot express at
all: that the rtl and ltr renders produce the IDENTICAL class set.

That is the same relationship this policy's header already describes between
lint and the HTML gate — fast filter, then proof — one tier further in. The
audit's real complaint was coverage: five of the lowest-risk components out of a
hundred and twenty-four. Lint now covers all of `packages/ui/src` and
`packages/blocks/src` at the source tier, so the gap those five left is closed by
the tier that can close it, and they keep the job only they can do.

The remaining cost is honest and unfixed: five identical regexes that can drift
from the one in `lumo.mjs`, and already differ from it (they carry no `ltr:`/
`rtl:` escape, which makes them stricter, and they predate the two entries the
Tailwind compile removed).

---

## §17 — The root contract: `ref` and `id` are decided once, and the decision is `ComponentProps<E>`

Decided 12 Aug 2026, out of a library-wide audit. It went first because it is
the only item whose cost is **quadratic** — every component added before the
decision has to be revisited after it — and doing it for 244 components later is
a week's work against a day's now.

### The state it replaced

There was no `ref` story and no `id` story. Whether `<Card ref={r}>` compiled was
an accident of which base type a file's author had reached for:

```
HTMLAttributes<T>     21 files, 49 declaration sites   NO ref
ComponentProps<E>     10 files                         ref
```

Nothing documented the difference, because nobody had chosen it. Downstream, no
collection, no overlay and no date component forwarded a ref at all, and **108 of
244 exported components (44%) declared no rest parameter** — so they accepted no
`id`, no `data-testid`, and no `aria-*` the component had not thought of.
`MenuItem` could not take `aria-current` for exactly that reason, and it cost a
new prop to fix one instance of it.

### The decision

**Omit what you own, spread the rest** — the `spinner.tsx` model, with two
clauses and a floor.

1. **The base is `ComponentProps<E>`, never `HTMLAttributes<T>`**, where `E` is
   the tag the component renders.
2. **`Omit` what the component owns, and say why on the line.** Ownership is one
   of three facts, not a matter of taste: the component *writes* the attribute
   (`role` on `Spinner`), *reads* it (`ref` on `Table`), or the state lives
   elsewhere (the open-state trio on an overlay surface).
3. **Floor:** `ref` and `id` are never subtracted, only ever OWNED or WIDENED.

### What decided it, and it is a React 19 fact

React 19 made `ref` an ordinary prop. Verified against this repo's own
`@types/react@19.2.18` with its own `tsc`, **both directions asserted** so the
probe could not pass vacuously:

```ts
type HasRef<P> = "ref" extends keyof P ? true : false;
const a: HasRef<ComponentProps<"div">>          = true;   // compiles
const b: HasRef<HTMLAttributes<HTMLDivElement>> = false;  // compiles
// …and the inverted pair produces TS2322 on both lines.
```

So the entire `ref` question is answered by a **base type**, not by a mechanism.
No `forwardRef`, no `ref` prop to declare, no element bookkeeping, no runtime
cost. Also verified under `exactOptionalPropertyTypes: true`: `{ id: undefined,
ref: undefined, onClick: undefined }` is assignable to `ComponentProps<"div">`,
because React spells every optional DOM field `T | undefined` — so a props bag
carrying an explicit `undefined` keeps spreading.

### The shape that was rejected

An explicit `attr()`-forwarded allow-list — `id` / `ref` / `aria-labelledby` /
`aria-describedby` / `data-*`, hand-listed and hand-delivered on every root. It
buys the promise that nothing arrives the component has not considered, and it
loses on four counts:

1. It is 244 hand-maintained lists. The 21-vs-10 split is what a per-file
   judgement call already produced at this scale.
2. Every field has to be redeclared **by hand** with `| undefined`, or
   `exactOptionalPropertyTypes` turns a correct spread into an error — the
   mistake `props.ts` already records once under "ONE MEASURED WIDENING".
3. React 19 removed its reason. Under React 18 the list at least bought an
   explicit `ref` story that `forwardRef` otherwise made per-component ceremony.
4. **It is not mechanically checkable, and that is the deciding one.** A gate can
   ask *"you accept `id` — do you deliver it?"* and answer it from syntax. No
   gate can ask *"should you also have accepted `aria-keyshortcuts`?"* — the
   answer lives on a page nobody has built yet. An allow-list's guarantee is
   therefore exactly as strong as the diligence of whoever wrote each list, which
   is the property that produced the state being replaced. "Omit what you own"
   inverts that: the default is complete, and each subtraction is a reviewed line.

### What it costs, stated plainly

**A wider surface accepts wider mistakes.** A consumer can now pass `role="button"`
to a `Card` and break its semantics, where before the type refused. That trade is
taken deliberately: the same passthrough is what lets a `Card` carry the `id`
that a `aria-labelledby` on a landmark points at, and the refusal was never a
considered protection — it was the absence of a base type.

**And `Omit` protects only a TypeScript consumer.** This library is distributed by
copying source into other projects, several of which are not TypeScript. So on
the roots where a displaced attribute fails silently — `Table`, `ListBox`,
`VirtualList`, `Gantt`, `Kanban`, `Sortable`, `FileUpload` — the component ALSO
spreads `{...props}` **first** and writes what it owns after it. That is the
reverse of the house order, it is stated on each of those lines, and
`table.test.tsx` holds the two tests that failed before the first one moved.

### The enforcement

`gradeRootContract` in `packages/gate/src/inert-props.ts`, run by `gate:props`
alongside the inert-prop rule and sharing its parse. Three verdicts —
`no-ref-story` (an `HTMLAttributes` base), `undelivered-root` (a DOM surface
inherited and never spread), `unexplained-own` (a `ref`/`id` subtraction with no
comment). Fixtures in `packages/gate/fixtures/root-contract/`, one per verdict
plus a `good.tsx` carrying all four legal shapes, and the self-test enumerates
the directory so a verdict without poison fails the suite.

The rule deliberately does **not** grade whether the omit list is right, and
could not: that is the same asymmetry that decided against the allow-list.


---

## §18 — One press, one ring, one dimming, three elevations: the variance is the defect

**Date:** 12 August 2026 ·
**Files:** `packages/theme/src/{tokens.css,theme.css}`, every
`packages/ui/src/*.variants.ts`, the style strings in `packages/ui/src/*.tsx`

### The problem is not in any one component

Measured across the 94 components, with comments stripped so prose about a
retired spelling was not counted:

```
press       5 spellings   active:bg-surface-sunken ×13 · active:brightness-95 ×4
                          active:translate-y-px ×4 · active:bg-accent/10 ×5
                          active:opacity-90/80 ×2      — on ~15 of ~45 pressables
focus       5 mechanisms  the global rule · FOCUS_RING_SELF · 3 re-typed copies
                          of it · hardcoded outline-accent ×3 · focus-as-fill ×3
                          (+ a has-[select:…] ring in calendar nobody had counted)
disabled    3 opacities   opacity-50 ×39 · opacity-60 ×1 · opacity-40 ×4
elevation   5 rungs       shadow-xs/sm/md/lg/xl/2xl — and ZERO shadow tokens, so
                          100% of it was Tailwind's constant ramp
scrim       0 tokens      bg-black/50, twice, the library's only untokenised colour
```

Every one of those lines is defensible in the file it is written in, on the day
it is written. That is the whole difficulty: there is no defect to find, and the
sum is what a designer reads as **grown, not designed**. It is also the thing
`gate:props`, `gate:lint` and both existing vocabulary suites are structurally
unable to see, because each of them grades one rule at a time.

### THE PRESS IS `active:translate-y-px`

A one-pixel block-axis nudge, everywhere, with one composed exemption. The other
three candidates were measured against the surfaces this library actually ships,
and each fails on one of them:

| candidate | where it fails, measured |
| --- | --- |
| a FILL (`active:bg-surface-sunken`) | light `--lumo-sys-surface-sunken` and `--lumo-sys-surface-hover` are both `neutral-100`, so most of those 13 painted the pixel the hover had already painted |
| a FILTER (`active:brightness-95`) | needs something bright to dim. A light-theme ghost has no fill and `text-fg` at #171717: `brightness(0.95)` moves channel 23 → 22 of 255 — invisible, in exactly the touch case a press exists for |
| OPACITY (`active:opacity-80`) | dims the LABEL with the fill. On the critical button, light theme, `text-bg` on `bg-critical` goes 4.86:1 → **2.82:1** while held: the one candidate that can take a control below AA at the moment it is used |

The nudge wins on four properties, and the second is the structural one:

1. It is independent of the surface, so one spelling covers solid, outline,
   ghost, link, row, cell and a 4px bar.
2. **It never competes for a declaration.** A fill press has to out-specify its
   own fill hover at equal specificity, and three components had each invented a
   different workaround for that — `hover:active:bg-`, `data-pressed:hover:bg-`,
   `aria-pressed:hover:bg-`. `translate` is a property no hover, selected,
   current or highlighted rule writes, so composition is free and there is
   nothing left to get wrong. Five vocabularies partly EXISTED because of this.
3. It is theme-neutral. `brightness-95` darkens: a press on light, a fade on dark.
4. It costs no contrast, and it is visible on touch.

**What does not get it** is a taxonomy, not taste, and the audit's warning not to
flatten it is honoured:

- **ANCHORED** — `active:not-aria-[haspopup]:translate-y-px`. Base UI anchors a
  panel to its trigger's box, so a held trigger drags the panel with it.
- **SELF-ANSWERING** — the pressed element's own box takes a persistent new
  appearance: toggle, checkbox, radio, switch, tab, segmented item, listbox
  option, calendar day. The tap answers itself.
- **THE EXCEPTION THAT LOOKS LIKE THE RULE** — `toggle-group` under
  `disallowEmptySelection` CANCELS the un-press (`details.cancel()`), so the one
  gesture that produces *nothing at all* is on a control that appears
  self-answering. It keeps a press. `toggle.variants.ts` still declines one.

Two written arguments were **reversed** rather than overwritten, and both are
recorded in place. `link.tsx` declined the nudge because "a link is a run of text
inside a paragraph" — but `translate` reflows nothing and `linkVariants` is
`inline-flex`, so the layout claim was false and only a taste claim remained,
bought with a third vocabulary. `toggle-group.variants.ts` declined it because
`overflow-hidden` clips the item — which is true, and the clipped pixel is the
group's own `bg-surface` on an unpressed item and a 1px band above the fill on a
pressed one, i.e. the press.

### THE RING IS `theme.css`, AND FOUR OF THE FIVE MECHANISMS WERE ALREADY DEAD

`:where([data-lumo]):focus-visible`, plus `FOCUS_RING_SELF` for controls whose
visible box is not the focus stop, plus the proxy rule for controls painted at
zero alpha. No component writes a `focus-visible:` class; `system-vocabulary.test.ts`
asserts the string appears in exactly one file.

The finding that made this cheap is in the **built stylesheet**, and it is why
this repo's rule is to read the export rather than reason about emission order.
Layers land as `properties · theme · base · components · utilities · lumo.reset
… lumo.components` — byte offsets 1354 / 3782 / 6175 / 9844 / 9862 / 94299 /
102592 on the 12 Aug export. `@layer` order beats specificity outright, so
`lumo.components` wins over every `focus-visible:` utility in the library:

- the three re-typed copies of `FOCUS_RING_SELF` were unreachable, not merely
  redundant;
- `focus-visible:outline-accent` in `disclosure`, `navigation-menu` and
  `calendar` never painted — which is the only reason a brand that moved
  `--lumo-sys-focus` without moving `--color-accent` had not already shipped two
  ring colours on one page;
- **toggle-group's inset ring was never inset.** It is the library's only
  negative offset, written because the group clips with `overflow-hidden`, and
  the global rule overrode it. The intent was right and the mechanism could not
  work.

The inset is now expressed as the variable the one rule already reads —
`[--lumo-sys-focus-offset:calc(var(--lumo-sys-focus-width)*-1)]` on the item, the
same move the density island makes for `--lumo-ref-control-*`. A per-element
knob is not a second mechanism; a second rule is.

`drawer.tsx` was the real defect and not a style inconsistency: the string
`data-lumo` appeared zero times in the file, and `drawerVariants` sets
`outline-none` on the `role="dialog" tabindex="-1"` element that IS the focus
stop. No indicator from the platform, none from the library. It is guarded now by
an INVARIANT rather than by naming the component — *a focusable element that
cancels the UA outline must carry the marker* — because naming it would be the
hand-kept list this repository keeps proving wrong.

### THE DIMMING IS `opacity-50`

The other two values were each a local judgement about how dim one control
looked (`opacity-60` on the field wrapper, `opacity-40` on the steppers and three
calendar strings), which is an argument for moving the value everywhere or
nowhere. Disabled text is outside SC 1.4.3, so no contrast floor applies.

`cursor-not-allowed` is dead wherever `pointer-events-none` is on the same
element, because nothing hit-tests to it. **The audit put that at 13 of 18 sites;
measured per CLASS STRING it is 2** — eleven of the thirteen were two utilities
on two different elements in one file. The looser reading would have deleted
eleven live rules, which is why the enforcement's unit is a class string.

### THREE ELEVATION TIERS, NAMED FOR THE JOB

`--lumo-sys-shadow-{raised,overlay,modal}`, bridged as `--shadow-*`. The tier is
not "how big" — it is **what the element has to be separated from**, which is
decidable without taste:

- **raised** — one plane above the same surface, still in flow, usually bordered
  too. The shadow only has to say "not flat".
- **overlay** — covers page content it does not know, with no scrim to help, and
  is dismissible. The shadow carries the whole separation alone. This is why
  `tooltip` and the chart tooltip cannot be three rungs apart: same problem.
- **modal** — covers a page the scrim has already dimmed, and is the only thing
  interactable. It says which object to look at.

**A black shadow on the dark page is arithmetically close to a no-op**, and the
number is kept as an assertion because the wrong fix is cheap to reach for. The
dark page is Y 0.00305, so black at alpha a leaves 0.00305·(1−a): α 0.10 → 1.006:1,
α 0.40 → 1.024:1, α 0.60 → 1.036:1, against a hairline this theme ships at
1.15:1. Dark elevation is carried by the lighter surface and by `border-border`;
the dark ramp is raised because it works over `surface-hover`, imagery and accent
fills, not over the page. Geometry is shared between themes — a shadow that
changes shape with the theme is two elevation systems wearing one set of names.

Tailwind's own rungs are deliberately **not** reset to `initial`: the site and
`packages/blocks` still use them, and blanking the namespace would break a build
rather than improve it. What holds the three tiers is the directory sweep.

### THE SCRIM IS `--lumo-sys-scrim`, AND ITS DARK VALUE IS NOT FOR THE MODAL

`bg-scrim`, replacing the library's only two untokenised colours. **The light
alpha does not move** — 0.5, exactly what `bg-black/50` was — so no light pixel
changed and only the dark value needs judging.

The dark value is 0.72, and the reason is counter-intuitive enough to be a test.
It is *not* to separate the modal from the page: the dark page is already almost
black, so 0.50 → 0.80 alpha moves the modal-vs-page ratio from 1.138:1 to
1.158:1 — twenty-two points of alpha for fifteen thousandths of contrast. What a
dark scrim is for is the page's *bright* content, which is the only thing left to
suppress: a dark accent fill (`brand-400`, Y 0.7838) reads 7.54:1 against the
modal at 0.5 and 4.60:1 at 0.72.

### The enforcement, and why it enumerates the directory

`packages/ui/src/system-vocabulary.test.ts` — 22 assertions, every one of them
over `readdirSync(src)`. A vocabulary rule is the most list-vulnerable kind there
is: the defect *is* a component that did its own thing, which is by definition
the component nobody put on the list. `state-vocabulary.test.tsx` learned this
the expensive way — both dead `data-hovered:` rules it eventually caught were in
components no specimen list contained.

Its unit is a **class string** (a run of literals joined by `+` or `,`), not a
line and not a file, because two of the rules are about two utilities landing on
the same element. `packages/theme/src/tokens.test.ts` gained nine assertions for
the halves a component sweep cannot reach: the elevation ladder, the shared
geometry, the dark-shadow ceiling, and the scrim composited by hand — the
contrast matrix cannot see through alpha, so the scrim is `EXCLUDED` from it with
a reason and measured separately.

All of it was proved by reverting each fix and naming the assertion that goes
red.

---

## §28 — Any language: the locale contract opens (16 Aug 2026)

The requirement: the library should be usable with every language. Until
now `Locale` was the closed union `"fa-IR" | "en-US"` — chosen so that a
route-param string could never become a locale, and so that every internal
string table was forced complete by `satisfies Record<Locale, …>`. Both
guarantees mattered; neither requires the union to be closed. What they
require is that a language Lumo does not carry never gets another language's
strings by default. So:

- `Locale = BuiltinLocale | (string & {})`; `BuiltinLocale = "fa-IR" | "en-US"`.
  Built-ins autocomplete and narrow (`isBuiltinLocale`); any tag is accepted.
- **`LumoProvider` requires `strings` for a non-built-in locale — by type**
  (`{ locale: BuiltinLocale; strings? } | { locale: Locale; strings: LumoAppStrings }`),
  and `stringsFor` / `baseUiStringsFor` THROW when asked for a language without
  the app's set. The rule for a third language is the rule for a required
  `label`: the app writes it, Lumo refuses to guess.
- Every internal `Record<Locale, …>` string table in the components (calendar
  chrome, tree verbs, chart role description, phone-input country names) moved
  into `LumoStrings` and is read through `useLumoStrings()`; nothing in
  `packages/ui` branches on a locale literal any more. `FORMAT_LOCALE[locale]`
  became `formatLocale(locale)` (`fa-*` → Persian calendar + `arabext`; other
  tags formatted as themselves; a `-u-` extension is respected).
- `direction()` answers for any tag: the platform when it can (`getTextInfo`),
  else CLDR character order by primary subtag — the same fallback the Hermes run
  needed.
- The gate grades any tag: explicit table first, then a profile derived from
  the same CLDR data the formatters use; a script it cannot name is an error.
  `localeForPath` accepts a BCP-47 route segment and refines from `<html lang>`.
- The docs site stays two-locale (`BuiltinLocale as Locale` in its copy).

Deprecated, kept one minor: `LOCALES`, `FORMAT_LOCALE`, `isLocale`,
`documentDirection`. This is 0.2.0 — a MINOR that may break, per policy.

---

## §30 — Best in class per platform: web stays Base UI + Tailwind + tokens; mobile is Flutter (17 Aug 2026)

The rule: best in class per platform. If mobile is better with Flutter then it
is Flutter; if the best the web can do is Base UI with Tailwind and tokens, then
it is that. This supersedes the earlier "never Flutter" position and the React
Native engine choice that followed it, both decided before any of this was
measured.

What was measured to get here: three twins of one screen (Expo/RN, Flutter,
Lynx) on one simulator; a 2,000-row bench on the two finalists (Flutter: 60 fps,
whole-list update 14–40 ms even in debug; Lynx: 60 fps, 216–273 ms, and
`<list>` shows stale rows after off-screen
updates); the Persian l10n probes (Flutter `intl` dates are Gregorian only — Jalali
needs a package; PrimJS Intl does Jalali/plural/currency); Lynx's accessibility
model (traits image | button | text, no states) which cannot carry Lumo's
contract; RN's app-level RTL, build-dependent Intl and library-dependent
motion/perf — every priority above met with a workaround.

Decision:
- **Web:** Lumo as it is — Base UI engine, Tailwind arrives scoped, tokens,
  the served-bytes gate. Nothing changes.
- **Mobile:** **Flutter.** `lumo_ui_mobile` — **Lumo UI Mobile** (Dart; `packages/mobile` in this
  repo, moved from the Flutter twin) is the mobile
  library: Material's widget layer underneath (as Base UI is under the web),
  Lumo tokens generated from `tokens.css` (`scripts/build-flutter-tokens.mjs`),
  Lumo's contract on top (required named parameters for every announced string;
  Dart's null-safety and constructor asserts are the type-level guard),
  `Directionality`/logical geometry for RTL, `Semantics` for the announcements.
  Jalali dates: a Lumo Dart utility over ICU/CLDR data or a vetted package —
  decided when the first date component lands.
- **Shared between the two:** tokens, the contract, the component names and
  prop vocabulary, the docs site (a Flutter tab where the Mobile tab was), the
  proof discipline (semantics-tree tests are the mobile counterpart of the
  served-HTML gate; no screen-reader claims without runs). Not shared: code.
- **`@lumo-ui/native` (React Native) and the Lynx twin: REMOVED** the same day
  — package, docs Mobile tab, previews, gates, catalog pins, token
  generators. The code went; the findings are the paragraph above. Lynx is
  re-evaluated only if it ships accessibility roles/states and the `<list>` bug
  is gone — from scratch, not from a kept twin.
- **Docs site:** the Mobile tab returns as a Flutter-web embed of the same
  Dart components (the way forui / shadcn_flutter show theirs), labelled as a
  canvas preview; the semantics-tree tests remain the proof.

Why two libraries is acceptable: Lumo's value is the contract and the proof,
not the code sharing; the Dart library was built in a day; the cost of the wrong
mobile framework (RTL/perf/l10n workarounds forever) is larger than the cost of
one more implementation of a small, well-specified surface.

---

## §36 — The mobile semantics grader, and what the platform already had (17 Aug 2026)

`apps/mobile-gallery/test/semantics_grader_test.dart` (the gallery retired in
§54): every demo rendered in both locales, its semantics tree walked, four rules
applied to every node — `named-controls`, `persian-digits`, `engine-english`, `announced-once` —
each with a poison fixture that must fail it. 210 renders, 0 violations, 1 earned
exemption. It runs inside `gate:flutter`.

This is the mobile counterpart of `gate:html`, and the reason it matters is the
same: the web's strongest instrument is not its tests, it is ONE grader stating
13 rules once and applying them to 688 documents, so a component written tomorrow
is graded whether or not its author remembered. The mobile library had a
semantics test per family — better than most libraries, and still not that: a
family added tomorrow gets exactly the assertions its author thought of.
`gate:flutter-contract` grades SOURCE, so it cannot see a string that arrives
from Material's own defaults at runtime, which is precisely where English leaks.

Two rules needed refining before they were true rather than merely strict, and
both refinements are about how Flutter builds its tree, not about the rules:

- A node **merged into its parent** is not announced separately. Grading it as
  its own node reported every text field as an unnamed control.
- A `TextField` emits a labelled node with an **unlabelled editable child at the
  same rect** — one control drawn once. So a name is inherited by rect: a node is
  unnamed only if no ancestor *at the same rect* named it. A button nested in a
  labelled card has a different rect, and is still required to name itself.

**It found 18 real defects on its first run**, all of the same shape and all in
the demos the docs site tells consumers to copy: `'${t['slide']} ${index + 1}'`
interpolates a bare `int`, which renders a LATIN digit. A Persian screen-reader
user heard "اسلاید 1 از 3". The library's whole reason for existing is that a
number goes through `formatNumber`, and its own showcase was teaching the
opposite. Fixed in `carousel` and `input_otp`; `LumoDemoCopy` gained a `locale`
getter so a demo can format.

One exemption, earned and justified in words: a bank card number's digits are
Latin because the card is. The web spells the same exception in markup with a
`data-lumo-latn` island; a semantics tree has no such marker, so it is written
in the test where it must be argued. A stale exemption fails the suite.

### What the platform already had

Flutter is mature, and this repo had been re-deriving parts of it.
`flutter_test` ships `AccessibilityGuideline` implementations maintained
upstream: `androidTapTargetGuideline` (48dp), `iOSTapTargetGuideline` (44pt),
`labeledTapTargetGuideline`, and `textContrastGuideline` (WCAG AA maths over what
was actually painted). This repo had hand-rolled the first two as
`tap_target_floor_test.dart` and `token_contrast_test.dart`, and I hand-rolled
the third as `named-controls` before checking. Where the platform states the
rule, the platform's statement is the one to run.

Running them over all 105 demos produced the most useful finding of the pass, and
it is not comfortable:

| Guideline | Demos missing it |
|---|---:|
| `labeledTapTargetGuideline` | **0** — a hard floor now |
| `iOSTapTargetGuideline` (44pt) | 42 |
| `androidTapTargetGuideline` (48dp) | 62 |
| `textContrastGuideline` (WCAG AA) | 37 |

Lumo's control scale is 29/36/44dp, generated from the web's
`--lumo-ref-control-*` and designed for a pointer: only `lg` reaches iOS's
minimum and nothing reaches Android's. Contrast fails as low as 3.46:1 at 12px on
muted foregrounds. Neither is fixable inside the mobile library — the tokens are
shared with the web, so raising them moves both platforms. That is a decision of
its own, so the three counts are RATCHETED at today's values
and may only fall. The house floors stay: they grade the tokens and the API
before a demo exists, where the SDK guidelines grade what a demo rendered.

---

## §37 — A mutation floor for the mobile library (17 Aug 2026)

`scripts/mutate-mobile.mjs`, `pnpm run mutation:mobile`, run as
its own CI job beside `mutation:components`.

`packages/mobile` had 669 tests and no anti-vacuity guard of any kind. Nothing
proved those tests assert anything: a semantics test that pumps a widget and
checks nothing passes, and goes on passing. The web has had one operator per
module for months; the mobile library had none, which meant its 669 was a number
without a floor under it.

The design is the web tool's, deliberately: a hand-authored operator per family —
[why it matters, the exact source to find, what to put there instead] — applied
one at a time, with the family's OWN test as the kill oracle, and the source
restored byte-for-byte in a `finally`. A mutant killed by some other family's
test would say nothing about this one.

Two disciplines carried over, and one added:

- **A family in neither `BEHAVIOURAL` nor `PENDING` throws before the campaign
  starts**, so a family added tomorrow cannot fall silently into "untested".
- **`PENDING` is a ratchet** — 63 families have no operator yet, and that number
  may only fall. It is stated rather than hidden: those families' tests are not
  proved against vacuity.
- **Operators are validated against the real source before anything is mutated**:
  a `find` string that does not occur exactly once is a startup error. An
  ambiguous operator would otherwise mutate a line nobody chose, and report a
  kill for a promise nobody broke.

13 of 13 killed on the first campaign. The two that matter most are the two the
library exists for: shifting the Jalali epoch by a year (`jy + 621` → `jy + 622`)
and sending `formatNumber` to the root locale so Persian digits come out Latin.
Both were caught by their own tests, which is the first actual evidence that the
calendar and the digit rule are TESTED rather than merely implemented.

---

## §43 — The first device run, and what the host had been getting wrong (18 Aug 2026)

`apps/mobile-gallery/integration_test/device_evidence_test.dart` (the gallery
retired in §54; `docs/evidence/mobile-device.md` is what survives of this run)
renders every gallery demo in both locales on attached hardware and applies the
SAME rules the host sweep applies — imported from `lib/src/semantics_rules.dart`,
extracted for this run so that one implementation grades both. Two copies of an
accessibility rule is how a device number and a host number quietly stop being
comparable.

To get there the gallery gained an iOS target (`flutter create --platforms=ios`)
and `integration_test`. It signs with the same team as the reference app.

**The run: iPhone, iOS 26.6, 1179×2556 at dpr 3.0. 240 of 240 renders, 0
failures.** Nothing failed to build, sign, install or render on real hardware.
That had never been shown: every mobile test in this repo until now was
`flutter test` on the host.

| Check | Host | Device |
|---|---:|---:|
| the four semantics rules | 0 violations | 0 violations |
| iOS 44pt tap target | 48/120 | 48/120 |
| Android 48dp tap target | 72/120 | 73/120 |
| WCAG AA text contrast | 39/120 | **74/120** |

Three of the four agreeing is the useful result: the host instrument is sound for
semantics and geometry, so the numbers reported from it can be trusted.

**The fourth is the finding.** `MinimumTextContrastGuideline` samples the pixels
that were actually painted. The host paints a substitute font at a device pixel
ratio of 1; the device paints the real text stack at dpr 3, where small glyphs
cover far less of each logical pixel. The host under-reports contrast failures by
roughly half — **62% of demos fail AA on a real phone, not 32%** — and it
under-reports in the REASSURING direction, which is the worst way for a
measurement to be wrong.

The host ceiling stays as a regression tripwire and is now labelled in the source
as known-optimistic, with the device figure beside it. This also moves the open token
decision from a tap-target one to a contrast one first: `fgMuted` and `fgSubtle` at 12px are
the offenders, and both are shared tokens.

### Two mistakes made getting here, both worth keeping written down

- The first attempt used `pumpAndSettle`. A spinner, a skeleton shimmer and a
  progress bar are continuous, so "settled" is a frame that never arrives; the
  run hung and died at the 12-minute file timeout. The host grader had always
  used a fixed `pump(400ms)` for exactly this reason and the habit did not carry
  across. One test per demo now, with the fixed pump.
- The report is PRINTED, not asserted, for everything except "did it render" and
  "do the semantics rules hold". A device number that differs from the host's is
  a finding to read, not a build to fail — and if it had been an assertion, the
  contrast discovery would have arrived as a red test rather than as a fact.

### What it does not prove

It is not a screen-reader run. Nothing in it asks iOS what VoiceOver would speak;
it reads the same semantics tree the host reads, on hardware, and a semantics
tree is the INPUT to a screen reader rather than its output. No VoiceOver,
TalkBack, NVDA, JAWS or Narrator claim exists for this library. It is also one
device, one OS, one screen size, with the system accessibility settings at their
defaults, run by hand and not in CI. `docs/evidence/mobile-device.md` states all
of that beside the numbers.

---

## §50 — Lumo is the gap, not the library: retire the registry, keep the contract and the grader (30 Aug 2026)

**Decided 30 Aug 2026, after an adversarial review of this repository and every
consumer of it.** Everything before this entry built a component library that
carries a locale contract. This decision inverts that: the locale contract and the
served-byte grader are the product, and the component library is retired to the
consumers that already own it.

Nothing here deletes a consumer's code. Every copy in every consumer app keeps
working, unchanged, forever. What ends is the
*obligation* — new components, web/mobile parity, and a registry that advertises
144 items one person maintains.

### What the review measured, and what it overturned

| Claim this log has shipped | What execution showed |
| --- | --- |
| The 52-component prototype is the founding evidence | **No artifact exists.** First commit is "Initial commit: the plan". The prototype appears only as prose in this repo; the gate's `because` strings quote the README rather than corroborating it. It cannot be cited as independent evidence — four review streams did exactly that |
| "A bare number in JSX is a compile error" | True only for a bare child of a Lumo component. `<Cell>{[1,2,3]}</Cell>` compiles clean, and the lint rule catches only `{5 + 1}`-shaped literals. Measured: `` {`مرحله ${step + 1} از ۳`} ``, `{items.length}`, `{step.toString()}` and the same template inside an `aria-label` all produce **zero errors** |
| `persian.bad.tsx` proves the rule works | It tests `{1 + count}` — a BinaryExpression with a numeric literal, i.e. the one shape the selector can catch. Rule and fixture written together always agree. The 44-fixture set proves non-vacuity, not adequacy |
| "Every announced string is a required prop" | A *presence* contract, not a correctness one. The props are plain `string`. A consumer ships `aria-label="Language"` in an `fa-IR`-only product past 169 required props and 22 gates |
| `lumo upgrade`'s 3-way merge is a distribution advantage | Never run. `.lumo/` is gitignored; no `upgrade` in any script. All 50 copies in the largest consumer already differ from upstream — measured, the drift is **pure Prettier line-wrapping**, so a `lumo diff` reports 50/50 files changed as noise |
| README:92 — "an exhaustive, compile-checked fallback" | A `ReadonlySet<string>` with no compile check, holding three unreachable entries, duplicated verbatim into `packages/gate/src/index.ts:64` |

**A correction to an earlier review claim, recorded because it was published:**
An admin surface was reported to have evaluated `table.tsx` and replaced it with
~200 lines of bespoke code. That is false. Its `table.tsx` is **byte-identical**
to upstream at 1,379 lines. No consumer has ever rejected a Lumo component.

### What survived every probe

- **169 required announced-string props, zero English defaults** across `ui` and
  `blocks`, verified two independent ways. `TS2741`/`TS2322` fire on live probes;
  `TS2578` proves the 52 type-test files are load-bearing.
- **Zero declared `dir` props.** Direction flows locale → `direction()` →
  `<html dir>` + `DirectionProvider`, and nothing else.
- **Jalali arithmetic.** 14,600 consecutive days (1990–2030) against `Intl`:
  **0 mismatches**.
- **The grader is not vacuous.** Neutering `uniqueIds` to `return []` produced 5
  test failures; 14 defects injected into a real built page were caught 14/14,
  each by the correct rule.
- **The territory is genuinely unoccupied.** axe-core 4.13's 105 rules grade
  **zero** digits, calendars, numbering systems or script.
  `composite-tab-stop` has no axe equivalent at all — the defect self-heals on
  hydration, so no browser tool can ever see it.

### The finding that decides it

Every Persian defect measurable across the portfolio lives in **app-authored
content and raw host JSX**, where the type contract has no reach and shadcn is
equally blind. A live, Persian-default, shadcn-based catalogue product ships
«ایران 208 میلیارد بشکه» with zero `Intl` calls in `src`. A Persian-only example
app ships `` `مرحله ${step + 1} از ۳` `` including inside an `aria-label`; that
string would pass every Lumo gate too.

The only mechanism in this portfolio that sees any of it is the served-byte
grader — 1,240 production lines, two npm dependencies, **zero `@lumo-ui`
imports** — and it is running in **zero of five consumers**.

So the component library was never the asset, and the enforcement layer has
never been pointed at a product.

### The decision

1. **`packages/ui` and `packages/blocks` are retired**, not deleted from history
   and not removed from any consumer. They stop being built, published,
   registered and gated. The registry stops advertising 144 items.
2. **A new `packages/dates` fills the one real gap.** It is *not* an extraction
   of `calendar.tsx`. It is the promotion of a consumer's proven
   `calendar-datelib.ts` — which binds **react-day-picker's grid** to
   `@internationalized/date`'s calendars. shadcn's Calendar *is*
   react-day-picker, so this extends shadcn rather than competing with it.
3. **New components take shadcn's API conventions**, reversing the earlier
   `isDisabled`/value-first choice, for this package only. One consumer carries 271
   `isDisabled`/`isInvalid`/`isReadOnly`/`isRequired` occurrences; shipping that
   convention into a shadcn-based product would split the API surface
   permanently. Existing copies keep the old names — they are the consumer's
   code now.
4. **Consumer copies are replaced opportunistically, never as a project.** When
   a file is already being edited and shadcn has the better component, swap it
   then. A migration project costs 4–6 engineer-months across five products;
   this costs approximately nothing and is spread over work already happening.
5. **Mobile keeps `gate:mobile-semantics` and retires the 145-widget roster.**
   The Flutter library already sits on Material's widget layer with zero
   third-party dependencies, so the wrapper thesis was right; the roster at ~52%
   demo parity was the error.
6. **The grader gets wired into a product's CI.** This has never been done and
   is the highest-value action available.

### What Lumo is after this

```
@lumo-ui/core      locale, direction, formatNumber, LumoNode, strings   1,821
@lumo-ui/theme     tokens, Tailwind bridge, :lang(fa)                   2,261
@lumo-ui/gate      the served-byte grader — the actual moat             1,240
@lumo-ui/config    the RTL lint policy, zero dependencies                 494
@lumo-ui/dates     the Jalali gap-filler, shadcn conventions            ~700
@lumo-ui/base-ui-ssr  first-byte compensations, pending §50.1             639
```

Roughly **7,155 lines against 173,550 — 4.1%** of what this repository was on
29 Aug 2026. (An earlier draft of this section said "under 4%". It is 4.12% by
its own table. A section that indicts overclaiming may not round its own
headline in its favour.)

### §50.1 — open, deliberately

Whether `@lumo-ui/base-ui-ssr` survives depends on which package shadcn's `base`
style pins. shadcn can build on Base UI, so the SSR compensations are likely
still load-bearing; the exact package identity was not resolved by the review
and must be checked against a real `shadcn add --base` install before this line
is settled.

### §50.2 — the locale context moved to core (done)

`useLumoStringsFor`, `useLumoLocale`, `useLumoStrings` and `LumoLocaleContext`
lived in `packages/ui/src/locale.ts`, inside clause 1's retirement. The locale
contract — the thing Lumo now is — could not be used without installing the
component library it replaces. Found because `@lumo-ui/dates`' own documented
entry point imported `useLumoStringsFor` from `@lumo-ui/core`, where it did not
exist.

**Moved 30 Aug 2026** to `packages/core/src/locale.tsx`, with a
`LumoLocaleProvider`. `packages/ui/src/locale.ts` now RE-EXPORTS the context
rather than declaring its own — two `createContext` calls would give provider
and hooks different identities and every component would silently read the
`fa-IR` default, a defect that renders, type-checks and looks right. Poison-
tested: redeclaring it fails 8 tests across `event-calendar`, `tree` and
`list-box`.

**What deliberately did not move.** Base UI's `DirectionProvider`, which
`packages/ui`'s `LumoProvider` mounts because every Lumo component rents Base
UI's keyboard geometry. A product on shadcn/ui does not, so requiring a Base UI
dependency to read a locale would reintroduce exactly the coupling §50 removes.
An app whose components DO use Base UI wraps the children in Base UI's own
provider with `direction(locale)` — one line, same source of truth, visible
rather than hidden. The engine templates stayed in `@lumo-ui/base-ui-ssr` for
the same reason: they patch English leaks in the components being retired.

**Coverage did not come free.** In `packages/ui` this module was covered
indirectly by 2,467 component tests; clause 1 deletes those. `packages/core/src/locale.test.tsx`
is the replacement — 9 tests at the `renderToStaticMarkup`/`node` tier, matching
`@lumo-ui/base-ui-ssr`, because the property that matters is that the context
resolves during a SERVER render: a locale that only resolves after hydration
serves the first byte in the wrong language. Core gained `react-dom` and
`@vitejs/plugin-react` as devDependencies for it. Core is now 51 tests.

This is additive to `@lumo-ui/core`'s public surface — nothing removed, nothing
renamed — so the five products pinned at `v0.2.6` are unaffected until they
choose to move.

### §50.3 — a stated `-u-` extension without `ca` dropped a Persian reader to Gregorian

`calendarFor("fa-IR-u-nu-latn")` returned `"gregory"`, so a tag meaning
"Persian, with Latin digits" produced a **Gregorian grid** while the formatters
still captioned «۱۴۰۳ مرداد» — a worse defect than the one the module exists to
prevent.

**This section first recorded it as deliberate, tested behaviour that could not
be changed.** That was wrong, and the error is kept here rather than edited
away. `packages/core/src/types.test.ts:138` pins `formatLocale`, in core. The
defect was in `calendarFor`, in `@lumo-ui/dates`, and was fixable without
touching core or that pinned contract at all. The reasoning conflated the two
because both mention the same tag.

Fixed: a stated `-u-ca-` wins outright; absent one, the language default is read
from the tag with its `-u-` extension **stripped**, so no other keyword can
short-circuit it. Applied to `packages/ui/src/calendar-datelib.ts` as well —
that is the copy five consumers took and the one running in production — and its full
suite still passes at 2,467.

`calendarFor` had no tests at all. Its doc comment writes a four-row table and
only the first and last rows were ever exercised, indirectly. All four rows are
now tested, including `ar-SA` → `islamic-umalqura`, which the third-property
argument rested on and which was asserted only in prose.

### §50.4 — what review found in the new package, and what is still owed

Fixed before merge: the lockfile was not committed (CI installs
`--frozen-lockfile` and would never have reached a gate); the documented usage
named a non-existent export (§50.2); the headline percentage was rounded in the
project's own favour; the package shipped `catalog:`/`workspace:*` in its RUNTIME
dependencies and was therefore uninstallable by git sub-path — the exact defect
`CHANGELOG` v0.1.1 exists to fix — while `check-versions.mjs` passed green
because its contract list is hardcoded and omitted `dates`; and `weekStartsOn`
was typed `number` against DayPicker's `0|1|…|6`, so the README's central
promise was false for one of the four props it sells.

Two of those — the uninstallable specifiers and the ungraded contract list —
are the same shape as the defect this project was built to catch: a gate that
reports success over the thing it does not look at.

Fixed in place rather than only in the new copy: mutation showed
`dateLib.formatNumber` returning Latin digits passed the suite. It was untested
in **`packages/ui/src/calendar-datelib.ts` too** — the copy five consumers
actually took, and the one running in production. Retired is not dead; the tests
were backported there (`packages/ui/src/calendar-datelib.test.ts`), and the
mutant now fails both.

Still owed, recorded rather than claimed fixed:

- **The twin files — guarded 30 Aug, not yet ended.**
  `packages/dates/src/twin.test.ts` reduces both copies to their executable text
  (comments and line-wrapping stripped) and fails loudly when they diverge.
  Coupling the packages would be backwards — a retired package must not become a
  dependency of a kept one — and deleting the twin is clause 1's job, so this is
  the cheapest honest close. The guard **deletes itself with `packages/ui`**.

  It found drift on its first run: the `Partial<DateLib>` typing and the
  `DateArg` coercion had gone into `packages/dates` only, leaving the renamed-key
  hole AND the crash in the copy five consumers took. Backported; `packages/ui`
  is 2,467 tests green. Poison-tested both directions — a changed comment does
  not trip it, a changed `getMonth` does.

  Backporting had a distribution consequence `gate:smoke` caught and no human
  would have: the type-only `react-day-picker` import means every registry item
  copying that file must now declare it. `date-selector`, `event-calendar` and
  `gantt` gained the dependency, derived automatically rather than hand-added.
  This is the gate earning its place — a defect structurally invisible from
  inside the workspace.
- **Test depth — closed 30 Aug.** Review generated 20 mutants and reported 12
  surviving. Two fixes, one structural and one behavioural:

  The bags were typed `Record<string, unknown>`, so a renamed override key
  (`startofMonth`) assigned cleanly and fell back to date-fns Gregorian — in the
  module whose entire job is not being Gregorian. They are now
  `Partial<DateLib>` / `Partial<Formatters>` / `Partial<Labels>`, and
  excess-property checking makes that a COMPILE error (`TS2561`, with a "did you
  mean"). An entire mutant class is now unrepresentable rather than untested.

  Typing them immediately found a live defect the untyped bag had hidden:
  `eachMonthOfInterval`/`eachYearOfInterval` receive date-fns' `DateArg` — a
  `Date`, a string, OR a number — and the code assumed `Date`, so a string bound
  would have thrown inside `fromJsDate`. Coerced once in `asDate`, asserted for
  all three forms.

  `setMonth`, `setYear`, `isSameYear`, both interval walkers and the coercion are
  now asserted; 30 tests. All five re-run mutants are killed. One of them —
  `setMonth` losing its `+ 1` — SURVIVED the first attempt, because the test used
  index 0 and `set({ month: 0 })` clamps to 1 and reads back as 0. The assertion
  now uses a non-zero index and keeps the boundary case beside it. A fixture that
  cannot fail is the thing this project exists to notice.
### §50.5 — clause 1 cannot be executed yet: the graders' only corpus IS the showcase

Found 30 Aug while scoping the retirement, and §50 did not anticipate it.

```
gate:html            = build apps/website  →  grade apps/website/out    (724 documents)
gate:mobile-semantics = render lumo_mobile_gallery/demos/all.dart        (210 demos)
```

**Both graders' entire corpus is the showcase of the components clause 1
retires.** `apps/website` imports `@lumo-ui/ui` and `@lumo-ui/blocks` across 115
files and cannot outlive them; the mobile gallery is the demo set of the 145
widgets. Retire the components and the moat has nothing left to grade.

That is not an argument against the scope decision — 86 of 144 items were never
copied by anyone, and that is unchanged. It is an argument about ORDER, and it is
the same trap the review named: acting before the evidence exists. §50 says the
grader "has never been pointed at a product" and calls that the highest-value
work. Deleting its only corpus first would make the point unanswerable rather
than answered.

**Pointing it at a product is currently blocked, in both consumers:**

| target | why not |
| --- | --- |
| A web consumer | `output: "standalone"`. Emits a server, not documents — `find .next -name '*.html'` is 0. Grading it needs a render step or a running instance behind auth |
| The catalogue product | The best target — live, Persian-default, **shadcn-built**, so grading it would prove the grader is library-agnostic, which is §50's whole thesis. But it has no `node_modules` and no build; a full install of a repo outside this decision's scope is its own decision, not a rider |

**RUN, 30 Aug 2026 — the first product contact, on the example target.** The
first target was an example app, and the right one was
the Persian-only example app: shadcn (Base UI style), Next 16
streaming, `lang="fa-IR"` on every page, and one defect KNOWN in advance —
`quote-wizard.tsx:169/:173` renders `` `مرحله ${step + 1} از ۳` `` into visible
text and an `aria-label`. A grader that misses a defect you can point at is a
broken harness; that string was the experiment's poison fixture.

`node scripts/grade-app.mjs <app>/.next/server/app fa-IR` — the harness this
section said was owed, now real: the operator DECLARES the locale and the
declaration is physical (every document staged under `fa-IR/` for the unmodified
CLI), so `lang-dir` grades each page's own `lang` against it rather than
trusting it.

**Result: 51 documents, 306 violations — dirty with signal, not noise.**

| what | count | reading |
| --- | --- | --- |
| The known poison, visible text | caught | `no-latin-digits`, «مرحله 1 از ۳», index.html |
| The known poison, `aria-label` | **caught only after a gate fix** | see below |
| Unnamed Base UI checkboxes (`role="checkbox"`, no name) | 33 across 12 pages | functional exclusion, the severest class |
| A `tablist` with zero tab stops in the served bytes | 1 | the self-healing defect class no browser tool can see |
| `lang`/`dir` absent on Next's global-error shell | 2 | the error page speaks the wrong voice |
| sonner's `aria-label="Notifications alt+T"` | 50 | the shadcn-era engine leak — same class as Base UI's, new library |
| Latin digits in visible Persian prose (`مرحله 1`, `۰1` ordinals, counts) | ~40 | real `formatNumber` misses, incl. a mixed «۰1» authored half-and-half |
| Footer email + phone, repeated per page | ~200 | annotation debt: four one-line `data-lumo-latn` / format fixes |

**The run found a bug in the gate itself, which is the more important result.**
The wizard's `aria-label` graded CLEAN on all 51 routes on the first pass.
`no-latin-digits` has graded `aria-label` since 16 Aug — but a streamed Next
document ships the real page inside `<div hidden id="S:0">` (revealed by the
`$RC` script), and nine rules skip `closest('[hidden]')`. So every announced
string in every streamed segment was silently exempt — on exactly the class of
app the gate exists to protect — while `visibleTextNodes`, which never honoured
`hidden`, flagged the same string one element over. Two branches, two policies.
`gradeHtml` now normalises React's `S:`-id segment containers before rules run
(the page arriving early is the page); pinned from both sides in `gate.test.ts`,
and the website corpus re-graded 724/0 — it contains no streaming containers.
The fix surfaced **+40 swallowed findings** (the checkboxes, the tablist, the
aria twin) on the same bytes.

Two smaller instrument findings, recorded rather than absorbed:
`no-latin-digits.bad.html` covered only the input-value shape — co-shaped with
the implementation, the same failure §50.4 found in `persian.bad.tsx`; it now
carries the live `div aria-label` poison. And `no-latin-aria` turns out to have
NO `[hidden]` skip at all — a pre-existing policy divergence this work found,
scoped around, and deliberately did not change: making announced-string rules
agree about `hidden` is its own decision.

**What this run does and does not prove.** It vindicates the enforcement layer
on first contact — the layer caught its poison, found real exclusion defects
shadcn's stack shipped, and found a defect class in its own machinery; and the
run is reproducible in one command. It does NOT yet prove the production case:
that target is an example app, and the production run is still the
experiment §50 rests on. Sonner-leak, checkbox and digit fixes belong to the
app, not this log.

So clause 1 stays described and not performed, deliberately, and this section
records why rather than letting it read as neglect. The unblocking work, in
order:

1. Grade **the catalogue product**. It is the strongest evidence available: a shadcn product with
   measured defects (193 Latin vs 175 Persian digits in `fa.json` values, an
   untranslated `sr-only` "Close", `aria-label="menu"` on a `lang=fa` page). A
   clean run falsifies the enforcement layer; a dirty run vindicates it. Either
   answer is worth more than another review pass.
2. Decide what `apps/website` becomes — deleted with its subject, or rebuilt as
   documentation for the five surviving packages, which would give the grader a
   permanent corpus that matches the product.
3. Then, and only then, clause 1.

- **Clause 1 is not implemented,** and §50.5 explains why it must not be yet.
  `packages/ui` and `packages/blocks` still build, register and gate. The section
  must not be read as a report of completed work.

### What this decision does NOT rest on

The grader has still never been run against a product's served bytes. That
experiment is owed and is the first item of work: if it returns substantively
dirty, the enforcement layer is vindicated and worth packaging properly; if it
returns clean, `tsc` plus 80 lines of ESLint plus author discipline was already
the whole answer. **The scope decision above is independent of that result** —
86 of 144 registry items were never copied by anyone, and 1 of 30 blocks — but
the *value of the enforcement layer* is not, and this log should not claim it is
until the run exists.


---

## §50.6 — clause 1 executed: the component library is deleted, and the chain is green without it (31 Aug 2026)

**Decided 31 Aug 2026**, after §50.5's first product run: include the
narrowed Lumo in both example projects, and delete the code that no longer
earns its carry. §50.5's blocking condition — the graders' only corpus was the
showcase — was resolved by the example runs replacing the showcase as corpus,
and by the deletion being chosen with that trade stated.

**Deleted** (~112k lines): `packages/ui` (114 components), `packages/blocks`
(30), `apps/website` (42k), `evidence/` (Playwright over the site), the
registry/catalog/api artefacts and their eight scripts, `eslint.consumer`
config, the CLI's distribution commands (search/info/list/deps/add/diff/upgrade
— the registry they read is gone), `scripts/lib/consumer-copy.mjs`, and
`packages/dates/src/twin.test.ts`, which deleted itself with its twin exactly
as written.

**Kept, deliberately**: `packages/mobile` whole — two Flutter consumers resolve
`lumo_ui_mobile` by local path, so it is load-bearing, not "unneeded"; its
gallery and all seven mobile gates; `packages/gate` whole (the inert-props tier
included — tested code that grades any owned copy on request); and every
v0.1.x/v0.2.x tag, which is where consumers' `lumo.lock.json` originals
resolve.

**Rewired**: `verify` is fifteen gates (was 22) and runs green end to end on
this commit. `gate:mobile-demos` no longer validates slugs against the web
catalog (parity retired, clause 5) and its manifest moved to
`apps/mobile-gallery/`. `check-pack` and the root `files` allow-list ship
`grade-app.mjs` instead of the registry. The workspace catalog dropped 22
orphaned pins (react-aria-components' poison-twin pin among them — the twins
lived in `packages/ui` and are gone); `@internationalized/date`, `clsx` and
`tailwind-merge` stay because `check-versions` compares contract-package
literals against them. Versions: **0.3.0 everywhere**, CHANGELOG leads with the
retirement entry and the no-op migration.

**Docs**: README, thesis, verification, llms.txt, the consumer skill and
agent-consumer.md rewritten to the narrowed reality;
the architecture, codebase, APG, goals and rubric sheets retired with their
dates. This log stays append-only; nothing was struck.

**What §50.5 still owes after this**: the production run, the
`no-latin-aria` hidden-policy decision, and — new — the example projects as the
standing corpus: both get the narrowed Lumo wired in and graded, which is the
other half of the instruction and the next entry's subject.


---

## §50.7 — both example projects wired, graded, and standing as the corpus (31 Aug 2026)

The other half of §50.6, done. Both examples install
the narrowed Lumo as `file:` dependencies and their served bytes now grade
clean of every defect the apps can fix:

| target | first grade | final | what remains |
| --- | --- | --- | --- |
| the Persian-only example (shadcn Base UI, fa-IR) | **306** | **6** | Next's `_global-error` shell |
| the trilingual example (shadcn Radix + Lumo dates, en/de/fa) | **434** | **4** | Next's `_global-error` + `_not-found` shells |

**The trilingual run is the first real consumer adoption of `@lumo-ui/dates`**: its
local `calendar-datelib.ts` copy is deleted and both calendars import the
package — which surfaced the two honest migrations a consumer meets
(`lumoCalendar(locale, strings.calendar)` grew its second argument in 0.2.x;
the deprecated `FORMAT_LOCALE` map became `formatLocale(locale)`), and proved
the package compiles in a real Next app outside this workspace.

**The corpus did its job on the harness, again.** Grading the second target
found two staging defects in `grade-app.mjs` the first target could not:
a multi-locale app's `/en/` documents were being staged under the declared
locale and graded as Persian (documents with their own locale segment now keep
it), and Next emits a locale's root page as a bare `de.html`, which graded as
the declared language (a basename that is a language tag now stages as that
locale's index). Each fix shipped the day its target was first graded.

**A framework-artifact class is now documented rather than hidden.** Next 16
prerenders its internal `_global-error` (and root `_not-found`) shells —
`<html>` with no `lang`, no `dir`, English copy — even when the app ships
custom boundaries; the custom ones render at runtime. Ten violations across
both examples are this class. They stay flagged: a no-JS reader on a hard 500
still receives English LTR, and an allowlist would hide exactly that. Upstream
is the only real fix.

**What made static grading possible at all**: that app's `<html>` moved into
`[locale]/layout.tsx` — the old root layout read `getLocale()`, a request API,
which forced every route dynamic and made `next build` emit ZERO documents.
A param is static; a request header is not. That pattern note belongs to any
Next consumer that wants `lumo gate` in CI.

One catalog lesson worth repeating: next-intl's `{count}` interpolation inserts
LATIN digits under `fa`; `{count, number}` formats in the locale. The trilingual
example's `fa.json` carries the corrected form.

Fix inventory on the apps (their own commits carry the detail): unnamed
controls 99 → 0 on the trilingual example (newsletter field, icon-only submit, password
toggles, profile tablist named and given a first-byte tab stop); ~70 new
catalog keys; `formatNumber` at every numeral a reader sees; mock dates in the
reader's calendar; brand wordmarks, press names, store badges, device mocks
and order codes marked `data-lumo-latn` — marked, not excused.


---

## §50.8 — what `lumo_ui_mobile` is, why it is still a 146-widget roster, and the stated direction (31 Aug 2026)

Asked directly, so answered here rather than in a chat scrollback.

**What it is.** `packages/mobile` is a Flutter package: 146 widgets wrapping
Material's widget layer with the Lumo contract — required announced strings,
direction from the locale, `formatNumber`, tokens generated from
`packages/theme` (`gate:flutter-tokens` keeps the two platforms agreeing about
what `md` or `accent` mean) — plus the semantics grader, which is the mobile
counterpart of `lumo-gate`: 210 gallery renders walked as SemanticsNode trees,
rule classes with poison fixtures.

**Why it survived §50.6 unchanged.** Two Flutter consumers resolve
`lumo_ui_mobile` by LOCAL PATH — it is a package dependency, not
copy-in. Deleting or shrinking it breaks their builds the same day. The web
library could be retired precisely because its consumers own copies; mobile's
cannot be, yet.

**The direction, stated.** The architecture is: component code is
MANAGED UPSTREAM (shadcn/Base UI on web, Material on mobile) and Lumo is the
correctness layer. Applied to mobile, that means the roster is the same
over-management §50 removed on web, and the §50-shaped target is:

```
keep   tokens bridge (theme → Dart), the locale/strings contract,
       the semantics grader and its gates
retire the 146-widget roster — consumers use Material widgets directly,
       with a thin set of Lumo extensions only where Material cannot be
       made correct from outside (the gap-filler pattern, like @lumo-ui/dates)
```

That is a MIGRATION in two consumer apps, not a rider on a docs-site commit.
It is recorded here as the direction; execution gets its own decision when a
mobile consumer is next actively worked on. Until then the roster is kept
green (it is load-bearing) and simply not grown — the same freeze-then-narrow
sequence the web went through between §50 and §50.6.

## §51 — the consumer contract: how every consumer project stays on the same core (31 Aug 2026)

The requirement: components are managed upstream (shadcn/Base UI on
web, Material on mobile), but ALL projects share the same core and must not
diverge. The mechanism, made explicit — each line is enforced by a named
instrument, because §50's whole lesson is that unenforced convention drifts:

| shared thing | carried by | divergence caught by |
| --- | --- | --- |
| Locale contract (direction, digits, calendars, required strings) | `@lumo-ui/core`, installed from ONE git tag, never copied | `lumo doctor` (pin skew), compile (required strings) |
| Design tokens | `@lumo-ui/theme` — same tag; shadcn's `--primary`/`--background`/`--radius` are BOUND to Lumo `sys` tokens in one `@layer lumo.brand` block per app | `gate:flutter-tokens` proves web↔mobile agree; visual drift is a brand-block diff, one file per app |
| Component code | shadcn/Base UI copies (web), Material (mobile) — UPSTREAM-managed; a copy is regenerated with `shadcn add`, then re-hardened | the ~13 English registry strings: translated in the copy; regression caught by the gate, not by review |
| The RTL/lint policy | `@lumo-ui/config` — one dependency-free file | `gate:lint` in each repo's CI |
| The oracle | `lumo gate` / `grade-app` over served bytes in every product CI | the gate itself; floors per route where digits are dense |
| The recipe | `docs/agent-consumer.md` §0 — one install block, one wiring checklist | `lumo doctor` says which piece is missing |

**What deliberately MAY diverge**: the copies. A project edits its shadcn
copies freely — that is the copy-in model working. The contract only claims
the four invariants above; §50.6 removed the machinery that claimed more.

**Version discipline**: every consumer pins ALL `@lumo-ui/*` specifiers to the
same tag (lockstep is checked by `check-versions` here and read by `doctor`
there). A fix reaches consumers as a new tag; there is no silent drift channel
because there is no npm range anywhere.

**§50.1 is CLOSED by measurement**: shadcn's `base` styles pin
`@base-ui/react` (measured on the Persian-only example, style `base-nova`,
ships `^1.7.0`) — the live
package, not the dead `@base-ui-components/react` RC. `@lumo-ui/base-ui-ssr`
therefore stays, and its peer range `>=1.7.0 <1.8.0` matches what shadcn
installs.

**The docs site is the contract's own showcase**: `apps/website` (rebuilt this
commit) is a shadcn-built, Lumo-wired static export — the components are
shadcn's copies, the correctness is core/theme/dates, and `gate:html` grades
the result in `verify`. The site is simultaneously the documentation of the
recipe and the standing in-repo corpus §50.5 said the gate lost.


---

## §52 — three consumers on the same contract, and what wiring them found (31 Aug 2026)

The two example apps and a Flutter consumer's marketing site now each compose
the RTL lint policy and grade their own served bytes (`pnpm gate`,
`pnpm check`). §51 described the contract; this is it applied three times, and
the three applications disagreed in ways worth recording.

**The same rule, opposite fixes.** Both example apps had physical direction
utilities. The correct mapping is not a constant:

| app | shape | mapping | why |
| --- | --- | --- | --- |
| the Persian-only example | RTL-only (`fa-IR`) | `right→start`, `left→end`, `mr→ms` | in an RTL-only app the physical right IS the reading start; the naive mapping would have mirrored every page |
| the trilingual example | trilingual, LTR default | `right→end`, `left→start`, `mr→me` | preserves the en/de rendering exactly and fixes `fa`, which had been rendering physically |

A codemod that "converts physical to logical" without asking which of these it
is would silently break one of the two. The rule exists to force the question.

**Counts.** The Persian-only example 24 findings (22 physical + 2 hand-written
`<html>`); the trilingual one 39 (26 physical, 1 `<html>`, 12 unused bindings
left by earlier localization work); the third 1 (the `<html>`; it uses its own CSS, so the
physical half of the policy has nothing to catch and says so by passing).

**`LumoHtml` removed a branch, not just an attribute.** The trilingual app's root layout
kept a plain `<html dir="ltr">` for German on the theory that Lumo's `Locale`
was the closed union it stopped being at §28. `LumoHtml` takes any BCP-47 tag,
so German needed no branch — it needed one only while a human was stating the
direction. The first attempt also made `toLumoLocale` total and broke the
build: `/de/reserve` then rendered a Lumo form with no German strings to
announce. Two different questions were sharing one function, and both are now
written where they are asked — `LumoHtml` asks "what direction is this tag",
`toLumoLocale` asks "does Lumo SHIP strings for this language" and stays
partial.

**The gate had a false positive, found by the third consumer.** `lang-dir`
compared the whole tag, so a consumer's legitimate `<html lang="en">` failed an
`en-US` route. A synthesiser is chosen by LANGUAGE; `en` there is less
specific, not wrong. Now compared on the primary subtag, pinned from both
sides — the founding defect (`lang="en"` on a Persian page) is a different
language and still fails. Region and script keep full precision where they
decide something: `no-latin-digits` and `native-calendar` grade from the
route's locale, untouched.

**"The look does not change" is measured, not asserted.** Headless Chromium,
clean builds on both sides, working-tree state asserted before each capture:

- the Persian-only example — 5 routes, **0 differing pixels** of 1,152,000 each
- the trilingual example — en/de/rooms/booking/about **0**; the `en` home reads 0.66%, which a
  same-build control run reproduces at 0.60% (the marquee's CSS animation);
  `fa` moves 0.04% against a 0.001% control floor, which is the RTL fix landing
- the Flutter consumer's site — desktop and mobile full-page, **0** of
  4,928,000 and 1,908,660

An earlier comparison was invalid and is recorded here because the
methodology matters: a `git stash pop` had silently not applied, so it compared
the committed build against itself and reported a perfect zero. Every
comparison above now asserts the tree state before capturing.

**Residues.** 6, 4 and 2 across the three — every one of them Next's internal
`_global-error` / `_not-found` shells, which the framework prerenders with no
`lang`, no `dir` and English copy even when the app ships custom boundaries.
Left flagged, not allowlisted: a JS-off reader on a hard 500 receives exactly
those bytes. The docs site is the one place this is fixable, because a static
export owns its error documents (`scripts/own-the-404.mjs`).

## §53 — the mobile grader ships, a consumer owns its widgets, and the first run found nine defects (31 Aug 2026)

§50.8 left the mobile half stated but not executed: `lumo_ui_mobile` shipped a
146-widget roster and kept its grader inside `apps/mobile-gallery`, so a
consumer got the components and no way to check its own screens. A consumer had
noticed — `test/contrast_test.dart` re-implements WCAG luminance by hand,
because the thing that already did it was out of reach.

Both halves are now the other way round.

**The grader ships.** `packages/mobile/lib/src/testing/semantics.dart`, behind
`package:lumo_ui_mobile/testing.dart`. It is the gallery's rule set made
generic: `lumoAnnouncedTree(tester, of: <Finder>)` takes the subtree to grade as
a parameter, so an app points it at its own screens. `flutter_test` is a real
dependency rather than a dev one, which is what makes it importable from a
consumer's test — the standard shape for a test-support library. The gallery
now consumes the package (`semantics_rules.dart`, 230 lines to 118) through
adapters that keep its own "demo" vocabulary, so one rule set has two callers
instead of one implementation and one copy.

**The consumer owns its widgets.** The seven it used — button, text field, switch,
search field, empty state, segmented control, toast — were copied verbatim into
the app's own `ui/` directory, `Lumo*` renamed to its own prefix, comments and all. This is the
web arrangement exactly: shadcn's copies live in the app that renders them, and
Lumo enforces the invariants from outside. Every token, style and scope type
the copies read is still Lumo's, which is why the rendering did not move — 292
tests pass, including the ones that render every screen in English and Persian.

Nothing was deleted from `packages/mobile`. That consumer is off the roster; the
gallery is not, and the gallery is the grader's corpus. Retiring the roster is
therefore a decision about what replaces that corpus, and it is open.

**One coupling had to be cut first.** `styles.dart` imported `button.dart`,
`card.dart` and `item.dart` to name the enums keying its own maps — a
dependency pointing the wrong way, and the single thing preventing the token
layer from shipping without the widgets. The five enums moved into
`styles.dart`. The consumer found it: its copy re-declared `LumoButtonVariant`, and
every `s.background?[variant]` in the copy then indexed the theme's map with a
type that could never match a key. That compiles. It returns null, and every
button silently falls back to its hard-coded colour. The analyzer's name for it
is `collection_methods_unrelated_type`.

**What the first production run found.** Eleven screens, two locales.

*Four defects in the grader itself*, none of which the gallery could have
surfaced:

1. `SemanticsData.tooltip` was never read. `IconButton(tooltip:)` names a
   control through that field and never through `label`, so thirteen correctly
   named buttons in that app were reported unnamed. No demo in the gallery could
   have caught it: every one passes an explicit `label`, so nothing there has
   ever been named by a tooltip.
2. `engine-english` fired on any string *containing* a UI word, so the muscle
   group «Upper back» was reported as Material's «Back» affordance. It now
   requires every word to be chrome or filler. An untranslated content word is
   a real defect; it is a different one, and mis-attributing it sends a reader
   into `MaterialLocalizations` after a string the app hard-coded.
3. Violations were unlocatable — thirteen arrived saying only "an interactive
   node has no label". They now carry a rect and the nearest named ancestor.
4. That rect was then wrong: `SemanticsNode.rect` is in the node's own
   coordinate system, so the first version reported three different controls as
   "48x48 at 0,0". The walk now accumulates the transform, which also fixes the
   ancestor test, which had been comparing rects across coordinate systems.

*One defect in the harness*, and it nearly shipped as seven bug reports.
`activeLocaleProvider` reads the stored-or-device locale; the harness set only
the `MaterialApp`'s. `Localizations` therefore said Persian while
`displayUnitsProvider` still read English off the device, and the grader
correctly reported «80 kg» and «330 kcal» announced under `fa`. The app was
right; the mount was lying. A grader is only as truthful as the harness beneath
it, and the fix is one override making both paths read one locale.

*Three real defects in the consumer app*, which is what the exercise was for:

- `measurements_screen.dart` interpolated the English words `reading`/`readings`
  inline while `measurementsReadings` sat translated in both `.arb` files.
- `Tag` overflowed its row by 18 px on Today and 56 px on Train under `fa` at
  360 dp — Persian runs longer than the English the layout was eyeballed
  against, and the clipped end was painted over with debug stripes. Found only
  because grading fixes a phone-sized stage; the existing screen tests run at
  800×600 and never saw it.
- The height and birth-year fields announce ASCII, correctly, and had no way to
  say so.

**`kLumoLatnIsland`.** That last one is the web's `data-lumo-latn`, on mobile.
The case is identical on both platforms: a numeric ENTRY field holds ASCII
because the thing that parses it requires ASCII. The web infers it from
`input[type=number]`, which the HTML spec defines as an ASCII floating-point
value; a Flutter semantics node carries no keyboard type, so the app declares
it. It suppresses the digit rules only, and only on the value — a fixture holds
that line by requiring an unnamed control inside an island to still fail. It
lives in the shipped library, not in `testing.dart`: the code that declares an
island is production code and has no business importing a test library to name
a constant.

Every rule change carries a poison fixture drawn from the field defect rather
than written beside the implementation — the discipline that caught
`persian.bad.tsx` and `no-latin-digits.bad.html` twice before.

**Still open.** The roster narrowing above. And no `v0.3.0` tag exists: the
consumer now needs `testing.dart` and `kLumoLatnIsland`, neither of which is in v0.2.6,
so its pin is a promise the repository has not yet kept. A local
`pubspec_overrides.yaml` is carrying it, which is exactly the situation that
override is supposed to make visible rather than hide.

## §54 — the mobile roster is retired, and both Flutter consumers own their components (31 Aug 2026)

§53 left this open in one sentence: "That consumer is off the roster; the gallery is
not, and the gallery is the grader's corpus. Retiring the roster is therefore a
decision about what replaces that corpus." This is that decision, executed.

**Deleted.** 73 files and 21,326 lines of `packages/mobile/lib/src`, 75 test
files and 12,242 lines beside them, and `apps/mobile-gallery` — 73 files, 6,778
lines, 120 demos. With them: `gate:flutter-contract`, `gate:mobile-demos`,
`gate:mobile-api` and `mutation:mobile`, which graded nothing else, and
`mobile-api-reference.json`, generated for a docs site retired in §50.6.
`verify` goes from sixteen gates to thirteen.

**Kept: eight files, 2,153 lines.** `scope.dart` (locale to direction),
`tokens.g.dart` (generated from the same `tokens.css` the web reads),
`styles.dart`/`styles.g.dart`, `format.dart`, `jalali.dart`, `latn.dart`, and
`testing/semantics.dart`. The closure was computed before anything was deleted
and it leaked nowhere: not one of the eight imports a widget.

**The corpus is now a consumer, not a showcase.** `apps/mobile-example` is a
Material booking screen — `FilledButton`, `TextField`, `SegmentedButton`,
`SwitchListTile`, `SnackBar` — that takes direction, tokens, digits and the
Jalali calendar from this package and is graded in both locales by the shipped
grader. It is the mobile `apps/website`: that one is a shadcn app graded by
`gate:html`, this one is a Material app graded by the semantics grader, and
neither shows off a Lumo component because there are none left to show.

The old arrangement was circular and §53 proved it empirically. The rules were
written beside the widgets they graded, so a defect class neither had thought of
was invisible to both — 120 demos in two locales had never once exercised a
control named by `SemanticsData.tooltip`, because every demo passed an explicit
`label`. One afternoon against a real app found four grader bugs. The example
carries an announced-node floor for the same reason the web gate carries
`persian-digit-floor`: every rule passes trivially on an empty tree, and an
empty tree is one rename away.

**Both Flutter consumers migrated, and neither look changed.**

The second Flutter consumer was the roster's reference app: 42 symbols across 22
files. It vendored 26 files and 5,937 lines into its own `ui/` directory,
`Lumo*` renamed to its own prefix, with
`calendar.dart` and `date_value_box.dart` deliberately left off its barrel
because they were internal to the date widgets and stay internal. The proof is
its own golden tests, and the methodology matters more than the result: **61 of
them were already failing at HEAD**, so a green run was never available as
evidence. What is evidence is that the failing SET is identical and every
percentage matches to two decimals. Those 61 are stale for reasons that predate
this work and are not touched here — regenerating them would destroy whatever
regression they are holding.

Getting that comparison honest took two tries. The first run showed 38 goldens
drifting by 0.03–0.07 points, which looked like the vendoring moving pixels. It
was not: editing `pubspec.yaml` invalidated the lockfile, and `flutter pub get`
took `lucide_icons_flutter` from 3.1.15 to 3.1.17. That app draws Lucide glyph
paths, so the icons changed shape. Restoring the committed lockfile returned
every percentage to the baseline exactly.

It also surfaced a real dependency bug the move exposed rather than caused:
`otp_field.dart` formats its own digits with `intl`, which the app had only as a
DEV dependency because `lumo_ui_mobile` supplied it transitively. Vendoring the
file made it a runtime dependency that was not declared — the precise defect
class `gate:mobile-smoke` exists to catch, appearing on the consumer's side of
the line.

**One retirement was wrong and was reverted within the hour.** `LumoCardStyle`
and `LumoItemStyle` were dropped on the grounds that nothing read them. True of
`LumoItemStyle`; false of `LumoCardStyle`, and only because the second consumer
had not been migrated yet — its vendored card resolves `LumoStyles.of(context).card`. It
is restored. The surviving families are now chosen by evidence rather than
symmetry: a style family stays while some consumer's own component reads it,
which is what this surface is FOR now that the components are theirs.

**Two gates were rewritten, and one of the rewrites was caught being vacuous.**
`gate:mobile-smoke` read its symbol list from `mobile-api-reference.json`, which
no longer exists. The obvious replacement was to read the barrel — and a poison
test said no immediately: delete an export and its symbols leave the expected
list too, so the gate passes and the exact defect it was built for becomes
invisible. It reads `lib/src/**` now for what EXISTS and the barrel for what is
REACHABLE, and dropping `export 'src/latn.dart'` fails it. A gate whose
expectations come from the thing it grades can only ever agree with itself,
which is the same sentence as the paragraph about the gallery.

`build-mobile-styles.mjs` emitted its three helpers unconditionally, harmless
only while three families between them used all three. One family left
`_lerpIconTheme` with no caller and `flutter analyze` failing on the file the
generator writes. It emits a helper only when a family calls it now — and the
first attempt at THAT tested for `name(`, which silently dropped `_lerpMap`,
because a generated call can carry explicit type arguments.

**Still open.** No `v0.3.0` tag exists. Both consumers now pin it and neither
can resolve it; two gitignored `pubspec_overrides.yaml` files are carrying them.
Those 61 stale goldens are the consumer's own to explain. And `apps/mobile-example` is
one screen — it should grow whenever a rule needs a case the screen does not
have, which is the only honest reason to add to it.

## §55 — the `[hidden]` divergence closed, and what the mutation campaign found once it had nothing to hide behind (31 Aug 2026)

Two open items, and a third that turned up while closing them.

**`no-latin-aria` now skips hidden subtrees, like the other eight.** §50.5
recorded the divergence and left it open: eight rules skipped
`[aria-hidden="true"],[hidden]`, this one skipped neither, and nobody had
written down why.

The interesting part is the direction NOT taken. The tempting fix was the other
one — stop skipping `[hidden]` everywhere, on the argument that `aria-hidden`
says "not in the accessibility tree" while `hidden` says "not relevant YET", and
a closed dialog ships its strings and announces them on a click. That is a good
argument. It was measured against the docs site and both example apps — 114
documents — and produced **zero** new violations, and it contradicts a position
§50.5 states and tests in both directions ("without the second someone widens
the id match and genuinely hidden UI starts being graded as if a reader could
reach it"). Reversing a documented, tested decision on zero evidence is not
rigour. The React-streaming case that position was carved for stays handled
where it belongs: `gradeHtml` un-hides `S:` containers before any rule runs.

The relaxation is pinned from both sides, because a relaxation is the easier
half to lose by accident.

**`mutation:mobile` survived the retirement and got stronger.** It graded 13 of
76 families with a floor of 63 unproved. There are four files left that can
carry a promise; all four have an operator and `PENDING_FLOOR` is 0. It now
covers the package rather than a sample of it.

Its first run after the narrowing killed two of four, and both survivors were
real.

**`scope.dart` survived**, which means the direction operator inverted
`directionOf` — RTL to LTR, every layout mirrored the wrong way — and every test
in the package still passed. "A layout mirrors because the language changed, and
not because someone remembered to flip a flag" is the first line of the README,
and the only thing asserting it lived in `apps/mobile-example`. That was
survivable while the package was mostly widgets whose own tests happened to
build a `LumoScope`; it stopped being survivable when they left and `scope.dart`
became one eighth of the product. `test/scope_test.dart` is that mutant's
headstone, and it tests the thing rather than the implementation: eight
right-to-left languages, not just Persian, and six words that BEGIN with a
right-to-left subtag («fake», «here», «used») which a `startsWith` would get
wrong.

**`format.dart` survived, and the harness was at fault.** The operator's search
string appeared in a doc comment quoting the very line it meant to change, and
`String.replace` takes the first occurrence. The campaign mutated prose, the
tests passed, and the report said "the family's test was not watching" — which
was false, and is the worst sentence a verification tool can produce. It blanks
comments before counting and splices at the offset found in the blanked source
now, so a comment-only match is a startup error with the count of each.

**A third thing fell out: `formatNumber` threw on an unsupported locale.**
Writing `format_test.dart` — a file that had never existed, for a function every
consumer calls — turned up `ArgumentError: Invalid locale "zz"`. Three reasons
that is a defect and not strictness: `formatLumoDate` in the same package
already falls back and says so in its own comment, so two formatters with one
contract disagreed on the same input; the web counterpart's `Locale` type is
open and `Intl.NumberFormat` resolves rather than throws; and `LumoScope` takes
any `String`, commonly fed from `PlatformDispatcher.instance.locales`, so a
language tag could take down a screen in release on a device nobody tested. It
falls back to `en` — deliberately not to something silent, because Latin digits
on a screen that expected Persian ones still look wrong to whoever is reading.

**`latn_test.dart` reads the web's source, on purpose.** The island operator
renamed `kLumoLatnIsland` and survived, and it looked equivalent: renaming a
constant renames its readers in the same move, so the app declares and the
grader looks for the same new string. It is not equivalent. The value is half a
pair — `data-lumo-latn` in `packages/gate` is the other half — and nothing in
either package could notice the two drifting apart. So the Dart test reads
`../gate/src/rules.ts` and asserts the attribute is composed from the Dart
constant. Unusual, and the only place the "one contract, two platforms" claim is
actually checked rather than asserted.

## §56 — the production run: a live product graded on first contact (31 Aug 2026)

§50.5 named this as the experiment §50 rests on, and left it blocked on one
thing: the product had no `node_modules`. It does now. `pnpm install --frozen-lockfile`
and `next build` both pass unmodified, which is itself worth stating — the app
was not touched to make it gradeable.

**The corpus.** 68 documents, six languages — `ar` `de` `en` `fa` `ru` `zh` —
of which four are non-Latin scripts (Arabic, Persian, Cyrillic, Han). Every
document with its own locale segment is graded in ITS locale; only Next's two
locale-less shells fall to the declared `fa-IR`, which is the staging rule
`grade-app.mjs` learned in §50.7. Nothing about this product is Lumo's: it is
shadcn-built, written by other people, and the gate had never seen it.

**760 violations, 190 distinct.** The gap between those numbers is the finding
that changed the tool. Site chrome repeats on every route, so an instance count
measures the size of the export rather than the size of the problem: one rule's
225 instances are TEN strings — a header, a nav and a logo, across 44 routes.
"760 problems" invites a reader to turn the gate off. The CLI prints both
numbers now.

**Two genuine defects, and they are the ones §50.5 predicted.**
`aria-label="menu"` on the mobile navigation trigger and `aria-label="Main"` on
the nav, announced in English to Arabic, Persian, Russian and Chinese readers,
on every route in all four. `native-script-name` reports the same button
independently through the computed accessible name, which is two mechanisms
agreeing rather than one rule counted twice.

**The rest is Latin-by-nature content, correctly flagged and wrongly shaped.**
The company name, five people's names, an email address, a domain, phone
numbers, three street addresses, a copyright year. Every
one is legitimately Latin on an Arabic page, and no rule can know that from the
bytes — which is exactly what `data-lumo-latn` is for. The gate is behaving as
designed; the product has simply never been told how to say "this part is
Latin on purpose".

**What this settles.** The grader is library-agnostic — this is a shadcn
product with no Lumo dependency of any kind — and script-agnostic, having
produced correct, script-specific messages for Arabic, Persian, Cyrillic and Han
without any of those being configured. §50's central claim was that the rules
and the grader are the part worth keeping. This is the first evidence for it
from outside the repository that wrote them.

**Not fixed here.** It is a separate product and these are its findings to
act on: two aria-labels to translate and a set of islands to declare. Its
`node_modules` and `.next` are left in place — both gitignored — so the next run
costs nothing.

## §57 — the open list closed, and the look proved unchanged four ways (31 Aug 2026)

Everything §54–§56 left open, plus three defects found while closing them.

**`v0.3.0` EXISTS.** `main` and `develop` fast-forwarded to `ca8c1c2` and the
tag is cut there. This was the most damaging item in the repository and nobody
had ranked it that way: `llms.txt`, `docs/agent-consumer.md` (six specifiers),
`skills/lumo-ui/SKILL.md`, both Flutter consumers' pubspecs and the PUBLISHED
getting-started page all instruct a reader to install `#v0.3.0`, against a
repository whose newest tag was `v0.2.6`. Every one of those instructions failed.
Not pushed — that stays a person's decision.

**THE LOOK DID NOT CHANGE, and it is measured rather than asserted.** Four
independent arguments, because the constraint deserves more than one:

1. *The web, by construction.* Every runtime package a browser receives —
   `core`, `theme`, `base-ui-ssr`, `dates`, `config` — is byte-identical to the
   session's first commit. Only `gate` (a build-time grader) and `mobile`
   changed. `apps/website`'s own source is untouched. The two example apps
   therefore cannot have moved, and neither can the site.
2. *The first Flutter consumer, by pixel.* 11 screens × 2 locales at 390×844, rendered from a
   worktree of the pre-migration tree against the pre-migration library, then
   again from today's. With the two deliberate fixes reverted: **22 of 22
   identical, zero differing pixels.** With them in place, three differ, all
   Persian, all improvements — the `Tag` overflow (today-fa, settings-fa) where
   the baseline paints Flutter's red bar and yellow hazard stripes over clipped
   text, and the `measurementsReadings` translation.
3. *The second Flutter consumer, by byte.* Its 61 goldens were ALL failing, and
   had been before any of this work. Rendering that app at its pre-migration
   commit against `lumo_ui_mobile` rolled back
   to `1922b02` — its state the day the goldens were shot, 21,834 lines and the
   whole roster ago — produced **61 of 61 images byte-identical to today's**. The
   library did not move a pixel of that app, and neither did the vendoring.
4. *The catalogue product, by document.* All 68 built documents are byte-identical once
   `aria-label` values are normalised.

**Those goldens were an environment artifact, and the diagnosis nearly went
wrong in an instructive way.** The first investigation concluded "SDK drift,
regenerate" with high confidence, on real evidence: this Mac was set up
2026-08-27, the goldens are from 2026-08-19, the SDK that made them left no copy,
English renders differ only by antialiasing while Persian differs by glyph
advances that change where text wraps. All true. But it never once examined
`lumo_ui_mobile` — the library the corpus exists to measure, whose own test
header says "does a real app on this library look the same after a library
change?". A diagnosis that skips the variable is not a diagnosis, however good
its evidence. The control above is what settles it, and it cost two worktrees.
Regenerated on Flutter 3.47.2; that suite is 85/85 where it was 24/61.

**Three defects found while closing the list.**

`announced-once` fired on Flutter's own `BackButton` and `AppBar` drawer button,
in every app and every locale. The `label == tooltip` case was added in §53
beside the code that made `tooltip` an announced field — written next to the
implementation instead of drawn from a defect, which is the discipline this
repository has broken twice before and paid for twice. Both widgets wrap an
`IconButton(tooltip:)` in a `Semantics(label:)` carrying the same string. It
never surfaced because neither the consumer's tab roots nor the example screen has a
back button. Removed, with a test that renders both widgets and requires them to
grade clean.

`apps/mobile-example` never exercised `engine-english`, so one rule in four was
untested by the corpus. Material's Persian localisations are correct, and
`showDialog` will not even open without the delegates — the real failure mode is
an app that sets its own locale and forgets `GlobalMaterialLocalizations`, which
is the default `MaterialApp`. That case is now in the corpus: same widgets, one
line of configuration removed, «Back» and «50%» announced under `fa`.

The catalogue product's fix shipped the literal message keys on the first attempt —
`aria-label="a11y.menu"` — and the gate caught it on the next run, which is the
whole point of having one. `SkipLink` resolves `a11y.skip` because it is a
server component; `SiteHeader` is a client component and receives only what
`clientMessages()` hand-picks.

**CI was red on every push and nobody had noticed.** `mutation` called
`mutation:components`, deleted with `packages/ui`; `evidence` ran a Playwright
suite whose specs, script, output directory and runbook are all gone. The first
is repaired to the campaign it can run, the second deleted along with its runbook.
Both Flutter steps are pinned to 3.47.2, the version
developers run — the `verify` job had been pinned to 3.35.2 under a comment
claiming that was "the version packages/mobile declares", when that file states
a FLOOR. A CI on a different engine cannot tell a real visual change from its own
drift, which is exactly what happened to those goldens.

**The audit that found most of this was itself audited, and needed it.** Its
factual core reproduced, but two evidence bullets did not match what the stated
commands produce, one claim was fabricated (no test pins the mobile README), and
three of its proposed actions were defective — including one that would have
dropped the docs site's Mobile page below the Persian-digit floor the same action
warned about. The replacement numbers here were checked against
`gate.floors.json` before being written: floor 6, renders 20.

**Left undone, deliberately.** The catalogue product's Latin-by-nature content — a brand, five
people's names, an email, a URL, phone numbers, addresses — is correctly flagged
and NOT marked with `data-lumo-latn`. `latn-island-purity` fails an island
holding mostly reader-script text, and marking those elements unconditionally
would create roughly sixty new violations on elements that were never violations
in those locales. It needs per-value conditional marking, which is a decision for
that product.

## §58 — an adversarial review, and the seven things it found that were real (31 Aug 2026)

Six probes, each refuted by an independent verifier before anything was
believed: the web rules, the mobile layer, cross-platform divergence, vacuous
tests, the consumer path, and coverage gaps. 91 findings, 37 refuted on
reproduction, 54 surviving. What follows is what was ACTED on; the rest is in
the run and is a queue, not a conclusion.

**The instrument had a hole where the escape hatch is.** `data-lumo-latn` is the
one thing that silences the gate and nothing bounded it. Measured before writing
anything: a Persian page carrying TEN violations drops to ONE when a single
attribute wraps it. `latn-island-purity` does not catch that and is not meant to
— it fails an island hiding READER-SCRIPT prose, while the useful abuse hides
LATIN defects, which is what the other rules exist to find. The survivor is the
unnamed button, because `named-controls` is not island-aware and should not be:
an island says "this text is Latin on purpose", never "this control needs no
name".

The fix is the shape this repository already had for the same vacuity. "Zero
Latin digits" passes trivially on a page with no numbers, and "zero violations"
passes trivially on a page that is entirely exempt. Not an absolute threshold —
there genuinely is none, a docs site full of code listings is legitimately more
exempt than a product — but a reviewed per-site baseline that may only fall.
`"@exempt-ceiling": 24` in the floors file, opt-in, so a site that commits none
keeps the printed-statistic behaviour that was decided deliberately.

**Three rules were passing vacuously on markup people write.**
`composite-tab-stop` matched items by `[role="…"]` alone, and nobody writes
`<button role="button">` — so a real Radix Toolbar of three `tabindex="-1"`
buttons, with no keyboard entry point at all, graded clean. The ceiling rule
beside it already saw those buttons, because it asks `isTabbable`: floor and
ceiling disagreed about the same elements. The three language rules read a
Persian digit as evidence of translation, because Persian digits carry
`Script=Arabic` — so «Page ۲ of ۱۰» was invisible to all thirteen, in exactly
the half-translated state they exist to catch. `latn-island-purity` never had
that bug; it builds `(?=\p{L})` for this reason, so the fix was the file catching
up with one rule inside it. And `INTERACTIVE` had never listed `progressbar`,
`treeitem`, `menuitemcheckbox`, `menuitemradio` or `toolbar`.

Measured across 182 documents in four corpora: the website stays clean, the
trilingual example and the catalogue product unchanged, the Persian-only
example 6 → 7. The new one is real — `<div role="progressbar"
aria-valuetext="۲۵٪">` with no name, so a reader hears «۲۵٪» and never what is
at 25%.

**The command the docs name as HOW YOU GRADE A PRODUCT could not run for any
consumer.** `grade-app.mjs` spawned `packages/gate/src/cli.ts` with
`--experimental-strip-types`, and Node refuses to strip types under
`node_modules` — which is exactly where the documented git install puts it. It
printed its own success line and then died in Node internals. It worked here and
only here, because a checkout is not under `node_modules`.

The fix was written down four files away: `lumo-cli.mjs` spawns `dist/cli.js` and
carries a comment explaining this precise Node behaviour. One of the two callers
had the knowledge. `gate:pack` could not see it because it asserted PRESENCE
while `docs/verification.md` claimed RUNTIME — every file WAS there. It now
extracts the tarball into a `node_modules`, symlinks the runtime dependencies the
manifest declares, and RUNS both commands.

**The grader was ungraded.** `lib/src/testing/semantics.dart` — the mobile
counterpart of lumo-gate, the file that reads every consumer's screens — had no
test file of its own, and `mutation:mobile` could not have said so: its scan was
not recursive, so the one file in a subdirectory was neither BEHAVIOURAL nor
PENDING, and the guard promising "a family added tomorrow cannot fall silently
into untested" never looked at it. Eleven operators found eight survivors. It has
seven tests now and an operator that dies against them, and the campaign is 5/5
with `PENDING_FLOOR` 0. Three documents said four files.

**And the ceiling I added an hour earlier had the same hole as its predecessor.**
It is armed by a KEY inside the floors file rather than by the argument, so
deleting one line turns a red build green while its four unit tests keep passing
— they call the function directly and never read the site's config. That is the
disarm route `persian-digit-floor` was memorialised for after failing it twice.
Pinned, and poison-tested.

**On method.** The verifiers earned their cost. They refuted 37 findings, caught
a proposed fix that would have dropped the docs site below its own digit floor,
corrected an axe-core claim (`columnheader` and `rowheader` do NOT require a
name, so adding them would have been a false positive), and reduced a
high-confidence "SDK drift, regenerate" verdict to "you never looked at the
library" — which turned out to be the finding. The tag is before all of it, so nothing
published moved.

## §59 — the three HIGH findings from §58's queue, and the one that was a silent regression (31 Aug 2026)

**`native-calendar` could not see the dates real formatters produce.** Rule 8 is
the one this repository calls its hardest-to-see defect — a date in the reader's
language and the wrong calendar, off by 622 years and green on everything else.
It was silently missing most of them, and had been since it was written.

It built its foreign-month list from `{month:"long"}`, the STANDALONE form. No
page renders a month standalone; a page renders a DATE, and neither way a
Persian page gets a Gregorian one produces that form. `Intl` with any date style
emits the ezafe — «۲۲ ژوئیهٔ ۲۰۲۴», where U+0654 is `\p{M}` and `datePattern`'s
trailing boundary refused to match through it — costing 4 of 12 months.
`react-day-picker@10.0.1`'s fa-IR locale, which is what shadcn's Calendar uses,
transliterates differently: «جولای», «آپریل» — costing 5 of 12.

July is in both sets, and «۲۲ ژوئیه ۲۰۲۴» is the string in the rule's own
`because` AND in its poison fixture, under a comment reading "this is exactly
what react-day-picker's v10 locale/fa-IR produces". It is not. That library
says «جولای». It is the one spelling of July that neither real generator emits —
the fixture was written beside the implementation in the form the implementation
could already see, which is the discipline failure this repository documents
paying for twice and has now paid for a third time.

`monthNames` unions three sources now, all captured rather than typed. 0 of 12
evade in either set. **One mistake worth recording**: the first version applied
the transliteration table to every calendar, so the Jalali `native` list
absorbed the Gregorian names and `foreign.filter(n => !native.includes(n))`
deleted all of them — the rule went from missing 4 months to missing 12. Caught
by re-measuring instead of assuming the change was an improvement.

**The mobile grader could not see a wrong-calendar date, and this package emits
one.** Four rules, none of which read a date. The gap was not a consumer's
problem: `formatGregorianMonth(2024, 7, 'fa-IR')` — a public function in
`jalali.dart` — returns «ژوئیهٔ ۲۰۲۴», and the grader in the same package was
green on its own output, for all twelve months.

Rule 5 added, its month list captured from `formatGregorianMonth` itself plus
date-fns's transliterations. A `const` list rather than `DateFormat.MMMM('fa')`,
deliberately: that throws `LocaleDataException` until `initializeDateFormatting`
has been awaited, and a grader needing an async setup step is a grader people
forget to set up. A consumer's 22 graded screens — an app that formats dates on
most of them — report zero.

**Rule 14: the imperfective prefix joined with a space.** «می‌کند» is one word;
«می کند» is two, and `Intl.Collator("fa-IR")` calls them unequal at every
sensitivity while substring search fails in both directions. A live product
serves 29 of them across 11 Persian routes, interleaved with 96 correct joins in
the same files — one document has 17 broken against 5 correct, which is
inconsistent authoring and not a house style.

Deliberately narrow: the verbal prefix only. The comparative suffix has the same
orthography and «چوب تر» is wet wood; separating those needs a lexicon, and a
rule that cries wolf on correct prose is a rule people switch off. The residual
risk is in the rule's own comment rather than hidden — `می` is also "wine" — and
was measured absent from real content. The line-break argument was dropped from
the rationale because it is font- and width-dependent, unlike collation and
search.

Four corpora: the docs site 0 (73 correct joins, none broken), both example apps
0, and 17 in the product the defect came from.

## §60 — one package (31 Aug 2026)

Lumo installed as five git specifiers pinned to the same tag: `@lumo-ui/core`,
`@lumo-ui/theme`, `@lumo-ui/dates`, `@lumo-ui/base-ui-ssr`, and `lumo-ui` for
the CLI. It installs as one.

**The fact that settled it.** The root package's `files` allow-list has carried
`packages/*/src/**` since long before the retirements, so every consumer was
ALREADY downloading core, theme, dates and base-ui-ssr inside the `lumo-ui`
tarball — 236 KB of source with no `exports` map to reach it through. They then
installed the same code a second time as separate git dependencies. Collapsing
this does not add weight to anyone's install; it exposes what already shipped
and deletes four redundant wirings.

Nothing in the log defends the split. It is an inheritance from when this
repository published 114 components and 30 blocks, where per-package
dependencies and independent versioning earned their keep. After §50 and §54
there are five source directories and about 11,000 lines, all versioned
together, all bumped together, all pinned to one tag by `check-versions`.

**The one real argument for separate packages was the dependency surface**, and
it is kept without them. `dates` needs `react-day-picker`; `base-ui-ssr` needs
`@base-ui/react`. Both are OPTIONAL peers now, so a consumer who imports neither
subpath is never asked for either. `lumo-ui/gate` resolves to the committed JS
build and runs under plain Node; everything else stays TypeScript source for a
bundler, as it was.

**Cross-package imports became relative.** A consumer has no `@lumo-ui/core` in
`node_modules`, so `packages/dates/src/datelib.ts` reaches its sibling by path —
which resolves identically in the workspace and inside the tarball. Two runtime
files; the rest were tests.

**Two defects surfaced in the doing, both now guarded.** `packages/config/eslint`
sat outside the `files` allow-list, so `lumo-ui/config/eslint` resolved in the
workspace and `MODULE_NOT_FOUND` in an install — `check-pack` now requires the
target of every exported subpath, not just the CLI's files. And its dependency
symlink handled neither a scoped name nor a non-hoisted one;
`createRequire(...).resolve` is the obvious fix and the wrong one, because a
package may not export `./package.json`. `@internationalized/date` is both, and
found both.

**A third was self-inflicted and worth recording**: the codemod rewrote
`transpilePackages: ["@lumo-ui/core", …]` into subpaths. That option takes
package NAMES; a subpath matches nothing, and Turbopack then reports "Unknown
module type" on a `.ts` file it was never told to compile. It is one entry now,
`["lumo-ui"]`, in all four consumers and in the published getting-started page.

**Verified from a real install**, not from the workspace: all ten subpaths
resolve, `lumo-ui/gate` runs and finds violations on a poison document, the
ESLint config loads. All four consumers migrated and their graded output is
unchanged — the two examples at 7 and 4, the docs site 0 over 16 documents — with every one
of them building and linting through the new specifiers.

The v0.1.x–v0.3.x tags stay fetchable with the old layout, so nothing pinned to
them moves. A consumer pinned at v0.2.6 is unaffected.

## §61 — the install is pnpm's, and 0.4.2's changelog claimed otherwise (31 Aug 2026)

Pushing v0.4.0 and then testing the documented install for the first time found
that `npm install github:Telarsa/lumo-ui#<tag>` has never worked, on any tag:

    npm error EUNSUPPORTEDPROTOCOL: Unsupported URL Type "workspace:"

npm prepares a git dependency by cloning the whole REPOSITORY and running
`npm install` inside it, devDependencies included, and it cannot parse pnpm's
private protocols. v0.2.6 fails identically, so this predates everything here.

Two rounds of removal followed, and BOTH were right on their own merits:

- **0.4.1** dropped three `workspace:*` devDependencies. All dead: `dates` and
  `base-ui-ssr` named `@lumo-ui/core`, which they import by relative path since
  §60; the root named `@lumo-ui/config`, which `eslint.config.js` has always
  imported directly.
- **0.4.2** stopped shipping the sub-package manifests. Nothing resolved through
  them — `exports` points at files, root and gate are both `"type": "module"`,
  no script reads one — and every one is full of `catalog:`.

**Neither made npm work, and 0.4.2's changelog said it did.** That entry was
written and pushed before the claim was tested against the pushed tag. It is
corrected in place with the correction marked, rather than quietly edited: the
`files` allow-list is irrelevant to a git install, so npm still reads the ROOT
manifest's own `catalog:` devDependencies and still fails.

**The resolution is to state the requirement, not to break the catalog.**
`pnpm-workspace.yaml` argues for `catalog:` at length — exact pins named once,
so an upstream change arrives as a reviewed bump and never as a silent
resolution difference between a laptop and CI, which is what keeps the
accessibility snapshots honest. `package.json` declares
`"packageManager": "pnpm@11.3.0"`. Every consumer in every repository here is
pnpm. Trading a documented decision away for a package manager nothing uses
would be the wrong bargain.

Verified on the pushed tag rather than the workspace: `pnpm install` of
`github:Telarsa/lumo-ui#v0.4.2` in an empty project installs 0.4.2, resolves all
six subpaths, and runs `lumo-ui/gate` against a poison document. That is the
claim the docs now make, and no more than that.

**What this cost, and the lesson.** Three tags in one afternoon because each fix
was verified against the workspace or a local tarball rather than against the
thing consumers use. `gate:pack` extracts and runs from an installed tarball —
which is why it stayed green through all of it, and why it could not see this:
a tarball install and a git install are different code paths in npm, and only
the second is what the docs tell people to do.

