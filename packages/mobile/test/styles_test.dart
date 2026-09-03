// The appearance surface's own guards.
//
// WHAT THIS FILE USED TO BE. Until 0.3.0 it measured three claims against real
// Lumo widgets: that an empty `LumoStyles` renders what the library rendered
// before the surface existed, that a maximally hostile style cannot move the
// semantics tree, and that a tap-target floor can only ever grow. Those widgets
// are retired, and a test cannot measure a widget that is not there.
//
// Two of the three guarantees did not go with them:
//
//  - APPEARANCE ONLY is still enforced, and by the stronger of the two
//    mechanisms it always had. `scripts/build-mobile-styles.mjs` can emit
//    `lerp` only for a colour, a length, a weight, a shadow or a per-step map
//    of those; a `String`, a `Widget` or an `IconData` field fails the BUILD.
//    That was the type-level half, and it survives untouched — `gate:mobile-styles`
//    runs the generator in `--check` mode on every verify.
//  - NO STYLES = NO CHANGE is now a property of the OBJECTS rather than of a
//    render: every field is null, `merge` keeps what it is given, and a
//    consumer's component resolves `style.x ?? <its own value>`. That is what
//    the tests below hold.
//
// The tap-target floor left with the widgets that clamped it. It is the
// consumer's now, which is stated in `LumoTouch`'s own docs and is the honest
// position: Lumo can publish the number and cannot enforce it inside a
// component it does not write.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

void main() {
  test('an empty style overrides nothing, which is what makes it safe', () {
    const empty = LumoButtonStyle();
    expect(empty.height, isNull);
    expect(empty.background, isNull);
    expect(empty.borderRadius, isNull);
    expect(empty.minTapTarget, isNull);

    // The whole precedence chain rests on this: `style.x ?? own` can only fall
    // through to the component's own value if `x` is genuinely null. A default
    // that was a NUMBER here would silently become the library's opinion about
    // every consumer's button.
    const styles = LumoStyles();
    expect(styles.button, const LumoButtonStyle());
  });

  test('merge: the call site wins per field, and per-step tables combine key by key', () {
    const theme = LumoButtonStyle(borderWidth: 3, height: {LumoButtonSize.lg: 60}, background: {LumoButtonVariant.solid: Color(0xFF111111)});
    const site = LumoButtonStyle(borderWidth: 5, height: {LumoButtonSize.sm: 20});
    final merged = theme.merge(site);

    expect(merged.borderWidth, 5, reason: 'the call site wins');
    expect(merged.background, {LumoButtonVariant.solid: const Color(0xFF111111)}, reason: 'a field the call site left null keeps the theme s');
    expect(merged.height, {LumoButtonSize.lg: 60.0, LumoButtonSize.sm: 20.0},
        reason: 'tables merge KEY BY KEY — a theme moving lg and a call site moving sm both take effect');
    expect(theme.merge(null), theme, reason: 'merging nothing changes nothing');
  });

  test('lerp: the ends are the ends, and LumoStyles interpolates its family', () {
    const a = LumoStyles(button: LumoButtonStyle(borderWidth: 0, disabledOpacity: 0));
    const b = LumoStyles(button: LumoButtonStyle(borderWidth: 10, disabledOpacity: 1));
    expect(a.lerp(b, 0), a);
    expect(a.lerp(b, 1), b);
    expect(a.lerp(b, 0.5).button.borderWidth, 5);
    expect(a.lerp(null, 0.5), a, reason: 'nothing to interpolate towards');
  });

  testWidgets('LumoStyles.of never asserts: outside a Theme it is the library s own',
      (tester) async {
    late LumoStyles seen;
    await tester.pumpWidget(Directionality(
      textDirection: TextDirection.rtl,
      child: Builder(builder: (context) {
        seen = LumoStyles.of(context);
        return const SizedBox.shrink();
      }),
    ));
    expect(seen, const LumoStyles());
  });

  testWidgets('a consumer component reads what lumoThemeData was given', (tester) async {
    // The round trip that matters now, and the one a consumer depends on: a style
    // handed to `lumoThemeData` must reach a widget the CONSUMER wrote, through
    // `Theme`, above the navigator. It rides on the theme rather than on
    // `LumoScope` precisely so a dialog or a sheet inherits it.
    const wanted = LumoButtonStyle(borderWidth: 7, height: {LumoButtonSize.md: 52});
    late LumoButtonStyle seen;

    await tester.pumpWidget(MaterialApp(
      theme: lumoThemeData(
        brightness: Brightness.light,
        styles: const LumoStyles(button: wanted),
      ),
      home: Builder(builder: (context) {
        seen = LumoStyles.of(context).button;
        return const SizedBox.shrink();
      }),
    ));

    expect(seen.borderWidth, 7);
    expect(seen.height, {LumoButtonSize.md: 52.0});
  });

  testWidgets('and a Material widget wears Lumo tokens without being wrapped',
      (tester) async {
    // The other half of what `lumoThemeData` is for, and the reason a consumer
    // can drop the roster without the look changing: Lumo's palette is bound
    // into Material's own `ColorScheme`, so a plain `FilledButton` is already
    // the right colour.
    late ColorScheme scheme;
    final colours = lightColours().copyWith(accent: const Color(0xFF00695C));

    await tester.pumpWidget(MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light, colours: colours),
      home: Builder(builder: (context) {
        scheme = Theme.of(context).colorScheme;
        return const SizedBox.shrink();
      }),
    ));

    expect(scheme.primary, const Color(0xFF00695C),
        reason: 'the accent token did not reach Material');
  });
}
