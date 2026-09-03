# lumo_ui_mobile — Lumo UI Mobile

## Grade your own screens

`package:lumo_ui_mobile/testing.dart` is the mobile counterpart of `gate:html`.
The web gate reads served bytes; there are no bytes on a phone, so this walks
the SemanticsNode tree — literally what Flutter hands TalkBack and VoiceOver —
and applies the same five rules to whatever subtree you point it at.

```dart
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';   // LumoScope, tokens
import 'package:lumo_ui_mobile/testing.dart';          // the grader

testWidgets('the Today screen announces cleanly in Persian', (tester) async {
  await tester.binding.setSurfaceSize(kLumoStage);
  final semantics = tester.ensureSemantics();   // no listener, no tree to grade
  await tester.pumpWidget(myApp(locale: 'fa'));

  final tree = lumoAnnouncedTree(tester, of: find.byType(TodayScreen));
  expect(lumoGrade(subject: 'today', locale: 'fa', tree: tree), isEmpty);

  semantics.dispose();
});
```

The rules: **named-controls** (an interactive node with no label, value or
tooltip), **persian-digits** (a Latin digit in an announced string under a
natively-numbered locale), **engine-english** (UI chrome Material supplies in
English, which no source scan can see), **announced-once** (the same string as
both name and hint, read twice in a row), and **native-calendar** (a date in
the reader's language and the WRONG calendar — «۲۲ ژوئیهٔ ۲۰۲۴» is Persian
words and Persian digits for a day Iran calls «۱ مرداد ۱۴۰۳», and this package
ships `formatGregorianMonth`, which produces exactly that).

A numeric ENTRY field is the one place ASCII digits are correct — the keypad
produces ASCII and `double.tryParse` cannot read «۱۷۸». Declare it, the way the
web declares `data-lumo-latn`:

```dart
Semantics(identifier: kLumoLatnIsland, child: TextFormField(…))
```

It suppresses the digit rules only, and only on the value. An unnamed control
inside an island still fails.

Two things about the locale, both learned the hard way. Grade at a fixed stage
(`kLumoStage`, 360×640): a consumer's chip row overflowed by 56 px under
Persian at phone width while passing at the 800×600 default. And make sure the locale
your providers read is the locale you gave `MaterialApp` — if they disagree,
the strings translate and the numbers do not, and the grader will report your
app for something your harness did.

## What ships

**Not components.** The widget roster was retired at 0.3.0 (§54): 73 files and
21,326 lines re-implementing what Material already gives you. Both Flutter
consumers took their own copies and neither app's look changed — each app's live
in its own `lib/<app>/ui/`, and one of them proved it with 61 golden images that
came out byte-identical. That is the same arrangement the web
has had all along with shadcn: the components live in the repository that
renders them, and Lumo checks them from outside.

Eight source files remain, and they are the things Material has no opinion about:

- **Direction from the locale, never a flag.** `LumoScope(locale:)` sets
  `Directionality`, so a layout mirrors because the language changed and not
  because someone remembered. `directionOf(locale)` is the function underneath;
  it knows eighteen right-to-left languages and matches whole subtags, so
  «fake» is not Farsi.
- **One token source.** `lib/src/tokens.g.dart` is GENERATED from
  `packages/theme/src/tokens.css` — the same file the web reads — by
  `node scripts/build-flutter-tokens.mjs`, and `pnpm run gate:flutter-tokens`
  fails when it is stale. `lumoThemeData()` binds those tokens into Material's
  own `ColorScheme`, so a plain `FilledButton` is already the right colour with
  nothing wrapped.
- **Formatted digits.** `formatNumber(n, locale)` through `intl` — Persian
  digits and separators. A locale `intl` does not carry falls back to `en`
  rather than throwing, because `LumoScope` takes any tag and a language tag
  must not be able to take down a screen.
- **The Jalali calendar.** `intl` is Gregorian-only, which is the largest gap on
  this platform: `JalaliDate` (pure Dart, the jalaali-js arithmetic),
  `calendarOf(locale)` (the web's rule — `fa` → Jalali, a stated `-u-ca-…`
  wins), and `formatLumoDate` («۲۶ مرداد ۱۴۰۵» / «Aug 17, 2026» /
  «26 Mordad 1405»). The date FIELD is yours to build; this is the arithmetic
  and the names under it.
- **A consumer's palette.** `LumoScope(light:, dark:)` takes a
  `LumoSchemeColours` per scheme (`lightColours().copyWith(accent: …)`) — the
  mobile counterpart of overriding `--lumo-sys-*` on the web. `brand` alone
  turns hue and chroma. `lumoThemeData(colours:)` carries the same palette into
  Material's widgets.
- **Appearance for the components you own.** `lumoThemeData(styles: LumoStyles(…))`
  carries a style object per family as a `ThemeExtension`, read back with
  `LumoStyles.of(context)`. TWO families survive, and which ones was decided by
  evidence rather than taste: `LumoButtonStyle`, because one consumer's own
  `AppButton` resolves it, and `LumoCardStyle`, because the other's `AppCard`
  does.
  `LumoItemStyle` had no reader and went. Every field is nullable and means
  "leave this alone", so supplying nothing renders what your component already
  rendered. A style object carries **appearance only**, and that is a fact about
  its types rather than a promise: `scripts/build-mobile-styles.mjs` can emit
  `lerp` only for a colour, a length, a weight or a per-step map of those, so a
  `String`, a `Widget` or an `IconData` field fails the BUILD.
- **The tap-target floor is published, not enforced.** `LumoTouch.floor` is the
  number, and `docs/evidence/mobile-device.md` is the on-device run behind it.
  The clamping left with the widgets that did it: a component this package does
  not write cannot be made to respect a floor by this package. Use
  `MaterialTapTargetSize.padded`, which is Flutter's own mechanism for exactly
  this, and let the grader tell you when a control is unreachable.
- **The grader**, documented at the top of this file.

`pnpm run gate:flutter` runs `flutter analyze` and `flutter test` over this
package AND over `apps/mobile-example`, the Material app that consumes it.
`pnpm run mutation:mobile` breaks one promise per file and requires that file's
own test to fail — five files, five operators, and a floor of zero unproved.


## Consume (path A, a git dependency pinned to a tag)
```yaml
dependencies:
  lumo_ui_mobile:
    git:
      url: https://github.com/Telarsa/lumo-ui.git
      ref: v0.3.0          # a tag; every package moves together
      path: packages/mobile
```
Then `LumoScope(locale: 'fa-IR', brightness: …, child: …)` at the root of every
route (`MaterialApp.builder`) and `theme: lumoThemeData(brightness: …)`. The
widgets are yours — Material's, or your own copies.

Reference consumer in this repository: `apps/mobile-example`. In the wild: two
production apps, each with its own `lib/<app>/ui/`, both of which took their own
copies of the retired roster at 0.2.x and neither of whose appearance moved —
one app's 61 golden images are byte-identical across the change.

## The gate

`flutter analyze` grades Dart and `flutter test` grades behaviour; neither can
see the defect this library exists to prevent, because it is valid Dart that
compiles and passes a test written by the same hand. So the contract has a
grader of its own — the SEMANTICS grader documented at the top of this file,
which reads the tree a screen reader receives rather than the source that
produced it.

There used to be a second one, `gate:flutter-contract`, which read the Dart
SOURCE of this package and refused an announced string that was not a required
parameter, a physical `EdgeInsets`, an English default, and a Material route
helper called without a localised name. It retired with the widget roster in
0.3.0: it graded constructors this package no longer has. The invariants it
enforced did not retire — they moved to where the components now live, and the
semantics grader is what checks them from the outside, on any app, without
needing to see the source.

`pnpm run gate:flutter` runs `flutter analyze` and `flutter test` over this
package AND over `apps/mobile-example`, the Material app that consumes it.


## Develop
Flutter is not on this machine's PATH: `export PATH=/opt/homebrew/share/flutter/bin:$PATH`.
`flutter pub get && flutter analyze && flutter test` here, or `pnpm run gate:flutter`
from the repo root (set `LUMO_SKIP_FLUTTER=1` only on a machine without Flutter,
and say so in the PR).
