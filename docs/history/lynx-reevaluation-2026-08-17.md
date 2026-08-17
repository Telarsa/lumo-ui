# Lynx re-evaluated against §30 — 17 Aug 2026

**The code is gone; this is what it proved.** The owner asked what building the
Khroos Flutter app in Lynx would actually be like and where the limits are, then
— given the answer — had the slice deleted. The same disposal as the August
removal: the findings stay, the code goes to nothing (it was never merged into
this repo; it lived in `example-projects/lumo-app-lynx`).

Decision §30 set the bar for revisiting Lynx: "re-evaluated only if it ships
accessibility roles/states and the `<list>` bug is gone". This run tested both.
The `<list>` bug did NOT reproduce. The roles/states did not arrive — the
vocabulary grew, the structure did not — so the bar is not met and §30 stands.

Two of the August findings are now out of date and are corrected below: the
trait vocabulary is larger than the docs describe, and `Intl` IS present on iOS.
Both corrections make the case against Lynx narrower and better evidenced, not
weaker.

---

# What current Lynx can and cannot do for Lumo

A vertical slice of the Khroos app, rebuilt in Lynx to find out where the
platform stops being able to carry a Persian-first, RTL, accessible component
library — and to replace the August evaluation's conclusions with measurements.

**What was built.** `create-rspeedy` 0.16.4 · `@lynx-js/react` 0.124.0 ·
`@lynx-js/types` 4.1.0 · Lynx engine 4.0 (`SystemInfo.engineVersion`). A
ten-component "Lumo for Lynx" (`src/lumo/components/`), the auth flow (splash →
phone → OTP), the customer home, the provider dashboard, a tab bar, the
2,000-row bench ported from `lumo-app-flutter/lib/bench.dart`, and a platform
probe screen. ~4,000 lines, of which 493 are generated (`tokens.css`,
`data.g.ts`, `i18n.g.ts`). `npm run build` succeeds for both the `lynx` and the
`web` environment; `tsc --noEmit` is clean.

**What it was run on.** iPhone 17 simulator, iOS 26.5, LynxExplorer 4.0.0 —
real, and the screenshots in `evidence/` are of it. Also Lynx for Web 0.24.1 in
headless Chrome, which is the only Lynx runtime whose accessibility tree can be
read programmatically on this machine. **Android was not run at all**, and
several findings below turn on that gap; they say so.

**Where every claim came from.** `evidence/README.md` lists each artefact and
the command that produced it. Anything not in `evidence/` and not quoted from a
source file is marked *unverified*.

---

## The short version

Two things changed since August, and one did not.

1. **The trait vocabulary is bigger than the docs say.** `lynxjs.org` documents
   `accessibility-trait` with four values (`none | button | image | text`).
   `@lynx-js/types` 4.1.0 ships fifteen, including `selected`, `disabled`,
   `header`, `link`, `search`, `adjustable` and `tabbar` — and four attributes
   the docs do not mention at all, among them `accessibility-value` and
   `accessibility-role-description`. The August evaluation's "image|button|text,
   no roles, no states" is out of date as a description of the *surface*.
2. **`Intl` is present on iOS.** The docs say flatly that "the `Intl` API is not
   implemented in Lynx". On iOS it is, completely — because Lynx runs
   JavaScriptCore there, and JSC carries ICU. `Intl.DateTimeFormat('fa-IR')`
   returns «۲۶ مرداد ۱۴۰۵» on the device. This is a *platform-dependent*
   capability, which for a library is worse than a uniform absence.
3. **The wall is in the same place.** The bigger vocabulary is still a
   single-valued enum with no state channel. A switch still cannot say it is on.
   A tab still cannot be both selected and pressable. A field still cannot say
   it is invalid, and its error message still cannot be bound to it. And on the
   web target, the whole vocabulary is inert: 378 accessibility-tree nodes, zero
   with a role.

The verdict from August stands, for a narrower and better-evidenced reason.

---

## A. Accessibility — the decisive axis

### A.1 What the platform actually accepts

`@lynx-js/types` 4.1.0, `types/common/props.d.ts`, lines 78–176 — the full
`accessibility-*` surface on `StandardProps` (so: on every element):

| attribute | type | doc'd on lynxjs.org? | the spec it links to |
|---|---|---|---|
| `accessibility-element` | `boolean` | yes | iOS `isAccessibilityElement`, Android `setImportantForAccessibility` |
| `accessibility-label` | `string` | yes | iOS `accessibilityLabel`, Android `setContentDescription` |
| `accessibility-traits` | one of 15 strings | **partly** — docs name it `accessibility-trait` and list 4 values | iOS `accessibilityTraits` |
| `accessibility-value` | `string` | **no** | iOS `accessibilityValue`, Android `setStateDescription` |
| `accessibility-heading` | `boolean` | **no** | Android `setHeading` (Android only) |
| `accessibility-role-description` | `'switch'\|'checkbox'\|'image'\|'progressbar'\|string` | **no** | Android `setRoleDescription` (Android only) |
| `accessibility-actions` | `string[]` | **no** | iOS custom actions, Android `addAction` |
| `accessibility-elements` | `string[]` | yes | focus order |
| `accessibility-elements-hidden` | `boolean` | yes | — |
| `accessibility-exclusive-focus` | `boolean` | yes | focus trap |
| `ios-platform-accessibility-id` | `string` | yes | iOS only |

The fifteen trait values, verbatim from the type:

```
'text' | 'image' | 'button' | 'link' | 'header' | 'search' | 'selected'
| 'playable' | 'keyboard' | 'summary' | 'disabled' | 'updating'
| 'adjustable' | 'tabbar' | 'none'
```

So: `accessibility-value` and `accessibility-role-description` **do exist** — as
declarations, with links to the real native APIs. `accessibility-status`, which
the earlier evaluation suspected, **does not exist anywhere**: not in the types,
not in the docs (0 occurrences across `llms-full.txt` for EN stable, EN next and
ZH), not in the web runtime's source.

### A.2 The first wall: the trait is one value, not a set

Its own doc comment calls it "the **combination** of accessibility traits that
best characterizes the accessibility element". The type admits exactly one:

```
$ npx tsc --ignoreConfig --noEmit --strict --jsx react-jsx \
    --jsxImportSource @lynx-js/react --types @lynx-js/rspeedy/client \
    evidence/a11y-type-probe.tsx

accessibility-traits='button'          OK — type-checks clean
accessibility-traits='button selected' error TS2322: Type '"button selected"' is not
                                       assignable to type '"search" | "link" | "text" |
                                       "image" | "button" | "header" | "selected" | …
```

There is no `checked`, no `expanded`, no `busy`, no `invalid`, no `required`,
and no level for `header`. `selected` and `disabled` exist but only by *taking
the place of* `button` — a selected tab announces "selected" and stops
announcing that it can be tapped; a disabled button announces "disabled" and
stops announcing that it is a button.

### A.3 The second wall: the compiler will not tell you

Same probe run, one attribute per file:

```
accessibility-trait='button'            OK — type-checks clean   ← the docs' own spelling. Wrong. Silent.
accessibility-status='checked'          OK — type-checks clean   ← does not exist. Silent.
accessibility-checked={true}            OK — type-checks clean   ← does not exist. Silent.
accessibility-live-region='polite'      OK — type-checks clean   ← does not exist. Silent.
totally-made-up='x'                     OK — type-checks clean   ← invented on the spot. Silent.
```

TypeScript does not excess-property-check a JSX attribute whose name is not a
valid identifier, so every hyphenated attribute is unchecked. `ViewProps` is a
closed interface with no index signature — it makes no difference. The one
attribute in the list that is spelled the way the *documentation* spells it
(`accessibility-trait`) is also the one that silently does nothing.

And the runtime does not tell you either. Every one of those attributes survives
the compiler, the bundler and the runtime and lands on the element unchanged
(`evidence/web-probes.json`, from the built bundle running in Chrome):

```html
<x-view id="probe-status"          accessibility-element="true" accessibility-label="status"         accessibility-status="checked">
<x-view id="probe-trait-singular"  accessibility-element="true" accessibility-label="trait-singular" accessibility-trait="button">
<x-view id="probe-invented"        accessibility-element="true" accessibility-label="invented"       totally-made-up="x">
```

`totally-made-up` gets exactly the treatment `accessibility-label` gets. There
is no validation anywhere in the chain. **This is the finding that matters most
for a library**: a Lumo component that silently stopped announcing state would
pass `tsc`, pass `npm run build`, and ship.

### A.4 The third wall: on Lynx for Web, none of it does anything

`@lynx-js/web-elements` 0.12.8 contains **zero** occurrences of the string
`accessibility` and zero of `aria` (the `aria` grep hits are inside the word
"variable"). Nothing maps the attributes to ARIA or to a role.

Chrome's own accessibility tree over the built bundle
(`evidence/web-axtree-summary.txt`):

```
total AX nodes: 378
role histogram: { RootWebArea: 1, none: 70, generic: 177, StaticText: 62, InlineTextBox: 68 }
nodes with an interactive or structural role: 0
focusable nodes: 1 (the RootWebArea itself)
```

A screen with three buttons in a tab bar, eight category buttons, four chips, a
text field and five headings produces **no buttons, no headings, no tabs, and
one focusable node — the document**. `accessibility-elements-hidden="true"` also
does nothing: the text under a named button is still exposed as `StaticText`, so
a reader would get it twice if it got it at all.

This is not a Lumo bug and not a build misconfiguration; it is the web runtime
having no accessibility layer. `lynx.accessibilityAnnounce` is likewise
documented `Web ❌ No`.

### A.5 What is verified on iOS, and what is not

Verified on the device (`evidence/ios-runtime-report.txt`):

```
SystemInfo.platform      = iOS
SystemInfo.runtimeType   = jsc
SystemInfo.engineVersion = 4.0
lynx.accessibilityAnnounce   = function
lynx.createSelectorQuery     = function     (requestAccessibilityFocus goes through this)
lynx.getElementById          = function
```

**Unverified, and it is the thing a reader would most want verified:** whether
`accessibility-value` and `accessibility-role-description` actually reach
`UIAccessibility` / `AccessibilityNodeInfo` at runtime. Reading the iOS
accessibility tree needs VoiceOver or Xcode's Accessibility Inspector driven
through the simulator's UI, and this machine cannot grant a terminal
accessibility permission (`System Events got an error: osascript is not allowed
assistive access. (-1728)`), so no tap or inspector query could be scripted. No
screen-reader result is claimed anywhere in this document.

What *is* known about those two attributes: they are declared with links to the
correct native APIs, they are absent from the documentation, `accessibility-heading`
and `accessibility-role-description` are marked `@Android` only, and on the one
runtime that could be inspected they do nothing at all.

### A.6 The per-component contract table

"Flutter announces" is read from `lumo-ui/packages/mobile/lib/src/*.dart` and the
Khroos wrappers in `lumo-app-flutter/lib/khroos/ds/ds.dart`. "Lynx expresses" is
what `src/lumo/a11y.ts` was able to emit; the audit column is the count this app
actually produced on the device, from `evidence/ios-runtime-report-*.txt`.

| component | Flutter / web announces | Lynx can express | lost |
|---|---|---|---|
| **Button** | name · role `button` · `enabled` · busy | name · trait `button` | disabled and busy have no channel; both are folded into `accessibility-value` as Persian prose. Observed: `a11y.Button = x2 role=button foldedIntoName=[disabled]` on the OTP screen |
| **IconButton** | name · role `button` | name · trait `button` | nothing (the icon carries no name by construction) |
| **Switch** | name · role `switch` · **`toggled: isSelected`** · `enabled` (`packages/mobile/lib/src/switch.dart:46-49`) | name · trait `button` · `accessibility-role-description: 'switch'` (Android only) | **the state.** No `checked`. A reader is told the same thing whether the switch is on or off unless the app writes «روشن»/«خاموش» into `accessibility-value` — which is prose the screen reader cannot translate, cannot pronounce with its own switch vocabulary, and which brings no swipe-to-adjust gesture. On iOS even the role hint is gone. |
| **TextField** | name · `textField: true` · value · `hint` carrying description + `errorMessage` (`text_field.dart:52-55`) | name · trait `keyboard` ("keyboard key" — the nearest thing to a textbox) · the last-seen value via `accessibility-value` | role · `invalid` · `required` · **the binding between the field and its error**: there is no `aria-describedby`, no `aria-errormessage`, no labelled-by of any kind. The error is a sibling `<text>` a reader reaches only by swiping past. Also: Lynx `<input>` has `default-value`, not `value` (`types/common/element/input.d.ts`), so it is uncontrolled and the announced value is whatever `bindinput` last reported. |
| **OtpField** | group name · per-cell «رقم ۲ از ۵» · value · error | group name · per-cell name · digit via `accessibility-value` | the cells are `<view>`s, not focusable inputs, because `<input>` cannot be driven cell-by-cell without a controlled value; position-in-set is hand-written into every cell's label (`cellLabel` is a required prop for that reason) |
| **Chip** | name · role `button`/`option` · `selected` | name · **either** trait `button` **or** trait `selected` | the two cannot coexist. Lumo keeps `button` and folds selection into `accessibility-value`. |
| **Card** | name · role `button` when tappable | name · trait `button` | nothing — one of three components the platform carries completely |
| **Avatar** | name, or excluded | name · trait `image`, or `accessibility-elements-hidden` | presence/online state has no channel |
| **Tabs** | `role: SemanticsRole.tabBar` · per tab `role: tab` · `selected` · `enabled` · `value: badge` (`packages/mobile/lib/src/tabs.dart:77-81,150-155`) | bar: trait `tabbar` · selected tab: trait `selected` · other tabs: trait `button` | **the `tab` role itself** (not in the vocabulary) · position in set (hand-written: `positionLabel` is required) · the selected tab loses `button`. Observed: `a11y.Tabs.tab(selected) = x1 role=tab foldedIntoName=[selected]` |
| **Badge** | name, non-interactive | name · trait `none`/`text` | nothing — carried completely |

Three of ten components survive intact: Button (minus its states), Card, Badge.
The two that carry the most state — Switch and Tabs — lose it, and TextField
loses the relationship that makes an error message useful.

### A.7 What Lumo had to do about it

`src/lumo/a11y.ts` is the single place an `accessibility-*` prop is produced.
It exists so the gap is visible in one file instead of scattered through ten
components, and it does two things:

- hands the platform the single best trait it can take, and
- keeps the states the platform cannot express, folding each into
  `accessibility-value` **only if the caller supplied a localised word for it**.

That last clause is the reason `Switch` has required `onLabel`/`offLabel` props,
`Tabs` has a required `selectedLabel` and `positionLabel`, and `Button`'s
`disabled` prop is `{ is: true; label: string }` rather than a boolean. It is
not good API design. It is the shape the platform forces: a state that has no
channel becomes part of the *name*, the name is Persian, and a default would be
English — which is the exact defect Lumo exists to prevent. Every one of those
folds is recorded by `a11yAudit()` and printed by the probe screen, so the app
can always be asked what it lost.

---

## B. RTL

### B.1 Direction comes from the app, and only from the app

`SystemInfo` carries `platform, pixelRatio, pixelWidth, pixelHeight,
lynxSdkVersion, engineVersion, theme, osVersion, runtimeType` — read off the
device, `evidence/ios-runtime-report.txt`:

```
SystemInfo.keys           = platform,pixelRatio,pixelWidth,pixelHeight,lynxSdkVersion,engineVersion,theme,osVersion,runtimeType
SystemInfo.hasLocaleField = false
```

There is no language tag anywhere in the runtime. The only automatic behaviour
Lynx has is `direction: normal` (the default), which infers *text* direction
from the characters in the string — not from the reader. So the app owns the
locale and `LumoRoot` is the one place that turns it into a `direction` style
(`src/lumo/root.tsx`). No component takes a `dir` prop; Lumo rule 2 survives
intact, and for once the platform made it easy.

### B.2 `direction` does not cascade unless you turn cascading on

This is the finding that would have bitten a real port silently.

Lynx does not inherit ordinary CSS properties by default. `direction` is on the
inheritable list, but only once `enableCSSInheritance` is set in
`pluginReactLynx`. Without it, `LumoRoot`'s single `direction: rtl` reaches
nothing, and every `margin-inline-start` / `padding-inline-end` in the app
resolves LTR.

The failure mode is not a crash and not a warning. It is this, same screen, one
flag apart:

- `evidence/ios-home.png` — page padding on both sides, location pill at the
  inline start (right), bell at the inline end (left), tab bar reading
  خانه · کسب‌وکار · گزارش سکو right-to-left.
- `evidence/ios-home-no-css-inheritance.png` — text still renders right-to-left
  (because `direction: normal` infers it from the Persian characters), so the
  screen still *looks* Persian; but the inline padding is gone on the right and
  doubled on the left, the pill is flush to the screen edge, the chips have lost
  their gaps, the provider card is clipped, and **the tab bar is in the reverse
  order**.

A screen that looks Persian and is laid out LTR is exactly the silent RTL defect
a screenshot cannot catch. The flag is one line in `lynx.config.ts`; it is
load-bearing for the entire RTL story, and nothing in the toolchain says so.

### B.3 Only half the logical box model exists

The inline axis is there and works: `margin-inline-start/end`,
`padding-inline-start/end`, `border-inline-start-*`, `inset-inline-start/end`,
plus Lynx's own `relative-align-inline-start/end`.

The block axis is not. Writing the stylesheet the way the web wants it produced
73 warnings in one build (`evidence/css-unsupported-block-axis.txt`):

```
  19 ⚠ Unsupported property "margin-block-start" was removed during template encode.
  17 ⚠ Unsupported property "padding-block-end" was removed during template encode.
  13 ⚠ Unsupported property "padding-block-start" was removed during template encode.
   8 ⚠ Unsupported property "margin-block-end" was removed during template encode.
   3 ⚠ Unsupported property "border-block-start-width" …
   …
   1 ⚠ Unsupported property "inset-block-start" …
```

They are **warnings**, not errors: the build succeeded and shipped a stylesheet
with its vertical rhythm silently deleted. Nothing is actually lost by using
`margin-top` — the block axis does not mirror in a horizontal writing mode — but
the failure mode is the same one as B.2: a correct-by-the-web-spec stylesheet
degrades quietly rather than failing loudly. `src/lumo/lumo.css` and
`src/khroos/khroos.css` are therefore logical on the inline axis and physical on
the block axis, with a comment saying why.

### B.4 What had to be hand-rolled

Very little, and this is a genuine strength. The switch knob travels along the
inline axis with a logical margin and mirrors for free:

```css
.lumo-switch__knob--on { margin-inline-start: 18px; }
```

Mixed-direction runs — a phone number, an OTP code, a price, a row index inside
a Persian sentence — are a `direction` style on the inline `<text>` run, and they
nest inside a `<text>` correctly (`src/khroos/screens/Otp.tsx`):

```tsx
<text className='k-lead'>
  {t('کد پنج‌رقمی پیامک‌شده به ')}
  <text className='k-strong' style={{ direction: 'ltr' }}>{shown}</text>
  {t(' را وارد کنید. ')}
</text>
```

The English build is the mirror of the Persian one with no per-locale code:
`evidence/ios-home.png` against `evidence/ios-home-en.png`.

One more trap, unrelated to RTL but found the same way: a Lynx `<view>` does not
lay out as flex unless told to, and a `flex: 1` child of a non-flex parent gets
height 0. The home screen's header drew and its entire scroll region collapsed —
`evidence/ios-home-before.png`. No warning, again.

### B.5 `lynx-rtl` is deprecated

The docs list `direction: normal | lynx-rtl | rtl | ltr`, and mark `lynx-rtl`
`<Deprecated />`: it also flips *physical* properties (`margin-left` ↔
`margin-right`), as a retrofit for LTR-only pages. Lumo never needs it, because
Lumo has no physical inline properties to flip. `rtl` is the correct value and
the one this app uses. Note the web target's own compat row calls `direction`
"⚠️ Partial implementation".

---

## C. Persian text and digits

### C.1 `Intl` is present on iOS — and the docs say it is not

The documentation is unambiguous
(`lynxjs.org/guide/inclusion/internationalization`):

> "Currently, the `Intl` API is not implemented in Lynx but will be supported in
> future versions. If you need to use the `Intl` API in Lynx, you can install
> the corresponding polyfills…"

Read off the running app on iOS 26.5 / LynxExplorer 4.0.0
(`evidence/ios-runtime-report.txt`, produced by `src/probe/report.ts`):

```
SystemInfo.runtimeType                              = jsc
Intl.present                                        = true
Intl.NumberFormat(fa-IR).format(1234567.5)          = ۱٬۲۳۴٬۵۶۷٫۵
Intl.NumberFormat(fa-IR-u-nu-arabext).format(…)     = ۱٬۲۳۴٬۵۶۷
Intl.DateTimeFormat(fa-IR) 2026-08-17               = ۲۶ مرداد ۱۴۰۵
Intl.DateTimeFormat(fa-IR-u-ca-persian)             = ۲۶ مرداد ۱۴۰۵
Intl.Collator("fa").compare("الف","ب")              = -1
Intl.PluralRules("fa").select(2)                    = other
Intl.ListFormat("fa")                               = آب،‏ برق، و گاز
Intl.RelativeTimeFormat("fa").format(-2,'day')      = ۲ روز پیش
Number.toLocaleString("fa-IR")                      = ۱٬۲۳۴٬۵۶۷٫۵
Date.toLocaleDateString("fa-IR")                    = ۱۴۰۵/۵/۲۶
```

Full ECMA-402, including the Persian calendar *by default* under `fa-IR`, the
Persian thousands separator `٬`, the Persian decimal `٫`, and correct Persian
list and relative-time formatting. The reason is in the runtime guide: "iOS: we
use JavaScriptCore by default" — and Apple's JSC ships ICU.

**Android is a different engine and was not tested.** The same guide says
"Android: … we use PrimJS by default", PrimJS is a QuickJS fork, and QuickJS
does not ship ECMA-402. So the documented "not implemented" is most likely true
of Android and false of iOS. *This is unverified* — no Android emulator was run.

For a component library this is the worst of the three possible worlds. If
`Intl` were absent everywhere, Lumo would ship one formatter and be done. If it
were present everywhere, Lumo would use it. Being present on one platform and
(probably) absent on the other means every formatter has to be written twice and
tested twice, and the *shape of the output can differ between platforms for the
same user* — a Persian date could be Jalali on the iPhone and Gregorian on the
Android, from the same source.

### C.2 What Lumo does about it

`src/lumo/format.ts` writes each formatter twice and picks at runtime — and the
probe is not "does `Intl` exist" but "does it actually localise", because an
engine can ship a stub that returns `1,234`:

```ts
INTL_OK = !!I?.NumberFormat && new I.NumberFormat('fa-IR').format(1234) !== '1,234'
```

The engine-free path does grouping with `٬`, decimals with `٫`, digit mapping
across Latin / Persian / Arabic-Indic, and a Jalali conversion (the prototype's
own algorithm) because no engine on the list is required to have
`-u-ca-persian`. On the device both paths agree:

```
lumo.formatNumber(1234567, fa-IR)   = ۱٬۲۳۴٬۵۶۷
lumo.formatNumber(2.4, fa-IR)       = ۲٫۴
lumo.formatDate(2026-08-17, fa-IR)  = ۲۶ مرداد ۱۴۰۵
lumo.toJalali(2026,8,17)            = 1405/5/26
```

Rule 3 ("a bare number is not rendered") could **not** be enforced the way Lumo
enforces it on the web. On the web a bare number in JSX does not compile,
because `LumoNode` narrows the children type. In ReactLynx the JSX namespace
comes from `@lynx-js/react`'s own `jsx-runtime`
(`interface IntrinsicElements extends Lynx.IntrinsicElements`), children are
React's `ReactLynxChildren`, and narrowing them would mean shadowing the
framework's JSX types for the whole app. `<text className='a'>{1234}</text>`
compiles clean under this project's own tsconfig — `evidence/bare-number-probe.md`. The rule is
carried by convention here — every digit in the app goes through `useLumo().n()`
— and by the fact that no component takes a numeric text prop. That is weaker
than the web's guarantee, and it is a real regression, not a stylistic choice.

### C.3 Text rendering

Persian shaping, ligatures and ZWNJ render correctly in the system font
(`evidence/ios-home.png`: «کارت‌به‌کارت», «کسب‌وکار», «نشان‌های شفاف» all with
their ZWNJ joins intact). Mixed-direction rows in the bench —
«ردیف ۹۱ · Item 91» — render with the bidi runs in the right order
(`evidence/ios-bench.png`). No custom font was loaded; `lynx.addFont` is
documented `Web ❌ No`, and loading Vazirmatn was not attempted.

---

## D. Performance, on the bench

**These are iOS *simulator* numbers**, from an Apple-silicon Mac running other
builds concurrently. A simulator has no GPU-thermal behaviour and no real
memory pressure. They are not device numbers and must not be compared directly
against the Flutter twin's device numbers.

`LUMO_START=bench LUMO_AUTO=1 npm run build`, then launched unattended. Raw log:
`evidence/ios-bench.log`, screenshot `evidence/ios-bench.png`.

```
mounted, waiting for first paint (rows: ۲٬۰۰۰)
pipeline.loadBundle:        pipelineStart→paintEnd 372.2 ms
pipeline.reactLynxHydrate:  pipelineStart→paintEnd  62.5 ms
auto: first-frame wall clock 1152 ms since mount
toggle #1..#5: setState returned in 0–1 ms (JS only)
stale-check: 8 visible cells (row-0…row-7), 0 whose item-key does not match its position
scroll: autoScroll 750px/s started (6000px in 8s)
scroll 6000px/8s: 471 rAF callbacks · gap avg 17.0 ms p95 17 ms · gaps >16 ms: 312
scroll: final {"scrollX":0,"maxScrollOffset":127525.33,"scrollY":5748,"scrollRange":128000}
stale-check: 9 visible cells (row-89…row-97), 0 whose item-key does not match its position
```

### D.1 First frame

`pipeline.loadBundle` reports 372 ms from `pipelineStart` to `paintEnd` for a
238 kB bundle mounting a 2,000-row `<list>`; the ReactLynx hydration pipeline
adds 62 ms. The wall-clock number from JS `mount` is 1152 ms, but that includes
the app's own 1 s auto-run delay and is the weaker measurement of the two — the
pipeline entry is the one to quote.

### D.2 Toggle-all

`setState` over 2,000 rows returns in 0–1 ms of JS. **That is not the same
measurement the Flutter twin reports**, and the difference is the point: the
Flutter bench reads `FrameTiming` and gets build and raster milliseconds for the
frame the toggle produced. Lynx has no equivalent. `lynx.performance`'s entry
types are `init`, `metric`, `pipeline` and `resource` — none of them is a frame,
and the `pipeline` entry fired for the bundle load and the hydrate, not for the
update. So the honest statement is: **the toggle's JS cost is ~1 ms and its
frame cost was not measurable with the instruments Lynx exposes.**

### D.3 Scroll

Lynx documents no FPS or frame-timing API. The documented substitute is counting
`requestAnimationFrame` callbacks — the doc's own `requestAnimationFrame`
example prints an FPS — so that is what the bench does. Over the 8 s scroll:
471 callbacks, mean gap 17.0 ms, p95 17 ms. That is a steady ~59 Hz cadence with
no long stalls, which is a good result; but note what it measures. It is the
*background thread's* callback cadence, not the compositor's, so it can look
smooth while the UI thread drops frames. The 312 "gaps > 16 ms" are the ordinary
16.67 ms vsync rounding up, not jank. Flutter's build/raster split is a strictly
better instrument and Lynx has nothing like it in JS. The only real frame data
Lynx documents is an offline Perfetto trace, **Android only**.

`autoScroll` at 750 px/s for 8 s landed at `scrollY: 5748` of a requested 6000,
i.e. it ramps rather than starting instantly.

### D.4 The `<list>` stale-row bug: **not reproduced**

The August run recorded rows updated while off-screen showing stale content when
scrolled back. This build could not reproduce it.

The bench toggles all 2,000 rows five times (leaving every row ON), then
auto-scrolls 5,748 px so that rows ~89–97 — which were off-screen for every one
of those toggles and whose cells have certainly been recycled — come into view.
`getVisibleCells` reports item-keys matching their positions exactly, and
`evidence/ios-bench.png` shows rows ۹۱–۹۷ each with its switch ON, its own index
in the pill, and its own amount. No stale cell, no mismatched key, no wrong
state.

Caveats, stated plainly: this is Lynx engine 4.0 on iOS in a simulator, with
`item-key` set on every `<list-item>` and `estimated-main-axis-size-px` given.
The docs' only stale-related warning is about `item-key`: "Incorrect settings may
lead to disorder and flickering issues". The bug may have been fixed, may be
Android-only, or may need a condition this bench does not create. **It did not
occur here**, and that is all this run establishes.

One undocumented detail found on the way: `getVisibleCells` resolves with a bare
array of cells on iOS (`[{bottom,position,itemKey,id,left,top,right,index}, …]`),
not the `{attachedCells}` object shape the samples suggest. Neither shape is
documented.

### D.5 Tooling

Everything the docs promise is available and works. `rspeedy build` produced
both environments in ~9 s cold, ~3 s warm. LynxExplorer 4.0.0 for the iOS
simulator is a 27 MB tarball from the GitHub release; `xcrun simctl install`
takes it. Lynx for Web builds from the same source with
`environments: { lynx: {}, web: {} }`.

The one thing that did not work: **driving the app**. `simctl openurl` with the
`lynx://` scheme raised iOS's "Open in LynxExplorer?" confirmation, which needs a
tap, and no tap can be scripted here (`osascript is not allowed assistive
access`). The way through was reading LynxExplorer's own source: its
`AppDelegate.mm` checks an `lynx_initial_url` environment variable, which
`simctl` can set via `SIMCTL_CHILD_lynx_initial_url`. That is undocumented on
lynxjs.org and is the only reason this report has device numbers at all.

Second thing that did not work: **`console.info` from the bundle never reaches
the iOS system log.** `log show --info --debug --predicate 'process ==
"LynxExplorer"'` carries the engine's own `[lynx]` lines and nothing the app
prints. The app therefore POSTs its report to a collector on the host through
`lynx.fetch` (`src/probe/report.ts`, `scripts/collect.mjs`). Note that `fetch` is
**not** a global in Lynx; it is `lynx.fetch`, "subset of Fetch API".

---

## E. The authoring experience

**What was pleasant.** The CSS-and-JSX model is the closest thing to the web of
the three mobile targets, and for a design system that matters more than it
sounds: `src/lumo/tokens.css` is generated straight from
`lumo-ui/packages/theme/src/tokens.css` with the same generator the monorepo
already had, custom properties work, `var()` works, class composition works, and
the Khroos palette lands as a second scheme on the same root. Getting from
"nothing" to "the Khroos splash rendering in Persian on an iPhone" took one
afternoon. The inline logical properties mirror correctly. `<list>` is fast and
its API is small. `rspeedy` is quick and its type-check plugin is on by default.

**What fought back.** Every problem in this build was silent.

- `direction` reaching nothing without `enableCSSInheritance` (B.2) — no warning.
- Block-axis logical properties deleted at encode time (B.3) — a warning, in a
  stream of 73 identical warnings, on a build that succeeded.
- A `flex: 1` child of a `<view>` collapsing to zero height (B.4) — no warning.
- `accessibility-status`, `accessibility-checked` and `accessibility-trait`
  type-checking clean and doing nothing (A.3) — no warning from tsc, none from
  the bundler, none from the runtime.

Four failure modes, four silences. For a library whose entire premise is that
Persian and RTL and accessibility break *quietly*, a platform that never
complains is a poor partner.

**What took longest.** Not the components — the *evidence*. Building the ten
components and five screens was a few hours. Getting a number out of a device
took longer: an undocumented environment variable to open a bundle, an HTTP
beacon because console output does not leave the app, and a build-time define to
reach a screen because no tap can be scripted. That work is in `scripts/` and is
reusable, but it is work the platform should not have required.

**What could not be done at all.**

- Enforce "a bare number does not compile" at the type level (C.2).
- Bind an error message to its field, or a label to its value, anywhere (A.6).
- Say that a switch is on (A.6).
- Measure a frame (D.2, D.3).
- Read the accessibility tree on the platform that has one (A.5).

**Where the docs were wrong or missing.** `accessibility-value`,
`accessibility-heading`, `accessibility-role-description` and
`accessibility-actions` are shipped in the types and appear **nowhere** in the
documentation — zero hits across the EN-stable, EN-next and ZH bundles. The
documented `accessibility-trait` is the wrong spelling of the shipped
`accessibility-traits`, and it type-checks clean, so following the documentation
produces an attribute that does nothing. The documented four trait values are
now fifteen. `Intl` is documented as "not implemented" and is fully present on
iOS. The `accessibility-*` attributes are documented only on `<view>` — `text.md`,
`image.md`, `list.md` and `scroll-view.md` contain zero occurrences of
"accessibility" — while the types put them on `StandardProps`, i.e. everywhere.
There is no RTL guide. The accessibility guide and the i18n guide never mention
each other, and neither mentions `direction`.

---

## What the limits of current Lynx are, for a library like Lumo

Lynx will render a Persian-first, right-to-left app well. That part is settled:
the screens in `evidence/` are the Khroos app, in Persian, laid out correctly,
mirroring into English from one locale value with no per-locale code, with
correct bidi runs, correct Persian digits and — on iOS — a full ICU behind them.
It is fast; a 2,000-row list scrolls at a steady ~59 Hz cadence and a 2,000-row
state flip costs a millisecond of JS. The old `<list>` stale-row bug did not
reappear. If the question were "can Lynx draw this app", the answer would be yes.

The question is whether Lynx can carry Lumo's *contract*, and there the answer is
still no — for one structural reason and one cultural one.

The structural reason is that Lynx has a naming layer, not a semantics layer.
`accessibility-label` is genuinely good. But `accessibility-traits` is a
single-valued enum of fifteen strings, and a control's role, its state and its
relationships are three different things that the platform collapses into that
one slot. A switch has to choose between being a button and having a state. A
tab has to choose between being selected and being pressable. A field cannot own
its error. Nothing can say "checked", "expanded", "busy", "invalid" or "2 of 5".
The only escape is `accessibility-value`, an undocumented free-text channel, and
using it means writing the state as Persian prose that the screen reader can
neither translate nor pronounce in its own vocabulary. Lumo's first rule is that
every announced string is a required prop with no English default; on Lynx that
rule metastasises, because half the *states* become announced strings too — which
is why `Switch` here needs `onLabel` and `offLabel` and `Tabs` needs
`positionLabel`. That is not a library with a slightly worse mobile target. It is
a different contract wearing the same prop names.

The cultural reason is worse, and it is the one that decides it. Nothing in this
toolchain fails closed. `accessibility-status` compiles. `accessibility-trait` —
the spelling in Lynx's own documentation — compiles and does nothing. A stylesheet
loses its vertical rhythm with a warning. `direction` reaches nothing at all
without a flag no error message mentions. And on Lynx for Web, the entire
accessibility vocabulary is inert: 378 nodes in the tree, zero roles, one
focusable element. A library whose reason to exist is that these defects are
invisible cannot be built on a platform where every one of them is invisible
*and* unverifiable — where, in the end, the only honest thing this report can say
about `accessibility-value` on iOS is that nobody here could find out what it does.

Flutter remains the right choice (decision §30). The specific things that would
have to change for that to be worth revisiting are narrow and nameable: a state
channel separate from the trait (`checked`, `selected`, `disabled`, `busy`,
`invalid`, `expanded` as their own attributes rather than trait values); a
labelled-by/described-by relation so a field can own its error; documentation for
the attributes that already ship; a compiler or a gate that rejects an
`accessibility-*` attribute the runtime does not know; and any accessibility
mapping at all on the web target. None of those is exotic. Until they exist,
this repo's rule applies: an unproven claim is worse than a gap, and Lynx cannot
prove what it announces.
