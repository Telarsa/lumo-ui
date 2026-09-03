# lumo-ui/base-ui-ssr

**Base UI resolves several accessibility relationships in a layout effect. A
layout effect does not run on the server. This package resolves them during
render instead, using public props only — no patch, no fork, no import from an
internal module path.**

Verified against **`@base-ui/react` 1.7.0** and **React 19.2.8**.

If you server-render Base UI — Next.js RSC, a static export, anything that ships
HTML before JavaScript — some of your controls are being served with no
accessible name and no description. It self-heals on hydration, so nothing you
own is red. That is the whole problem.

---

## The measurement that made us write this

A 442-document static export of a component library built on Base UI, graded on
the **served bytes** — not on a jsdom tree, not after hydration:

| | `named-controls` violations |
|---|---|
| Base UI as composed, no workaround | **98** |
| After the naming fix only (Phase A) | 12 |
| After the naming fix reached the last shape (this package) | **0** |

442 documents graded, 0 violations, measured 2026-08-11. Every number in this
README is from a render or a build, never from reading a changelog.

98 unnamed controls is not a wiring mistake in the wrapper. It is one library
behaviour, repeated: a `<span role="checkbox">` served with `aria-labelledby`
absent, announced by a screen reader as a bare "checkbox", with the name arriving
only after hydration.

---

## What it fixes

### 1. Controls have no accessible name in the served HTML

`useFieldWiring`

Base UI names a control from `Field.Label` by publishing the label's id into a
context — inside `useIsoLayoutEffect` (`utils/useRegisteredLabelId.js`). Its
second route, scanning the DOM for an associated `<label>`
(`internals/labelable-provider/useAriaLabelledBy.js`), is in a layout effect too,
and it MUTATES the DOM (`label.id = generatedLabelId`), so it could never be
anything else. Both naming paths are inert during a server render, and
`explicitAriaLabelledBy ?? labelId ?? fallbackAriaLabelledBy` yields `undefined`.

A wrapping `<label>` does not save you. A native `<label>` names only labelable
ELEMENTS, and a `<span role="checkbox">` is not one — the only labelable element
inside is Base UI's own `aria-hidden="true"` proxy input, which is removed from
the accessibility tree. **This is what makes the defect Base UI-specific rather
than a general SSR caveat: a library that exposes a real `<input>` is named by
the platform with no JavaScript at all.**

Measured, bare Base UI, no Lumo code involved — this is a test in this package,
asserted to reproduce:

```
renderToStaticMarkup(
  <Field.Root><Field.Label>پذیرش شرایط</Field.Label><Checkbox.Root /></Field.Root>
)
→ <span role="checkbox" …>  with no aria-labelledby and no aria-label
```

### 2. Descriptions and error messages are announced by nothing

`useFieldWiring` (same hook, same `useId`)

`Field.Description` reaches the control through the same machinery —
`useFieldRootContext`'s `descriptionId`, registered from a layout effect. The
description element even gets an `id`; Base UI mints that during render. Only the
REFERENCE is missing.

**This half has a violation count of zero in every instrument we own**, and had
one before we looked. An accessible-name rule grades names, and a dangling-idref
rule that included `aria-describedby` would false-positive on other engines. Zero
violations, real loss: the help text under a field is not announced to a no-JS or
pre-hydration reader. WCAG 1.3.1 / 4.1.2.

If you take one thing from this README, take this one — it is the half nobody is
counting.

### 3. Overlay triggers cannot state their own state

`useOpenMirror`

`Menu.Trigger` serves `aria-haspopup="menu"` and no `aria-expanded`; the
attribute appears only after mount. `Dialog.Trigger` and `Popover.Trigger` DO
emit it at SSR in the same build, so this is an inconsistency rather than a
policy. A tooltip trigger's `aria-describedby` has the same shape of problem in
reverse: it must point at the popup only while the popup exists.

Base UI's overlay roots are uncontrolled by default and expose no way to read
their open state, so the wrapper keeps its own copy, seeded from `defaultOpen`
and advanced from `onOpenChange`.

**The trap this documents is worth more than the fix.** Base UI resolves a
conflict between its own `aria-*` and the caller's by letting the CALLER win — so
the naive workaround, a hard-coded `aria-expanded={false}`, survives onto an
**open** trigger. A constant is a worse defect than the gap. Emit the real value
or emit nothing.

### 3b. A server-rendered composite cannot be reached with the Tab key

`useCompositeTabStop`

Every Base UI widget with a roving tabindex — Toolbar, ToggleGroup, Tabs,
RadioGroup — is built on `CompositeRoot`, and `CompositeRoot` decides which item
holds the stop on the CLIENT. The server therefore emits `tabindex="-1"` on every
item and `tabindex="0"` on none. Measured with `renderToStaticMarkup`, two items
each, bare libraries:

| | `tabindex="0"` | `tabindex="-1"` |
|---|---:|---:|
| Base UI Toolbar / ToggleGroup / Tabs / RadioGroup | **0** | 2 |
| React Aria TagGroup | 3 | 0 |
| React Aria ToggleButtonGroup | 2 | 0 |
| React Aria Tabs | 0 | 2 |

A control with no `tabindex="0"` anywhere in it is **unreachable by keyboard**
until hydration — not mis-ordered, unreachable. Read the React Aria column
honestly: its Tabs has the same hole and its TagGroup overshoots the other way
(three stops for two chips). Neither library serves a correct roving tabindex.
The difference is that React Aria's failure is degraded and Base UI's is total.

**The trap here is the same shape as `useOpenMirror`'s and it is worth more than
the fix.** A constant `tabIndex={0}` on the first item produces correct HTML and
then never gives the attribute back — measured, `<Toolbar>` with two buttons:
`0, -1` initially, `0, 0` after one ArrowRight, permanently. Two tab stops, a
control that looks and arrows correctly, nothing red. So the value has to EXPIRE:
`useSyncExternalStore` reports `false` on the server and during hydration and
`true` in the commit after, which is the one React API that promises exactly
that boundary.

Retired by `CompositeRoot` resolving its initial highlighted index during render
rather than in `useIsoLayoutEffect`. The information needs no measurement — it is
index 0, or the index matching `value`. **Not reported upstream** as of
2026-08-11.

### 4. There is no internationalisation of any kind

`baseUiStringsFor`, `BASE_UI_STRINGS`

Measured across all 3240 files of the 1.7.0 dist: zero locale bundles, zero
strings provider, zero key namespace, zero locale context. Of 83 export subpaths,
exactly two are providers (`./csp-provider`, `./direction-provider`) and neither
carries text. The library nevertheless speaks English in eight places. Seven are
reachable through an ordinary prop; this is the catalogue of the seven, keyed by
the file and line that emits each one.

The failure mode is quiet, and Base UI's own default demonstrates it: a range
slider announces `«۲۰ start range»` — **half** localised, the digits obeying
`Slider.Root`'s `locale` prop and the words around them not. A reviewer who does
not read Persian sees ۲۰ and passes it. Every one of the seven is an ARIA
attribute: invisible in review, invisible in a screenshot, wrong only to the
person listening.

So the catalogue's authored form makes the raw number **unreachable** — a
translator writes `` (v) => `${v} آغاز بازه` `` and receives an already-formatted
string, because reaching the number means `${value}`, a Latin-digit JavaScript
number interpolated into an ARIA attribute on a Persian page. `satisfies
Record<Locale, …>` makes a missing locale a compile error and a missing key a
compile error. There is no fallback, because a fallback is what puts an English
word in a Persian sentence.

The eighth string is **not reachable**, and that is recorded rather than worked
around — see below.

---

## Install and use

This package is not published separately and cannot be installed on its own. It
ships inside `lumo-ui` as the `lumo-ui/base-ui-ssr` subpath — one git dependency
carries the whole contract layer:

```jsonc
"dependencies": { "lumo-ui": "github:Telarsa/lumo-ui#v0.4.10" }
```

Use **pnpm**; `npm install` fails on the `catalog:` protocol this repository
pins with, which is deliberate. Inside the monorepo it remains the workspace
package `@lumo-ui/base-ui-ssr`, which is what `pnpm --filter` answers to.

```tsx
import { useFieldWiring } from "lumo-ui/base-ui-ssr";

function Checkbox({ label, description, ...props }) {
  const w = useFieldWiring({ label, description, explicit: props });
  return (
    <Field.Root>
      <Field.Label {...w.labelProps}>{label}</Field.Label>
      <BaseCheckbox.Root {...props} {...w.controlProps} />
      <Field.Description {...w.descriptionProps}>{description}</Field.Description>
    </Field.Root>
  );
}
```

Two modes, and the difference is a defect class:

- **`"aria"` (default)** — you render the label, so you can prove it exists; the
  control points at it with `aria-labelledby`. The only route available for
  `Checkbox` and `Switch`, whose control is a `<span role=…>`.
- **`"native"`** — your CONSUMER renders the label as a sibling you never see
  (`<Select><Label/><SelectTrigger/></Select>`). You cannot prove a label exists,
  so `aria-labelledby` would be a guess at an id that may never render — a
  dangling idref, which is a different defect, not a fix. The arrow reverses: the
  label carries `htmlFor`, the control carries the `id`, and if no label renders
  nothing is emitted and nothing dangles. Requires a real labelable control;
  `Select.Trigger` renders a `<button>`, which qualifies.

**It never relabels a control you already named.** An explicit `aria-label` or
`aria-labelledby` suppresses the naming arm entirely; an explicit
`aria-describedby` suppresses the describing arm. A `<Checkbox aria-label="…">`
in a table header has no visible label to point at, and wiring `aria-labelledby`
at an empty element would replace a correct name with none.

### Three rules this package holds to

1. **Public API only.** Nothing imports a Base UI internal module path; nothing
   patches `node_modules`. In fact this package **does not import
   `@base-ui/react` at all** — every fix is a value passed INTO Base UI, and
   passing a prop needs no import. `@base-ui/react` is a peer dependency because
   the fixes are verified against one version's *behaviour*, not because a symbol
   is linked.
2. **No `"use client"`, in any file.** The two hooks are hooks and are callable
   only from a component, but the modules carry no directive, so a server module
   may import and call `baseUiStringsFor`, `attr` and `findChildProp` during a
   server render. A directive here would drag every consumer's field component
   onto the client.
3. **No dependency on the component library it was extracted from.** `react`,
   `lumo-ui/core` (for `Locale` and `formatNumber`), and a peer on
   `@base-ui/react`. That is the whole surface.

---

## What it does NOT fix

**`Combobox`'s internal dismiss button announces `"Dismiss"` in every language,
and no prop can reach it.** Four independent reasons, all verified against the
1.7.0 dist:

- `combobox/utils/ComboboxInternalDismissButton.mjs:14` discards its props
  argument at the signature (`function (_, forwardedRef)`), so there is no object
  to override into;
- the literal on line 32 sits AFTER `...dismissProps`, so even a props path would
  lose to it;
- it is not importable — 83 export subpaths, none resolving into `combobox/utils/`,
  and its `.d.ts` is `export {}`;
- it is constructed by its parents (`ComboboxInput.mjs:368`,
  `ComboboxPopup.mjs:115`), neither of which forwards consumer props.

**This gap is not externally fixable and this package does not pretend
otherwise.** It needs upstream. See `mui/base-ui#5263`, where a core maintainer
has already accepted that "a prop can work in the meantime".

Two more things worth stating plainly:

- **Base UI's served `<label for>` targets its own `aria-hidden="true"` proxy
  input.** The association exists and resolves to an element removed from the
  accessibility tree, so the label names nothing a screen reader can reach. This
  package works around it by naming the control directly; only upstream can make
  the `for` correct.
- **The collection layer is not addressed and cannot be, from outside.**
  `Select.Value` resolves an option's label only from the Root's `items` prop,
  and the options live in a portal that renders `null` while closed — so a
  server-rendered `<Select defaultValue="thr">` displays the raw key `thr` where
  the label should be. No ARIA attribute can conjure text that was never
  rendered. That is the shape of the remaining risk: **the accessibility layer
  closes from outside; the collection layer does not.**

---

## Which upstream fix retires which part

State as measured via the GitHub API on **2026-08-11**. Re-check before
believing it.

| Part of this package | Retired by | Status |
|---|---|---|
| `useFieldWiring` — the naming arm | Resolving `aria-labelledby` during render: mint the label id in `Field.Root` (the common ancestor, which already renders before both) and put it on the context; keep `useRegisteredLabelId`'s effect as the reconciliation path for labels that mount, unmount or change id later, but stop it being the only source of the first byte. | **Not reported by anyone.** Two GitHub search queries over `repo:mui/base-ui` found no open or closed issue. Nearest neighbour is **#4142** (merged 2026-02-24), the PR that introduced the mechanism. A report is drafted at `docs/upstream/base-ui-ssr-naming.md` and has not been filed. |
| `useFieldWiring` — the describing arm | The same change applied to `descriptionId`. | Same: unreported. |
| `useFieldWiring` — id correctness (not first-byte presence) | **#5456** "Fix label association when a control unregisters" and **#5457** "[checkbox] Fix stale and duplicated control ids" — both OPEN. (#5448 was CLOSED unmerged the same day, split into these two.) | These make the effect-published id CORRECT. They are a **different axis**: this package's complaint is that the id is published from an effect at all. Neither retires anything here. |
| `useOpenMirror` | `aria-expanded` emitted on `Menu.Trigger` at SSR, as `Dialog.Trigger` and `Popover.Trigger` already do. | Unreported. |
| `useCompositeTabStop` | `CompositeRoot` resolving its initial highlighted index during render instead of in `useIsoLayoutEffect`. | Unreported. Found while migrating the collections family, 2026-08-11. |
| `baseUiStringsFor` — the resolver and its types | A first-party translations/labels provider. | The maintainers have signalled one is intended; `#5263` is the live thread. When it lands, the resolver goes and the **phrases stay** — those are yours to author either way. |
| The unreachable `"Dismiss"` | **#5263**, OPEN. Proposed shape: `labels?: { dismiss?: string }` on `Combobox.Root`, threaded onto the store the sentinel already subscribes to, read as `store.state.labels?.dismiss ?? "Dismiss"`. | Acknowledged by a maintainer within 5 days; interim prop accepted in principle. |

**The credibility argument for the main fix, in one line:** Base UI's own code
already consults `explicitAriaLabelledBy` FIRST and synchronously, ahead of both
effects. The render-time naming path exists. Only the id is missing.

---

## What this costs

The engine layer, excluding its own test suite:

| Module | Total lines | Code | Comment | What it is |
|---|---:|---:|---:|---|
| `field-wiring.ts` | 189 | 60 | 120 | Compensating for Base UI |
| `strings.ts` | 281 | 69 | 202 | Compensating for Base UI (43) + Persian/English phrases you would author anyway (26) |
| `open-mirror.ts` | 55 | 16 | 38 | Compensating for Base UI |
| `composite-tab-stop.ts` | 108 | 14 | 91 | Compensating for Base UI |
| `children.ts` | 46 | 14 | 31 | Composition plumbing |
| `attr.ts` | 18 | 3 | 15 | `exactOptionalPropertyTypes` plumbing, engine-neutral |
| `index.ts` | 50 | 7 | 40 | Barrel |
| **Total** | **639** | **169** | **446** | |

Of 169 code lines: **119 (70%) compensate for Base UI defects**, 26 (15%) are the
translated phrases (Lumo value — an upstream i18n provider changes where you hand
them over, not whether you write them), 17 (10%) are composition plumbing, 7 (4%)
are the barrel.

Comment-to-code runs 2.6:1, which is deliberate. This package's value is not 169
lines of code — anyone can write those. It is knowing *which* 169, and why the
obvious alternatives (a wrapping `<label>`, a constant `aria-expanded`, an
unconditional idref, a `getAriaValueText` on `Slider.Root`) each produce a
different defect. The reasoning is the artifact.

**Per-component cost at the call site:** one hook call and up to four prop
spreads. Fourteen source modules in the library it was extracted from import it —
thirteen components plus the locale module.

**Maintenance per Base UI upgrade:** every fix here compensates for an
*implementation choice*, not a documented seam — an id published from a layout
effect, an English literal at a known file and line. A patch release can defeat
any of them with no type error and a green build. The re-check is cheap and it is
not optional:

1. Run this package's suite. Its poison twins assert that **bare Base UI is still
   broken**. If one of those goes red, the bug is fixed upstream and the
   corresponding workaround should be **deleted**, not maintained. That is the
   most useful assertion in the package.
2. Grade a real server render for unnamed controls. jsdom cannot see this class —
   which is exactly how it reached a 1.7.0 release.
3. Diff the eight known English literals against the new dist. A minor that moves
   one after the spread turns a Persian page English with a green build and no
   type error.

Budget it at one afternoon per minor, and pin the version exactly.

---

## Testing this class of defect at all

`environment: "jsdom"` is deliberately absent from this package's vitest config.

Every defect here **self-heals on hydration**. jsdom, Testing Library,
`getByRole({ name })` and axe-in-a-browser all observe the post-hydration DOM and
all pass — with or without this package installed. A suite that mounts these
fixtures in jsdom proves nothing, and that is precisely why the defect survived
upstream review.

The tier is `renderToStaticMarkup` on the `node` environment, which cannot run an
effect even by accident. Every assertion has a poison twin: the same tree without
the fix, asserted to be broken.

If you are auditing your own Base UI app for this, do not trust a component test.
Grade the built HTML.

---

## Prior art check

We looked for this before writing it: no locale bundles, no strings provider, no
SSR-naming issue on the tracker, and no third-party package doing either job. If
one exists now, prefer it — this package is a workaround with an expiry date, and
the best outcome for every part of it is deletion.

MIT. Built by [Telarsa](https://telarsa.com) for [Lumo UI](https://github.com/Telarsa/lumo-ui),
a Persian-first, RTL-first component library, where an unannounced control is not
a rounding error.
