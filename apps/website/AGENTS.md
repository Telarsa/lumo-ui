# Lumo website

Follow the root AGENTS.md. Build from the monorepo root; this app consumes
`lumo-ui` through `file:../..`. Its static export deploys independently to
Cloudflare Workers Static Assets using this directory's wrangler.jsonc.

Run the root verify gate and inspect English/Persian built output before
publishing. The owner authorised shared website UI improvements on 7 September 2026.
Measure both themes/locales before and after; keep shadcn accent unbound.
No package version or tag is needed for a website deployment. Owner DNS binds
apex and www separately as Worker Custom Domains. See docs/deployment.md.

Next's generated agent-rules block is not maintained source; revert that block
if a dev server writes it. Do not commit it with unrelated work.
