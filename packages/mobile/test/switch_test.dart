// Semantics and GEOMETRY tests for LumoSwitch: named by its visible label or by
// an explicit accessibilityLabel (never neither), announced `toggled` and NOT a
// button (that is LumoToggle), the name heard ONCE, the track/thumb geometry
// taken from the web's BORDER box, ON at the reading END in both directions,
// the thumb a SURFACE and not a foreground, the touch floor for a nameless
// switch, and a thumb that does not travel under «Reduce motion».
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {bool disableAnimations = false, Brightness brightness = Brightness.light}) => MaterialApp(
      theme: lumoThemeData(brightness: brightness),
      home: MediaQuery(
        data: MediaQueryData(disableAnimations: disableAnimations),
        child: LumoScope(locale: locale, brightness: brightness, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
      ),
    );

/// The track: the sized box that holds the DecoratedBox the thumb travels in.
Finder track() => find.byWidgetPredicate((w) => w is SizedBox && w.child is DecoratedBox).first;

/// The thumb: the round Container inside the track.
Finder thumb() => find.descendant(of: find.byType(AnimatedAlign), matching: find.byType(Container));

void main() {
  testWidgets('Switch: named ONCE by its label, announced `toggled` and NOT a button; the description is the hint', (tester) async {
    final semantics = tester.ensureSemantics();
    bool? reported;
    await tester.pumpWidget(app('fa-IR', LumoSwitch(label: 'اعلان‌ها', description: 'پیامک', isSelected: true, onChanged: (v) => reported = v)));
    expect(
      tester.getSemantics(find.bySemanticsLabel('اعلان‌ها')),
      containsSemantics(label: 'اعلان‌ها', hint: 'پیامک', hasToggledState: true, isToggled: true, hasEnabledState: true, isEnabled: true, isButton: false),
    );
    // The name and the hint are each in the tree exactly once — the drawn copies are excluded.
    expect(find.bySemanticsLabel('اعلان‌ها'), findsOneWidget);
    expect(find.text('اعلان‌ها'), findsOneWidget);
    expect(find.text('پیامک'), findsOneWidget);
    await tester.tap(find.text('اعلان‌ها'));
    expect(reported, isFalse);
    semantics.dispose();
  });

  testWidgets('Switch: an accessibilityLabel names a switch that draws no words; neither is refused at construction', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoSwitch(accessibilityLabel: 'Wi-Fi')));
    expect(find.bySemanticsLabel('Wi-Fi'), findsOneWidget);
    expect(find.text('Wi-Fi'), findsNothing);
    expect(() => LumoSwitch(onChanged: (_) {}), throwsAssertionError);
    semantics.dispose();
  });

  testWidgets('Switch: the track is the web BORDER box — 32x18 with a 14 thumb at md, 44x24 with a 20 thumb at lg (it drew the 30x16 / 42x22 PADDING box)', (tester) async {
    for (final (size, w, h, t) in [(LumoSwitchSize.md, 32.0, 18.0, 14.0), (LumoSwitchSize.lg, 44.0, 24.0, 20.0)]) {
      // en-US so the OFF thumb's reading START is the LEFT edge and the inset reads directly.
      await tester.pumpWidget(app('en-US', LumoSwitch(key: ValueKey(size), accessibilityLabel: 'Wi-Fi', size: size)));
      expect(tester.getSize(track()), Size(w, h), reason: '$size track');
      expect(tester.getSize(thumb()), Size(t, t), reason: '$size thumb');
      // The web's 1px border + 1px inset, measured from the border box.
      final inset = tester.getRect(thumb()).left - tester.getRect(track()).left;
      expect(inset, 2.0, reason: '$size resting inset');
    }
  });

  testWidgets('Switch: ON sits at the reading END — the thumb is at the LEFT of the track under fa-IR and at the RIGHT under en-US', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      await tester.pumpWidget(app(locale, LumoSwitch(key: ValueKey(locale), accessibilityLabel: 'وای‌فای', isSelected: true)));
      await tester.pumpAndSettle();
      final t = tester.getRect(track());
      final n = tester.getRect(thumb());
      if (locale == 'fa-IR') {
        expect(n.left - t.left, 2.0, reason: 'RTL: the reading END is the left edge');
      } else {
        expect(t.right - n.right, 2.0, reason: 'LTR: the reading END is the right edge');
      }
    }
  });

  testWidgets('Switch: the resting thumb is a SURFACE, not a foreground — the token role holds in both schemes', (tester) async {
    for (final brightness in [Brightness.light, Brightness.dark]) {
      await tester.pumpWidget(app('fa-IR', LumoSwitch(key: ValueKey(brightness), accessibilityLabel: 'وای‌فای'), brightness: brightness));
      final colours = brightness == Brightness.dark ? darkColours(LumoBrand.achromatic) : lightColours(LumoBrand.achromatic);
      final decoration = tester.widget<Container>(thumb()).decoration! as BoxDecoration;
      expect(decoration.color, colours.surface, reason: '$brightness resting thumb');
      expect(decoration.color, isNot(colours.fg), reason: '$brightness: `fg` is the text role, not a fill');
    }
  });

  testWidgets('Switch: a NAMELESS switch still meets the 44 touch floor inside a Row (it was the bare 32-wide track)', (tester) async {
    await tester.pumpWidget(app('fa-IR', const Row(mainAxisSize: MainAxisSize.min, children: [LumoSwitch(accessibilityLabel: 'بلوتوث')])));
    expect(tester.getSize(find.byType(LumoSwitch)).width, greaterThanOrEqualTo(LumoControl.lg));
  });

  testWidgets('Switch: under disableAnimations the thumb ARRIVES — one frame, no travel', (tester) async {
    Widget build(bool on, bool reduce) => app('en-US', LumoSwitch(accessibilityLabel: 'Wi-Fi', isSelected: on), disableAnimations: reduce);

    // With motion: one frame after the change the thumb is still on its way.
    await tester.pumpWidget(build(false, false));
    await tester.pumpWidget(build(true, false));
    await tester.pump();
    final travelling = tester.getRect(thumb()).left - tester.getRect(track()).left;
    expect(travelling, lessThan(16.0), reason: 'sanity: with motion the thumb interpolates');
    await tester.pumpAndSettle();

    // Under «Reduce motion»: the very next frame is the end state.
    await tester.pumpWidget(build(false, true));
    await tester.pumpAndSettle();
    await tester.pumpWidget(build(true, true));
    await tester.pump();
    expect(tester.getRect(thumb()).left - tester.getRect(track()).left, 16.0, reason: 'md: 32 − 2 − 14');
  });
}
