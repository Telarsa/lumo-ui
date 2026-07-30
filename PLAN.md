# The plan, before any of it is built

Documented first, on the owner's instruction. Nothing here is implemented except
`Select` in `@lumo-ui/core`.

**Name and domain: undecided.** `lumo-ui.com` recommended and available;
`kite-ui.com`, `onyx-ui.com`, `juno-ui.com`, `sable-ui.com`, `vela-ui.com` also
free. Every package here is currently `@lumo-ui/*` as a placeholder. **Do not
build the docs site or publish anything until the name is fixed** — a rename
after the site exists means URLs, npm scopes and imports all move at once.

**Sequencing: Tessalor first.** The owner's instruction is that the platform's
open work finishes before this library is built out. See the bottom of this
file.

---

## Do the research before writing components

The instruction was explicit: use the existing solutions as reference **and read
their issue trackers**, so the same mistakes are not repeated. That research is
a task in itself and comes before the first component.

Read, at minimum: **shadcn/ui**, **Radix Primitives**, **Base UI**, **Ark UI**,
**Kobalte**, **Bits UI**, **React Aria**. Look at closed issues as much as open
ones — a closed issue with a workaround is a design decision somebody regretted.

### What is already known to go wrong

Collected from what these projects publicly struggle with. Each is a decision to
make deliberately rather than inherit.

| Known problem | Where it bites | What to do instead |
| --- | --- | --- |
| **Copied components have no version** | shadcn. You copy a Button, it is yours, and eighteen months later nobody can tell which revision it came from or what upstream fixed | Stamp a version and a source hash in a comment when a component is copied, and ship a `diff` command that tells you what changed upstream |
| **The CLI overwrites customisations** | shadcn `add --overwrite` destroys local edits; there is no merge | Never overwrite. Show the diff and let a human apply it |
| **`asChild` polymorphism** | Radix. Powerful, type-hostile, and a common source of "why did my ref disappear" | Do not build it. Render a real element; if a consumer needs a different tag, take a `tag` prop |
| **Portals versus SSR** | Every React library. A portal has no server equivalent, so the markup differs between passes and hydration mismatches | Render inline by default. Only portal when escaping `overflow: hidden`, and make it opt-in |
| **Scroll locking on iOS** | Radix Dialog, years of issues. `position: fixed` on `body` loses scroll position and fights the address bar | Use `overscroll-behavior` and the `inert` attribute. Do not touch `body` position |
| **Controlled/uncontrolled confusion** | Universal. A component silently switches mode when `value` becomes `undefined` | Pick one. These components are controlled, always. It is less clever and it is never ambiguous |
| **`cn()` / `tailwind-merge`** | shadcn ships a runtime class-merging dependency on every component | Not needed — styling is CSS against data attributes, so there are no classes to merge |
| **Form components welded to one form library** | shadcn's Form assumes react-hook-form | Components take value and onChange. Form integration is an example in the docs, not a dependency |
| **Animation requires a library** | Several ship framer-motion for a fade | CSS transitions on data-attribute state. `@starting-style` and `transition-behavior: allow-discrete` cover enter/exit natively now |
| **Focus trap breaks with nested overlays** | A select inside a dialog inside a drawer | Test that combination explicitly. It is the one everybody ships broken |
| **Docs demos are client-only** | So SSR bugs reach consumers first | Every demo server-renders. See ARCHITECTURE.md |

---

## The component inventory

Parity with shadcn, plus what it lacks. Ordered by how much a consumer suffers
without it.

**Tier 1 — the platform cannot be styled without these**
Select · Dialog · Popover · Tooltip · Tabs · Checkbox · Radio Group · Switch ·
Accordion · Dropdown Menu

**Tier 2 — expected of any complete library**
Combobox · Command palette · Date Picker · Slider · Toast · Alert Dialog ·
Sheet / Drawer · Progress · Avatar · Badge · Breadcrumb · Card · Collapsible ·
Context Menu · Hover Card · Input · Label · Menubar · Navigation Menu ·
Pagination · Scroll Area · Separator · Skeleton · Table · Textarea · Toggle ·
Toggle Group

**Tier 3 — where to be better than the reference**
Data Table (sorting, filtering, virtualisation) · File Upload with drag, paste
and progress · Number Input with locale-aware parsing · Chart primitives ·
Empty State · Multi-Select · Tree · Resizable panes · Carousel

Tessalor already needs Tier 1 and three Tier 3 items — the file upload, the data
table and the chart primitives. **Build what the platform needs first.** A
component with one real consumer is designed better than one designed for an
imagined audience.

---

## Theme generator

`@lumo-ui/theme` emits CSS custom properties from a token definition, in the
tradition of shadcn's theme editor: pick a base hue and radius, get a full
palette in OKLCH with light and dark, and copy the CSS out.

Two things to do better than the reference:

- **Contrast is verified, not assumed.** Every generated pair is checked against
  WCAG at generation time and the generator refuses to emit a failing
  combination. Tessalor shipped a 4.17:1 token pair to production and it took a
  Lighthouse run to find.
- **One definition, both themes.** Light and dark are generated together from
  one source. Tessalor's dark values drifted between two hand-written blocks and
  produced exactly the bug above.

---

## Blocks

Larger compositions assembled from `@lumo-ui/ui`: sign-in, settings panel, empty
state, data table with toolbar, file dropzone with queue, pricing table. Copy-in
like the components.

---

## Order of work

1. **Fix the name and buy the domain.** Everything else is blocked on it.
2. **Research pass.** Read the issue trackers above and turn the findings into
   decisions recorded here.
3. **Finish Tessalor's open work.** Below.
4. Extract Tessalor's real components into Tier 1, one at a time, each with the
   platform as its first consumer.
5. Docs site — only once there is something to document.
6. Tier 2, then Tier 3.

---

## Blocking Tessalor work, which comes first

From the owner, in priority order:

1. **Performance 81–83.** Entirely render-blocking CSS: FCP 1.4 s, LCP 1.5 s,
   two stylesheets blocking 154 ms and 304 ms. TBT is 0 ms and CLS is 0, both
   perfect — JavaScript is costing nothing. Fix is critical-CSS inlining.
2. **The ~5% test flake.** A generated `recomputes to a real figure` test fails
   about one run in twenty, on a different tool each time. The input holds the
   new value; the result does not follow. Not root-caused. **Blocks the 200.**
3. **Toggles render as full-width input boxes.** A boolean is given the same
   `FieldShell` treatment as a text field, so four checkboxes stack into four
   large empty rectangles.
4. **The dropdown must be ours.** `@tessalor/ui`'s Select is wired in but still
   uses the older `classes` prop; move it to the data-attribute contract that
   `@lumo-ui/core` now has, and delete the duplicate.
5. **File upload** — too small, no visible button, label duplicated.
6. **Result actions** — download and print are effectively invisible. Tools
   compute correct answers a visitor cannot take away. Worst functional gap.
7. **Header mega menu** for all twelve categories.
8. **Chart type toggle** — render each type at build time, switch with CSS.
9. **Spurious horizontal scrollbars** — sweep at 320/390/768.
10. **Home page weave** — more interesting, custom cursor.
