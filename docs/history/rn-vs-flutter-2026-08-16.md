# React Native (Expo) vs Flutter for Lumo — the two-project experiment, 16 Aug 2026

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
