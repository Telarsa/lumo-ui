# Independent static website deployment

The owner selected Cloudflare Workers Static Assets on 7 September 2026.
The website stays under apps/website in this monorepo.
Its rollout is independent of product services and package/git-tag releases.

Run from the monorepo root after `pnpm install --frozen-lockfile`; do not change
the Cloudflare root directory to `apps/website`, which consumes the root package.

```sh
pnpm build:website                  # build only → apps/website/out/
pnpm check:website                  # lint, website types, build and HTML gate
pnpm verify                          # complete repository verification
pnpm preview:website                 # serve the built export locally
pnpm deploy:website                  # upload checked output; main only, no rebuild
```

## Cloudflare dashboard setup

| Cloudflare setting | Value |
| --- | --- |
| Project / Worker name | `lumo-ui-website` (matches Wrangler) |
| Production branch | `main` |
| Path / root directory | `/` (repository root) |
| Build command | `pnpm check:website` |
| Deploy command | `pnpm deploy:website` |
| Builds for non-production branches | Disabled |
| Protect with Cloudflare Access | Off (public website) |

Wrangler reads `apps/website/wrangler.jsonc` and uploads `apps/website/out/`. The asset directory is
configured there; it is not a separate Pages build-output setting.

The dashboard deploy command uses the explicit app config and uploads the output
already built by `check:website`. The same `pnpm deploy:website` command runs
locally and in Cloudflare; it requires `main` and does not rebuild. Neither command publishes the library or creates a release tag.

## Local preview and publication

For another local port, run `npx wrangler dev --local --ip 127.0.0.1 --port 4300`
from `apps/website` after building. The verified export is `apps/website/out`.
Wrangler config explicitly names the assets and matches Next's trailing slashes;
metadata routes are force-static, and build outputs are excluded from lint.
No dependency is added to invoke Wrangler.

`pnpm deploy:website` uploads checked output from a
signed-in Cloudflare CLI. Verify the exact export first. No GitHub Actions run is
required; the owner waived CI while usage is exhausted. DNS stays owner-managed:
bind `lumo-ui.com` and `www.lumo-ui.com` individually as Worker Custom Domains.
Do not replace nameservers or use a www CNAME to a Worker apex. Roll back to a
previous verified Worker version and keep its commit/deployment ID in the handoff.

The static host sends `/` to `/en/`; explicit en/de/fa
URLs select locale. The optional Caddy container can negotiate Accept-Language;
that behavior is host-specific and is not promised by the static deployment.
Check all locales, styles/scripts/fonts, canonical slash redirects and custom 404.
A deployed Worker and a bound customer domain are separate acceptance steps.

## Command verification — 7 September 2026

Commands and paths were checked against the root and website `package.json`
files and `apps/website/wrangler.jsonc`. This documentation update does not
publish a Worker or verify dashboard settings. After owner deployment, acceptance
is working English/German/Persian pages, assets, redirects and 404 on both bound
hostnames; record the commit and deployment ID.

## Uniform website command contract — 7 September 2026

Run from the repository root. Cloudflare Build is `pnpm check:website` and Deploy
is `pnpm deploy:website`, with root `/`, production branch `main` and
non-production builds disabled. Both dashboard and local publication use these
same commands; do not use bare Wrangler to bypass the branch check.

| Command | Meaning |
| --- | --- |
| `pnpm build:website` | Build the static website without publishing |
| `pnpm check:website` | Run the website checks, including a build and output validation |
| `pnpm preview:website` | Serve the existing build locally without rebuilding |
| `pnpm deploy:website` | Require `main` and upload the existing output without rebuilding |

Run check and deploy in the same checkout and build environment. Upload does not
prove that an arbitrary old output directory was checked: always complete the
check first. Project-specific checks remain in place; this is a shared command
contract, not a replacement for the full repository verification pipeline.
This supersedes previous build-and-upload convenience behavior. No source folders,
frameworks, UI, domain bindings or platform deployments change with these commands.

## Three-language website — 7 September 2026

All home and documentation routes exist in English, German and Persian.
The header menu keeps the current route and shows EN, DE and فا with autonyms.
German calendar/control strings belong to the website consumer in
`src/lib/site-strings.ts`; German is not a newly released built-in library locale.
German social previews use translated text cards; existing English/Persian
artwork is not relabelled as German. Unknown URLs offer all three home links.

Check the exported routes and sitemap, then test the menu at 320, 390, 768 and
1440 pixels in both themes. `scripts/probe-website.mjs` captures rest/hover
geometry against a built preview. No package release accompanies these pages.
