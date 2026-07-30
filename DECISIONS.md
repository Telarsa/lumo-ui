# Decisions, and the evidence for them

Dated 30 July 2026. Each of these was checked rather than recalled; where a
thing is unverified it says so.

---

## 1. Build on Zag.js, not on hand-written state machines

**Decided.** `@zag-js/preact` exists, is MIT, and is versioned in lockstep with
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
