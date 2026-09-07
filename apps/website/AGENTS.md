# Lumo website

Follow the root AGENTS.md. Build from the monorepo root; this app consumes
`lumo-ui` through `file:../..`. Its static export deploys independently to
Cloudflare Workers Static Assets using this directory's wrangler.jsonc.

Run the root verify gate and inspect English/Persian built output before
publishing. Preserve the UI, both themes, and the unbound shadcn accent rule.
No package version or tag is needed for a website deployment. Owner DNS binds
apex and www separately as Worker Custom Domains. See docs/deployment.md.

Next's generated agent-rules block is not maintained source; revert that block
if a dev server writes it. Do not commit it with unrelated work.
