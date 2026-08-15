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
