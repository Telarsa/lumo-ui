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
- **Press feedback is Lumo's, not Material's.** A Material `InkWell` answers a
  finger with a ripple: a circle travelling from the touch point, plus a
  lingering highlight. Lumo answers the way the web library does — an immediate
  flat `surfaceHover` tint — and `lumoThemeData(pressFeedback:)` says so out
  loud: `tint` (default), `none`, or `ripple` for an app that wants the platform
  gesture. It is set on the THEME, so every widget agrees; before this, only
  `LumoButton` had cleared its overlay and the switch beside it still rippled.
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

## Widgets — 77 families
Every announced string is a required parameter; direction from the locale;
colours from the scope; a semantics-tree test per family in `test/`.

| Family | Widgets |
|---|---|
| Actions | `LumoButton`, `LumoIconButton(label:)` |
| Selection | `LumoSwitch`, `LumoCheckbox`, `LumoCheckboxGroup`, `LumoRadioGroup`/`LumoRadio`, `LumoSegmentedControl`, `LumoChip`, `LumoTagGroup`, `LumoRating` (interactive with `starLabel`) |
| Fields | `LumoTextField` (`isNumeric` = LTR digits), `LumoTextArea`, `LumoSearchField(clearLabel:)`, `LumoOtpField(cellLabel:)`, `LumoNumberField(incrementLabel:, decrementLabel:)`, `LumoSlider`/`LumoRangeSlider(valueLabel:)`, `LumoSelect(closeLabel:)`, `LumoDateField` (Jalali/Gregorian by locale) |
| Overlays | `showLumoDialog`/`LumoDialogTrigger`, `showLumoSheet`/`LumoSheetTrigger` (own route — Material's bottom sheet names itself «Dialog»/«Dismiss» in English), `LumoMenuTrigger` (+ items, checkbox items, sections), `LumoPopoverTrigger`/`showLumoPopover`, `LumoTooltip`, `showLumoToast` (live region, bottom-end, max 3) |
| Structure | `LumoTabs`, `LumoCard`/`LumoCardHeader`/`LumoCardFooter`, `LumoAvatar(statusLabel:)`, `LumoBadge`, `LumoEmptyState`, `LumoSkeleton`/`LumoSkeletonText`, `LumoProgress`, `LumoSpinner`, `LumoSteps(completedLabel:, currentLabel:, upcomingLabel:)`, `LumoSeparator` |
| Feedback | `LumoAlert`, `showLumoAlertDialog`/`LumoAlertDialogTrigger`, `LumoDisclosure`/`LumoAccordion`, `LumoTimeline` |
| Pickers | `LumoMultiSelect`, `LumoCombobox`, `LumoPhoneInput`, `LumoTimeField` |
| Lists & nav | `LumoItem`/`LumoItemGroup`/`LumoListBox`, `LumoBreadcrumbs`, `LumoLink`, `LumoDescriptionList`, `LumoToggle`/`LumoToggleGroup` |
| Media | `LumoMessage`/`LumoMessageGroup`, `LumoCarousel`, `LumoFileUpload`/`LumoAttachmentTile`, `LumoIconTile`/`LumoIconStack` |
| Navigation | `LumoNavigationBar`, `LumoAppBar`, `LumoNavigationDrawer`, `LumoToolbar`, `LumoButtonGroup`, `LumoInputGroup`, `LumoContextMenu` |
| Dates | `LumoCalendar`, `LumoRangeCalendar`, `LumoDatePicker`, `LumoDateRangePicker` (Jalali or Gregorian by locale) |
| Data & lists | `LumoTable`, `LumoVirtualList`/`LumoInfiniteList`, `LumoPullToRefresh`, `LumoSortable`, `LumoScrollArea`, `LumoKanban` |
| Forms & layout | `LumoForm`/`LumoFormField`/`LumoFormState`, `LumoTagsInput`, `LumoMaskInput`, `LumoColorInput`/`LumoColorPicker`, `LumoFilters`, `LumoStack`/`LumoGrid`/`LumoAspectRatio`, `LumoCommand` |
| Charts & tree | `LumoBarChart`, `LumoLineChart`, `LumoSparkline`, `LumoDonutChart`, `LumoTree`, `LumoTreeSelect` |
| Utilities | `formatNumber`, `JalaliDate`, `calendarOf`, `formatLumoDate`, `lumoFoldForSearch`, `LumoScope`, `lumoThemeData`, `LumoShadow` |

A chart is not a picture of numbers: every data point is its own semantics node
announcing «label: value», so the series can be walked without being seen. A
drag is not an interface: `LumoSortable` and `LumoKanban` require named
move actions, because a screen-reader user cannot drag.

## The gate

`flutter analyze` grades Dart and `flutter test` grades behaviour; neither can
see the defects this library exists to prevent, because all of them are valid
Dart that compiles and passes a test written by the same hand. So the contract
has a grader of its own — `pnpm run gate:flutter-contract`
(`scripts/flutter-contract-gate.mjs`), the mobile counterpart of `gate:props`:

| Rule | What it refuses |
|---|---|
| `english-default` | an announced string with a default value — the defect the library argues against |
| `english-literal` | a user-facing string welded shut in Latin letters, which no locale reaches |
| `physical-direction` | `left`/`right` where the inline axis was meant — the silent RTL defect |
| `material-english-route` | `showModalBottomSheet`/`showMenu`/`showDialog`/`showDatePicker`/`showTimePicker`, each of which names its own route and barrier «Dialog»/«Dismiss» from `MaterialLocalizations` |

`packages/mobile/test/house_rules_test.dart` adds four more, swept over the whole
of `lib/src/` rather than family by family — so a family added tomorrow is
covered without anyone remembering to opt it in: **no hand-rolled `BoxShadow`**
(elevation is `LumoShadow`, which has a separate dark ramp), **every animating
file consults `MediaQuery.disableAnimationsOf`**, **a validation error is never
silent**, and **no const-constructor assert on a collection length** (it is a
compile error at every const call site, not a runtime check). The motion guard
caught two families that landed WHILE the first ten were being fixed, which is
the argument for a guard over a fix.

Every rule ships a poison fixture in `gate_fixtures/`, and `--self-test` fails
if a rule stops rejecting its own poison or starts flagging the clean file — a
rule that quietly loses its teeth is worse than a missing one, because it is
trusted. One line may opt out with
`// lumo-gate-allow: <rule> — <reason of at least 12 characters>`: an exemption
is a sentence someone signed, not a flag.

All four rules pass across `lib/`, which is why no Lumo route is Material's any
more (`showLumoSheetRoute` is the bare bottom-sheet route for a body that brings
its own header, like the calendar).

## Develop
Flutter is not on this machine's PATH: `export PATH=/opt/homebrew/share/flutter/bin:$PATH`.
`flutter pub get && flutter analyze && flutter test` here, or `pnpm run gate:flutter`
from the repo root (set `LUMO_SKIP_FLUTTER=1` only on a machine without Flutter,
and say so in the PR).
