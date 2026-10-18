# Lumo UI customer journey audit and plan — 18 October 2026

## Scope and evidence

Lumo is a Persian-first correctness layer for applications built with their own
web components or Flutter Material widgets, not a component library. The
maintained product thesis, `README.md`, `packages/gate/src/rules.ts`, and the
website's own `src/content/site.ts` establish the contract, lint policy,
served-HTML gate, calendar helpers and pinned GitHub installation. This Next.js
static-export site owns its semantic CSS, lime geometric mark and typography.
English, German and Persian routes include home, how it works, checks, six
technical documentation pages, the docs index and two legal pages.

The existing uncommitted documentation work predates this audit. Its explicit
adapter preserves the authored corpus and adds language-independent section
anchors, localized permalink labels, keyboard-reachable listings, a corrected
formatter description and current install syntax. The handoff
`handoff-2026-10-14-documentation-ux.md` describes earlier evidence; it is
historical, not proof of the current source. `node
scripts/documentation-ux-browser.mjs --static` passed on this audit. A fresh
browser baseline is required before product edits.

The current visual direction is functional and measured: neutral surfaces,
lime signal, a real pipeline diagram, readable code and a working calendar.
In the experimental taste scale, estimate design variance 4/10, motion 2/10,
and density 6/10. The intended targeted evolution is 5/10, 1/10 and 6/10:
retain the identity and restrained motion while showing the product's concrete
value sooner. Interactive examples follow the broader UX and design-engineering
guidance rather than marketing-layout rules.

| Before | After | Why |
| --- | --- | --- |
| The home diagram describes contract, source checks and HTML abstractly; a real defect is not visible in the main journey. | Show one documented digit defect and its corrected form, explain the corresponding gate rule, and link to its reference. | A developer can understand what the tool catches before committing to setup. |
| Equal feature cards and a later workflow repeat capability descriptions. | Recompose the existing capability section as a compact capability list alongside the concrete example, keeping its verified copy and install path. | The page explains the distinction through evidence without adding another long section. |
| The gate reference shows `node scripts/grade-app.mjs` from a consumer project and standalone `lumo gate` in terminal snippets. | Point to `node_modules/lumo-ui/scripts/grade-app.mjs` and use `pnpm exec lumo gate` for an installed local binary. | The documented commands need to work from the project where the package was installed. |
| The calendar usage snippet calls `stringsFor(locale)` without identifying supported tags. | Show a concrete `fa-IR` example and explain that other tags require a complete caller-supplied string set. | `stringsFor` throws for `fa`, `en`, and `de`; the live demo already maps route locales and supplies German. |
| Each documentation permalink has the same accessible name. | Name each link with its rendered heading and localized link purpose, preserving the fragment. | A links list can distinguish section destinations, including headings with Latin tokens. |
| The diagram's planes and trace move indefinitely; its reduced-motion alternative already disables this. | End the nonessential motion or make it a short one-shot explanation that settles to a static state; keep reduced motion static. | Continuous motion alongside reading needs a pause/stop path; a static diagram avoids distraction without adding a control. |

## Real example

`packages/gate/fixtures/no-latin-digits.bad.html` contains the field-derived
Persian input `<input aria-label="مبلغ" value="1,234" />`. Running
`gradeHtml("fa/index.html", fixture)` from the committed gate build on this
audit produced `no-latin-digits` with detail `Latin digits in value: "1,234"`.
The same fixture contains Latin calendar cells and a mixed-digit announced
string, so the whole fixture correctly yields five findings for this rule. An
isolated version produced exactly one digit finding for `1,234` and none for
`۱٬۲۳۴`. The maintained `formatNumber(1234, "fa")` returns `۱٬۲۳۴` in this
runtime. Use these results rather than presenting an invented gate report. Display the
example as deliberate code/sample content so the site's own Persian gate does not
mistake an educational bad value for a live customer defect. Labels and context
must be complete and natural in all three languages; no customer or metric is
implied. Verify the corrected example has no corresponding digit finding.

## Implementation sequence

1. Under the shared lease, capture current desktop and phone screenshots before
   source edits in EN, DE and FA, light/dark; record the build, font mode,
   viewport, URL and source state. Examine home, checks, getting-started and
   calendar. Preserve the uncommitted documentation changes.
2. Recompose the existing feature section to pair its compact capability list with
   the accessible example in home/copy/site CSS if baseline evidence supports it.
   Stop or settle the diagram's nonessential looping motion. Preserve URLs, IDs, logo, legal copy,
   install spec, localized content, keyboard reachability and RTL behavior.
   Keep the example static unless an interaction provides meaningful feedback.
3. Correct the command and calendar snippets and contextual permalink names through `scripts/sync-public-docs.mjs` and
   `pnpm docs:refresh`; review the resulting snapshot and regenerated pages,
   leaving source provenance and existing adaptations intact. Confirm both
   commands from a consumer-like working directory with an installed package. Verify the calendar example uses an actual built-in locale and that custom-locale strings remain required.
   Update focused checks to cover the command contract and repeatable refresh.
4. Test the complete marketing → getting-started → gate → live calendar path;
   preserve the documentation handoff's language-link, fragment, focus, rail,
   zoom and code-scroll work. Fix only findings demonstrated by this path.
5. Capture matching after screenshots and compare. Run site and root checks
   serially, review the staged diff and proprietary-font exclusion, then commit
   the verified scoped work with the configured commitlint hook. No push or
   deployment is part of this work.

## Verification matrix

- EN/DE/FA, light and dark, at desktop and 390/360 CSS px phone widths; inspect
  wrapping, clipping, document overflow, direction, link destinations and
  selected/today calendar states. Include real keyboard Tab, Enter and Escape,
  touch activation and 200% zoom, plus reduced motion.
- Check the sample independently with the maintained gate: isolated bad input
  has one `no-latin-digits` finding, corrected input has none; verify labels,
  exact rule and link on each locale and that the site's own gate remains clean.
- Verify contextual permalink names refer to the correct rendered heading; native section anchors and locale switching preserve path, query,
  fragment and theme; ordinary keyboard navigation reveals focus rings and
  scrollable code. Run the website-owned documentation browser probe against
  the served current export and refresh reproducibility/static checks.
- Run `pnpm --filter @lumo-ui/website check` and `pnpm run verify` from the root,
  once each at the final source state, with resource-intensive work serial under
  `/private/tmp/khatamo-parallel-2026-10-13/heavy.lock`. An existing lease is busy
  and must never be stolen. Record exact exit status and any environment limit.
- Public fallback and licensed private font are separate build inputs. The
  ignored licensed files currently exist, so merely unsetting environment
  variables does **not** produce fallback. Use an isolated public clone/build or
  another controlled, reversible method; verify the rendered fallback marker and
  font requests. Record private mode separately and never copy private bytes into
  source, evidence or commits. Do not infer one result from the other.
- Check source links/forms, browser console and CSP errors, visible focus and
  contrast, plus production performance using an appropriately quiet run.
  Do not claim assistive-technology, legal, field-performance or deployment
  results without actually performing them.

## Known open questions

Owner inputs for the authorized representative, request logging and retention,
and email provider and retention remain unconfirmed; local UI work cannot supply
those facts. The project has `core.hooksPath=.husky/_` and a commit-message hook
running commitlint. Private font files are ignored and must stay out of staging.

## Progress and evidence — 18 October

The documentation fixes were made before the marketing capture. Exact pre-fix
website source and tracked diff, excluding proprietary font bytes, are recorded
under `/private/tmp/lumo-customer-journey-2026-10-18/source-baseline/`; the old
export was stale and is not used as current-source browser evidence. The two
consumer commands passed against an installed local package and a clean test
page. The refreshed snapshot and static documentation checks passed. Contextual
permalink names were subsequently verified against the browser accessibility tree.

A fresh production export built successfully with the private Persian font
verified. Its homepage was still visually unchanged; the repaired documentation
was included. The `before/` directory beside the source baseline contains 27
screenshots and `capture.json` with URLs, viewport, theme, response hashes,
font class and geometry. All captured responses were HTTP 200 with no recorded
page errors or page-level overflow. Homepage captures cover all three locales,
two widths and both themes; documentation and checks captures use light mode.
The preview was stopped and the shared lease released after the capture.

The homepage now uses the proposed capability list and fixture-grounded example,
shorter localized leads and a static diagram. The before images describe the
prior homepage, not the earlier broken documentation state. Later qualification
and remaining limitations are recorded in the dated evidence linked below.

Independent review found three additional issues. The displayed `pnpm add -D`
would omit Lumo after production pruning even when the application imports its
runtime modules; all three install snippets now use `pnpm add`, consistent with
`docs/agent-consumer.md`. The link purpose previously contributed to the
heading's accessible name; heading and contextual link now share a visual row
but have separate semantics. The browser probe checks their real accessible
names without altering the DOM. Finally, the refresh formerly wrote each page
before checking the next: an isolated late-drift regression failed on that
implementation and passes with all adaptations and metadata prepared before
the first write. This protects against adaptation failure, not an interrupted
filesystem write. Refresh reproducibility and source checks passed. An offline
consumer install first stopped because the
local pnpm store lacked `@internationalized/date@3.12.3`. A separate temporary
consumer then installed the locally packed Lumo 1.0.0 with React 19.2.8 and
react-day-picker 10.0.1 using official registry dependencies and scripts
disabled. After production pruning removed an explicit dev-only probe, a
test-only TypeScript loader executed the core formatter and date-calendar
imports; the theme CSS resolved and was read. Both displayed gate commands
graded a clean temporary Persian page successfully. This checks the local
package and dependency classification, not installation from the GitHub tag or
an application bundler. The root public README now uses the same runtime
install, and the installation-policy check covers it and all three site snippets.

Final local qualification, including the actual pinned-tag installation, the
calendar direction and contrast regressions, both font builds, full checks,
browser review and performance sampling, is recorded in [the dated evidence](evidence-2026-10-18/README.md).
It retains incomplete accessibility findings, the unexplained initial static
preview hydration observation, and the limits of the local performance samples.
