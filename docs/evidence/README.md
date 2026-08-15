# Browser evidence — what it proves, and what it does not

`pnpm run evidence` runs Playwright over the built site (`apps/website/out`,
served by `scripts/serve-static.mjs`) in three real engines. It is a separate
job from `verify` (RAM: never run them together). Configuration and specs live
in `evidence/`.

| Spec | Engines | Proves | Does NOT prove |
|---|---|---|---|
| `axe.spec.ts` | Chromium | No serious/critical axe-core (WCAG 2.x A/AA) violation on any of the ~590 built routes. One stated exclusion: contrast of text inside a *disabled* component (label/description of a disabled field, a disabled breadcrumb) — WCAG 1.4.3 exempts inactive components; these are counted per route as a test annotation, never silently dropped. The root `/` (a meta-refresh onto `/fa/`) is not graded. | Anything axe cannot detect (reading order sense, announcement wording, focus feel) |
| `popups.spec.ts` | Chromium, WebKit, Firefox | For 20 popup families opened for real: the ARIA tree matches the committed snapshot (`tests/__snapshots__/*.aria.yml`); no Latin word in a spoken attribute inside the popup; the popup has an authored name where its role needs one; axe clean with the popup open (Chromium) | What a screen reader *says* — an ARIA tree is the input to a screen reader, not its output |
| `rtl-layout.spec.ts` | Chromium, WebKit, Firefox | For mirrored families the same two elements are ordered right-to-left on `fa` and left-to-right on `en` (geometry from the layout engine, not pixels); every sampled `fa` route is `dir=rtl` with computed `direction: rtl` and no horizontal scroll | Visual correctness of glyph shaping, kashida, or icon mirroring inside SVGs |
| `voiceover.spec.ts` | macOS only, opt-in | Nothing yet — a placeholder that skips unless `LUMO_VOICEOVER=1`; the Guidepup driver is the next step | **No VoiceOver, NVDA, JAWS, Narrator or TalkBack claim exists.** |

Rules:
- A finding here is a defect in the component or a documented engine defect in
  `docs/upstream/` with a `test.fixme` that links it — never an allowlist.
- Snapshot files are reviewed like code: a diff in `*.aria.yml` is an API change
  to what assistive technology receives.
- Screenshots are deliberately not used: font rasterisation differs per OS, so
  pixel baselines would fail on the next machine and teach people to update
  them blindly. Geometry does not.

Local run (installs ~350 MB of browsers once):
```
pnpm exec playwright install chromium webkit firefox
pnpm run build            # or: pnpm --filter @lumo-ui/website build
pnpm run evidence         # all three engines
pnpm run evidence -- --project=chromium --grep @cross   # a quicker slice
```
