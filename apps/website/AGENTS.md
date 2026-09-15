# Lumo website

Follow the root AGENTS.md. Build from the monorepo root; this app consumes
`lumo-ui` through `file:../..`. Its static export deploys independently to
Cloudflare Workers Static Assets using this directory's wrangler.jsonc.

Run the root verify gate and inspect English/German/Persian built output before
publishing. The owner authorised shared website UI improvements on 7 September 2026.
Measure both themes and all three locales before and after; keep shadcn accent unbound.
No package version or tag is needed for a website deployment. Owner DNS binds
apex and www separately as Worker Custom Domains. See docs/deployment.md.

Next's generated agent-rules block is not maintained source; revert that block
if a dev server writes it. Do not commit it with unrelated work.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
