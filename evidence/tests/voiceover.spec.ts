import { test } from "@playwright/test";

/**
 * VoiceOver (macOS) transcripts via Guidepup — a REAL screen reader, driven
 * locally, never in CI (macOS runners are not free and VoiceOver needs the
 * Accessibility permission for the terminal). Opt in with
 * `LUMO_VOICEOVER=1 pnpm run evidence:voiceover`; the run writes
 * `docs/evidence/voiceover/<family>.txt`. Until someone runs it, no
 * VoiceOver claim exists — this file skipping is the honest state.
 */
test("voiceover transcripts (opt-in, local macOS only)", async () => {
  test.skip(process.env["LUMO_VOICEOVER"] !== "1", "set LUMO_VOICEOVER=1 on macOS with VoiceOver permissions to record transcripts");
  test.fixme(true, "Guidepup driver not wired yet — see docs/evidence/README.md for the plan");
});
