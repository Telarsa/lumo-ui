# Independent static website deployment

The owner selected Cloudflare Workers Static Assets on 7 September 2026.
The website stays under apps/website in this monorepo.
Its rollout is independent of product services and package/git-tag releases.

Run from the monorepo root after `pnpm install --frozen-lockfile`; do not change
the Cloudflare root directory to `apps/website`, which consumes the root package.

```sh
pnpm --filter @lumo-ui/website build  # build only → apps/website/out/
pnpm run gate:html                   # build and grade the website export
pnpm verify                          # complete repository verification
pnpm preview:website                 # serve the built export locally
pnpm deploy:website                  # build and publish with your Cloudflare account
```

## Cloudflare dashboard setup

| Cloudflare setting | Value |
| --- | --- |
| Project / Worker name | `lumo-ui-website` (matches Wrangler) |
| Production branch | `main` |
| Path / root directory | `/` (repository root) |
| Build command | `pnpm run gate:html` |
| Deploy command | `npx wrangler deploy --config apps/website/wrangler.jsonc` |
| Builds for non-production branches | Disabled |
| Protect with Cloudflare Access | Off (public website) |

Wrangler reads `apps/website/wrangler.jsonc` and uploads `apps/website/out/`. The asset directory is
configured there; it is not a separate Pages build-output setting.

The dashboard deploy command uses the explicit app config and uploads the output
already built by `gate:html`. The local `pnpm deploy:website` command builds again
before publication. Neither command publishes the library or creates a release tag.

## Local preview and publication

For another local port, run `npx wrangler dev --local --ip 127.0.0.1 --port 4300`
from `apps/website` after building. The verified export is `apps/website/out`.
Wrangler config explicitly names the assets and matches Next's trailing slashes;
metadata routes are force-static, and build outputs are excluded from lint.
No dependency is added to invoke Wrangler.

`pnpm deploy:website` builds and deploys from a
signed-in Cloudflare CLI. Verify the exact export first. No GitHub Actions run is
required; the owner waived CI while usage is exhausted. DNS stays owner-managed:
bind `lumo-ui.com` and `www.lumo-ui.com` individually as Worker Custom Domains.
Do not replace nameservers or use a www CNAME to a Worker apex. Roll back to a
previous verified Worker version and keep its commit/deployment ID in the handoff.

The static host sends `/` to `/en/`; explicit en/fa
URLs select locale. The optional Caddy container can negotiate Accept-Language;
that behavior is host-specific and is not promised by the static deployment.
Check all locales, styles/scripts/fonts, canonical slash redirects and custom 404.
A deployed Worker and a bound customer domain are separate acceptance steps.

## Command verification — 7 September 2026

Commands and paths were checked against the root and website `package.json`
files and `apps/website/wrangler.jsonc`. This documentation update does not
publish a Worker or verify dashboard settings. After owner deployment, acceptance
is working English/Persian pages, assets, redirects and 404 on both bound
hostnames; record the commit and deployment ID.
