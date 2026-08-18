# Decisions, and the evidence for them

> **Reading this log:** it is append-only. Superseded decisions stay, struck through, so a reversal can be told from a drift — which means the early sections describe plans (Zag, Preact, Tessalor-first) that no longer hold. For the current architecture read `docs/architecture.md`; for what the library is now, `docs/thesis.md`.

Originally dated 30 July 2026, amended 9 August 2026 and 15 August 2026. Each of these was checked
rather than recalled; where a thing is unverified it says so. Superseded
decisions are struck through and kept, never deleted — the reasoning that was
once correct is how you tell a reversal from a drift.

---

## 0. SUPERSEDES §1 — build on React Aria Components, and Lumo is React-only

**Decided 9 August 2026.** §1 below chose Zag.js, and its reasoning was sound at
the time: Zag was the best library that could serve **both** React and Preact,
and Preact mattered because Tessalor is Astro + Preact. That constraint has been
removed, not argued away.

**Tessalor is out of scope for Lumo.** It is SEO-bound — 449 `.astro` files
against 63 `.tsx`, static-first by design — and it keeps its own component
layer for that reason. It is not a Lumo consumer and will not become one.

With the cross-framework requirement gone, the trade §1 named explicitly —
*"React Aria is the more rigorous library on accessibility, internationalisation
and screen-reader testing, and Adobe funds it. It is React-only, so it is not
available here"* — resolves the other way. It is available here now.

### What decided it, verified 9 August 2026

| Fact | Consequence |
| --- | --- |
| `@ark-ui/preact` is **not published**; only `@zag-js/preact@1.43.0` is | Zag's cross-framework story covers machines, not components — you write the component layer once per framework regardless |
| `@internationalized/date` (already a RAC dependency) exports `PersianCalendar`; `toCalendar(today(), new PersianCalendar())` → **1405/5/18** | No third-party Jalali package. Zag has no equivalent |
| RAC `Table` emits `role="grid"`, `role="columnheader"`, `aria-colindex` in SSR | A real ARIA data grid. Ark ships none |
| RAC exports `Virtualizer`, `ListLayout`, `GridLayout`, `TableLayout` | Collection virtualization in-library. Ark ships none |
| Zag hardcodes `aria-roledescription` in ≥8 machines with **no `IntlTranslations` key** | English that a wrapper structurally cannot reach. Measured: 6 such attributes on a rendered Persian page |
| RAC defaults `createCalendar` to the real factory; Zag skips calendar conversion silently if omitted | Ark degrades a Persian calendar to Gregorian with no warning |

### What this decision costs, stated plainly

React Aria ships 34 locales and **Persian is not one of them**. Measured, that
costs far less than it sounds: sweeping 25 components under
`fa-IR-u-ca-persian-nu-arabext` produced **8 genuine English strings**, and the
expensive half — `۱۴۰۵ مرداد ۱۸, یکشنبه`, Persian numerals, RTL keyboard
semantics — comes out correct with zero configuration. See §0.1.

Zag's bus factor concern in §1 was understated, not wrong: one maintainer
accounts for **84.5%** of Ark's and ~86–88% of Zag's human commits over twelve
months. React Aria is Adobe-funded. Neither is a guarantee.

### 0.1 Strings are props, not a dictionary — and the reason is SSR

**Amended 9 August 2026 after measuring.** This section previously specified a
complete 147-key `fa-IR` dictionary injected via `LocalizedStringProvider`. That
does not work for server-rendered pages, and the reason is structural rather
than a configuration mistake:

`LocalizedStringProvider` **renders no children**. It is not a context provider —
it emits a `<script>` that sets `window[Symbol.for('react-aria.i18n.strings')]`.
The dictionary is therefore a *client* payload and reaches nothing during
`renderToStaticMarkup`. Verified: a dictionary with all 147 keys stamped with a
sentinel produced **zero** sentinel hits across ComboBox, Select, Menu, Table,
Tree, GridList, NumberField and TagGroup. Khroos's provider mini-sites must be
SEO-indexed, so "correct after hydration" is not correct.

A second reason to avoid the dictionary: function-valued entries are serialised
with `toString()`, so any closure over module scope emits broken JavaScript into
the page.

**So Lumo passes strings as props**, typed in `packages/core/src/strings.ts`,
where a missing key is a compile error. Of the 8 measured leaks, **5 are
prop-reachable and are covered**. The remaining 3 are `CalendarCell`'s
`"Today, <date>"` and `DateSegment`'s `aria-valuetext="Empty"` — both compose
internally and ignore the props, verified by passing them and observing no
change. Both belong to Calendar/DateField, which milestone M9 places
post-launch, and both are announced on interaction rather than read from the
first byte, so the client dictionary is the right tool for them later.

Correcting an earlier claim: NumberField's `aria-roledescription="Number field"`
**is** reachable — it sits on the `<input>`, not on `<Group>`. Passing it to
`Group` emits both values and the English one survives as a duplicate attribute.
**There is no unreachable English in any V1 component.**

The principle the dictionary version was reaching for still holds and is
implemented in the type: every declared locale must be complete, there is no
partial type and no fallback, because a fallback is what puts an English word in
a Persian sentence.

---

## 0.2 Lumo is private-first; publishing is a later decision

**Decided 9 August 2026.** Lumo UI is consumed inside the Telarsa organisation.
It is not published to npm and `lumo-ui.com` does not serve a public registry in
the near term.

Three consequences, and the third is the useful one:

- **No public showcase site is in scope.** The docs/demo site designed earlier
  was scoped as the public face *and* the registry host. Private-first removes
  the marketing half entirely; what survives is an internal preview surface,
  built only when a second consumer needs it.
- **Distribution is a private GitHub artifact**, not a CDN. Packages travel as
  git dependencies pinned to a tag; components travel as copy-in from a path or
  a private registry URL. No npm publish, no OIDC provenance, no scope to claim.
- **Nothing here can rot in public.** A published promise is what a two-person
  team cannot maintain — HeadlessUI's Vue target sat a full major and 23 months
  behind React's while carrying 5.46M downloads a month. Staying private means
  Lumo owes no one an upgrade path but Telarsa.

Publishing remains available later. Every artifact is built to be publishable —
schema-valid registry items, no private paths in the emitted JSON — so this is a
door left open, not a bridge burned.

---

## 0.3 GitHub Teams: the gate can be REQUIRED, not merely available

**Decided 9 August 2026.** The organisation is on the Teams plan, so branch
protection and required status checks work on private repositories.

This closes the largest hole in the enforcement design. The previous plan
assumed detect-not-prevent: a consumer repository could delete
`.github/workflows/lumo.yml` and every gate would silently evaporate, leaving a
conformance system that only worked where someone remembered to keep it. That is
the same failure class as a comment explaining a bug two lines above the bug.

With Teams:

- `lumo-gate` runs as a **required status check** on `main` and `develop` in
  every consuming repository. A red gate blocks the merge rather than emailing
  someone about it.
- An organisation ruleset applies the requirement centrally, so a new repository
  inherits it instead of opting in.
- Deleting the workflow no longer bypasses the check — a required check that
  never reports blocks the merge.

The gate is therefore designed to *prevent*, not to *report*, and the
"accept detect-only" fallback recorded earlier is withdrawn.

---

## 0.4 The default theme is achromatic, compact, and honours the system

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

## ~~1. Build on Zag.js, not on hand-written state machines~~

**SUPERSEDED by §0 on 9 August 2026.** Kept for its reasoning, which was correct
given the Preact requirement that no longer applies.

~~**Decided.**~~ `@zag-js/preact` exists, is MIT, and is versioned in lockstep with
the React, Vue, Solid and Svelte adapters — all `1.43.0`, `@zag-js/core`
published 29 July 2026. Lockstep versioning is the signal that matters: Preact
is a maintained target rather than a community port that lags releases.

The hard part of a headless library is not the framework binding. It is the
state machines — roving focus, `aria-activedescendant` bookkeeping, typeahead,
focus trapping, dismiss layers, collection navigation. Zag has all of it,
proven through Ark UI and Chakra v3.

### What was considered

| Library | Frameworks | Last publish |
| --- | --- | --- |
| **Zag.js** | React, Vue, Solid, Svelte, **Preact** | 2026-07-29 |
| React Aria | React only | 2026-07-30 |
| Base UI | React only | 2026-07-15, still `1.0.0-rc.0` |
| Radix | React only | 2026-07-28 |
| Melt UI | Svelte only | 2026-01-04 — seven months stale |

**React Aria is the more rigorous library** on accessibility, internationalisation
and screen-reader testing, and Adobe funds it. It is React-only, so it is not
available here. That is a real trade and it should be stated rather than
pretended away: Zag was chosen because it is the best library that *can* be
used, not because it beats everything on merit.

**Zag's bus factor is thinner** than React Aria's — principally one
organisation's work. Mitigated by MIT and by the machines being plain
TypeScript that could be forked.

---

## 2. `@zag-js/preact` does NOT need Astro's `compat: true` — but it is not
   compat-free either

This was the explicit question, and the answer has two halves. Verified by
downloading `@zag-js/preact@1.43.0` and reading the shipped `dist/`.

**The manifest:**

```json
"peerDependencies": { "preact": ">=10.0.0" }
```

No `react`, no `react-dom`. Its only dependencies are `@zag-js/{core,store,types,utils}`.

**The shipped code imports `preact/compat` for exactly two named exports:**

| Import | Files |
| --- | --- |
| `flushSync` | `bindable.mjs`, `machine.mjs` |
| `useSyncExternalStore` | `use-sync-external-store.mjs` |

These two things are not the same, and the distinction is the whole answer:

- **`compat: true` in `@astrojs/preact` aliases `react` → `preact/compat`.** Zag
  never imports `react`, so it does not need that alias. Tessalor's locked
  decision — `compat` off — stands.
- **`preact/compat` is also a real module inside the `preact` package**, and
  importing it *by name* resolves regardless of the alias. So Zag will pull that
  module into the bundle.

**The open question is what that costs**, and it must be measured, not assumed.
Whether Rollup tree-shakes `preact/compat` down to `flushSync` and
`useSyncExternalStore`, or drags the React API surface in wholesale, decides
whether this is ~200 bytes or several kilobytes on every page that uses a
component.

This is precisely the class of defect Tessalor's `check:budget` exists for. One
`getLocale` import once put every tool page 14 KB over budget, and the source
looked correct. **Do not adopt Zag in Tessalor until this number is on paper.**

---

## 3. Preact, not Qwik

**Decided.** The deciding fact: **Qwik 2.0 is `2.0.0-beta.38`** as of 16 July
2026. Not a release candidate — beta thirty-eight.

Building a 200-tool catalogue *and* an open-source component library on an
unreleased major, whose API can still move, is a risk with no upside available:
Tessalor's Total Blocking Time is already **0 ms** and CLS is **0**, and TBT is
the metric resumability optimises. Every Lighthouse point being lost is
FCP/LCP/Speed Index — the network and rendering path, which Qwik does not touch.

| | Preact | Qwik |
| --- | --- | --- |
| Current | 10.29.7, stable | 1.20.0 stable / **2.0 beta-38** |
| Age | ~10 years | ~4 years |
| Headless UI | Zag, official Preact adapter | Qwik UI, young |
| Escape hatch | `compat` opens the React ecosystem | none comparable |

That last row is worth more than it looks. `compat` is deliberately off, but it
remains break-glass if a future tool needs a React-only library.

**When to revisit:** if a single tool's island grows past roughly 100 KB — a
node-graph editor, a timeline with hundreds of draggable elements — resumability
starts to pay. Astro chooses a renderer *per island*, so that tool can become a
Qwik island beside 199 Preact ones. It is not a bet that has to be placed now.

**What does *not* justify revisiting:** interactive charts. That blocker is the
Content Security Policy, not hydration — ECharts injects an unhashable `<style>`
element, and it would do so identically under Qwik.

---

## 4. Ark UI's work can be used, with conditions

Ark UI is **MIT**. That permits use, modification and redistribution, including
commercially.

**It is not public domain, and "take everything" has one requirement:** where
Ark UI's source is copied or adapted, the MIT copyright notice and licence text
must be retained. In practice:

- Copying an implementation → keep the notice, credit it in `NOTICE` or the file
  header.
- Reading it and writing our own → no obligation, and this is what should happen
  for most of it, because Ark UI is a *React* library and its idioms will not
  transfer verbatim.
- Its **API shape** — component names, part names, prop conventions — is not
  copyrightable in any practical sense and is the part most worth following,
  because matching a known API is what makes a library learnable.

**Licence compatibility is not a problem:** Tessalor's allowlist is
MIT/Apache-2.0/BSD/ISC/MPL-2.0/0BSD/CC0/Unlicense/OFL-1.1, and everything here —
Ark UI, Zag.js, Base UI, Radix, React Aria — is MIT or Apache-2.0.

---

## 5. Why Ark UI has no Preact package

Searched rather than guessed. **There is no public issue or RFC requesting it**,
and no stated reason for its absence in the repository. Ark UI's own description
is "Works in React, Vue, Solid, and Svelte" — Preact is simply not in scope, not
rejected.

The likely explanation, offered as inference and labelled as such: Preact's
React-compatible API means the Preact audience has historically reached for
React libraries through `compat`, so the demand never separated out. Community
discussion in the Preact repository bears that out — people report using
`@ark-ui/react` with Preact and being satisfied, which is only possible with
`compat` on.

**That is the gap, and it is the whole argument for this library.**
`@zag-js/preact` exists and `@ark-ui/preact` does not. Building Ark's component
layer on Zag's Preact adapter means inheriting the hard machines, filling a real
ecosystem hole rather than adding a fifth Preact library, and serving exactly
the audience that has `compat` turned off — which is the audience that chose
Preact for its size in the first place.

---

## The spike that gates all of this

**Nothing above should be built until one afternoon's work answers three
questions.** Two of them can invalidate the plan.

1. **Does a Zag component render through Astro SSR under a CSP with no
   `'unsafe-inline'` for styles?** Dismiss layers and popovers are exactly the
   components that inject `<style>` elements at runtime — the same thing that
   blocks ECharts in Tessalor today. Pass/fail: a page with a Zag combobox,
   checked for a console CSP violation.
2. **What does `preact/compat` cost once bundled?** See decision 2. Measure with
   Tessalor's own `check:budget`.
3. **Does it hydrate twice cleanly?** Tessalor ships one island per page and
   previously broke on two Preact instances — `Cannot read properties of
   undefined (reading '__H')`. Confirm Zag adds no second copy.

Sources for the claims above:

- [chakra-ui/ark](https://github.com/chakra-ui/ark) — "Works in React, Vue, Solid, and Svelte"
- [Ark UI issues](https://github.com/chakra-ui/ark/issues) — no open Preact request
- [Preact discussion #4559](https://github.com/preactjs/preact/discussions/4559) — community using Ark UI with Preact

---

## SPIKE RESULTS — run 30 July 2026, on a throwaway branch in Tessalor

A real `@zag-js/combobox` island, built through Astro, measured against
Tessalor's own gates. Combobox on purpose: it is the heaviest component and the
only one that positions a floating panel, so it is the worst case for both
questions.

### 1. CSP — conditional pass, and the condition is severe

**With SSR (`client:load`): FAILS.**

```
Content Security Policy violations in 1 place(s):
  /zag-spike
    <div data-scope="combobox" data-part="positioner"
         style="position:absolute;isolation:isolate;width:var(--reference-width);po…
```

Zag's positioner emits an inline `style` attribute into the server-rendered
HTML. A browser under this policy blocks it, the panel loses its positioning,
and the component is visually broken.

**With `client:only="preact"`: PASSES.** All 78 pages clean, and zero console
errors at runtime through open, filter, arrow-key and select.

The reason is a genuine distinction rather than a loophole: CSP `style-src`
restricts `style` *attributes* and `<style>` *elements*. It does not restrict
CSSOM — `el.style.setProperty(...)`, which is what Preact does when it applies a
style prop on the client. So the violation exists only in the SSR output.

**The cost of that workaround is the thing to weigh.** `client:only` means the
component is absent from the HTML: not crawlable, not present at first paint,
and it pops in after hydration. For a tool's primary control on a page whose
entire SEO argument is server-rendered content, that is a real regression, not a
technicality.

### 2. Budget — the number that decides it

| Route | JS on arrival | Budget |
| --- | --- | --- |
| **`/zag-spike`** — one combobox, nothing else | **42.7 KB** | 20.0 KB — **OVER** |
| `/money/compound-interest` — full calculator, decimal.js, chart, table | 39.3 KB | 50.0 KB |
| `/documents/word-counter` | 27.8 KB | 50.0 KB |

**A single Zag combobox costs more than an entire compound-interest calculator.**

### 3. Hydration — clean pass

No second Preact instance, no `Cannot read properties of undefined (reading
'__H')`, no console errors. The component genuinely works: typing `mort`,
ArrowDown, Enter selected "Mortgage repayment".

### What this means

**For Tessalor: do not adopt Zag for form controls.** Either it is SSR'd and
breaks the CSP, or it is `client:only` and gives up server rendering — and
either way one combobox costs more than a whole calculator against a budget
whose whole purpose is that speed is the differentiator.

**For Lumo UI: the constraints are Tessalor's, not the world's.** Most projects
carry `'unsafe-inline'` for styles and have no 20 KB budget. Zag is still the
right engine for a general-purpose library.

But it changes the pitch. "Headless components for Preact" is fine; "headless
components for people who chose Preact because it is 4 KB" is not honest if the
first component costs 40 KB.

### What to test next, before committing to the architecture

1. **Cost per component.** Combobox was the worst case. Dialog, tabs, toggle,
   accordion carry no positioning engine and should be far cheaper. If a
   dialog is 6 KB the library is viable and the combobox is the outlier.
2. **How much of the 42.7 KB is `preact/compat`.** Still unmeasured, and it is
   the one number that would apply to *every* component.
3. **Whether Zag's SSR style output can be suppressed.** If the positioner can
   be told not to emit inline styles server-side, the CSP problem disappears and
   Tessalor's objection halves.

## §12 — Platform destinations, and the two we are not taking yet

Decided 11 Aug 2026. Recorded because the REASONS are non-obvious and will
otherwise be re-litigated from scratch.

### Every React framework is already a destination, and it is enforced

    framework imports across ui / core / blocks / base-ui-ssr:   NONE
    gate:smoke — 109 items compiled in a bare project with no
                 framework, jsx: react-jsx, moduleResolution: bundler:  109/109

Vite, Next.js, Remix, TanStack Start, Astro-with-React need no work: `gate:smoke`
copies each registry item into a frameworkless project and type-checks it on
every commit, so anything reaching for `next/link` fails the day it is written.

Three things a consumer wires, none framework-specific: Tailwind v4 plus
`theme.css`; `"use client"` (required by RSC, an inert string literal
elsewhere); and `@lumo-ui/base-ui-ssr`, which is correct everywhere and only
DOES anything where there is a server render.

State the limit honestly in the docs: `lumo-gate` grades SERVED BYTES. A
client-only Vite SPA has none, so the components remain correct but the
consumer loses the mechanism that proves it. The gate does not travel with the
package.

### React Native / Expo — deferred, architecture already ready

Shared unchanged: `@lumo-ui/core` (formatters, `parseNumber`, `FORMAT_LOCALE`,
the `strings.ts` contract), `calendar-datelib.ts` and `@internationalized/date`,
the validators in `form-state.tsx`, TanStack Table/Form state, token values.
Rebuilt: every `.tsx` in `packages/ui`.

A UNIVERSAL calendar is a fiction and we should not be talked into one. The
platforms differ in INTERACTION, not styling: a web calendar is an arrow-key
grid with a roving tabindex; a mobile calendar is a swipeable month with 44pt
targets and no Tab key. Shared math, per-platform grid. When we build it,
prefer `@marceloterreiro/flash-calendar` (no bundled date library, driveable
from `calendar-datelib.ts`) over `react-native-ui-datepicker` (bundles
`dayjs` + `jalali-plugin-dayjs`, i.e. the forked-date-library-per-calendar
pattern already rejected for react-day-picker v9).

VERIFY FIRST, before anything else: `Intl.DateTimeFormat` with `-u-ca-persian`
on a real device. Hermes has historically shipped without full ICU, and the
entire Persian story rests on it.

Docs previews: Expo Snack is FREE (Expo's paid products are EAS Build/Update/
Submit). Its real constraint is that it installs from public npm, so private
`@lumo-ui/*` will not resolve — inline the component source into the Snack
payload instead, which suits a copy-in registry: the embed then shows exactly
what a consumer pastes. If `react-native-web` previews are used instead, they
need a `data-lumo-native` gate exemption beside `data-lumo-latn` and
`data-lumo-gregory`, because RN-web emits `<div>` for everything and grading
its output would report failures about a translation rather than about the
native accessibility tree — a red gate that means nothing, or worse a green one.

### Lynx — not now, and the reason is ours alone

    @lynx-js/react  0.123.3, released 7 Aug 2026        36k / week
    react-native                                    11,400k / week
    expo                                             7,700k / week

0.3% of React Native's adoption and still 0.x after ~17 months. But
`@lynx-js/types` carries `marginInlineStart`, `paddingInlineEnd`,
`insetInlineStart` and `direction` — Lynx has real CSS with logical properties
and an inherited direction. React Native has none of that: flat style keys, no
cascade, and RTL via the process-wide `I18nManager.forceRTL` needing an app
restart.

Lumo's ENTIRE RTL strategy is logical properties. It would port to Lynx nearly
directly and does not port to React Native at all — on RN every mirroring
decision is re-derived in a model that cannot express it. Most people weighing
Lynx care about its dual-threaded performance; we would care about `direction`
inheritance, which is why this note exists.

TRIPWIRE: revisit if Lynx reaches 1.0 AND the RTL cascade holds up under a real
test. Not before.

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

## §14 — The site is a static export, and `pnpm start` is not `next start`

Recorded on 11 Aug 2026 because someone asked why, and the repository could not
answer: the choice existed only in a docblock in `apps/website/next.config.ts`,
and the reason that docblock gives is the weakest of the three real ones.

Default Next.js is a Node server — `next build` produces `.next/`, `next start`
serves it, and `start` means that in every Next project anyone has worked on
before this one. `output: "export"` is a supported, documented, NON-DEFAULT mode
in which `next start` refuses to run at all. So this is a divergence from the
standard, it is deliberate, and it needs to be written down.

### The three reasons, in the order that actually decides it

1. **Free hosting, which is a standing constraint rather than a preference.**
   A directory of files goes on Cloudflare Pages, GitHub Pages, S3 or nginx at
   zero cost. A Node server wants a paid host or a free tier with limits and an
   idle timeout. "No paid services" is a rule this project has held everywhere
   else — it killed the Expo Snack embeds — and it holds here too. This reason
   appears nowhere in the config, and it is the strongest.

2. **Nothing on this site is computed per request.** The registry, the examples,
   the coverage manifest, the search index and the docs are all derived from the
   filesystem at build time. There is no user data, no personalisation, no
   session, no authoring UI. A Node server would spend its life re-serving
   constants.

3. **The gate wants a directory of exactly the bytes a reader receives**, and
   `out/` is that with nothing else in it. This is the config's stated reason,
   and it is a convenience rather than a blocker: a server build still
   prerenders, so `lumo-gate` could be pointed at `.next/server/app/**/*.html`.
   It would be grading the same HTML mixed in with RSC payloads and harder to
   map back to routes. Worth having; not worth deciding on alone.

### What it costs, and one of those costs is already being paid

- **`images: { unoptimized: true }`** is in the config right now. That is not a
  styling choice, it is export forcing the issue — there is no image optimiser
  without a server.
- **No middleware, no route handlers, no Server Actions, no ISR.** Nothing on
  the site wants them today. That is the point of reason 2, and it is also the
  thing to re-check before assuming it stays true.
- **`next start` does not exist**, so `pnpm start` had to mean something else.
  It serves `out/` through `scripts/serve-static.mjs`, and the banner it prints
  says so — because someone who types `pnpm start` expecting a Node server, and
  is not told otherwise, will later wonder why a route handler they added does
  nothing.

That script exists rather than a dependency for the same reason as everything
else here: `serve` or `http-server` is a package on a repo constrained by disk,
and `npx` needs the network at run time. Sixty lines of `node:http` needs
neither. It reproduces two host behaviours that a naive static server gets
wrong — the `trailingSlash` 301, and serving the site's own gate-graded
`404.html` rather than a bare Node message.

### The state this decision is actually in

**The site is not deployed anywhere.** `.github/workflows/ci.yml` builds it,
grades it, and uploads `out/` as an artifact ON FAILURE only. There is no
`vercel.json`, no `netlify.toml`, no Pages workflow. So export is currently a
decision about a build, not about a host — and the host decision, when it is
made, is the moment to re-read this section rather than inherit it.

### TRIPWIRE — the one condition that reopens this

**Auth in front of the docs.** Lumo is private-first; the repository is private
and the library is not published. If these pages ever need to sit behind a
login, a static export cannot do it at the application level. The options then
are host-level gating (Cloudflare Access and equivalents, still free at this
scale) or moving to a server build — and only the second changes this decision.

Two weaker signals that would also warrant a re-read: wanting search served
rather than shipped as an index, and wanting real image optimisation on a page
of screenshots. Neither is a reason on its own; both together, with auth, are.

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

## §16 — Lint runs, and the policy it runs is narrower than the one it replaced

`packages/config/eslint/lumo.mjs` was written, argued, exported and documented,
and nothing in this repository executed it: no `eslint.config.*` at the root, no
`lint` script, `eslint` not a dependency of any package, no step in `verify` and
none in CI. CONTRIBUTING.md meanwhile told contributors *"a physical utility is
caught by lint. There is no exception."*

This is the third instance of one shape in this repository. `cli.ts`'s header
memorialises the first (`persian-digit-floor` had a factory, a fixture, a
self-test and a README paragraph, and was not in the `RULES` array). §2.7 of the
audit found the second (the same rule re-armed by an argument, and the argument
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

Decided 12 Aug 2026. AUDIT.md §5 item 2.1. It went first in Phase 2 because it is
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

**Date:** 12 August 2026 · **Phase:** AUDIT §5 items 2.2 and 2.3 ·
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
red; the table is in the Phase 2.2/2.3 outcome in AUDIT.md §9.

---

## §19 — The replacement envelope is React web and product-depth composition

**Decided 13 August 2026.** Lumo targets React applications on the web. Vue,
Svelte, Solid and native bindings are not parity targets and their absence is
not a product defect. §12 already proves that the copy-in components are
framework-independent *within React*; adding another renderer would multiply
the component, interaction and accessibility surfaces without helping the
products Lumo exists to serve.

Lumo also does not target universal low-level primitive compatibility. Radix
and Ark expose granular parts such as `Root`, `Trigger`, `Content`, `Portal` and
`Item`, element substitution such as `asChild`, context hooks, and direct state
machine access. Lumo deliberately owns more of each component's structure,
styling and semantic contract. That narrower surface reduces consumer assembly
and prevents callers from replacing component-owned roles, ID relationships or
locale-derived direction. Add a part-level escape hatch or migration adapter
only when a real supported React product cannot express its requirement through
the existing contract; do not reproduce another library's primitive API for
catalog parity.

Roadmap capacity therefore goes to product-depth systems: enterprise data grid,
scheduler, Gantt and upload workflows; form, chart, input and global-manager
capabilities used by Telarsa applications; and AI/chat, PowerSearch, LogStream,
editor and internal-tool workflows. Shared state and data engines should deepen
several of those systems rather than create isolated look-alike components.

The unfinished NVDA/JAWS/current-Chrome matrix is deferred until a hosted
assistive-technology or device lab can expose real platform sessions through an
OS-agnostic workflow. A DOM accessibility tree, ARIA snapshot or synthetic
speech test is useful supporting evidence but is not a substitute for the real
reader. Until then, the matrix remains explicitly unproved and contributes no
score; no local Windows VM work is in scope.

---

## 20. React Aria compatibility surface removed; documentation and comments consolidated

**Decided 15 August 2026.** The public API is Lumo's own. The `?: undefined` compatibility carriers, underscore discards, `SlotProps`, `excludeFromTabOrder` (now a real `tabIndex`), `routerOptions`, `isPending` and `preventFocusOnPress` are gone: on a private `0.0.0` library they protected no consumer and kept producing accepted-and-inert props (a `slot="close"` cancel button that closed nothing; `hrefLang` served on a `<button>`). `DialogClose` is the supported way to close a dialog from its footer.

The same day: root documents moved under `docs/`, review reports were retired into `docs/history/evaluations.md`, agent guides were added (`AGENTS.md`, layered `CLAUDE.md`), and the inline comment volume was reduced from roughly 45% of lines to roughly 20% across the tree — comments only, verified by comparing every modified file's TypeScript token stream against HEAD (220 files, zero differences). Long-form rationale now lives in this log and in `docs/`, not between the `if` and the `else`.

---

## 21. Complexity pass: one registration system, one dismiss relabel, no dead string catalogue

**Decided 15 August 2026.** The website had two registries for one catalog (`lib/demos.tsx` and `examples/<slug>.tsx`, merged by `catalog.ts`); the merge is the mechanism that once let eleven components ship without pages. `demos.tsx` is gone; an examples file IS the registration, and `catalog.ts` derives everything (title, intro, tier, preview, whether the module is `"use client"`) from it. `scripts/build-registry.mjs` reads item descriptions from `meta.intro` only.

`relabelEngineDismiss` (mui/base-ui#5263) lives once, in `@lumo-ui/base-ui-ssr`, where engine compensations belong. `LumoStrings` in `@lumo-ui/core` keeps the two groups that are read (`dateField`, `numberField`); the React-Aria-era leak groups (`comboBox`, `searchField`, `calendar`, `datePicker`) had no reader on Base UI — the required-prop rule is the mechanism, not a dictionary. `no-latin-aria` is keyed on the reader's script, like rules 10 and 11, not on direction: an LTR non-Latin locale is graded too.

Kept deliberately: `demo-islands.tsx` (one `"use client"` boundary for 46 stateful demos — cohesion, not duplication), `vendor-from-shadcn.mjs` (a documented workflow), and the generated `registry.json` / `api-reference.json` (diff-checked, they are the ratchets). Complexity is high and mostly earned; the remaining unearned part is the mutation campaign's one-operator floor for 104 of 111 modules and the optional container names on `Menu`/`ListBox`/`Tree`, both recorded as follow-ups.

---

## 22. Real engines in the loop; the dialog name lifts once; islands are graded for what they claim

**Decided 15 August 2026.** Three decisions from the first tranche of `docs/goals.md`:

1. **Browser evidence is a standing job.** `pnpm run evidence` (Playwright, free) runs axe-core over every built route in Chromium and opens 20 popup families for real in Chromium, WebKit and Firefox — ARIA trees pinned as committed snapshots, spoken attributes checked for Latin, names checked, axe with the popup open — plus RTL layout by geometry (reading order flips fa↔en) rather than pixels. It is not a screen-reader run and is labelled so (`docs/evidence/README.md`); VoiceOver via Guidepup is an opt-in placeholder until someone records transcripts. Engine defects it surfaces are recorded in `docs/upstream/` and annotated `fixme`, never allowlisted. On its first run it found what jsdom and the served-bytes gate structurally cannot: `Tabs` pointed every tab's `aria-controls` at an id no panel carried (fixed — the panel keeps the engine's id); a props-table scroller unreachable by keyboard (fixed); the preview-frame documents and the 404 had no `<title>` (fixed); status text on its own 10% tint measured 4.47 / 4.25 / 4.43 in light — the theme's wash model composited in linear light while browsers composite in gamma — so `positive`/`critical`/`caution` moved to 0.495 / 0.470 / 0.515 and the tint ground is now measured in `tokens.test.ts`; the calendar's outside-month days stacked `opacity-60` on an AA token (2.33 — opacity removed); the docs' Shiki theme moved to GitHub's high-contrast pair; and three Base UI focus-management behaviours (`docs/upstream/base-ui-focus-guards.md`).

2. **One dialog name, typed once, on `Dialog`.** `DialogModal` and `Drawer` both lift `Dialog.label` (or `AlertDialog.title`) onto the `role="dialog"` element by SHAPE, shallowly — never into another component, so a body field's `label` can never become the popup's name (reevaluation P7). `Drawer.label` is gone.

3. **`data-lumo-latn` is graded, not just trusted.** Rule 14, `latn-island-purity`: an island holding more letters of the reader's script than Latin is a misplaced exemption and fails. Its first run found a Persian link inside an `lang="en" dir="ltr"` island on all 34 block pages. The exemption share stays disclosed in the coverage report; this rule is its containment.

Also this tranche: a behavioural mutation operator for every module that owns behaviour (104 of 111; the 7 presentational modules are listed with reasons and the campaign refuses an unclassified module); the popup tier grades 22 families (+ date-range-picker, date-selector, power-search editor, toast); InputOtp joined the shared field wiring (its help/error text now reaches the input — the PhoneInput class of defect, found by the #7 audit).

---

## 23. Adapters at one seam; every page says when to use it; the field-shaped inputs are all wired

**Decided 16 August 2026.**

1. **Router link.** `LumoProvider linkComponent` is the one seam for the app's link (Next's `Link`, a router's). Client families that render an anchor — `Item`, `Command` rows, `NavigationMenuLink`, `SidebarItem` — read it from context. `Link` and `Breadcrumbs` are SERVER components and cannot read a client context; `Link` takes `linkComponent` as a prop for server-rendered trees, and the client wrappers inject the context value into it. Default everywhere: the platform `<a>`, proved in the first byte. The render props are picked from React's own `<a>` props plus a string `href` — the anchor's DOM surface, not a Lumo vocabulary.
2. **Data layer.** `presentQueryResult(result, messages)` maps a TanStack Query-shaped result onto the `asyncState` every collection accepts, structurally (no dependency), with the same required copy as `presentAsyncCollection`. Apps that own their data layer stop double-fetching.
3. **Every component page carries `usage` (when / when not, both locales, naming the alternative in backticks; every named alternative is validated against the barrel).** 112 pages.
4. **Field parity.** ComboBox, MultiSelect, TagsInput and Slider connect `description`/`errorMessage` to the control the reader lands on, in the first byte. Slider carries no `aria-invalid`: the engine forwards `aria-describedby` to its range input but not `aria-invalid`, and a flag on the thumb's div would name the wrong element — recorded rather than faked.
5. **Snapshots and names.** Playwright aria snapshots are partial matchers; recorded with `--update-snapshots all`, and popup names are asserted with the engine's own `toHaveAccessibleName` — the DOM approximation that had passed an unnamed Select listbox is gone (§ evaluations, second pass).

---

## 24. What the fourth blind pass settled — and one thing it left open

**Decided 16 August 2026.**

- **A number-typed prop is formatted by the component, never stringified.** `PowerSearch.resultCount` was `number | string`, documented "already-localized", and served `1234 نتیجه` under `fa-IR`; a number now goes through `formatNumber(locale)`, a string is shown as given. The rule for every family: if a prop can be a number, the component owns its digits.
- **Announced values are formatted like visible ones.** Gantt's zoom range and split separator carry `aria-valuetext` in the reader's digits (they announced raw Latin numbers).
- **File names island themselves only when Latin** — `AttachmentName` applies the same rule as `FileUploadItem`.
- **The gate reads digits wherever a reader meets them:** text nodes, and now `value`, `aria-valuetext`, `placeholder`, `alt`, `title`, `aria-label`, `aria-description`, `aria-roledescription` (Latin-by-nature and machine-value inputs skipped). Blocks are graded with the full rule set, not two rules.
- **`dir` is not a prop of any Lumo component.** It left `GlobalDOMAttributes` in `@lumo-ui/core`; the whole workspace still compiles, which proves nothing depended on it. Direction is `direction(locale)`; islands set `dir` on their own host elements.
- **Licence field.** The packages declared `MIT` with no LICENSE file on a private, unpublished library; they now say `UNLICENSED`, which is what is true today. Choosing an actual licence (for a public future or for consumers' legal comfort) is the owner's decision.

**Closed the same day (16 Aug, in v0.1.0):** the date family disagreed on calendar. `Calendar`, `Gantt`, `EventCalendar` display a Gregorian `CalendarDate` in the reader's calendar (Jalali under `fa-IR`); `DateField`/`DatePicker`/`DateRangePicker` keep the VALUE's calendar ("it wins; converting would lose data" — `date-field-state.ts`), so a `fa-IR` field can announce «۲۰۲۶» while its own popup grid captions «۱۴۰۵ مرداد». The right shape is display-and-edit in the reader's calendar with a round-trip back to the caller's calendar on change (`toCalendar` both ways loses nothing). Done: `date-field-state.ts` displays/edits in the locale calendar and emits `toCalendar(value, caller's calendar)`; rule 8 flags a `data-type="year"` segment announcing ≥ 1800 under a Persian/Islamic calendar. Also decided: **all packages move together** (`gate:versions`), and the **licence is proprietary** (`LICENSE`).

---

## 25. Distribution: path A — git dependencies pinned to a tag

**Decided 16 August 2026 (owner).** Consumers install `@lumo-ui/core`, `@lumo-ui/theme` and `@lumo-ui/base-ui-ssr` as `github:Telarsa/lumo-ui#<tag>&path:packages/<name>` and the repository root as a dev dependency (`lumo-ui`), which delivers the `lumo` CLI, the registry and the catalog. No registry host, no token beyond repository access, private by construction; the CLI reads any reachable checkout, so a later move to a package registry (npm under `@lumo-ui`, never GitHub Packages, which would force the `@telarsa` scope and a rename of every import) is a URL change for consumers, not a rewrite. What it cost: contract packages must carry real dependency specifiers (proved by `v0.1.0` failing to install), and Next consumers add `transpilePackages`. Recorded in CHANGELOG 0.1.1 and `docs/agent-consumer.md` §0.


## 26. What the first two consumer trials settled (16 Aug 2026)

Two real projects adopted v0.1.1 through path A the same day: `example-hotel`
(a Next 16 + shadcn + next-intl app; a booking form on `DateRangePicker`,
`Select`, `TextField`, `Dialog`) and the Telarsa website (Next 16, its own CSS,
no Tailwind — the harder host). The components held: Persian first byte right
(Jalali grid, Persian digits, RTL, every control named), zero console or
hydration errors, the gate found 0 defects in the Lumo screens against 26 on the
shadcn equivalent. The tooling and the theme's global reach did not, and that is
what this entry records.

**Decisions.**

- **The Persian typography block is opt-in (`@lumo-ui/theme/script.css`).**
  Its rules are page-wide by design (root leading, `h1…h6:lang(fa)`,
  the `tracking-*` guard, `font-synthesis: none`), and inside `tokens.css` they
  restyled a host wherever the host was silent — the Telarsa site's `lang="fa"`
  locale-switch link grew 10 px on every English route, measured by computed
  style. Layer order protects only properties the host declares. So: `tokens.css`
  + `theme.css` are the embeddable contract; `script.css` is what a greenfield
  app adds. Proved by re-running the site comparison: 0 differences over 92
  captures (46 routes × 2 widths, computed styles + screenshots + normalised
  HTML). The embedding recipe (Lumo layers declared first, Tailwind theme
  without preflight, utilities unlayered and scanned only over the copies) is in
  `docs/agent-consumer.md` §0.2.
- **Copies must compile and lint under a CONSUMER's toolchain, not ours.** Two
  new gates in `verify`: `gate:consumer-profile` (tsc, plain `strict` + `lib:
  esnext`, over core/base-ui-ssr/ui/blocks) and `gate:consumer-lint`
  (typescript-eslint `recommended` + react-hooks 7 `recommended`, React
  Compiler rules included, `--max-warnings 0`, over ui/blocks). Both failed on
  the day (an `Intl.Locale` augmentation collided with `lib.esnext.intl`; three
  copies leaned on `exactOptionalPropertyTypes`; 55 lint findings incl. 30
  compiler-rule violations); both are green at 0.1.2. The smoke test gained the
  same profile and now copies blocks the way `lumo add` does.
- **Blocks are consumable.** `lumo add <block>` rewrites `@lumo-ui/ui` imports
  to relative imports of the ui copies and derives the block's ui/block closure
  from its imports (registry.json records none); the catalog carries every
  block's title/intro/category/docs from the docs site's own table.
- **`lumo gate` runs a committed JavaScript build** (`packages/gate/dist`,
  `gate:dist` keeps it fresh): Node refuses to strip types under
  `node_modules`, and the gate's runtime deps are now root `dependencies`.
- **`lumo add` never overwrites a file it did not write** (`--force` to
  insist), takes `--dir`, remembers it, prints exact `name@version` installs
  from the shipped catalog, stores originals as `*.orig`; `lumo diff` lists
  local edits; `--to` defaults to `.` and the commands find the project upward.
- **`LumoHtml.lang` accepts a host's other languages** (any BCP-47 tag;
  direction by primary subtag) — Lumo components must not render under such a
  document. `SelectField`'s docblock said the opposite of its default; the
  docblock was wrong.
- **Recorded, not changed:** Lumo's `@theme inline` names (`--color-accent`,
  `--radius-*`) collide with another Tailwind theme in the same app; the
  resolution is binding Lumo's `--lumo-sys-*` to the app's tokens in
  `@layer lumo.brand`, documented — a namespace prefix would rename every
  utility in 111 components and is not worth it for a private library. Also
  recorded: `Button` and every field/popup are client components (Base UI);
  `Card`/`Badge`/`Link` and the `*.variants.ts` render from a server component
  — the Astryx spike's "no client boundary for a button" is a real difference,
  and the price of a real button engine.

The example-hotel session's verdict was 5/10 for "how well can it be used" at
0.1.1 (components 8–9, tooling and docs pulled it down); every finding it
listed is either fixed above or recorded here.

## 27. React Native: started with a Button, gate still open (16 Aug 2026)

The owner asked whether the mobile alternative had been tested — it had not;
`packages/native` held only the ICU probe and a README arguing gate-first and
"not a button" — and asked to start with a Button and show it on the website.
Decision: start it, keep the gate honest, and make the start real rather than a
sketch. `@lumo-ui/native` (0.1.2, lockstep) now exists with a provider and
`Button`/`IconButton` on `Pressable`+`Text`; its tokens are GENERATED from
`tokens.css` (oklch → hex, rem → dp; `gate:native-tokens`), so native and web
read one semantic palette; its first byte is graded by the 14 rules through
react-native-web (0 violations); consumer lint/profile gates cover it; the docs
site shows it in a phone frame at `/docs/native/` and states on the page that a
browser rendering is not a device run. Measured on the way: react-native-web
renders a `role="button"` Pressable as a real `<button>` with `aria-disabled` and
`aria-label`, so the README's RNW concern does not apply to this component
(it still applies to the idea of building the library on RNW).

Not decided, deliberately: the toolchain (plain `StyleSheet` for now, no
NativeWind), and whether `@lumo-ui/core` runs unchanged on a device — that is
the probe's answer, and Xcode 26.6 with simulators being on the development
machine makes the blocking simulator run feasible when the owner wants the
long build. The next component should be direction-sensitive.

## 28. Any language — the locale contract opens (16 Aug 2026)

The owner: "our library should be able to be used with all languages." Until
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

## 29. The native engine: @rn-primitives, evaluated on Dialog (16 Aug 2026)

The owner: "rn-primitives ok" — after the question of what carries the
components a hand-built Pressable cannot honestly carry (dialogs, popovers,
menus: focus movement, modal semantics, escape gestures, the back button).
`@rn-primitives/*` is the closest thing React Native has to what Base UI is on
the web: unstyled, Radix-shaped primitives with native implementations, and
Radix itself on the web. Evaluated on Dialog first because a button needs no
engine and an overlay is where an engine earns its keep.

What was measured:
- **Contract on top holds.** `label` and `closeLabel` REQUIRED; ✕ at the inline
  end (top-left in Persian, verified in the browser through react-native-web and
  the same code path on device); every text takes the locale's writing
  direction; the provider mounts the engine's `PortalHost` on device so an app
  adds nothing. Web (Radix): named by the title, described, focus moved inside,
  Escape closes, no console errors. Native: `role="dialog"`, `aria-modal`,
  accessibility focus, escape gesture, Android back — the engine's own.
- **Costs, all recorded in code:** the packages ship Metro-style platform files
  behind extensionless imports and RAW JSX in `.mjs` — a bundler outside Metro
  needs a resolve rule and a JSX transform (Turbopack: `resolveExtensions` +
  `transpilePackages`; vitest: a 20-line plugin). Radix's `asChild` merges
  `style` by object spread, so parts it slots must receive FLAT style objects
  (`StyleSheet.flatten`), not arrays. The web engine assigns its own ids to
  Title/Description; Lumo's idrefs are for the native engine only — the gate's
  `resolved-idrefs` caught the dangling pair on the first render, which is the
  gate doing its job on a new platform. Lumo's `Button`/`IconButton` now
  forward engine props (`aria-expanded`, the composed press) to the Pressable so
  they can be slotted as triggers and close controls.
- Two runtime dependencies for the native package (`@rn-primitives/dialog`,
  `@rn-primitives/portal`, pinned in the catalog); no NativeWind, no Tamagui.

Decision: `@rn-primitives` is the native engine for overlays and composite
widgets (Popover, Menu, Tabs, Checkbox next); Button, Switch, TextField stay on
plain primitives. Same rule as the web: the engine underneath, Lumo's contract
on top, the gate over the served bytes on both platforms. RTL and any language
carry the same weight on mobile as on the web — the any-language native test
(German ltr / Egyptian Arabic rtl through the same provider) is the pin.

## 30. Best in class per platform: web stays Base UI + Tailwind + tokens; mobile is Flutter (17 Aug 2026)

The owner's rule, stated verbatim: "i want the best in class, if mobile is
better with flutter then it is flutter, if like now, the best case is base ui
with tailwindcss and tokens on web then it is that." This supersedes decision
§27's "never Flutter" and §29's React Native engine choice for *product*
mobile work.

What was measured to get here (record: `docs/history/rn-vs-flutter-2026-08-16.md`):
three twins of one screen (Expo/RN, Flutter, Lynx) on one simulator; a 2,000-row
bench on the two finalists (Flutter: 60 fps, whole-list update 14–40 ms even in
debug; Lynx: 60 fps, 216–273 ms, and `<list>` shows stale rows after off-screen
updates); the Persian l10n probes (Flutter `intl` dates are Gregorian only — Jalali
needs a package; PrimJS Intl does Jalali/plural/currency); Lynx's accessibility
model (traits image | button | text, no states) which cannot carry Lumo's
contract; RN's app-level RTL, build-dependent Intl and library-dependent
motion/perf — every owner priority a workaround.

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
- **`@lumo-ui/native` (React Native) and the Lynx twin: REMOVED** on the
  owner's instruction the same day ("remove old projects and folders and
  files") — package, docs Mobile tab, previews, gates, catalog pins, token
  generators. History keeps the code; `docs/history/rn-vs-flutter-2026-08-16.md`
  keeps the findings. Lynx is re-evaluated only if it ships accessibility
  roles/states and the `<list>` bug is gone — from scratch, not from a kept twin.
- **Docs site:** the Mobile tab returns as a Flutter-web embed of the same
  Dart components (the way forui / shadcn_flutter show theirs), labelled as a
  canvas preview; the semantics-tree tests remain the proof.

Why two libraries is acceptable: Lumo's value is the contract and the proof,
not the code sharing; the Dart library was built in a day; the cost of the wrong
mobile framework (RTL/perf/l10n workarounds forever) is larger than the cost of
one more implementation of a small, well-specified surface.

## 31. The Mobile side of the docs site is a Flutter web build, embedded and labelled (17 Aug 2026)

§30 said the Mobile tab returns "as a Flutter-web embed of the same Dart
components (the way forui / shadcn_flutter show theirs), labelled as a canvas
preview". This is that, built.

The shape, which is the same shape the React Native version had before it was
removed — because it was right and only its platform was wrong:

- **The platform is a ROUTE, never client state**, exactly as the locale is:
  `/components/<slug>/` is Web, `/components/<slug>/mobile/` is Mobile, and the
  `Web | Mobile` switch is two real links. Both pages are served bytes the gate
  grades. A switch that only re-rendered would give the reader a URL they cannot
  send to anyone.
- **One gallery app serves every demo.** `apps/mobile-gallery` is a Flutter web
  build addressed as `?demo=<id>&lang=<tag>&theme=<light|dark>`; each component
  page embeds it in an iframe inside a phone frame. One app rather than one per
  component means the ~13 MB engine is fetched and cached ONCE for the whole
  site instead of per page.
- **The demo copy is localized**, like the web examples' copy, and the source
  snippet is emitted per locale. A Persian button on the English page beside an
  English one on the Web page would have made the two platforms look like two
  products.
- **The props table is generated from the Dart** (`scripts/build-mobile-api.mjs`
  → `mobile-api-reference.json`), and marks which parameters are ANNOUNCED
  strings — the contract's headline, visible in the table rather than only in
  prose.

What we accepted, and said on the page in both languages:

- **The preview is a canvas.** Flutter web paints into WebGL/WASM; there is no
  DOM inside it, so the served-HTML gate cannot grade a single thing the reader
  sees in that frame. The proof for what is inside is the semantics-tree tests
  in `packages/mobile/test/` — the mobile counterpart of the gate — and the page
  says so rather than letting the frame imply it was graded.
- **The gate's INPUT SCOPE excludes the gallery shell**, and only the shell:
  `packages/gate/src/cli.ts` names `mobile-preview/` in `EMBEDDED_ASSET_DIRS`
  and prints the skip on every run. It is a bootstrap document with no locale
  segment and no prose; handed to the grader it produced a crash, not a
  violation — the grader correctly refusing to guess a locale. No rule was
  disabled and every documentation page is still graded by every rule.
- **The built gallery is BUILT, not committed** (`apps/website/public/mobile-preview/`,
  ~17 MB after pruning the unused skwasm renderer, the symbol maps and the
  installable-app surface). It was committed first, on the reasoning that the
  site should build on a machine that has never heard of Dart. The owner
  rejected that: the repo needs Flutter anyway, so it was 17 MB of git weight
  for nothing, re-added on every gallery change and kept forever.
  That was right, and checking it made it more right — **CI did not install
  Flutter, so `gate:flutter`, `gate:flutter-contract`, `gate:mobile-api` and
  `gate:mobile-demos` never ran there at all.** The Dart library was graded on a
  laptop and taken on trust in CI, which is the arrangement every other gate in
  this repo exists to refuse. So: the toolchain is a CI dependency now, the
  mobile gates run on the runner, and `apps/website`'s build runs
  `scripts/ensure-mobile-gallery.mjs`, which hashes the gallery's inputs (its
  Dart, its web shell, its pubspec, AND `packages/mobile/lib`) and rebuilds only
  on a miss. Absent Flutter it fails with the command to fix it;
  `LUMO_SKIP_GALLERY=1` is the visible escape and says what it left stale.
- **The English page shows Persian-first components behaving in English.**
  `lang` drives direction, digits and copy; it does not pretend the library's
  defaults are Latin.

Why not build the docs site itself in Flutter (shadcn_flutter's answer): the
site is the WEB library's own showcase and its served bytes are the web
library's proof. Replacing it with a canvas would delete that proof to gain a
demo.

## 32. The web had a second radius ramp nobody declared (17 Aug 2026)

The owner's read was that the web looks rounder than mobile and the mobile radii
should be thicker. Measured, the first half is true and the second is not, and
the difference matters.

The three-step ramp is **already identical**: `--lumo-sys-radius-sm/md/lg` are
0.375/0.5/0.625rem, and `LumoRadius.sm/md/lg` are 6/8/10 dp — the same numbers,
from the same generator. `getComputedStyle` on the live docs site returns
`--radius-md: calc(.5rem * 1)`. Nothing to thicken.

What the web actually had that mobile did not was **three more steps that were
never declared**. `packages/ui` uses `rounded-full` 40 times, `rounded-xl` 3 and
`rounded-2xl` once — but `theme.css` mapped only `sm`, `md` and `lg`, so those
three fell through to **Tailwind's own defaults** (0.75rem, 1rem,
`calc(infinity * 1px)`). A second radius ramp, shipping in production, outside
the design system: a brand's `--lumo-ref-radius-scale` could not reach it, and
the Flutter generator could not see it.

Flutter paid for that in hand-written numbers: `BorderRadius.circular(999)`
seventeen times across ten files, `Radius.circular(16)` in `message.dart` for
the web's `rounded-2xl` — and `Radius.circular(4)` for a corner **its own
comment said was `rounded-*-md`**, which is 8. The comment had been right and
the number wrong for as long as both existed. A number cannot disagree with a
token it never referenced, so nothing could have caught it.

So: `--lumo-ref-radius-xl` (0.75rem), `--lumo-ref-radius-2xl` (1rem) and
`--lumo-ref-radius-full` (9999px) are declared, promoted to `--lumo-sys-*`, and
mapped in `theme.css` **at exactly the values Tailwind was already producing** —
no web pixel moves. `full` is deliberately NOT scaled by the brand knob: a pill
is not a step on the ramp, and a brand must not be able to turn one into a
rounded rectangle. `LumoRadius` gains `xl`, `xxl` (Dart cannot start an
identifier with a digit) and `full`.

The guard is `house_rules_test.dart`: a bare number in a radius constructor
fails. It found one more the sweep had missed — a chart legend swatch at 10×10
with a 3px corner where the web is `h-2 w-2 rounded-[2px]`. That one is a real
exception (the smallest Lumo step on an 8px chip is a circle, and a circle reads
as a status dot), so it is now 8×8 at 2px and named in the exemption list with
its reason, the same shape as the hand-rolled-`BoxShadow` rule above it.

## 33. Two defects found by rendering the docs instead of reading them (17 Aug 2026)

Both came out of the same complaint — "in a lot of components icons are not
centred, they are shifted to the right" — and neither was what it sounded like.
`LumoIconButton`, `LumoIconTile`, `LumoAvatar` and `LumoSpinner` all measure
their glyph dead-centre in both directions. The cause was elsewhere, and finding
it needed pictures: 105 demos rendered to PNG at 360×640 in both locales, then
measured.

- **The demo stage was stretching, not centring.** The gallery laid every demo
  out with `CrossAxisAlignment.stretch` on the argument that a widget should sit
  at the full phone width. But stretch does not centre — it makes every demo
  full-width, and a demo with nothing to fill that width sits hard against the
  reading start, which under fa-IR is the right-hand edge. Measured over the 105
  demos: **21 had their content pinned to one edge with the far side empty.**
  The web's preview stage centres (`grid place-items-center` › `flex
  items-center`), and the fix is to do the same: 21 → 6, and those 6 are widgets
  that genuinely fill the width and are start-aligned inside themselves.
  Greedy widgets still fill; intrinsically-sized ones now take their natural
  width and centre, exactly as the same component does on the Web tab.

- **Button labels did not inherit the app's font.** Found by accident: Persian
  rendered in the shots everywhere except inside buttons.
  `ButtonStyle.textStyle` **replaces** the theme's `labelLarge` rather than
  merging with it, so the bare `TextStyle(fontSize:, fontWeight:)` in
  `button.dart` silently dropped `ThemeData.fontFamily`. An app setting
  `fontFamily: 'Vazirmatn'` got Vazirmatn everywhere except its buttons, where
  Persian fell through to the platform face. **26 strings across 11 slugs**, all
  of them button labels, one root cause. Only the family travels now; size,
  weight and metrics stay the widget's.

The method is the point. A semantics test cannot see a font fall back, and a
geometry test on the widget cannot see a stage that never centres it. Rendering
the thing and measuring the picture found both in one pass.

## 34. Cleanup: the copies that had already drifted (17 Aug 2026)

A tidying pass, kept to duplication that was actively wrong rather than merely
repeated.

- **Flutter SDK discovery lived in three scripts** — `gate:flutter`, the gallery
  build, and the ensure-wrapper in front of it — as the same twelve copy-pasted
  lines. They had already drifted in a way none of them could notice: each
  accepted `/usr/local/share/flutter/bin/flutter` as a candidate, and each then
  hard-coded `/opt/homebrew/share/flutter/bin` as the directory to append to the
  child's PATH. On any machine whose Flutter is not the Homebrew cask — an Intel
  Mac, a manual install, a CI runner that unpacks the SDK elsewhere — the binary
  was found and then invoked with a PATH that did not contain it. Now
  `scripts/lib/flutter.mjs` DERIVES the PATH entry from where the binary was
  actually found, which is the only arrangement in which the two cannot disagree
  again.

- **`importSpecifiers` lived twice, byte for byte**, in `build-registry.mjs` and
  `smoke-consumer.mjs` — and those two answer questions that must agree: the
  registry declares what a consumer will have to install, and the smoke test
  checks that a consumer given exactly that can build. Two copies of the parser
  behind both answers is precisely where a drift would be silent, because each
  side would still be internally consistent with itself. One copy now, in
  `scripts/lib/ts-ast.mjs`.

- **`docs/codebase.md` had drifted from the code**: it said the gate carries 14
  served-HTML rules where `RULES` holds 13, and it did not mention
  `packages/mobile` or `apps/mobile-gallery` at all — a library of 145 widgets
  and the app that renders every one of its demos, absent from the map
  of the repo. Both fixed, with the counts taken from the artefacts rather than
  from memory.

- **`house_rules_test.dart` announced "Two defect-class guards"** while holding
  five. The header now lists them, and says why an exemption must name a file
  AND a reason.

What is deliberately NOT done: `build-catalog.mjs` and `build-registry.mjs` both
carry a near-identical `property()`/`resolve()` pair for reading a copy table out
of an object literal. It is real duplication, but the two differ in what they
close over, and merging them is a design decision about a shared meta-reader, not
a cleanup. Left standing, and written down here so the next person finds it
already noticed.

## 35. The render floors, and the instrument that did not work (17 Aug 2026)

Tier M item M1. The two defects of §33 are now permanent floors over all 105
gallery demos, in `gate:flutter` — `apps/mobile-gallery/test/render_floors_test.dart`.

They live in the **gallery**, not in `packages/mobile`, because that is the one
place every family is already instantiated with real required arguments and real
Persian copy. A sweep there covers a family the day its demo lands, with no
opt-in step for anyone to forget.

**The font floor** pumps every demo under a theme whose `fontFamily` is a name
no font stack can satisfy, and fails on any string that did not inherit it. Its
first run reported 55 failures, all of them icons: Flutter renders `Icon` as a
`RichText` in `MaterialIcons`, which must *not* inherit the text family. The rule
is therefore about strings a reader reads — a run whose every codepoint is in a
private-use block is a glyph, and skipped. After that: zero.

**The alignment floor took two attempts, and the first was wrong.** The obvious
measurement is to capture the frame and compare the blank margin either side of
the painted ink. Measured across all 105 demos it cannot work: legitimately
start-aligned content reaches a **64dp** imbalance (`timeline-1`, a rail down the
reading start) while the broken state peaked near **69dp**. The populations
overlap, so no threshold separates "the stage stopped centring" from "this widget
reads start-first", and a floor that cannot tell them apart is a floor that gets
deleted the first time it cries wolf.

What separates them exactly is structural. Under `stretch` a Column's cross size
is the incoming maximum, so **every** demo is the frame's width. Under `centre`
it is the widest child, so an intrinsically-sized demo is narrower — today 29 of
105, each centred to within a pixel. The floor asserts that at least 20 demos are
narrower and that every narrow one is centred. A revert takes that count to zero.
It is also a synchronous rect read: no image capture, no threshold, no flake, and
the whole sweep runs in 21 seconds.

Both are poison-tested, per the house rule: reverting the stage to `stretch`
fails the first, and deleting the two `fontFamily` lines from `button.dart` fails
the second with the exact string it lost.

**It found two more defects on its first green run**, neither of which any
existing instrument could see:

- `LumoRangeSlider`'s header **overflowed by 85px at 328dp**. The label was
  already `Expanded` with an ellipsis, which looked handled — but a flex child is
  laid out with what the *non-flex* children leave, and the three value Texts
  beside it were unconstrained, so they simply pushed past the edge. Both sliders
  now flex on both sides, and the range slider's value pair is one `Text.rich`
  with three spans, because three sibling Texts cannot ellipsise as a unit.
  `cramped_layout_test.dart` did not catch this: it does not cover the sliders.
- The `separator-2` demo overflowed for the same reason — two Persian labels
  either side of a vertical rule, at their natural width, on a 360dp phone.

One test changed to match: `slider_test.dart` looked for the value with
`find.text('۲۰')`, which no longer matches a span inside a combined text. The
rendered string and the semantics are identical, so the finder was the
implementation detail — it now reads the same assertion off the combined text,
with a comment saying why.

## 36. The mobile semantics grader, and what the platform already had (17 Aug 2026)

Tier M item M2. `apps/mobile-gallery/test/semantics_grader_test.dart`: every demo
rendered in both locales, its semantics tree walked, four rules applied to every
node — `named-controls`, `persian-digits`, `engine-english`, `announced-once` —
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
shared with the web, so raising them moves both platforms. That is an owner
decision (Tier M item M8), so the three counts are RATCHETED at today's values
and may only fall. The house floors stay: they grade the tokens and the API
before a demo exists, where the SDK guidelines grade what a demo rendered.

## 37. A mutation floor for the mobile library (17 Aug 2026)

Tier M item M5. `scripts/mutate-mobile.mjs`, `pnpm run mutation:mobile`, run as
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

## 38. Documenting the mobile API, and what the barrel is for (17 Aug 2026)

Tier M items M3 and M6, and a correction that came out of doing them.

**The barrel is the public API, not the directory listing.** `build-mobile-api.mjs`
globbed `lib/src/*.dart`, so it documented whatever was there —
including `date_value_box.dart`, which has two public classes
(`LumoDateFieldFrame`, `LumoDateValueBox`), is internal composition for the three
date families, and has no `export` line. The docs site was showing API a consumer
cannot import. The generator now reads the barrel and skips the rest, with the
reason printed per skipped file. The count moved 145 → 143 widgets, 1062 → 1049
props, and the surface is now exactly what can be imported.

**M3: undocumented props 458 → 0**, the same floor the web reached, ratchet
locked at 0. The work was mostly vocabulary: 391 of the 458 were repeats of names
whose meaning is uniform across the library — `isDisabled`, `description`,
`errorMessage`, `isReadOnly`, `isRequired`, `placeholder` — and the wording for
those is lifted from `packages/core/src/props.ts` so the two platforms say the
same thing about the same prop. The rest were written per widget. Where the
meaning genuinely varies (`label` is a visible name on one family and an
announced-only name on another) the sentence says what is true of both rather
than guessing.

One tooling note worth keeping: the first pass documented the first matching
field in each FILE, so a second class declaring the same field was skipped —
`isDisabled` stayed undocumented in 24 widgets. Field lookup is now scoped to the
widget's own class body.

**M6: `gate:mobile-smoke`.** A throwaway Flutter package outside the workspace
depends on `lumo_ui_mobile` by path, imports only the barrel, and names all 143
widgets and 67 enums. It catches a pubspec missing a dependency the monorepo
happened to supply, and documented API the barrel does not export — the other
half of the `date_value_box` fix. Poison-tested by removing one export line: 10
analyzer errors, exit 1.

## 39. The mobile library has families the web cannot host (17 Aug 2026)

Found while adding demos for Tier M item M4. `build-mobile-demos.mjs` requires
every mobile slug to exist in `catalog.json`, and `catalog.json` is derived from
the WEB registry. So a mobile family with no web counterpart cannot have a
documentation page **at all** — the build fails with "names slug X, which
catalog.json does not have".

Five families are blocked by this today: `app_bar`, `navigation_bar`,
`navigation_drawer`, `pull_to_refresh`, `layout`. That is not an accident of
naming. A phone has an app bar and a bottom navigation bar; a web page has
neither, and pull-to-refresh is a gesture the web does not own. The Web|Mobile
toggle (decision §31) assumed a parity between the two libraries that the mobile
library was always going to break the moment it did its job properly.

Demos for `app_bar` and `navigation_bar` are written and parked rather than
deleted. The fix is a website change — a component page that renders with only a
Mobile side — and it is Tier M item M9.

M4 itself moved: 47 → 52 slugs, 105 → 112 demos, and the widgets that no demo
ever shows fell 66 → 56. Every new demo is graded by the semantics grader and the
render floors on the day it lands, which is the point of putting the sweeps in
the gallery.

## 40. The answer to a mobile-only family is usually a slug, sometimes a component (18 Aug 2026)

Decision §39 recorded that five mobile families could not have a documentation
page, because `build-mobile-demos.mjs` requires every mobile slug to exist in
`catalog.json` — which is derived from the WEB registry. The owner's call was to
build the web counterparts rather than teach the site to render a Mobile-only
page. Doing that showed the premise was half wrong.

**Three of the five needed no new component at all.** They were slug-name
mismatches, not missing components:

| Mobile family | Web counterpart that already existed |
|---|---|
| `layout` (`LumoStack`, `LumoGrid`) | `stack` — "Stack over flex, **Grid** over grid, Container for the page measure" |
| `layout` (`LumoAspectRatio`) | `aspect-ratio` |
| `navigation_drawer` | `sidebar` — "groups, icon-and-badge items, and a collapsed rail" |

A navigation drawer IS the app sidebar; a phone puts it behind an edge because
it has no room to keep it on screen. Writing the mobile demos under those slugs
unblocked three families for the cost of three demo files.

**One needed a real component, and now has one.** `AppBar` exists on the web:
`packages/ui/src/app-bar.tsx`, with tests, a type-test, a worked-examples page,
a mutation operator (`KILLED app-bar.tsx`), and its row in the registry, API
reference and catalog. It is the same component as `LumoAppBar` in the sense that
matters — same slots, same required title, same rule that the actions name
themselves — and it renders on the SERVER, which is only possible because
`leading` and `actions` are slots rather than `onBack`/`onAction` callbacks.

Two remain: `navigation-bar` (a bottom navigation bar — MUI and Mantine both ship
one for mobile web, so a web counterpart is defensible) and `pull-to-refresh`.
**`pull-to-refresh` should probably NOT get a web component.** It is a touch
gesture; building a web version so that a documentation page can exist is the
tail wagging the dog. Either it keeps no page, or M9's original shape — a page
with only a Mobile side — is still needed for exactly one family.

### What the new demos found

Writing demos for widgets nobody had demoed exercised them in a context their
tests never had, and two sharp edges came out:

- **`LumoStack`'s `align` defaults to `stretch`.** On a COLUMN that means fill
  the width, which is right. On a ROW it means stretch on the vertical axis,
  which inside a scroll view is unbounded — a layout assertion, not a wrong
  pixel. The default is direction-dependent in a way the docblock does not warn
  about. The demo passes `align: center` and says why; whether the default should
  vary by direction is an API decision, not a demo's.
- **`LumoNavigationDrawer` needs a bounded height.** Reasonable for a full-height
  panel, and worth showing in the demo rather than discovering in an app.

Both were caught by the render floors and the semantics grader the moment the
demos landed — which is the argument for putting those sweeps in the gallery
rather than in the library.

## 41. `NavigationBar` on the web, and the badge that was never announced (18 Aug 2026)

The second half of decision §40. `packages/ui/src/navigation-bar.tsx`, with
tests, a type-test, a worked-examples page, a mutation operator, and its rows in
the registry, API reference and catalog. The parked mobile demo is registered, so
`navigation-bar` now has both sides of the docs toggle.

**The destinations are LINKS, not buttons with a selection callback**, and that
is the one place this component parts from `LumoNavigationBar`. It is not a
divergence from the mobile API so much as an honest reading of each platform: on
a phone the tab bar swaps a view inside one app; on the web it navigates, and a
thing that navigates is an anchor. `aria-current="page"` — not the colour, not
the filled glyph — is what says which destination you are on, and it comes from
`Link`, so the bar inherits `linkComponent` and with it the app's router.

### Two defects, one of them pre-existing and shipped

**The badge was not announced.** The obvious build puts the count inside the
icon's `aria-hidden` wrapper, because that is where it sits visually. Do that and
«سفارش‌ها، ۱۲» is announced as «سفارش‌ها»: an icon is decoration and a count is
information, and burying one in the other loses it. The badge is a sibling of the
hidden glyph, positioned with `inset-inline-end` so it lands on the correct side
in both scripts.

**Then the fixed version announced «سفارش‌ها۱۲».** Two adjacent spans concatenate
in the accessible name with nothing between them, so the count became part of the
same word. The separator is a literal `{" "}`, and it is not cosmetic.

**`SidebarItem` had the same defect, in shipped code.** It has carried
`<span>{children}</span>{badge && <span>{badge}</span>}` all along, and a
`SidebarItem` with a badge has been announcing «سفارش‌ها۱۲» to every screen-reader
user since it was written. Found only because the new component was given a test
that asserted the accessible NAME rather than the presence of the text. Both are
fixed; `sidebar`'s own suite still passes unchanged, which is the point — nothing
it asserted was ever about the name.

### The gate caught the third

`gate:props` rejected the first version: `NavigationBarProps` wrote `aria-label`
from `label` and still inherited `aria-label` through the consumer spread, so a
caller could overwrite the name the component claims to own. Omitted, and the
authored value is authoritative. That rule exists because this mistake is
invisible in every test that passes its own props.

## 42. One page, either platform — and the two sides now read alike (18 Aug 2026)

Two owner requirements, answered together: **the same page should render for
either mobile or web**, and **the two sides should look the same**.

### The same page, either platform

Decision §40 built web counterparts for the families that deserved them and left
`pull-to-refresh` — a touch gesture the web does not own — with nowhere to live.
The site now hosts a family that exists on ONE platform:

- `meta.platforms` on the examples file. `["mobile"]` registers a family with no
  web component; the file carries `meta` and an empty `examples`. It is still the
  ONE registration point the contract has always promised — no second list.
- The loader stops at that flag before the web-only requirements bite: no
  examples to slice, no module in `packages/ui/src`, no barrel re-export, no
  generated API. Each of those is a fact about a web component.
- `catalog.ts` keeps `allCatalog()` meaning "has a web side" and adds
  `allMobileOnly()` beside it. Making `render`/`source` nullable on
  `CatalogEntry` would have pushed a "this cannot happen" branch into the landing
  gallery, the `/view/` route and the registry resolver to describe a case that
  has neither.
- `catalog.json` gains the family as `type: "registry:mobile"` — nothing is
  copied into a web project, but `lumo search` should not pretend the library is
  smaller than it is, and `build-mobile-demos.mjs` reads this file to check a
  demo's slug is a real page.
- The Web side of such a page is the same shell — sidebar, header, Web|Mobile
  switch — with the preview replaced by one sentence: the web library has no
  counterpart, and that is not a gap.

`pull-to-refresh` is the first, and the blocker recorded in §39 is closed.

### The two sides now read alike

The pages already shared a skeleton — same grid, same header, same tabs, same
rail — and differed in WHICH sections existed:

| | Web | Mobile |
|---|---|---|
| before | preview · installation · examples · **usage** · **composition** · api · evidence | preview · installation · demos · **contract** · api · **caveats** · evidence |
| after | unchanged | preview · installation · demos · **usage** · contract · api · caveats · evidence |

"When to use it" is a fact about the FAMILY, not about one platform, so the
Mobile page now reads the same `meta.usage` the Web page reads and prints the
same two sentences in the same markup at the same position. A reader who flips
the switch should not be told a different story about when to reach for the
thing; before this the section simply did not exist on that side.

### Three slug↔file mappings, stated rather than guessed

`sidebar → navigation_drawer.dart`, `stack → layout.dart`,
`aspect-ratio → layout.dart`. The web splits its layout primitives across two
pages and the mobile library keeps all three in one file; the app sidebar is the
phone's navigation drawer. `mobileFileFor` refuses to guess, which is why adding
these demos failed loudly until the mapping was written down.

### What the gate caught, again

`gate:html` failed the first build with four `no-latin-digits` violations — in
MY copy. The Persian intro I wrote for the app-bar page said `min-w-0`, and its
`0` is a Latin digit on a Persian page. Reworded. The rule exists because this is
exactly how it happens: not a number in data, a class name in a sentence.

## 43. The first device run, and what the host had been getting wrong (18 Aug 2026)

Tier M item M7, in part. `apps/mobile-gallery/integration_test/device_evidence_test.dart`
renders every gallery demo in both locales on attached hardware and applies the
SAME rules the host sweep applies — imported from `lib/src/semantics_rules.dart`,
extracted for this run so that one implementation grades both. Two copies of an
accessibility rule is how a device number and a host number quietly stop being
comparable.

To get there the gallery gained an iOS target (`flutter create --platforms=ios`)
and `integration_test`. It signs with the team the reference app already uses.

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
as known-optimistic, with the device figure beside it. This also moves M8 from a
tap-target decision to a contrast one first: `fgMuted` and `fgSubtle` at 12px are
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

## 44. Four docs defects the owner could see, and three I introduced fixing them (18 Aug 2026)

The owner reported four things from a screenshot: the sidebar's platform
indicators look ragged, there is no WEB indicator, the Web|Mobile switch moves
when you flip it, and the Mobile page has no direction control. All four were
real; the interesting part is what the fixing found.

**The sidebar was one CSS mistake, not a design problem.** The phone glyph and
the "new" dot were siblings on the row's flex line and BOTH carried `ms-auto`.
Two auto inline-start margins split the row's free space equally, so on a row
with both, the phone landed at the midpoint between title and dot — an offset
that moved with the title's LENGTH. Ten of 115 families carry both flags, so ten
glyphs sat at ten different places while the rest sat flush. Now one end-aligned
group of three fixed-width slots (new · web · mobile), each rendered whether
filled or not, which is what makes the columns line up. Measured after: every
glyph on one x.

The WEB indicator needed no new plumbing: `allCatalog()` IS "has a web side" by
construction and `allMobileOnly()` is its exact complement, and the sidebar
already awaited both. The split is 57 web-only, 57 both, 1 mobile-only.

**The switch was not moving; it was staying still behind different things.** Both
headers use byte-identical containers. The web toolbar holds PlatformSwitch,
CopyButton, Pager; the mobile toolbar holds the switch alone. The group is pinned
to the inline end, so a child's distance from that edge is the width of
everything AFTER it — about 11-12rem on web, zero on mobile. Putting the switch
LAST fixes it for both, and keeps fixing it when either page gains a control,
which forcing the two toolbars to match would not. Measured after: x=288 on both.

**The direction control is a locale link, and that is the point.** The web's
"LTR|RTL" never flipped a direction: it navigates to the same route in the
mirrored locale, a separately prerendered document with its own genuine
`lang`/`dir`. Direction is derived from the locale in both libraries and there is
deliberately no `dir` prop anywhere, so a control that flipped direction while
the language stayed put would be the one thing the contract refuses. Extracted as
`direction-switch.tsx` and mounted on the Mobile page, which had no control at
all. `apps/mobile-gallery/lib/main.dart` needed ZERO changes: the gallery already
derives direction from `?lang=`.

### Three defects I introduced, and what caught each

- **A Latin comma in a Persian announced phrase.** The sr-only summary joined its
  two parts with a hardcoded `", "`, so a Persian reader heard «فقط وب, جدید».
  Persian's comma is «،» U+060C; the separator is COPY and now lives in the copy
  table per locale. **No gate catches this** — `native-script-text` passes
  because the run holds Persian characters. A second reader caught it.
- **The two glyphs were not normalised.** An 18×13 screen beside a 10×20 phone at
  one box size renders 9px of ink beside 5px: "thin and lost", which is the same
  asymmetry the change existed to fix. Both are now comparable ink at one stroke
  weight — and the screen's stand was a dash floating four units clear of its own
  body.
- **The Mobile page's opening paragraph.** It printed the WEB component's intro:
  on `description-list` a Flutter reader met `<dl>/<dt>/<dd>` and Tailwind's
  preflight; on `tooltip`, "appears on hover", which on a phone it does not. The
  first fix used the widget's own Dart docblock — right platform, but a `///`
  comment has ONE language, and `persian-digit-floor` failed the build
  (`phone-input/mobile`: 26 Persian digits expected, 22 found). Swapping Persian
  prose for English prose on a Persian-first page is a different defect. It now
  uses the first demo's description, which is mobile-authored AND bilingual.

**And a correction of yesterday's own reasoning.** The "when to use it" section
was added to the Mobile page earlier the same day, arguing that when to reach for
a family is a fact about the FAMILY rather than about one platform. Reading the
copy disproved it: it is written in web terms and cross-references web components
("use `HoverCard`"), so printing it on the Flutter page made that page MORE
web-voiced, not less. Removed, with the reasoning kept beside the gap.

One more: the `phone-input` demo description said «... همیشه E.164 است». That was
safe inside a demo card and is not safe as page prose — a bare Latin identifier
in Persian prose needs a `data-lumo-latn` island, which a manifest string cannot
carry. Reworded, with the example number in Persian digits.
