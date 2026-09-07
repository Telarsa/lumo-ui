# Independent static website deployment

The owner selected Cloudflare Workers Static Assets on 7 September 2026.
The website stays under apps/website in this monorepo.
Its rollout is independent of product services and package/git-tag releases.

```sh
pnpm verify
pnpm --filter @lumo-ui/website build
pnpm preview:website
```

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
