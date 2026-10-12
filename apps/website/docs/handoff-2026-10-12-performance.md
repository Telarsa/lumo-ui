# Lumo UI performance follow-up — 12 October 2026

The public Lighthouse baseline uses the genuine existing public-build mechanism:
both private-font environment variables are unset and the ignored private font
is absent during the build. The supported preparation script emits its normal
system-fallback module; no generated HTML, CSS or CSP was manually patched.
Build session 61226 actually exited 0 and closed at 06:47:38.500 UTC. The three
original ignored files, including the private generated module, were restored
byte for byte. No tracked source changed before this baseline.

The immutable public export has 242 files and 41 CSP-checked documents. Its proof
is `/private/tmp/marketing-performance-2026-10-12/lumo/baseline-public-build-proof.json`;
the separate licensed private-font export remains preserved. Actual live EN/DE/FA
pages advertise `/_next/static/chunks/0fdmem-wf0xcr.css`: HTTP 200, matching public
snapshot bytes, and `Cache-Control: public, max-age=0, must-revalidate`. The
unrelated private-build stylesheet's recorded 404 does not describe a broken
public page. Exact public CSS proof is `lumo/live-cache-before/report.json` in
the temporary performance evidence directory.

## Measured baseline

The coordinator ran all eighteen cold Lighthouse 12.6.1 cases, three per locale
and theme, against the immutable public export. Default mobile simulation uses
412×823, DPR 1.75, simulated Slow 4G and 4× CPU. These are controlled local
Lighthouse observations, separate from observed-load/field/live-edge timings.

| Locale / theme | Median performance | Median simulated LCP ms | Median TBT ms |
|---|---:|---:|---:|
| EN light | 97 | 2553.8850 | 26.5 |
| EN dark | 97 | 2554.3077 | 21.0 |
| DE light | 98 | 2479.2106 | 26.0 |
| DE dark | 98 | 2478.1015 | 21.5 |
| FA light | 98 | 2479.7473 | 21.0 |
| FA dark | 98 | 2478.2056 | 22.0 |

All accessibility, best-practices and SEO categories are 100; median CLS is zero
in every variant. Raw `.lhr.json` and summaries remain under
`/private/tmp/marketing-performance-2026-10-12/lumo/before/`.
The weighted accessibility score is not an all-rules AA pass: all eighteen
baseline reports retain an unweighted visible-label/name mismatch. Its current
repair and expanded rule coverage are recorded below.

## Narrow source changes

- Cloudflare receives the same one-year immutable policy already present in
  Caddy, scoped only to content/build-ID-addressed `/_next/static/*`. The Worker,
  original-transport HSTS rule, status/bodies and other response protections
  stay intact; HTML and unversioned brand assets remain revalidatable.
- The Inter preload is 79,976 bytes, down from 112,532, saving 32,556 bytes. Its
  117-point font is byte-identical to the previously verified Khatamo subset of
  the same Latin master. The unchanged Latin master and original full face
  remain lazy complements. All three retain blocking display, original metrics,
  the OFL notice and exact disjoint ranges covering the complete source. The
  asset guard and missing/overlapping/preloaded-complement regressions are updated.

All 82 frozen before documents (41 public plus 41 licensed private) were parsed
for body/title and alt/aria-label/title/value/placeholder strings; no Latin-master
point falls outside the 117-point primary. Website-generated decorations are
empty strings and no hyphens rule is used. Optional/future glyphs remain in the
unchanged complements. Derivation/shaping provenance is retained in
`docs/site-assets.json`; actual browser geometry remains a separate final check.

Copy, navigation, keyboard rails, calendar examples, licensed private font bytes
and the public Persian fallback are unchanged by the performance candidate.
The owner subsequently commissioned the new logo described below; that separate
request is part of the same final verification. There is no new runtime
dependency. External stylesheets and exact style-element CSP remain in use.

## Owner-requested identity and associated files

The original folded-L symbol follows the geometric direction of Telarsa and
Khatamo while keeping Lumo's own fixed ink/paper/lime palette. The Latin wordmark
is outlined from the retained Inter/OFL master; the owner-confirmed Persian
wordmark «لومو یو‌آی» is shaped and outlined from public Vazirmatn/OFL source.
No proprietary application-font bytes enter these committed masters. Horizontal
and vertical theme copies preserve the exact master bytes, geometry and
symbol-left placement in every locale.

The coordinator regenerated favicon, apple/home-screen icons and three share
cards from the current masters. The site-owned root/error document adapter now
preserves the generated favicon, SVG, apple and manifest head references. The
brand guard checks outlined/self-contained geometry, source licence and hashes,
both locale families, unmirrored orientation, PNG/ICO dimensions, manifest
references and explicit reviewed post-render checksums. Its field-defect poisons
cover missing/wrong-sized icons, diverging public masters, a live-text wordmark,
mirroring and omitted root/error head metadata. Normal builds cannot silently
rerecord the raster checksum baseline.

The initial transparent 16-pixel legacy icon left the ink L unclear on a dark
surface. The final renderer gives ICO 16/32/48 and PNG 16/32/64 a paper backing
while keeping the adaptive SVG and original master palette. The coordinator's
actual final raster run exited 0 (session 48042); its log is
`/private/tmp/lumo-new-logo-paper-icons-og-render-2026-10-12.log`. The final
16/32-pixel files were inspected and retain a visible ink silhouette.

After that render, the explicit `check-brand-assets.mjs --record` step recorded
`docs/brand-assets.json`. Focused checks actually exited 0: the brand guard,
all nine brand/icon regression tests, the site asset guard (seven files in the
licensed local mode), scoped ESLint covering the helpers and locale-aware brand
call sites, and whitespace validation. Every header/footer Brand supplies its
locale; Persian uses the exact native name in images and the home-link label.
The three ignored private inputs still match their original hashes exactly.
The private proof is `lumo/brand-focused-checks.json` in the temporary
performance evidence directory. These source checks are distinct from the
pending full type/build/browser and public-fallback comparison.

## Rejected inline-CSS experiment

The generic Next `experimental.inlineCss` candidate was prepared here but removed
before any post-change Lumo build or browser run. The coordinator's actual Khatamo
client-navigation run found **54 real `style-src-elem` CSP violations**, despite
301 functional navigation passes. That shared-framework finding rejects this
candidate; it is not claimed as a Lumo browser result. The flag is fully absent
and `next.config.ts` again matches the reviewed source. CSP was not weakened.
The owned-style hash poison remains useful protection, but its unit semantics
do not establish safe framework client-navigation behavior.

## Earlier verified candidate before the owner's spacing follow-up

The complete root thirteen-phase verification actually exited 0 and closed
(session 48888, 2048 MB Node heap). The known existing Flutter cache permission
issue was handled through approved cache access, without a project workaround.
The website's 46 script tests passed; 41 documents received exact CSP checks,
40 were graded with zero violations, and 1,601 asset/navigation links passed.
The brand guard passed before and after the export. The complete log is
`/private/tmp/lumo-performance-brand-root-verify-2026-10-12.log`.

The subsequent genuine public after build also actually exited 0 and closed
(session 44610). Both private-font environment variables were unset and the
supported font-preparation mechanism selected system fallback from actual font
absence. The immutable export is now archived at
`/private/tmp/marketing-performance-2026-10-12/lumo/before-owner-spacing/after-public-export`.
Its all-file/source/environment proof is `lumo/before-owner-spacing/after-public-build-proof.json`
in the temporary evidence directory; it describes the frozen working candidate
before publication, rather than claiming a clean published source. Source
hashes, status and HEAD remained unchanged during the build, and all three
original ignored private files were restored byte for byte. No browser or
test server was started by either verification driver. The combined exact
gate/log-hash proof is `lumo/before-owner-spacing/full-verify-and-public-build-proof.json`.
The original proofs remain byte-identical; `lumo/before-owner-spacing-relocation.json`
qualifies their original recorded paths and verifies all 247 relocated files.

## Final owner-requested spacing

The owner requested logo/type spacing matching the Telarsa/Khatamo family. The
updated masters position actual outlined glyph bounds with a gap equal to 13.2%
of the symbol's ink height. Independent read-only SVG bounds checks actually
exited 0 for all eight variants: outline paths, scales and the symbol geometry
are unchanged. English and Persian previews were inspected. Exact proof is
`lumo/spacing-independent-source-review.json` in the temporary directory.

The coordinator regenerated the final icons/share cards and closed with actual
exit 0; the log is `/private/tmp/lumo-final-matched-spacing-icons-og-2026-10-12.log`.
The reviewed brand hash record was explicitly refreshed afterward. The earlier
full gate and public snapshot remain historical. That spacing candidate first
passed the narrower checks below, then received the accessibility repairs in
the next section. These earlier artifacts are preserved under
`lumo/before-a11y-repair`; current accepted source/evidence follows afterward:

- The final root thirteen-phase verification exited 0 and closed (session
  98056, 2048 MB Node heap): 46 website tests, 41 exact CSP documents, 40 graded
  with zero violations and 1,601 local links. Full log:
  `/private/tmp/lumo-performance-brand-final-spacing-root-verify-2026-10-12.log`.
- The genuine public after build exited 0 and closed (session 69101), leaving
  247 files/41 HTML documents at `lumo/before-a11y-repair/after-public-export`. Both private env
  variables were unset; all three original ignored inputs were restored;
  source hashes, status and HEAD stayed unchanged. Exact proof is
  `lumo/before-a11y-repair/after-public-build-proof.json` in the temporary evidence directory.
- The bounded normal-CSP browser check exited 0 and closed (session 59304):
  18 home views covering EN/DE/FA, both themes and 1440/390/360 widths, plus two
  theme variants of the owned 404. It checks icon metadata, exact locale/theme
  master paths and labels, the painted logo's loaded dimensions and horizontal
  bounds, genuine public font mode, requests, overflow, runtime/CSP and axe.
  The strict assertions pass and axe reports zero violations. Two retained
  contrast-incomplete flags concern the partially visible German docs link
  at 360 pixels, one in each theme; they remain for the broader native-focus
  review rather than being silently treated as automatic passes. Both the
  owned browser and ephemeral server closed. Exact report:
  `lumo/before-a11y-repair/final-spacing-public-rendered/report.json`.

The first bounded run exited 1 because the harness required the CSS-hidden
opposite-theme lazy image to be fetched. Its script/report remain preserved at
`lumo/final-spacing-public-rendered-first-lazy-check`. The corrected check still
requires both variants' exact path/label and a fully loaded painted image; no
product change was made. Successful 200 header-only probes remain explicitly
qualified raw events, separate from unresolved request failures. The combined
actual proof is `lumo/before-a11y-repair/full-verify-and-public-build-proof.json`. These controlled
local checks do not claim production transport or the broader native-keyboard
and client-navigation matrix.

## Current expanded accessibility closure

The fresh twelve-phone probe actually exited 1 and closed (session 23059),
establishing 98 clipped focus outlines: 84 documentation links lacked top/end
space and 14 mobile boundary links lacked end space. All 120 focused text
targets and 48 logos otherwise passed their paint/contrast checks. Available
WCAG 2.1 A rules also confirmed the language control's visible EN/DE/FA code
was absent from its accessible name. Prior checks omitted that rule group and
are preserved as insufficient-scope history at `lumo/before-a11y-repair`.

The site-owned overflow rails now reserve six logical pixels, derived from the
existing two-pixel outline plus three-pixel offset and one-pixel safety margin.
The docs rail reserves this at both block and inline edges; native overflow,
the existing focus helper and the authored docs corpus remain intact. The
language name puts its visible code first, followed by the required native
label and the existing decorative SVG chevron. The first parenthesized attempt
still failed the real axe rule because its token normalization removes
parenthetical contents. Both actual failed runs and the successful outline
evidence remain at `lumo/before-label-normalization-repair`; no rule was filtered
or waived as an instrument error.

The final required root thirteen-phase verification actually exited 0 and
closed (session 77700): 46 website tests, 41 CSP documents, 40 graded with zero
violations and 1,601 links. Its log is
`/private/tmp/lumo-performance-final-name-root-verify-2026-10-12.log`.
The following genuine public rebuild exited 0 and closed (session 88652),
with 247 files, unchanged build-time source/status/HEAD and all three private
inputs restored. `lumo/after-public-export` and `lumo/after-public-build-proof.json`
now describe this repaired final candidate.

The final expanded rendered twenty-case check exited 0 and closed (session
84623), covering eighteen homes and both 404 themes. The final strict native
twelve-case check exited 0 and closed (session 18968): all 120 link targets show
complete text and five-pixel outline bounds, all 48 header/footer logos pass
their visibility/paint checks, and all 24 route loads pass every available
WCAG 2.x A/AA tag including `wcag21a`. Minimum focused-leaf contrast is
4.6190; minimum primary logo silhouette contrast is 16.4408. Secondary logo
fill ratios are disclosed under the logo exception, rather than claimed as
ordinary text-AA pairs. Two retained unfocused German docs-link contrast flags
at 360 pixels map to the fully revealed, full-contrast native-Tab evidence.
Successful 200 HEAD probes remain separate raw qualified events. Both owned
browsers and servers closed. Current combined proof is
`lumo/full-verify-and-public-build-proof.json` in the temporary evidence directory.

Comparable cold Lighthouse, wider geometry/keyboard/navigation comparisons and
actual published cache/transport observations remain pending the coordinator's
serialized measurements. No after score or public publication is claimed yet.

## Final local acceptance, 12 October

The owner-confirmed Persian spelling «لومو یو‌آی» is now also used in the legal copy. A fresh public production build and the full website verification exited 0 after this edit: 46 tests, 41 strict-CSP documents, 40 graded pages with zero violations, and 1,561 internal links. All three ignored private font inputs were restored byte for byte. The public Farsi export uses its intended system fallback. The final favicon audit found all six linked browser assets present and structurally valid across 41 documents. The brand delivery has the English and Persian outlined wordmarks, social cards and icon variants in the dated OneDrive Brands folder.

The rebuilt export changed build IDs and one generated JavaScript chunk; CSS, fonts, brand and icon bytes stayed exact. The new chunk was exercised in all final lab loads. In Lighthouse 12.6.1's simulated mobile setting, three cold samples per locale/theme gave final performance medians of EN 97/93, DE 93/93 and FA 94/94 in light/dark, against baselines 97/97, 98/98 and 98/98. These slower simulated outcomes are retained. Final accessibility, best-practices and SEO medians were 100 with zero layout shift. The separate actual 390px cold-load matrix, under 150ms latency, 1.6Mbps down, 0.75Mbps up and 4× CPU slowdown, measured LCP medians in milliseconds of EN 1764/1764 → 1408/1412, DE 1776/1764 → 1424/1416 and FA 528/532 → 532/524. The 4ms Farsi-light increase is retained too; simulated and actual throttling are distinct measurements.

The independent current local review rated Lumo UI 9.35/10 across the required ten dimensions, including 8.8 for performance. Its rating includes the simulated regressions and the native 120-link focus/48-logo/24-route evidence. The independent rating artifact is packaged with the dated measured evidence. This is local acceptance; repository promotion and live transport verification follow separately.
