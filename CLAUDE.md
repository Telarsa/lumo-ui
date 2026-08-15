@AGENTS.md

# Claude-specific notes
- Prefer `graphify query` / `graphify explain` over broad grep for orientation; the graph is at `graphify-out/`.
- Commit in logical tranches with the reasoning in the message; do not push.
- When a gate rejects your change, fix the change — the gates are the spec.
- Long runs (`verify`, `mutation:components`) go in the background, one at a time; never touch source while the mutation campaign runs.
- Package-scoped guidance lives in `packages/*/CLAUDE.md` and `apps/website/CLAUDE.md`.
