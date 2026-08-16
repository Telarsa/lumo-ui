# `packages/native` — `@lumo-ui/native`, and its gate

**Status (16 Aug 2026): STARTED by owner decision, gate still open.** The owner
asked for a first component — a Button — visible on the docs site, before the
Hermes ICU probe below has run on a device. So this package now holds:

- `src/tokens.ts` — GENERATED from `packages/theme/src/tokens.css` by
  `scripts/build-native-tokens.mjs` (`gate:native-tokens` fails on drift): the
  same `--lumo-sys-*` semantic tokens as hex for light and dark, radii and
  control heights in dp, brand hue/chroma as the one runtime knob.
- `src/provider.tsx` — `LumoNativeProvider({ locale, brand, fonts, colorScheme })`:
  direction derived from the locale, never passed; it does not call
  `I18nManager.forceRTL` (an app-level, next-launch switch — the app's decision).
- `src/button.tsx` — `Button` / `IconButton` on `Pressable` + `Text`, the web
  button's contract: four variants, three sizes on the shared control scale,
  `isDisabled` announced through `accessibilityState`, children typed `LumoNode`
  (a raw number does not compile), `IconButton.label` REQUIRED.
- Tests: rendered through **react-native-web** to static markup and graded by
  the same 14 served-HTML rules as the web (0 violations under fa-IR); a
  `.type-test.tsx` pins the contract. `gate:consumer-lint` and
  `gate:consumer-profile` cover this package too.
- The docs site previews it (`/docs/native/`) through react-native-web inside a
  phone `Frame`, and says on the page that a browser rendering is not a device
  run. Measured there: RNW renders our `role="button"` Pressable as a real
  `<button type="button">` with `aria-disabled`, `aria-label` and
  `direction: rtl` on the text — so for THIS component the concern below that
  RNW yields roleless markup did not materialise; it remains the reason the
  library is not BUILT on RNW.

### The first device run — iOS simulator, debug (Expo Go), 16 Aug 2026

`example-projects/lumo-native-probe` (Expo SDK 57.0.13, React Native 0.86.2,
Hermes; iPhone 16 simulator, iOS 18.5) — the app imports `@lumo-ui/core` and
`@lumo-ui/native` from this repository as git dependencies and runs the probe
on the device. Metro's log line, verbatim:

```
LUMO_ICU_PROBE {"platform":"ios","version":"18.5","hermes":true,"pass":false,"checks":[
  {"id":"intl-present","pass":true,"actual":"true","expected":"true"},
  {"id":"direction","pass":false,"actual":"(threw: TypeError: undefined cannot be used as a constructor.)","expected":"rtl"},
  {"id":"digits","pass":true,"actual":"۱۲۳۴","expected":"۱۲۳۴"},
  {"id":"calendar","pass":true,"actual":"مرداد","expected":"مرداد"},
  {"id":"calendar-not-gregorian","pass":true,"actual":"۱۴۰۵ (→ 1405)","expected":"۱۴۰۵ (→ 1405), and never 2026"}]}
```

Reading it against the outcome table below: **digits and calendar PASS** — the
two outcomes that would have changed the plan's shape did not happen;
`formatNumber` and `formatDate` are the same code on web and device.
**Direction FAILS in the cheapest way:** this Hermes has no `Intl.Locale` at all
(not just no `getTextInfo`). And it failed harder than the table predicted:
`@lumo-ui/core`'s `direction()` called `new Intl.Locale()` unguarded and the
native provider evaluated it at module scope, so the first launch died with
`[runtime not ready]: TypeError: undefined cannot be used as a constructor`
before its first frame. Fixed the way the table said: `direction()` asks the
platform inside a guard and falls back to the hand-kept map; nothing in
`@lumo-ui/native` runs platform code at import time; the probe now names the
outcome (`no Intl.Locale`) instead of a raw TypeError. With that, the buttons
rendered on the simulator (screenshot in the session's evidence): four variants,
three sizes, the named icon button, disabled; text RTL; row order LTR because
the app never called `I18nManager.forceRTL` — the app-level switch, as
`provider.tsx` documents.

Still open: the **release-build** row (minification, `resConfigs`, language
splits) and an **Android emulator** run — Android Studio is not on the
development machine. Until those run, the claim is limited to "iOS 18.5 debug
Hermes: digits and calendar hold; direction needs the table."

The next component should be direction-sensitive (`Switch` /
`SegmentedControl`), for the reason step 4 below gives.

Provisional toolchain decision: plain `StyleSheet` over generated tokens, no
NativeWind (nothing in a button needed class strings, and NativeWind's install
is large). Revisit at the second component.

---

The original gate-first argument, kept verbatim because it still holds:

## The gate, and why it comes first

Lumo's entire claim rests on three properties of the runtime's `Intl`:

| property | what the library calls | what it needs |
| --- | --- | --- |
| direction | `direction(locale)` | `Intl.Locale("fa-IR").getTextInfo().direction === "rtl"` |
| digits | `formatNumber` | the `-u-nu-arabext` extension actually produces ۱۲۳ |
| calendar | `formatDate` | the `-u-ca-persian` extension actually produces مرداد ۱۴۰۵ |

On a browser these are Baseline and the library takes them for granted. On React
Native they are a question — Hermes shipped for years with no `Intl` at all,
Android builds back it with the platform's own ICU (whose completeness varies by
OS version and by whether the app was built against a trimmed ICU), and iOS
bridges to Foundation rather than to ICU proper.

The failure that matters is not a crash. **A runtime can answer
`Intl.DateTimeFormat` truthy and silently ignore `-u-ca-persian`**, returning a
Gregorian date in Persian script: «۲۲ ژوئیه ۲۰۲۴» for a day Iran calls «۱ مرداد
۱۴۰۳». Right script, right digits, wrong calendar, wrong year, and green on every
other check. `calendar-not-gregorian` in the probe exists for exactly that, and
it asserts the year NEGATIVELY — a Jalali year can never equal a Gregorian one,
which is a fact no formatting bug can fake.

### Running it

Dependency-free and framework-free on purpose — no React, no Expo, no test
runner — so it can be pasted into a bare RN app's entry file or run in a Hermes
REPL.

```
node --experimental-strip-types packages/native/src/icu-probe.ts
```

On Node — a full-ICU runtime — it reports:

```
lumo icu probe — PASS
  ok   intl-present            got "true"
  ok   direction               got "rtl"
  ok   digits                  got "۱۲۳۴"
  ok   calendar                got "مرداد"
  ok   calendar-not-gregorian  got "۱۴۰۵ (→ 1405)"
```

Node is the control. **What decides the spike is a run under Hermes**, and the
axis that matters is the BUILD, not the hardware — an earlier draft of this file
asked for four physical handsets, which was wrong and would have sent someone
hunting for phones to answer a question a build flag decides.

Everything that strips locale data is build-time and reproduces on an emulator:

- Hermes compiled without its `intl` flag;
- R8 / ProGuard minification and resource shrinking in a release variant;
- `resConfigs` in `build.gradle` pruning locales;
- Play App Bundle **language splits** — the locale the split does not carry is
  the locale the user does not get.

So:

| run | what it settles | blocking? |
| --- | --- | --- |
| emulator / simulator, debug | does the engine honour the extensions at all | **yes — do this first** |
| emulator, **release** build | minification, `resConfigs`, language splits | **yes** |
| iOS simulator | Foundation-backed `Intl` on iOS | yes, and sufficient |
| one real Samsung or Xiaomi | OEM-modified ICU, and Mainline drift | one run for confidence, not a gate |

The last row is the only one that genuinely wants hardware, and the reason is
narrow: OEMs ship their own locale data, and since Android 12 ICU is an
updatable Mainline module (`com.android.i18n`), so an updated handset can differ
from a stock emulator image in either direction. For this product's market that
means Samsung and Xiaomi specifically.

An emulator image is the AOSP baseline for its API level. That is the right
thing to gate on; the handset is the thing to sanity-check against once.

### What each outcome means

| outcome | consequence |
| --- | --- |
| all pass | `@lumo-ui/core` runs unchanged. The shared-math plan holds: `formatNumber`, `formatDate`, `direction` and `FORMAT_LOCALE` are the same code on web and native, and only the COMPONENTS are per-platform. |
| calendar fails | The plan changes shape. `formatDate` needs a native implementation over `@internationalized/date`, which carries its own calendar arithmetic with no React and no Intl dependency — already a dependency here, and `calendar-datelib.ts` already proves the pattern. Cost: real, bounded. |
| digits fail | Worse. Digits are everywhere and `formatNumber` runs per table cell. A numeral map is possible, but the library's rule (`core/src/format.ts`) is that the map is built by ASKING Intl — which is what would be unavailable. This needs a decision, not a workaround. |
| direction fails | Cheapest and least likely: a two-entry table. `direction()` asks the platform only to avoid a stale hand-kept map; on a runtime that cannot answer, a map is the honest fallback. |
| `Intl` absent | The spike stops. `@formatjs/intl-*` is ~400KB before locale data, and the bar for a runtime dependency here is "owning it must fix a defect". That is its own decision, recorded, before any component work. |

## What is already established, and needs no further investigation

Recorded so the next person does not re-derive it.

**There is no cross-platform headless accessibility engine.** Measured, not
assumed:

- `@zag-js/react` and `@react-stately/*` both peer-depend on `react-dom`.
- Base UI is DOM-only — its whole value here is the `data-*` state attributes it
  writes onto DOM elements.
- The "universal" libraries work through `react-native-web`, which is the wrong
  direction for Lumo: RNW emits `<div>` for everything, so a library built on it
  produces exactly the unnamed, roleless markup `lumo-gate` exists to fail.

**Therefore: shared math in `@lumo-ui/core`, per-platform components.** There is
no third option that preserves the accessibility guarantee, and the guarantee is
the product.

**Lynx is not being taken.** `DECISIONS.md` §12 records why, with its tripwire.

**`Frame device="phone"`** already exists in `packages/ui`, so native results can
be shown on the website inside a bezel without a second mechanism.

## The order of work, once the gate is green

1. Confirm the gate on the runs in the table above — the two emulator rows are
   the blocking ones. Paste the reports into this file verbatim: the outputs are
   the evidence, and a summary of them is not.
2. Decide the toolchain. Expo + NativeWind is the working assumption and is not
   settled; NativeWind in particular buys Tailwind-shaped class strings, which
   matters for `shadcn migrate rtl` only if the RTL transform is taught to walk
   them. Check that before committing to it.
3. Port `@lumo-ui/core` — which, if the gate is green, is a re-export and a
   `package.json`, not a port.
4. ONE component, end to end, chosen because it is direction-sensitive and
   small. `switch` or `segmented-control`. Not `button`: a button that renders
   proves nothing about the thing this library is for.
5. Only then decide whether there is a library here.

## Standing constraints that apply to this directory

- **No paid services.** The blocking runs are an emulator and a simulator, both
  free; the optional handset run is a phone and a cable. Nothing here needs a
  device farm.
- **Low RAM and disk.** Expo's install is large; do not add it until step 2 is
  actually being started, and remove it if the spike is parked.
- **React Native / Expo, never Flutter.**
