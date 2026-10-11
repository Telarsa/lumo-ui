# Lumo UI website — marketing review, 11 October 2026

This work is scoped to `apps/website`, a consumer of the public MIT Lumo UI
package. The owner authorized the public `https://lumo-ui.com` origin and
publishing through the existing Git/CI path. The parent agent owns Git and
publication; this handoff does not claim a deployment, screen-reader pass or
legal certification.

## Result

- The three-language hero identifies open-source RTL and locale checks, gives
  concrete source/built-HTML examples and keeps the reader’s own components.
  The diagram ends with an actionable report rather than guaranteeing a
  reader-ready interface. Persian marketing phrasing uses native terms.
- The company-profile snapshot is byte-identical to Telarsa’s authoritative
  record. The confirmed Persian address is shown in every locale, with `A12`
  explicitly marked as a Latin island. Privacy text reflects observed
  Cloudflare delivery and honestly identifies unconfirmed operational facts.
- Header/error-page horizontal logo assets are byte-identical copies of the
  delivered masters. Theme changes select the original variant. Footer assets
  rearrange the same paths, colours and wordmark attributes vertically; their
  provenance is documented in `public/brand/README.md`. Logos never mirror.
- The three social cards use the supplied horizontal lockup and current hero
  copy. The Persian card’s font size accommodates its complete headline.
- Scrolling code/table regions are keyboard reachable. Documentation furniture
  was regenerated through deterministic `sync-public-docs.mjs` adaptations and
  `pnpm docs:refresh`; the authored corpus and original source hashes remain
  intact. The focus ring on a code listing stays inside its clipped figure.
- Every exported HTML page receives an exact-hash script CSP immediately after
  its charset. Script execution is same-origin or explicitly hashed; eval and
  inline event handlers are disallowed. React style attributes remain allowed,
  while style elements require this origin or an exact hash. The Cloudflare
  and Caddy configurations add framing, permissions, opener, content-type and
  referrer protections. The build checks the policies and host configurations;
  unit tests include changed scripts, weak/late policies, handlers, encoded
  JavaScript URLs, external executable assets and removed response headers.

## Validation evidence

Baseline `NODE_OPTIONS=--max-old-space-size=2048 pnpm --filter @lumo-ui/website
check` exited **0** before source edits. It graded 40 documents with zero Lumo
violations and checked 1,429 links. The immutable 41-HTML export is retained at
`/private/tmp/marketing-baselines-2026-10-11/lumo`; the log is
`/private/tmp/lumo-baseline-check-2026-10-11.log`.

The five CSP regression groups, snapshot provenance validation, exact logo and
company comparisons, and whitespace validation pass. Social rendering exited
**0** (`/private/tmp/lumo-social-cards-2026-10-11.log`); all three 1200×630 PNGs
were visually reviewed. Icon regeneration produced no binary changes.

Final website `check` exited **0** with the 2,048 MB heap limit
(`/private/tmp/lumo-final-check-2026-10-11.log`). Next lint, TypeScript and all
24 regression tests passed. The export contains 41 protected/verified HTML
documents, with 40 graded, zero violations and 1,581 valid local links. Persian
character exemptions are 18.0%, below the unchanged 28% ceiling; all seven
native-digit floors remain armed.

The earlier root `pnpm run verify` ran once, serialized with the same heap
limit, and exited **0** (`/private/tmp/lumo-root-verify-2026-10-11.log`). It passed
versions, recursive types, the consumer profile, root lint, CSS-Module ban,
recursive tests, dist/pack adversarial checks, Flutter tokens/styles, mobile
library and example analysis/tests, bare consumer smoke and a fresh website
build/static gate. No public package or mobile source was changed.

Independent browser/rating evidence is appended after review. Browser
validation is coordinated globally to avoid concurrent browser processes or
noisy performance samples.

### Font refinement after the first green checks

The quiet mobile baseline measured EN light/dark LCP at 3,876/3,880 ms and DE
at 3,880/3,876 ms, with FA at 2,164/2,168 ms. The unmodified full Inter face
accounted for 352,240 preloaded bytes. The verified Telarsa Latin subset is
112,532 bytes, derived from that exact original face; it reduces the primary
font by 239,708 bytes. The full original remains available without preload,
with exact complementary Unicode coverage. Blocking display, font weights,
OFL notice, private Persian font and system fallback are preserved.

The source guard now reads the actual WOFF2 cmaps (406 subset and 2,852 original
code points) with built-in Brotli, verifies subset/source membership, exact
disjoint ranges and the rendered fallback stack. New poison tests reject a
lost full fallback, false declared coverage and full-face preloading. All 13
asset tests passed. Existing exported text required only one non-subset Inter
glyph: the decorative checkmark. It now uses a small vector.

The affected full website check exited **0** with the same heap limit
(`/private/tmp/lumo-font-final-check-2026-10-11.log`): Next lint/types, all 27
tests, the fresh build, 41 CSP-protected documents, 40 graded with zero
violations, and 1,581 links. Static inspection found zero full-Inter preloads
and no source-Inter glyph missing from the primary subset across all 41 HTML
documents (decoded visible text and `alt`, `aria-label`, `title`, `value`
attributes). Coverage evidence is
`/private/tmp/lumo-font-coverage-result-2026-10-11.json`.

Fresh browser/performance results follow below. This refinement changes only
website font assets, declarations, the decorative mark and their
guards/provenance.

### Final root verification — 11 October 2026

After the font refinement, the parent ran the required final root
`NODE_OPTIONS=--max-old-space-size=2048 pnpm run verify`, serialized with the
other sites. It exited **0**; the log is
`/private/tmp/lumo-final-root-verify-2026-10-11.log`. All thirteen pipeline gates
passed, including the latest website build/static gate: 41 CSP-protected HTML
documents, 40 graded with zero violations, and 1,581 valid local links. The
earlier root run above is retained as historical validation evidence.

### Language-link suffix preservation — 11 October 2026

The final read-only navigation audit found that language links already
normalized their destination's trailing slash, but omitted the current query
and fragment. The active header now reads both at ordinary mouse or keyboard
activation, so a skip link's `#main` and any current query survive the locale
switch. Theme handling and the frozen documentation renderer are unchanged.
Scoped ESLint and whitespace checks exited **0**. The final root
`NODE_OPTIONS=--max-old-space-size=2048 pnpm run verify` after this header change
also exited **0**, serialized in the granted heavy slot. The log is
`/private/tmp/lumo-navigation-final-root-verify-2026-10-11.log`. All thirteen
pipeline stages passed, including the fresh website build/static gate: 41
CSP-protected HTML documents, 40 graded with zero violations, and 1,581 valid
local links. Independent browser validation follows below.

### Final functional browser checks — 11 October 2026

The coordinated Playwright functional run exited **0** across 18 cases
(EN/DE/FA × initial light/dark × 1440/390/360). Keyboard theme changes also
exercise dark and system choices before the locale switch and reload. Evidence is
`/private/tmp/marketing-review-2026-10-11/lumo/after/functional.json`, with log
`/private/tmp/lumo-functional-settled-final-2026-10-11.log`. Keyboard language
activation retained the canonical slash, current query and `#main`; theme
choices persisted across the switch and reload. Natural Tab navigation
reached documentation code/table regions with a visible outline. Real
overflow was scrolled forward and back using keyboard arrows, including RTL
tables; targets that fit the desktop viewport were checked for keyboard
reachability and focus visibility instead.

The final functional-route axe scans reported zero violations, legitimate
page execution reported zero CSP violations, and inserted inline script/event
handler probes were blocked. Two earlier harness attempts sampled native
smooth scrolling before it settled. The final harness waits for actual
viewport intersection and stable animation frames; no product change was
needed for those attempts.

### Visual and public-font matrices before the legal-date correction — 11 October 2026

The coordinated final matrix exited **0** across 78 states: home,
how-it-works, documentation getting-started and gate, legal notice and privacy
at 1440/390 in EN/DE/FA and both themes, plus each home at 360. The report is
`/private/tmp/marketing-review-2026-10-11/lumo/after/report.json`.
All routes returned 200; no viewport overflow, failed images, runtime errors,
legitimate CSP violations or axe WCAG 2.2 AA violations were recorded. The
unhashed inline-script and event-handler probes were blocked in every state.
Retained axe contrast incompletes are reviewed separately; zero violations
alone do not establish that those manual checks passed.

The Persian system-font supplement also exited **0** across 26 matching FA
states, including both themes and the 360px homes. Its report is
`/private/tmp/marketing-review-2026-10-11/lumo/after-system/report.json`.
The private font class was removed, the public system-font class applied and
the private font variable verified empty before capture. Its same route,
overflow, image, runtime, CSP, axe and poison checks passed. This supplement
checks system-font wrapping; production font delivery is recorded separately
after automatic publication. Quiet mobile performance and the independent
rating remain pending below.

### Legal notice revision dates — 11 October 2026

The independent reviewer found that both notices displayed the company
snapshot's 10 October provenance date even though their wording changed on
11 October. Each notice now has its own actual revision date in legal content;
the page formats that date for EN/DE/FA and uses it in the `time` attribute.
The company snapshot remains byte-identical to the Telarsa authority (comparison
exit **0**). Scoped lint and whitespace checks pass.

The required latest root `NODE_OPTIONS=--max-old-space-size=2048 pnpm run
verify` after this correction exited **0**, serialized by the parent. Its log
is `/private/tmp/lumo-final-legal-date-root-verify-2026-10-11.log`. All thirteen
pipeline stages passed, including the fresh 41-document CSP export, 40 graded
documents with zero violations and 1,581 valid local links. Read-only inspection
of all six legal exports confirms `datetime="2026-10-11"`, with actual text
`October 11, 2026`, `11. Oktober 2026` and `۱۹ مهر ۱۴۰۵`.
The inspection exited **0**; evidence is
`/private/tmp/lumo-legal-date-export-proof-2026-10-11.json`.

The parent will refresh both visual matrices after this last source
correction; earlier results above remain validation history.

### Complete focused navigation labels — 11 October 2026

The independent natural-Tab probe found that the browser leaves a partly
visible link in place: on EN light 390px, the focused documentation contract
label extended 12.34px past its rail. Contrast and its visible focus ring
passed, while complete label visibility failed. Failed evidence is retained
under `/private/tmp/marketing-review-2026-10-11/lumo/after-nav-visibility/`.

A site-owned focus helper now adjusts only the relevant navigation rail's
horizontal scroll to reveal the whole link and its focus ring. Physical
bounding boxes handle both reading directions. It runs at focus and once on
the next frame to accommodate native focus scrolling. Mobile header links
use it directly; documentation sidebar links use it through the deterministic
snapshot adapter and `pnpm docs:refresh`. No authored documentation, theme,
page scrolling, focus position or CSP policy is changed. Fresh root and
independent browser validation follow below; earlier evidence remains history.
Scoped ESLint, the 21-route/14-source documentation provenance check, company
snapshot byte comparison and whitespace validation all exited **0**. The
snapshot was refreshed from the same `c040e7490419` public source commit.

The latest required root `NODE_OPTIONS=--max-old-space-size=2048 pnpm run
verify` after this focus repair exited **0**, serialized by the parent. Its
log is `/private/tmp/lumo-final-focus-root-verify-2026-10-11.log`. All thirteen
pipeline stages passed, including the fresh 41-document CSP export, 40 graded
documents with zero violations and 1,581 valid local links. The independent
native-Tab visibility results follow below; refreshed visual/system-font
matrices remain pending.

The independent 12-case post-repair probe then verified all **204 focused
navigation links** and **36 figure labels** for complete visibility, outlines,
contrast and paint order. Its actual overall exit was **1**, because three
code-arrow reversal observations remain unresolved: the harness waited for
ancestor scrolling without waiting for each code target's own `scrollLeft`
to settle. The reviewer prepared a bounded target-and-ancestor settling wait
while retaining the same strict reversal assertions; no product defect is
inferred and no source was changed for those samples. The completed run and
its closed-resource result are retained at
`/private/tmp/marketing-review-2026-10-11/lumo/after-nav-visibility/after-focus-repair/report.json`,
with log `/private/tmp/lumo-nav-visibility-probe-focus-final-2026-10-11.log`.

The corrected independent probe subsequently exited **0** across all twelve
cases and closed its browser/server. Evidence is
`/private/tmp/marketing-review-2026-10-11/lumo/after-nav-visibility/after-focus-repair-settled/report.json`,
with log `/private/tmp/lumo-nav-visibility-probe-focus-settled-final-2026-10-11.log`.
All 204 naturally focused navigation links passed complete visibility,
outlines and contrast; all 36 figure labels passed geometry, paint order and
contrast; all 36 native code regions scrolled forward and back. Minimum
contrast ratios were 4.619:1 for navigation, 5.375:1 for figure labels and
15.282:1 for code. Waiting for the code target's own scroll position resolved
the earlier three flags with no product edits. Both earlier failed runs
remain preserved. Fresh broad matrices and quiet mobile performance still
precede the final independent rating.

### Fresh broad matrices and independent review — 11 October 2026

The current focus-repaired source passed the fresh **78-view main matrix**
and the separate **26-view Persian system-font simulation**, both actual
phases exiting **0**. Reports are
`/private/tmp/marketing-review-2026-10-11/lumo/after/report.json` (16:10 UTC)
and `/private/tmp/marketing-review-2026-10-11/lumo/after-system/report.json`
(16:12 UTC). All 104 states returned 200 and passed overflow, images, runtime,
legitimate CSP and axe violation checks. All 208 inserted script/handler
probes were blocked. The independent reviewer resolved all 114 retained
contrast incompletes against the matching target/state multisets, source
contrast and the strict natural-Tab/figure/code probe above. Evidence is
`/private/tmp/marketing-review-2026-10-11/lumo/independent-incomplete-resolution.md`.

The independent Khatamo agent, who made no Lumo implementation edits, completed
the final ten-dimension review after quiet mobile performance. The unweighted
arithmetic mean is **7.95/10 before → 9.37/10 after** (79.5/10 → 93.7/10).
A serious fixable finding would prevent acceptance at 9; none remains in the
reviewed current export. Its final notes and exact-score evidence are
`/private/tmp/marketing-review-2026-10-11/lumo/independent-after.md` and
`/private/tmp/marketing-review-2026-10-11/lumo/after/independent-score.json`.

| Dimension | Before /10 | Current /10 |
| --- | ---: | ---: |
| First-screen clarity | 8.5 | 9.5 |
| Primary visitor path | 9.2 | 9.4 |
| Truthful proof | 7.7 | 9.3 |
| English, native Persian and German copy | 8.6 | 9.4 |
| Mobile at 390/360 | 9.0 | 9.3 |
| Accessibility | 7.3 | 9.4 |
| Visual polish and consistency | 8.4 | 9.3 |
| Graphics quality | 9.0 | 9.2 |
| Mobile preset LCP | 7.0 | 9.3 |
| Security headers/CSP | 4.8 | 9.6 |

### Final quiet mobile performance — 11 October 2026

The final quiet performance phase exited **0**, with log
`/private/tmp/lumo-after-quiet-perf-2026-10-11.log`. The report records the phase
at 2026-10-11T16:46:47.198Z and retains source/export and harness digests. Its
browser/server closed before the next site ran. All eighteen cold samples
have positive LCP, status 200 and the expected theme.

The matching before/after preset is 390×844, DPR 1/mobile, cache disabled,
three cold contexts per locale/theme, 150ms latency, 200,000 B/s download,
93,750 B/s upload, CPU ×4 and local gzip for HTML/CSS/JS/SVG/JSON. LCP is the
median and CLS the maximum of the three samples:

| Locale / theme | Before LCP / ms | After LCP / ms | Before max CLS | After max CLS |
| --- | ---: | ---: | ---: | ---: |
| EN / light | 3876 | 2260 | 0.032850 | 0.024820 |
| EN / dark | 3880 | 2256 | 0.032850 | 0.024820 |
| DE / light | 3880 | 2244 | 0.001513 | 0.024976 |
| DE / dark | 3876 | 2264 | 0.001513 | 0.024976 |
| FA / light | 2164 | 2220 | 0.015371 | 0.000649 |
| FA / dark | 2168 | 2224 | 0.015371 | 0.000649 |

All six current median LCP values are below 2,500ms. English and German
improve by 1,612–1,636ms; Persian is 56ms slower in both themes. German CLS
increased, while every current maximum is below 0.025. No all-locale speedup
is claimed. Exact maximum CLS values are 0.024820272621275237 for English,
0.024976108873319074 for German and 0.0006494018380263074 for Persian.

No other team heavy build/browser ran during these measurements; an unrelated
existing server was untouched. These are controlled local lab observations,
not OS-wide isolation, field percentiles, Lighthouse or live-edge latency.
The main local Persian renders and performance include the ignored licensed
font. The separate 26-view public-system-font simulation passed; actual
published Persian layout and font-request-failure smoke remain separate
checks after automatic publication. No deployment or live result is claimed
by this local review. Git and publication evidence follows when available.

## Owner-only facts and assets

The authorized company representative, request-log settings and retention,
email service and message retention remain unconfirmed. They are not invented
in the public notice. These are the remaining factual owner inputs.

The supplied logo wordmark is live SVG text with its original Archivo/system
fallback. An outlined official master is an optional owner asset for fixed
cross-device wordmark rendering. Future npm registration/publishing and a
secure private production-font source are separate owner choices; neither is
required for the current documented public MIT GitHub tag/install path or
public system-font fallback. The public canonical URL, GitHub tag, notice
revision dates and system-font fallback are resolved, not open owner items.

IRANSansX remains only in the ignored private font directory, supplied to
private builds through the existing mechanism. Its local licence confirmation
is retained; no missing local licence/source input is inferred. Public CI has
no private-font injection and uses the system fallback. The separate
simulation passes; actual production font/layout smoke remains pending
publication. No proprietary font is added
to source control. Inter retains its OFL notice. No runtime dependency, shared
style package, CSS Module or public component-package change was added.

## Production HTTPS origin guard — 11 October 2026

The parent's actual live follow-up found that `http://lumo-ui.com/en/`
returned **200 with an HTTP effective URL** after following redirects. The
first develop push/fast-forward main publication had completed, but the
static-only hosting configuration did not force a first HTTP request onto
HTTPS. HSTS and HTML canonical links did not repair that request path.

The independent review's previous **9.37/10** is retained as the completed
local-review checkpoint above. Its security score and ten-dimension acceptance
are now **pending** until the new affected full verification and actual public
HTTP/www-to-HTTPS proof pass. Other page, copy, font, visual and measured
performance sources are unchanged; those observations remain separate evidence.

The root Wrangler configuration now runs the small site-owned
`apps/website/worker.mjs` before static assets, with an explicit `ASSETS`
binding. Exact production HTTP and `www.lumo-ui.com` requests receive a
method-preserving **308** to `https://lumo-ui.com`, retaining encoded paths and
queries. The guard does not redirect workers.dev/local/other preview origins.
Other requests retain the original Request passed to ASSETS; returned bodies,
status/status text, slash redirects, 404s, cache/ETag and other asset metadata
are preserved. The Worker attaches the existing fixed response protections
because Worker responses cannot rely on `_headers` alone.

`response-security.mjs` is a pure shared response-policy authority for the
Worker and existing CSP/host audit. It has no Node-only runtime import; the
early exact-hash HTML meta policies remain unchanged. The build now checks
the configured entry/binding/order/static routing before compiling. Seven
meaningful Worker regressions enter the existing website `test`/`test:gate`
scripts and therefore the existing root `gate:test` verification phase; no
extra root gate or runtime dependency is needed.

The focused Worker/configuration tests and existing CSP tests exited **0**:
**12/12**, with no skips. Evidence:
`/private/tmp/lumo-canonical-worker-unit-2026-10-11.log`.
Scoped ESLint exited **0**:
`/private/tmp/lumo-canonical-worker-lint-2026-10-11.log`.
The direct configuration guard also exited **0**. The affected full root
verification passed as recorded below. Fresh automatic publication and public
HTTPS/asset/404 evidence remain pending; no deployment/settings command was run
by this implementer.

### Full HTTPS-guard verification — 11 October 2026

The complete root `pnpm run verify` pipeline exited **0** with
`NODE_OPTIONS=--max-old-space-size=2048`. The successful retry log is
`/private/tmp/lumo-final-https-root-verify-escalated-2026-10-11.log`.
Process session 88856 completed and the exclusive heavy lane was released.
All thirteen phases passed: versions, types, consumer profile, lint, no CSS
Modules, recursive tests, fresh distribution, installed-package smoke,
Flutter tokens, mobile styles, Flutter analysis/tests, mobile smoke and the
website HTML/export gate. The website suite passed **34/34**, including all
seven new Worker groups, with no failures or skips. Flutter analysis reported
no issues and its 55 tests passed. The final export contains 41 CSP-verified
documents; 40 content documents were graded with **0 violations**, all seven
Persian floors armed, and **1,581** local links passed.

The initial sandboxed attempt was an actual **exit 1**, preserved unchanged in
`/private/tmp/lumo-final-https-root-verify-2026-10-11.log`. Its Flutter phase
could not write the installed SDK's normal engine cache files under
`/opt/homebrew/share/flutter/bin/cache`. The entire thirteen-phase pipeline
was rerun with authorized access to that existing SDK cache; no project source
or gate was weakened to bypass the sandbox failure.

The source repair remains confined to the website-owned Worker, pure shared
response policy, configuration guard/tests, existing CSP import, website
scripts and durable website guidance, plus the authorized root Wrangler
configuration. Frontend source, public assets/fonts and HTML scanner/hash/meta
policy functions are unchanged from the first published checkpoint. This gate
proves the affected source and export; it does not establish that production
has received the Worker. The independent security score and ten-dimension mean
remain pending actual automatic publication and public redirect/asset/404
acceptance.

### Automatic publication and actual public proof — 11 October 2026

The coordinator published the HTTPS repair through the existing automatic
pipeline. Working commit: `d03f4eaa99da9ec4172d2ca63282b22e1324a894`.
Empty publication commit: `44f26de12831e41027ede99366411f82664eac7a`.
Actual develop/main pushes exited **0**, without force, with both remote tips
equal. The coordinator observed the corresponding Cloudflare build succeed.
No manual deployment or hosting-settings change was used. Private proprietary
fonts remain excluded from Git. These are the current source/publication
facts; earlier “publication pending” checkpoints above are superseded.

The formal public verification exited **0**. Evidence:
`/private/tmp/marketing-live-2026-10-11/final-verification.json`, recorded at
18:10:35 UTC. Across the three public domains it checks nine locale homes and
27 share-card assets. Lumo's own evidence comprises three HTTPS locale pages
with matching current text/canonical URLs/strict document CSP and required
response-header values; five direct **308** cases including encoded Persian
queries and `Sec-Fetch-Mode:navigate`; three followed requests ending at the
HTTPS apex with their checked suffixes retained; all three byte-identical,
correctly typed/protected PNG share cards; and an actual protected missing-page
**404**. The original plaintext HTTP-200 finding is repaired, not waived.

The first public browser batch actually exited **1** after twelve Telarsa
views and Lumo EN/light/1440. Four background route requests emitted
`net::ERR_ABORTED`; that failed 13-state report and screenshots remain under
`/private/tmp/marketing-live-2026-10-11/first-browser-run-aborted-background-requests/`,
with log `/private/tmp/marketing-production-38-final-2026-10-11.log`.
There was no accompanying HTTP error, runtime/CSP event, broken image, axe
violation or overflow finding. Those facts alone did not dismiss the aborts.

A separate typed/native HEAD diagnostic then actually exited **0**, log
`/private/tmp/marketing-public-head-diagnostic-2026-10-11.log`, and closed its
browser. Its evidence is
`/private/tmp/marketing-live-2026-10-11/head-response-diagnostic.json`.
The four exact ordinary canonical probe paths returned successful HEAD 200
responses and the four independently awaited native HEAD promises fulfilled
with zero-length bodies. The harness qualifies only successful same-URL,
same-origin, non-navigation HEAD/fetch events for the exact canonical probe
paths, without queries, with status 200 and HTML content type. Every other
abort, navigation/GET failure or unsuccessful response still fails the run.
No product source change was made for this measurement correction.

The qualified complete **38-view public run actually exited 0**, session
13242, and closed its browser at 18:18:19 UTC. Current report:
`/private/tmp/marketing-live-2026-10-11/production-smoke.json`, started at
18:17:10 UTC; log:
`/private/tmp/marketing-production-38-final-qualified-head-2026-10-11.log`.
It contains twelve Telarsa, **fourteen Lumo** and twelve Tessalor views. All
fourteen Lumo homes pass status/theme, overflow, images, HTTP responses,
runtime errors, legitimate CSP events and axe violations; no retained axe
incompletes or unresolved request failures remain. The 56 successful qualified
HEAD events are retained explicitly in `completedHeadProbeEvents`, alongside
all raw request-failure events, rather than silently dropped. Actual footer
viewport screenshots were captured before returning to the top in every state.

The fourteen Lumo states cover EN/DE/FA and both themes at 1440/390, plus
Persian at **360 in both themes**. All six actual Persian states carry the
`lumo-persian-system-font` marker and computed system-font fallback stack.
Only the public Inter WOFF2 was requested; there was no IRANSans request or
font-request failure. Public Persian wrapping, images and overflow pass at
390/360. This resolves the actual production fallback/layout verification;
it is distinct from the earlier 26-view simulation and the local private-font
performance samples. No new live LCP/field performance claim is made.

The independent Khatamo reviewer subsequently accepted final security
**9.6/10** and the ten-dimension arithmetic mean **9.37/10**, against the
baseline **7.95/10**. The reviewer made no Lumo implementation edits. Its
current acceptance is recorded in
`/private/tmp/marketing-review-2026-10-11/lumo/independent-public-acceptance.json`
and `lumo/after/independent-score.json`. It independently parsed all fourteen
actual Lumo cases and formal response proof, and inspected all **28 actual
home/footer viewport captures**, including six Persian system-font views.
All retained public incomplete arrays are empty; no new finding remains.
The acceptance artifact records exact source/capture hashes and explicitly
retains and qualifies all 56 successful HEAD observations.

This acceptance does not claim a font-request-blocking injection test or
live-edge performance measurement. The local licensed Persian cold-load
samples, fallback simulation and actual public system-font smoke remain
distinct evidence. The present implementer has not awarded its own score.
Remaining factual owner inputs are only the authorized representative and
operator-log/email processing arrangements; canonical URL, MIT Git/tag, legal
revision dates, font licence/local source, public fallback mode, publication
and the measured public smoke are resolved.
