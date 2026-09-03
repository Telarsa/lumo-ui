@AGENTS.md

# Claude-specific notes
- Commit in logical tranches with the reasoning in the message; do not push.
- When a gate rejects your change, fix the change — the gates are the spec.
- Long runs (`verify`, `mutation:mobile`) go in the background, one at a time;
  never touch source while a mutation campaign runs.
- No ratings, scores or comparisons against other libraries: the rubric that
  produced them is gone. Progress is "which gate moved, with evidence", and
  `docs/verification.md` lists what each one proves.
- Package-scoped guidance lives in `packages/core/CLAUDE.md` and
  `packages/gate/CLAUDE.md`.
- The docs site (`apps/website`) is a CONSUMER, not a showcase of ours: its
  `src/components/ui/**` are shadcn copies this repo does not lint-own (§51).
  Change them the way a consumer would — and let `gate:html` grade the result.
