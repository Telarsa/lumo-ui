# Decisions, and the evidence for them

Originally dated 30 July 2026, amended 9 August 2026. Each of these was checked
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
