# lumo_ui_mobile — Lumo UI Mobile

The mobile UI component library of Lumo UI, in Flutter (decision §30, 17 Aug 2026: best in class per platform — web
stays Base UI + Tailwind + tokens; **mobile is Flutter**). Same contract as the
web library, in Dart:

- **Every announced string is a required named parameter.** `LumoIconButton(label:)`,
  `LumoSelect(closeLabel:)`, `LumoDialogTrigger(label:, closeLabel:)`; a
  `LumoSwitch` asserts it has a visible `label` or an `accessibilityLabel`. Dart's
  null-safety is the type-level guard, the constructor asserts the runtime one.
- **Direction from the locale**, never a flag: `LumoScope(locale:)` sets
  `Directionality`; every widget uses `AlignmentDirectional`/`EdgeInsetsDirectional`.
- **One token source**: `lib/src/tokens.g.dart` is GENERATED from
  `packages/theme/src/tokens.css` by `node scripts/build-flutter-tokens.mjs`;
  `pnpm run gate:flutter-tokens` fails when it is stale.
- **Formatted digits**: `formatNumber(n, locale)` through `intl` (Persian digits
  and separators). **Dates**: `intl` is Gregorian-only, so the calendar is
  Lumo's — `JalaliDate` (pure Dart, the jalaali-js arithmetic), `calendarOf(locale)`
  (the web's rule: `fa` → Jalali, a stated `-u-ca-…` wins), `formatLumoDate`
  («۲۶ مرداد ۱۴۰۵» / «Aug 17, 2026» / «26 Mordad 1405»), and `LumoDateField`
  with a hand-built month grid (Saturday-first under Jalali).
- **A consumer's palette**: `LumoScope(light:, dark:)` takes a `LumoSchemeColours`
  per scheme (`lightColours().copyWith(accent: …)`) — the mobile counterpart of
  overriding `--lumo-sys-*` custom properties on the web. `brand` alone turns
  hue and chroma. `lumoThemeData(colours:)` carries the same palette to
  Material's own widgets.
- **Proof**: semantics-tree tests (`test/`) are the mobile counterpart of the
  served-HTML gate; `pnpm run gate:flutter` runs `flutter analyze` + `flutter test`.
  No screen-reader claims without runs.

## Consume (path A, a git dependency pinned to a tag)
```yaml
dependencies:
  lumo_ui_mobile:
    git:
      url: https://github.com/Telarsa/lumo-ui.git
      ref: v0.2.2          # a tag; every package moves together
      path: packages/mobile
```
Then `LumoScope(locale: 'fa-IR', brightness: …, child: …)` at the root of every
route (`MaterialApp.builder`), `theme: lumoThemeData(brightness: …)`, and the
widgets. Reference app: `example-projects/lumo-app-flutter` — since 17 Aug 2026
the Khroos mobile prototype ported to Flutter on this package (a UI/UX, RTL and
localisation test bed), plus the 2,000-row bench.

## Widgets (0.2.3)
Every announced string is a required parameter; direction from the locale;
colours from the scope; a semantics-tree test per family in `test/`.

| Family | Widgets |
|---|---|
| Actions | `LumoButton`, `LumoIconButton(label:)` |
| Selection | `LumoSwitch`, `LumoCheckbox`, `LumoCheckboxGroup`, `LumoRadioGroup`/`LumoRadio`, `LumoSegmentedControl`, `LumoChip`, `LumoTagGroup`, `LumoRating` (interactive with `starLabel`) |
| Fields | `LumoTextField` (`isNumeric` = LTR digits), `LumoTextArea`, `LumoSearchField(clearLabel:)`, `LumoOtpField(cellLabel:)`, `LumoNumberField(incrementLabel:, decrementLabel:)`, `LumoSlider`/`LumoRangeSlider(valueLabel:)`, `LumoSelect(closeLabel:)`, `LumoDateField` (Jalali/Gregorian by locale) |
| Overlays | `showLumoDialog`/`LumoDialogTrigger`, `showLumoSheet`/`LumoSheetTrigger` (own route — Material's bottom sheet names itself «Dialog»/«Dismiss» in English), `LumoMenuTrigger` (+ items, checkbox items, sections), `LumoPopoverTrigger`/`showLumoPopover`, `LumoTooltip`, `showLumoToast` (live region, bottom-end, max 3) |
| Structure | `LumoTabs`, `LumoCard`/`LumoCardHeader`/`LumoCardFooter`, `LumoAvatar(statusLabel:)`, `LumoBadge`, `LumoEmptyState`, `LumoSkeleton`/`LumoSkeletonText`, `LumoProgress`, `LumoSpinner`, `LumoSteps(completedLabel:, currentLabel:, upcomingLabel:)`, `LumoSeparator` |
| Utilities | `formatNumber`, `JalaliDate`, `calendarOf`, `formatLumoDate`, `LumoScope`, `lumoThemeData` |

Known: `LumoSelect` still opens Material's `showModalBottomSheet`, whose route
carries English platform names on Android («Dialog», «Dismiss») — the sheet
family avoids it with its own route; the select moves onto it next.

## Develop
Flutter is not on this machine's PATH: `export PATH=/opt/homebrew/share/flutter/bin:$PATH`.
`flutter pub get && flutter analyze && flutter test` here, or `pnpm run gate:flutter`
from the repo root (set `LUMO_SKIP_FLUTTER=1` only on a machine without Flutter,
and say so in the PR).
