@AGENTS.md

# Claude-specific notes
- Start with the graph: `graphify query` / `graphify path` / `graphify explain` before broad grep or Read; the graph is at `graphify-out/` (gitignored). Refresh it with `graphify update .` after edits.
- Any rating, review, or comparison uses `docs/rubric.md` — the sheet, the weights, the anchors. Progress is "which criteria moved, with evidence", not a new overall number argued from scratch.
- Commit in logical tranches with the reasoning in the message; do not push.
- When a gate rejects your change, fix the change — the gates are the spec.
- Long runs (`verify`, `mutation:components`) go in the background, one at a time; never touch source while the mutation campaign runs.
- Package-scoped guidance lives in `packages/*/CLAUDE.md` and `apps/website/CLAUDE.md`.
