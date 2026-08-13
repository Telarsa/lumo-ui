# Android TalkBack session and replacement-readiness update

Date: 2026-08-13

Branch: `experiment/base-ui`

Starting HEAD: `41fd2ea71efddcb16aba29c8fa23aa0700764d8e`

## Scope and verdict

This pass ran **real TalkBack** against the production static export on an
Android 15/API 35 emulator. Windows was stopped at the user's request: NVDA and
JAWS were documented but not installed, run, or scored.

Environment actually exercised:

- Android 15, API 35, `sdk_gphone64_arm64`;
- Android Accessibility Suite / TalkBack `15.0.0.639625893`;
- Android System WebView `124.0.6367.219`;
- Lumo's static export at `http://localhost:4173`, reached through `adb reverse`;
- TalkBack was a bound, enabled service with spoken, haptic, and audible
  feedback; `dumpsys accessibility` reported no crashed accessibility service.

Chrome 124's first-run policy/loading screen did not complete in this clean
emulator. A disposable native WebView shell was therefore used. That is a real
TalkBack + Chromium accessibility bridge, but it is **not represented as a
Chrome-browser pass**. No disposable app or Android build file was added to the
repository.

The session found two product defects:

1. **PROVED:** Android WebView 124 could not hydrate any Lumo page because it
   lacks `Intl.Locale.prototype.getTextInfo`.
2. **PROVED:** Gantt claimed one sequential stop over its bars, while every
   start/end resize button added another native Tab stop.

Both are fixed, have named regression assertions, were mutation/reversion
checked, and were rechecked in the real Android accessibility tree. The honest
overall score moves from **9.2 to 9.3**, not to 10: TalkBack now covers five
high-risk components, but Windows readers remain untested and replacement
breadth/distribution gaps remain material.

The final HTML gate also exposed one **PROVED tooling false positive**:
`no-latin-aria` treated standards-defined `aria-keyshortcuts` key tokens as
untranslated prose. WAI-ARIA requires UI Events names such as `ArrowRight`,
`Escape`, `Tab`, and `F1`; translating those values would make the attribute
invalid. A red gate assertion now distinguishes that machine grammar from
ordinary English ARIA copy, while the visible Persian keyboard instructions
were genuinely localized.

## Defect 1 — Android Chromium hydration failure

### Before — PROVED

On WebView 124, the Persian Table route was replaced during hydration by
Next's generic client-error surface. The exact DevTools exception was:

> `Error: Intl.Locale.getTextInfo is unavailable, so text direction for "fa-IR" cannot be resolved.`

The issue was production code, not TalkBack. The same page loaded only after
the direction resolution was repaired.

### Red assertion

`packages/core/src/types.test.ts:27-40` now removes `getTextInfo` from the
runtime and names the contract:

> `keeps the closed locale catalogue usable on Android Chromium without getTextInfo`

Before the fix, the assertion threw instead of producing `rtl`/`ltr`.

### Fix

`packages/core/src/types.ts:44-82` first uses the platform capability, then
falls back to an exhaustive catalogue:

> `const info = new Intl.Locale(locale).getTextInfo?.();`
>
> `if (info) return info.direction;`
>
> `return DIRECTION[locale];`

This does not restore a caller-controlled `dir` and does not guess from a
language prefix. The fallback is compile-exhaustive:

> `as const satisfies Record<Locale, Direction>`

Adding a locale without deliberately assigning a direction is therefore a
type error.

### Proof after fix

- Focused core suite: 12/12 passed.
- Type gate passed across the workspace.
- The same rebuilt Persian Table page rendered and hydrated in WebView 124.
- Removing the fallback makes the named Android-Chromium assertion fail again.

## Defect 2 — Gantt resize handles violated the one-stop contract

### Before — PROVED

The live Persian hierarchy example had six task bars and twelve resize
handles. Only one bar was in the roving sequence, but all twelve resize handles
were native buttons with `tabIndex=0`. This contradicted the source's own
first-byte promise of one stop over the chart's bars.

The Android DOM inspection showed, before the fix:

> first hierarchy bars: `[0, -1, -1, -1, -1, -1]`
>
> first hierarchy resize handles: twelve `0` values

### Red assertion and mutation proof

`packages/ui/src/gantt.test.tsx:481-511` names the interaction contract:

> `enters resize mode with F2 without adding sequential Tab stops`

It requires both edges to be `-1`, F2 to enter the start edge, Tab to switch
edges, Shift+Tab to return, and Escape to restore the task bar. It initially
failed with:

> `expected +0 to be -1`

The served-byte assertion at `packages/ui/src/gantt.test.tsx:640-664` also
requires all six rendered handles to carry `tabindex="-1"`. Reapplying
`tabIndex={0}` to a handle made the named resize-mode assertion fail again;
the fix was then restored.

### Fix

- `packages/ui/src/gantt.tsx:939-951`: F2 on the active bar enters its start
  handle.
- `packages/ui/src/gantt.tsx:1103-1124`: the bar remains the roving stop and
  advertises `aria-keyshortcuts="F2"`.
- `packages/ui/src/gantt.tsx:1139-1177`: the start handle is `tabIndex={-1}`;
  Tab goes to the end edge and Escape returns to the bar.
- `packages/ui/src/gantt.tsx:1178-1216`: the end edge has the matching contract.
- `apps/website/src/examples/gantt.tsx` now documents F2, edge switching, and
  Escape in both English and Persian rather than leaving the only route hidden
  in source code.

### Real TalkBack proof after fix

The rebuilt export exposed twenty visible resize handles across the two Gantt
examples, all with `tabIndex=-1`; each chart retained exactly one bar with
`tabIndex=0`.

The Android accessibility tree then recorded this exact path:

1. focused bar: `نسخهٔ بهار، از ۱ فروردین ۱۴۰۵ تا ۱۸ فروردین ۱۴۰۵، ۴۵٪ انجام‌شده`;
2. F2: `تغییر آغاز نسخهٔ بهار`;
3. Tab: `تغییر پایان نسخهٔ بهار`;
4. Escape: focus returned to the original full-date/progress bar.

The focused Gantt suite passed 34/34 after restoration.

## Tooling correction — `aria-keyshortcuts` is grammar, not prose

The first final HTML gate reported 32 `no-latin-aria` violations for values
such as `aria-keyshortcuts="ArrowLeft ArrowRight Escape Tab"`. This was a gate
defect, not 32 untranslated labels. The WAI-ARIA specification requires exact
UI Events `KeyboardEvent.key` values and explicitly lists `Tab`, `ArrowRight`,
`Escape`, and `F1` as valid names:
[WAI-ARIA `aria-keyshortcuts`](https://www.w3.org/TR/wai-aria/#aria-keyshortcuts).

The named assertion in `packages/gate/src/gate.test.ts`:

> `does not mistake the standards-defined aria-keyshortcuts grammar for English prose`

was red before the rule correction. `packages/gate/src/rules.ts` now limits
the list to **localizable prose attributes** and documents why
`aria-keyshortcuts` is intentionally outside it. Re-adding that attribute to
the prose list kills the named assertion. The same HTML run also caught real
English key names in the visible Persian Gantt explanation; those were
translated rather than exempted. Final result: 540 documents, zero findings.

## TalkBack component matrix

| Component and action | Actual Android/TalkBack evidence | Verdict |
| --- | --- | --- |
| Persian Table, focus header | Caption panel: `column header, Row 1, In table سفارش‌های اخیر, 3 rows, 2 columns`; the focused node was `مشتری`. | **PROVED:** table coordinates and localized label reach TalkBack. |
| Persian Table, F2 then Right Arrow | Focused resizer was `۱۸۰ پیکسل, تغییر اندازهٔ ستون`; Right Arrow produced `۱۷۰ پیکسل, تغییر اندازهٔ ستون`. | **PROVED:** localized value text is exposed and the physical Right key shrinks in RTL. |
| AlertDialog, Enter then Escape | Enter moved focus from `حذف فاکتور` into the modal's `انصراف` button. The accessibility subtree contained the title, irreversible-action description, `حذف`, and `انصراف`. Escape restored focus to the original `حذف فاکتور` trigger. | **PROVED:** focus entry, contained actions, and restoration. **PARTIAL:** the opening title sentence was not captured from the speech overlay, so no exact spoken-title claim. |
| Persian Calendar, Right Arrow | Focus moved from `امروز، ۱۴۰۵ مرداد ۲۱, چهارشنبه` to `۱۴۰۵ مرداد ۲۰, سه‌شنبه`. | **PROVED:** Jalali date, Persian digits, weekday, and mirrored RTL day movement reach the Android accessibility bridge. |
| Gantt, Down Arrow | Focus moved from the Spring-release range/progress sentence to `طراحی صفحهٔ پرداخت، از ۱ فروردین ۱۴۰۵ تا ۷ فروردین ۱۴۰۵، ۱۰۰٪ انجام‌شده`. | **PROVED:** roving task navigation exposes date ranges and progress. |
| Gantt, F2 → Tab → Escape | Start-edge label, end-edge label, then the original bar sentence, as transcribed above. | **PROVED fix:** inner resize mode is reachable without adding sequential stops. |
| VirtualList | TalkBack exposed one focusable `ListView` named `فهرست سفارش‌ها`; the DOM contained 22 rendered `role=listitem` nodes with raw `aria-posinset`/`aria-setsize`, but UIAutomator did not expose those descendants or a `1 of 10,000` sentence. | **PARTIAL / SUSPECTED engine boundary:** container naming and scrolling are present, but corpus-position speech is not proved on WebView 124. No product change was made because the Chromium AX tree still contained listitems and the same implementation is already proved in VoiceOver. |

The matrix deliberately does not promote DOM attributes to speech evidence.
Where the caption was not captured, the result says accessibility-tree or
focus evidence, not “TalkBack said”.

## Windows readers — documented and deferred

NVDA and JAWS were stopped, not failed. Neither was run.

- JAWS' current system requirements are Windows 10/11 or supported Windows
  Server releases: [Freedom Scientific JAWS](https://www.freedomscientific.com/products/software/jaws/).
- NVDA is a Windows screen reader: [NV Access download](https://www.nvaccess.org/download/).

A Windows VM was discussed only because macOS cannot execute those Windows
screen readers. Per the user's instruction, no VM image, Windows licence,
NVDA, or JAWS installation was downloaded. These remain explicit evidence
gaps and contribute no score.

## Competitor position after the real Android session

The full current-source comparison and per-competitor migration checklists are
in `review/COMPETITOR-REPLACEMENT-2026-08-13.md`. The Android result changes the
comparison in two useful ways:

1. Lumo's locale-derived direction is now demonstrated on an older Android
   Chromium engine, not only modern desktop engines. The test found a real
   compatibility hole first; the advantage is the exhaustive fallback and
   regression, not the original design claim.
2. Lumo's Gantt now has an auditable inner resize mode and localized TalkBack
   labels. ReUI still leads in dependencies, rollups, baselines, zones,
   continuous zoom, and external scheduling; the repair closes a keyboard
   defect, not that product-depth gap.

### What Lumo is better at

- Persian/Jalali behavior, locale-derived RTL, Persian digits, and mirrored
  keyboard geometry are enforced together.
- Every announced product string is caller-required; there is no silent
  English accessibility fallback.
- Static first-byte semantics, copied registry payloads, and consumer
  compilation are graded instead of inferred from a hydrated Storybook.
- Lumo already owns product-level Gantt, EventCalendar, Filters,
  Questionnaire, TransferList, OverflowList, and deterministic VirtualList
  contracts beyond a primitive-only library.

### What competitors are better at

- Radix and Ark expose deeper part/context/state-machine composition; Ark also
  supports React, Solid, Vue, and Svelte.
- shadcn and ReUI have reachable public registries, much larger adoption
  ecosystems, and more recipes/blocks.
- ReUI is substantially deeper in enterprise Gantt, scheduler, data-grid, and
  upload workflows.
- Mantine is broader in hooks, forms, charts, specialist inputs, global
  managers, and extensions.
- Meta Astryx is deeper in AI/chat, editors, internal-tool templates,
  LogStream, PowerSearch, and specialist visualizations.

### What Lumo still needs before it can honestly replace them

1. **Distribution first:** a reachable registry/package channel, releases,
   semver/deprecation/support/security policies, and migration tooling. Lumo's
   own installation page currently says it is private, unpublished to npm, and
   serves no public registry.
2. **Cross-platform evidence:** NVDA + Firefox/Chrome, JAWS + Chrome/Edge, and a
   current Chrome/TalkBack run—not only WebView 124.
3. **Enterprise depth:** dependency-aware Gantt; resource/recurring/zoned
   scheduling; virtual/editable/pinned/grouped data grid; resumable/chunked
   upload adapters; unified async/virtual pickers.
4. **Migration surface:** Radix/Ark controlled-state and part adapters, Mantine
   theme/form/hooks recipes, shadcn/ReUI component/block mappings and codemods.
5. **Specialist categories where demand is real:** color/range inputs,
   richer charts, notification/modal managers, AI composer/tool calls,
   editors, LogStream, and application-shell templates.

## Re-evaluation

| Dimension | Before this pass | After | Remaining ceiling |
| --- | ---: | ---: | --- |
| Accessibility / i18n / RTL | 9.3 | **9.5** | Real Android TalkBack found two defects and verified high-risk focus/date/RTL/resize behavior. NVDA/JAWS and current Chrome/TalkBack remain untested; VirtualList corpus-position speech is partial on WebView 124. |
| Testing and tooling | 9.4 | **9.5** | Both new defects have red tests and mutation/reversion proof. This is not a semantic mutation of every branch, nor an automated Android tier. |
| API design and DX | 9.0 | **9.1** | Exhaustive direction fallback and discoverable Gantt inner mode improve the contracts. Cross-component controlled-state/async collection consistency still trails the best primitive/platform libraries. |
| Design system and docs | 9.4 | **9.4** | Gantt keyboard docs and stale 98/128 counts were corrected; the earlier 198-page pass still stands. Competitors retain larger public recipe/theme ecosystems. |
| Product breadth | 8.8 | **8.8** | Accessibility fixes do not manufacture dependencies, recurrence/resources/zones, resumable upload, enterprise grids, editor/AI, or hooks breadth. |
| **Overall** | **9.2** | **9.3** | A real second AT platform is meaningful. The remaining 0.7 is primarily replacement/distribution and enterprise breadth, plus the deferred Windows matrix. |

## Declined or not claimed

- No NVDA, JAWS, Narrator, or Windows VM result.
- No Chrome-for-Android result; Chrome's clean-emulator first-run screen did
  not complete, so the tested engine is reported as WebView 124.
- No claim that all 99 component pages passed TalkBack. Five high-risk
  components were exercised; the complete 198-route visual pass is separate.
- No claim that VirtualList announced corpus positions in TalkBack 15/WebView
  124. That was not observed, and the engine/product boundary was not proved.
- No new runtime dependency, paid service, publish, push, editor, WebGL
  package, or thin catalog alias.
- No dependency solver, scheduler recurrence engine, upload transport, or
  enterprise grid was improvised inside an AT evidence pass.

## Verification record

- Core direction regression: 12/12 passed.
- Gantt focused suite: 34/34 passed.
- Workspace type gate: passed after the Android direction repair.
- Production website build: 540 static pages; 198 evidence panels injected.
- Real Android recheck: rebuilt Gantt served all resize handles at `-1`, and
  F2/Tab/Escape traversed start/end/bar as specified.
- One top-level `pnpm run verify` was invoked. It passed types, prop/root gates,
  lint, CSS-module checks, config/core/theme/gate/base-SSR tests, then stopped
  on a newly added Gantt server-markup fixture that rendered a read-only chart
  and therefore expected six handles where zero were supposed to exist. The
  fixture was corrected to render the public editable API; the full UI suite
  then passed 78 files / 1,867 assertions.
- Blocks passed 160/160. The website run passed 82 assertions and timed out—no
  assertion failure—in the 60-second all-examples loader while the emulator and
  server were consuming memory. After both were stopped, that exact file passed
  19/19 in 16.2 seconds (the flagship load itself took 12.0 seconds).
- Gate self-tests passed with the new shortcut-grammar regression; registry
  check reported 128 items, API check 105 modules, and all 128 copied payloads
  typechecked in a bare consumer.
- Final static export/HTML gate: 540 documents, 198 evidence panels, zero
  violations. `git diff --check`: clean.

No change was pushed. `review/INDEPENDENT-REVIEW-9eb90a7.md` remains untouched.
