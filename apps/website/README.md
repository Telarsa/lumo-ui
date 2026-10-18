# Lumo UI website (`apps/website`)

lumo-ui.com: the Lumo UI marketing pages and the complete on-site technical
documentation, in English, German and Persian. A static Next export that
consumes the workspace `lumo-ui` package like any product would, and is graded
by Lumo's own served-byte gate. MIT, like the rest of this repository; see
`NOTICE.md` for the trademark and font notes.

It was built from 5 October 2026 as a separate private repository
(`Telarsa/lumo-ui-website`, now archived) and replaced the previous docs site
here on 9 October 2026. The proprietary Persian font stayed private: see
[The private Persian font](#the-private-persian-font).

## Commands

Use Node 24 and pnpm 11.3.0. Install from the repository root
(`pnpm install`); the site has no lockfile of its own.

```sh
pnpm --filter @lumo-ui/website dev      # http://127.0.0.1:3113/en/  (root: pnpm dev)
pnpm --filter @lumo-ui/website check    # lint, typecheck, test:gate, build, gate
pnpm --filter @lumo-ui/website preview  # serves out/ on :3113
```

From this directory the same scripts run as `pnpm dev`, `pnpm check` and so on.
`check` runs Next/React lint plus Lumo's RTL lint policy, strict types, the
script tests (asset integrity, private-font preparation, gate staging), the
build (font preparation, asset/contract/docs-snapshot checks, `next build`,
owned root and error documents) and the gate (Lumo's grader over every exported
document via `scripts/grade-static.mjs`, then a local link/anchor check and CSP
validation). The build adds a per-page
CSP after writing the owned root/error documents: scripts are limited to this
origin and each document’s exact SHA-256 hashes. React style attributes are
allowed; style elements remain restricted. Cloudflare and Caddy carry the
matching frame, permissions and other response protections, checked by the
same script. `csp.test.mjs` includes deliberately changed payloads, handlers,
encoded JavaScript links, external assets and missing headers. The
root `gate:html` runs the same build and gate.

Each of `/en/`, `/de/` and `/fa/` has the home page, `how-it-works/`,
`checks/`, seven documentation routes and two legal pages.

## The private Persian font

IRANSansX is licensed to the owner for application use. It is **never
committed** to this public repository: `src/assets/fonts/private/` is
git-ignored. `scripts/prepare-private-fonts.mjs` runs before `dev`, `lint`,
`typecheck` and `build`:

- With `LUMO_PRIVATE_FONTS_DIR` set to a directory containing
  `IRANSansXVF.woff2` and `IRANSansX-LICENSE-NOTE.txt`, it copies both into the
  ignored directory. A missing file there is an error.
- When the font is present it verifies both files against the checksums in
  `docs/site-assets.json` and generates the ignored `persian-font.ts`, a
  `next/font/local` declaration (blocking display, preloaded, as before).
- Without it, the generated module leaves `--font-persian` unset and Persian
  text uses the system stack `--lumo-web-font-persian-fallback` in
  `src/app/globals.css` (Vazirmatn, Noto Sans Arabic, Segoe UI, Tahoma,
  Geeza Pro). A public clone builds and passes the gate this way.
- `LUMO_REQUIRE_PRIVATE_FONTS=1` turns a missing font into a build failure; the
  production image sets it.

```sh
# Private build (once per checkout; later runs reuse the verified local copy):
LUMO_PRIVATE_FONTS_DIR=/path/to/private/fonts pnpm --filter @lumo-ui/website fonts
```

Keep the licensed files in a private location outside this repository (the
owner's font package). The export carries the IRANSansX licence note in
`out/font-licenses/` only when it serves the font. Never `git add -f` anything
under `src/assets/fonts/private/`.

## Site-owned styling and assets

`src/styles/tokens.css` owns typography, spacing, control, focus and motion
values; `src/app/*.css` owns Lumo's identity, layout, documentation and
marketing styles. There are no shadcn copies and no CSS Modules (the repository
bans them; the legal pages use the prefixed `legal.css`). `docs/site-assets.json`
records the provenance and checksums of the stylesheet and fonts;
`scripts/check-site-assets.mjs` verifies them on every build.

Inter’s preloaded face is the verified 79,976-byte, 117-point subset of this
website’s retained 112,532-byte Latin source. The Latin source and original
352,240-byte Inter 4.001 face remain as non-preloaded complements; all three
retain blocking display, original metrics and the OFL notice. The primary is
a byte-identical adoption of the previously verified site-owned Khatamo subset;
ordinary builds have no dependency on that checkout. `docs/site-assets.json`
records source/derived hashes and Unicode ranges. The guard reads actual WOFF2
Unicode cmaps using built-in Brotli and checks exact, disjoint coverage of the
full source plus the rendered fallback stack.
The diagram’s decorative check is a vector so it does not fetch the full face.

Production keeps external stylesheets. Next’s generic inline-CSS experiment was
rejected after real client-navigation CSP violations in the shared framework
test; no style policy is weakened. The existing post-export CSP still hashes
every exact owned style element. Only hashed `/_next/static/*` assets receive one-year immutable
caching on Cloudflare and Caddy; unversioned pages/brand assets retain ordinary
revalidation. Performance measurements must distinguish the genuine public
system-font export from licensed local private-font builds.

The header/footer use the original folded-L logo commissioned by the owner
on 12 October 2026, in the geometric direction of Telarsa and Khatamo. The
wordmark is outlined from the owned Inter/OFL source and needs no runtime
font. Public copies match the horizontal/vertical fixed-colour masters in
assets/logo; symbols stay left and never mirror in Persian.
See public/brand/README.md and assets/logo/provenance.json.

Icons and social cards are static files in `public/`: `icon.svg` (the mark,
adapting to dark mode), `favicon.ico`, `apple-touch-icon.png`, `icons/`,
`site.webmanifest` and the 1200x630 Open Graph/Twitter cards `og/lumo-{en,de,fa}.png`.
`node scripts/render-brand-images.mjs` renders the rasters from the mark, the
light colours of `src/app/globals.css` and the hero copy with the workspace's
Playwright Chromium; rerun and review it when any of those change. The layout
and `pageMetadata` (`src/lib/site.ts`) wire them into every page's head with
absolute URLs on `NEXT_PUBLIC_SITE_URL`, else `https://lumo-ui.com`; the same
origin feeds `src/app/robots.ts` and `src/app/sitemap.ts` (every route in every
language with hreflang alternates). Canonical links and indexing use the
owner-authorized `https://lumo-ui.com` origin by default; `NEXT_PUBLIC_SITE_URL`
can override it for a separate host.

## Documentation snapshot

The documentation pages, renderer and data were adapted from the previous
`apps/website` at commit `c040e7490419`. `docs/public-docs-snapshot.json` records the
source commit and checksums, and `check-public-docs.mjs` verifies them on every
build. `pnpm docs:refresh [ref] [repo]` regenerates the snapshot from git history
(default: the recorded commit in this repository) and reapplies the documented
adaptations. The shared code listings and table wrappers add `tabIndex={0}`
for keyboard scrolling. The sidebar uses the site-owned focus helper to reveal
the complete focused navigation link within its horizontal rail, including
RTL; this is also recorded in the adapter. The authored corpus stays intact. Displayed facts
(version, rule count) are checked against the
workspace package by `check-public-contract.mjs`.

The explicit adapter also maps each of the six technical pages' original
section keys/positions to durable language-independent IDs and adds localized
native heading permalinks. Refresh checks the original section count/order;
translated headings never determine the IDs. Each permalink's accessible name
includes its rendered heading and localized purpose; the separate heading keeps
its own title as its accessible name. Source reads, adaptations and snapshot
metadata are prepared before any destination is written, so a later adaptation
failure cannot partially refresh the corpus. `scripts/sync-public-docs-atomicity.test.mjs`
exercises this with a late source drift in an isolated temporary repository.
The getting-started install places Lumo in runtime dependencies, matching apps
that import its core, dates and theme. The helpers' numbers
paragraph is an accuracy adaptation against the maintained `formatLocale` API:
explicit Persian and Saudi Arabic profiles, preserved caller Unicode extensions
and Intl/CLDR defaults for other tags. The gate commands resolve the installed
package from a consumer project, and the calendar snippet uses the built-in
`fa-IR` tag with guidance for custom strings. The recorded original source and
MIT notice remain unchanged; adapted checksums record these refinements.

`scripts/documentation-ux-browser.mjs` checks source invariants (`--static`),
refresh reproducibility (`--refresh-check`) and an already-served export's
native section/language links, install snippets and keyboard/zoom behavior.
Provide `PLAYWRIGHT_FROM` pointing to existing installed e2e package metadata
and `WEBSITE_URL` for the local preview; it installs nothing and starts no
server. `DOCUMENTATION_UX_ARTIFACTS` selects the evidence directory.

Legal pages use typed copy in `src/content/legal.ts`; company facts are a local
snapshot of the Telarsa company profile. Local checks do not certify legal
compliance.

## Deployment

The public origin is `https://lumo-ui.com`; see `.env.example`. Two host
configurations exist:

- **Cloudflare Workers Static Assets**: `wrangler.jsonc` uploads `out/`, with
  `public/_headers` and `public/_redirects`. `pnpm deploy:website` from the root,
  authenticated, after building. Live responses confirm Cloudflare delivery;
  the older unpublished infrastructure entry is historical.
- **Docker on the VPS**: `Dockerfile` (context: the repository root) builds the
  site and serves `out/` with Caddy (`Caddyfile`) on port 3000. See the root
  `DEPLOY-VPS.md`. Pass `--build-arg LUMO_REQUIRE_PRIVATE_FONTS=1` and populate
  the private font directory first for the production image.

## History

`docs/handoff-2026-10-05-private-marketing.md` and
`docs/site-ownership-2026-10-05.md` are the standalone repository's dated
records, kept as history.

`docs/handoff-2026-10-11-marketing-review.md` records the current marketing,
logo, keyboard, CSP and verification changes with remaining owner facts.

After reviewing regenerated logos/icons/cards, run
`node scripts/check-brand-assets.mjs --record` to freeze docs/brand-assets.json.
Ordinary builds verify these recorded hashes before and after export; they
never silently refresh them. Keep all nine meaningful brand/icon regressions.
