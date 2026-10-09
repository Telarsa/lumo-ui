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
document via `scripts/grade-static.mjs`, then a local link/anchor check). The
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

Icons and social cards are static files in `public/`: `icon.svg` (the mark,
adapting to dark mode), `favicon.ico`, `apple-touch-icon.png`, `icons/`,
`site.webmanifest` and the 1200x630 Open Graph/Twitter cards `og/lumo-{en,de,fa}.png`.
`node scripts/render-brand-images.mjs` renders the rasters from the mark, the
light colours of `src/app/globals.css` and the hero copy with the workspace's
Playwright Chromium; rerun and review it when any of those change. The layout
and `pageMetadata` (`src/lib/site.ts`) wire them into every page's head with
absolute URLs on `NEXT_PUBLIC_SITE_URL`, else `https://lumo-ui.com`; the same
origin feeds `src/app/robots.ts` and `src/app/sitemap.ts` (every route in every
language with hreflang alternates). Indexing stays `noindex` until
`NEXT_PUBLIC_SITE_URL` is set.

## Documentation snapshot

The documentation pages, renderer and data were adapted from the previous
`apps/website` at commit `5d17b06`. `docs/public-docs-snapshot.json` records the
source commit and checksums, and `check-public-docs.mjs` verifies them on every
build. `pnpm docs:refresh [ref] [repo]` regenerates the snapshot from git history
(default: the recorded commit in this repository) and reapplies the documented
adaptations. Displayed facts (version, rule count) are checked against the
workspace package by `check-public-contract.mjs`.

Legal pages use typed copy in `src/content/legal.ts`; company facts are a local
snapshot of the Telarsa company profile. Local checks do not certify legal
compliance.

## Deployment

`NEXT_PUBLIC_SITE_URL` stays unset (pages are `noindex`, no canonical origin)
until a deployment is agreed; see `.env.example`. Two configurations exist:

- **Cloudflare Workers Static Assets**: `wrangler.jsonc` uploads `out/`, with
  `public/_headers` and `public/_redirects`. `pnpm deploy:website` from the root,
  authenticated, after building. Listed as unpublished in the infrastructure
  deployment registry.
- **Docker on the VPS**: `Dockerfile` (context: the repository root) builds the
  site and serves `out/` with Caddy (`Caddyfile`) on port 3000. See the root
  `DEPLOY-VPS.md`. Pass `--build-arg LUMO_REQUIRE_PRIVATE_FONTS=1` and populate
  the private font directory first for the production image.

## History

`docs/handoff-2026-10-05-private-marketing.md` and
`docs/site-ownership-2026-10-05.md` are the standalone repository's dated
records, kept as history.
