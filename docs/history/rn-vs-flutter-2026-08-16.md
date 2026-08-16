# React Native (Expo) vs Flutter vs Lynx for Lumo — the twin-app experiment, 16 Aug 2026

The owner asked for two projects with the same app on each, to try both and
decide. Both live under `example-projects/` and are the ONLY vehicles for
further experiments (owner instruction):

| | `lumo-app-expo` | `lumo-app-flutter` |
|---|---|---|
| Stack | Expo SDK 57 / React Native 0.86 / Hermes; `@lumo-ui/native` (rn-primitives engine) + `@lumo-ui/core` as git pins | Flutter 3.35 / Dart 3.9; `packages/lumo_ui` (Material 3 widgets under Lumo's contract), local path package |
| Tokens | `packages/native/src/tokens.ts` generated from `tokens.css` | `packages/lumo_ui/lib/src/tokens.g.dart` generated from the SAME `tokens.css` (`scripts/build-flutter-tokens.mjs`) |
| Contract | required announced strings (types), no `dir`, `LumoNode` children, `formatNumber`, any BCP-47 locale | required named parameters (compile-time), no `dir`, `formatNumber` (Dart cannot forbid a raw number by type), any BCP-47 locale |
| Proof | first byte through react-native-web graded by the 14 rules; device runs (iOS 26.5 simulator) | widget tests over the SEMANTICS tree (names, roles, states, thumb side, dialog naming); device run |
| App | one screen: title + language toggle, TextField ×2 (validation), Select (sheet), Switch, Dialog (submit), IconButton (reset), formatted counter, dark switch — Persian first | the same screen, same copy keys (`copy.dart` mirrors `copy.ts`) |
| Ran on | iPhone 17, iOS 26.5, via Expo Go (no build) | iPhone 17, iOS 26.5, `flutter build ios --simulator` (9 min cold) |

Screenshots: `example-projects/lumo-app-expo/docs/ios-26-5-simulator-fa.png`,
`example-projects/lumo-app-flutter/docs/ios-26-5-simulator-fa.png` — visually
near-identical: same layout, RTL, tokens; the text engines differ (Flutter
draws its own glyphs; RN uses the platform's).

## Ratings (1–10; the AI's experience first, then the team's)

| Axis | RN + Lumo | Flutter + lumo_ui | Why |
|---|---|---|---|
| **AI working with it** — writing components | 8 | 8 | Both are one language, typed, hot-reload. Dart's `required` named params express Lumo's contract more cleanly than TS unions; RN's engine (rn-primitives) needed three real workarounds (style arrays, dangling idrefs, Metro-style packaging) that Flutter's `showDialog` did not — but Flutter's routes-above-scope needed its own fix. Even. |
| **AI working with it** — proving it | 9 | 6 | RN reuses Lumo's whole proof machinery (14 gate rules over RNW markup, the same tests, the docs site's Web|Mobile pages). Flutter has no served bytes: semantics-tree tests are good but a second proof system, and nothing grades a Flutter app the way `lumo gate` grades a route. |
| **AI working with it** — running it | 6 | 5 | RN: Expo Go, no build, but Metro/Hermes surprises (`Intl.Locale` missing, `I18nManager` relaunch). Flutter: 9-minute cold Xcode build, ~2 GB derived data, needs the iOS platform installed — the same wall the RN release build hit; then it just works. |
| **Team: shared code with the web** | 9 | 3 | RN shares `@lumo-ui/core` (types, format, direction, strings), the tokens generator, the docs, the CLI, the gate. Flutter shares only tokens (generated) and the *idea* of the contract; every string, type and test is duplicated in Dart. |
| **Team: maintainability** | 7 | 6 | Two libraries either way (web + native); RN's is TypeScript in the same monorepo with the same lints/gates. Flutter adds a second language, second CI, second doc site or a Flutter-web embed. |
| **RTL** | 6 | 9 | Flutter: `Directionality` per subtree, `AlignmentDirectional`, `EdgeInsetsDirectional`, mirrored icons — RTL is a first-class axis, no relaunch. RN: layout mirroring is app-level (`I18nManager.forceRTL` + relaunch); components can only be *ready* (logical `start`/`end`, writingDirection). |
| **i18n / any language / digits / calendar** | 6 | 9 | Flutter bundles ICU via `intl`: `formatNumber(1234,'fa-IR')` → ۱٬۲۳۴ deterministically; Jalali is available in `flutter_localizations`. RN depends on the Hermes build's `Intl` (digits/calendar held on iOS 26.5; `Intl.Locale` absent). |
| **Accessibility depth** | 7 | 7 | RN: real platform controls (UIKit/Compose) + `aria-*`/`accessibility*`; per-platform differences. Flutter: one `Semantics` API, but the a11y tree is Flutter's own bridge — good, occasionally lagging platform idioms. |
| **Features / ecosystem for our needs** | 7 | 6 | RN: rn-primitives (17 primitives), Expo modules, huge ecosystem, but no Jalali calendar. Flutter: Material 3 complete, Jalali in the framework, fewer headless kits (Material *is* the system, which is also the constraint). |
| **Look parity with web Lumo** | 8 | 7 | RN through RNW is literally the same tokens and shape on the docs site. Flutter matches by tokens; the text engine differs; Material's own widgets peek through (ink, ripples) unless suppressed. |
| **Performance on device** | 8 | 9 | Both smooth on the simulator; Flutter's build is AOT for release, RN's Hermes bytecode; Flutter's cold build cost is dev-time, not runtime. |
| **Ceiling** | 8 | 8 | RN's is the platform's (mirroring, `Intl`); Flutter's is the fork's (a second Lumo). |

**AI's overall:** RN + Lumo **7.6**, Flutter + lumo_ui **6.9** — for *Telarsa*, whose asset is a TypeScript Lumo with a web proof method. On a green field with no web library, Flutter would win on RTL/i18n alone.

## What the experiment settled

- Both stacks CAN carry Lumo's contract; the Flutter side proved that in an
  afternoon (five widgets, semantics tests, generated tokens, the twin app).
- The decisive difference is not the components — it is **what is shared**:
  RN shares core, tokens, docs, gate and CLI with the web; Flutter shares
  tokens only and duplicates the rest in Dart forever.
- The RN platform gaps are real and bounded (mirroring at app level; `Intl`
  per build; no Jalali calendar in the ecosystem — Lumo builds it on its
  datelib). The Flutter gap is structural (a second library).
- Both need the iOS platform in Xcode for anything beyond Expo Go — the 8.5 GB
  download is now installed; the machine has ~4 GB free after cleaning.

Recommendation: keep React Native / Expo as the mobile line (the standing
rule holds, now with a measured comparison behind it); keep `lumo-app-flutter`
as the reference of what Flutter would cost and offer, and revisit only if the
mobile line ever needs to stand alone from the web.


## Addendum, later the same day: the React Native pass, and a third twin — Lynx

**RN improved after the owner's first look** (motion "completely missing", the
switch not mirroring): `@lumo-ui/native` gained motion on React Native's own
`Animated`/`LayoutAnimation` (press dip, switch travel, sheet slide with a
FADING scrim instead of the Modal's sliding curtain, dialog fade+scale, reduced
motion honoured), a drawn chevron (the glyph sat below centre), and the switch
thumb is positioned by **flex alignment** — the layout engine mirrors it like
every row; two earlier approaches (logical `start` on an absolute child; a side
from `I18nManager.isRTL`) disagreed with the layout on device. Performance:
React Compiler enabled in `lumo-app-expo`, animations on the UI thread, Hermes +
New Architecture. Verified on the iPhone 17.

**Lynx** (`example-projects/lumo-app-lynx`): ReactLynx + `@lynx-js/lynx-ui`, the
official *headless* UI — the same shape as rn-primitives — under Lumo's
contract, tokens generated from `tokens.css` as Lynx CSS variables, RTL from CSS
`direction` (inheritable by config), the same screen. Ran in the prebuilt
LynxExplorer on the same simulator (no build). Measured:

| Axis | RN + Lumo | Flutter + lumo_ui | Lynx + lumo (lynx-ui) |
|---|---|---|---|
| AI writing components | 8 | 8 | 7 — React with Lynx elements (`<view>/<text>`) and CSS; a few surprises (no child combinator, no `oklch()`, overlays need their `*View`, console only in DevTool) |
| AI proving them | 9 | 6 | 5 — no served bytes, no semantics-tree tester yet; the probe had to render on screen |
| AI running them | 6 | 5 | 8 — Explorer is Lynx's Expo Go; `pnpm dev` + one `openurl`, sub-second rebuilds |
| Shared with the web | 9 | 3 | 7 — React + CSS + TypeScript; `@lumo-ui/core` would run (PrimJS passed the whole Intl probe, `Intl.Locale` included) but the DOM-based pieces (Base UI, gate) do not |
| Maintainability | 7 | 6 | 5 — young ecosystem (lynx-ui 3.x, 4.0 core), Lynx CSS dialect, ByteDance-driven cadence |
| RTL | 6 (app-level mirroring) | 9 | 8 — CSS `direction` per subtree, logical properties, `enableRTL` on the sheet |
| i18n / digits / calendar | 6 | 9 | 9 — Persian digits, Persian calendar, `Intl.Locale` all present on device |
| Accessibility depth | 7 | 7 | 5 — `accessibility-*` attributes exist; less documented, untested with VoiceOver here |
| Ecosystem for our needs | 7 | 6 | 4 — 17 headless primitives, no calendar/combobox, thin third-party world |
| Look parity | 8 | 7 | 8 — same tokens as CSS variables; text is the platform's |
| Runtime maturity / risk | 8 | 9 | 5 — 4.0.1, decision §12's tripwire still applies |
| **Overall (Telarsa)** | **7.6** | **6.9** | **6.4** |

Verdict unchanged — React Native / Expo stays the mobile line — but Lynx is the
more interesting runner-up than Flutter for *this* library: it is React + CSS,
its runtime's Intl is complete, and its headless kit has the right shape; what
it lacks is maturity, proof surfaces and an ecosystem. `lumo-app-lynx` stays as
the tripwire decision §12 asked for.

## Full review after the owner's challenge (later, 16 Aug 2026)

The owner pushed back: Lynx supports Tailwind, its runtime is mature (the
ecosystem is young), it looks better under RTL and is faster; are the other
Lynx scores right; is accessibility right; could a *better* library be built on
Lynx than on Expo; and how many prebuilt headless components exist per stack.
Re-scored with what was verified today, and honest about what was not measured.

### Corrections to the Lynx column
- **Runtime maturity: 5 → 8.** The engine has run in TikTok-scale production
  for years; what is young is the open-source *ecosystem* (lynx-ui 3.x since
  2026, `@lynx-js/react` 0.x). Ecosystem stays 4.
- **Styling / shared with web: 7 → 8.** Tailwind is officially supported
  (rspeedy styling guide) — Lumo's Tailwind class strings could style Lynx
  components with a Lynx preset, within Lynx's CSS subset (no `oklch()`, no
  child combinators, no cascade layers). React + TypeScript + `@lumo-ui/core`
  (PrimJS passed the whole Intl probe, `Intl.Locale` included) carry over; Base
  UI and the served-HTML gate do not.
- **RTL: 8 → 9.** CSS `direction` per subtree, inheritable; logical
  properties; the sheet's `enableRTL`. Same tier as Flutter, above RN's
  app-level mirroring.
- **Performance: added a row.** Lynx's dual-thread design (main-thread script
  for gestures/animation, instant first frame) is architecturally ahead of
  Hermes+JS-thread React Native and comparable to Flutter's; RN closes part of
  the gap with the New Architecture and Reanimated worklets. **Not measured
  here** — the twin app is one screen; no numbers were taken on any stack.
  Scored on architecture: RN 7, Flutter 9, Lynx 9.
- **AI proving: 5 → 6.** A ReactLynx Testing Library exists (Testing-Library
  API); still no served bytes and no semantics-tree tester.
- **Accessibility: 5 → 4, and this is the material finding.** Lynx documents
  `accessibility-element`, `accessibility-label`, `accessibility-trait` with
  traits **image | button | text only**, `accessibility-elements` (order),
  `accessibilityAnnounce`, `requestAccessibilityFocus`. There is no way to
  express a SWITCH with a checked state, a dialog role, an expanded/disabled
  state, or a value — the things Lumo's contract exists to announce. The
  `accessibility-value`/`-status` attributes the twin uses are undocumented and
  likely ignored. Until Lynx grows roles and states, a Persian-first accessible
  library cannot honestly ship on it. RN (`role`, `aria-*`, `accessibilityState`,
  UIKit/Compose controls) and Flutter (`Semantics` with flags/values/actions)
  both can — with the caveat that **no screen reader was run on any stack
  today**; those two scores stay 7 as static-semantics-verified, runtime-unverified.

### Revised table (RN · Flutter · Lynx)
| Axis | RN + Lumo | Flutter + lumo_ui | Lynx + lumo |
|---|---|---|---|
| AI writing components | 8 | 8 | 7 |
| AI proving them | 9 | 6 | 6 |
| AI running them | 6 | 5 | 8 |
| Shared with the web (code, tokens, docs, gate) | 9 | 3 | 8 (Tailwind + core + React; not Base UI, not the gate) |
| Maintainability | 7 | 6 | 6 |
| RTL | 6 | 9 | 9 |
| i18n / digits / calendar | 6 | 9 | 9 |
| Accessibility (static verified; runtime unverified everywhere) | 7 | 7 | 4 (roles/states missing) |
| Ecosystem for our needs | 7 | 6 | 4 |
| Look parity | 8 | 7 | 8 |
| Performance (architecture, unmeasured) | 7 | 9 | 9 |
| Runtime maturity / risk | 8 | 9 | 8 |
| **Overall** | **7.4** | **7.0** | **7.2** |

### Could a better library be built on Lynx than on Expo?
On RTL, i18n, performance and CSS/Tailwind sharing — plausibly yes, and the
twin was written faster than the RN one. On what Lumo is *for* — announced,
correct UI in Persian — **not today**: the accessibility model has no roles or
states beyond button/image/text. That is disqualifying for the contract, not a
style preference. Second-order costs: 17 headless primitives vs the RN/Flutter
worlds, no Expo-class module ecosystem (camera, auth, OTA), few people and
fewer AI training examples, ByteDance-driven cadence. So: RN stays; Lynx is
the runner-up to re-check when its accessibility surface grows (the tripwire
of decision §12, now concrete: "roles and states"). Keep `lumo-app-lynx`.

### Prebuilt headless components, per stack (16 Aug 2026)
| Stack | Headless (unstyled, accessible primitives) | Styled kits built on them | Notes |
|---|---|---|---|
| React Native | **@rn-primitives: 17** (accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, select, separator, slider, switch, table, tabs, toast, toggle, toggle-group, toolbar, tooltip — 28 packages incl. internals; 17 verified on npm at 1.5.x plus the rest) | React Native Reusables (~40, NativeWind), gluestack-ui v2 (~40), Tamagui (~40, some unstyled) | no calendar, combobox, number field |
| Flutter | Not a headless culture: the `widgets` layer *is* the primitives (RawMaterialButton, GestureDetector, FocusableActionDetector, Semantics…) | Material 3 (~60 widgets), Cupertino (~30), shadcn_flutter (~70), forui (~50) | everything ships styled; theming by tokens works, as `lumo_ui` showed |
| Lynx | **@lynx-js/lynx-ui: 20** (button, checkbox, dialog, draggable, feed-list, form, input, input-otp, lazy-component, list, popover, presence, radio-group, scroll-view, sheet, slider, sortable, swipe-action, swiper, switch) | none public yet | official, Apache-2.0; overlays need their `*View` wrappers |
| Web (reference) | Base UI ~30 · Radix ~30 · React Aria Components ~45 | shadcn/ui, Lumo | |
