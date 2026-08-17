// Semantics and GEOMETRY tests for LumoButton / LumoIconButton: the four
// variants and three sizes on the shared control scale, the disabled state
// announced, the icon button named ONCE (an icon is not a name, and the
// Tooltip's copy is excluded), and the touch floor — a SQUARE icon button gets
// a 44 px hit area while the button it DRAWS keeps its size step.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

void main() {
  testWidgets('Button: named by its child, enabled announced, disabled loses its tap action', (tester) async {
    final semantics = tester.ensureSemantics();
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoButton(onPressed: () => taps++, child: const Text('ذخیره')),
      LumoButton(onPressed: () => taps++, isDisabled: true, child: const Text('حذف')),
    ])));
    expect(find.bySemanticsLabel('ذخیره'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('ذخیره')), containsSemantics(label: 'ذخیره', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true));
    expect(tester.getSemantics(find.bySemanticsLabel('حذف')), containsSemantics(label: 'حذف', isButton: true, hasEnabledState: true, isEnabled: false));
    await tester.tap(find.text('ذخیره'));
    await tester.tap(find.text('حذف'), warnIfMissed: false);
    expect(taps, 1);
    semantics.dispose();
  });

  testWidgets('Button: the three sizes ARE the shared control scale — 29 / 36 / 44 — and sm/md stay under the 44 floor on purpose (the web says the same)', (tester) async {
    await tester.pumpWidget(app('en-US', const SizedBox(width: 360, child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
      LumoButton(size: LumoButtonSize.sm, child: Text('Small')),
      LumoButton(size: LumoButtonSize.md, child: Text('Medium')),
      LumoButton(size: LumoButtonSize.lg, child: Text('Large')),
    ]))));
    expect(tester.getSize(find.ancestor(of: find.text('Small'), matching: find.byType(LumoButton))), const Size(360, LumoControl.sm));
    expect(tester.getSize(find.ancestor(of: find.text('Medium'), matching: find.byType(LumoButton))), const Size(360, LumoControl.md));
    expect(tester.getSize(find.ancestor(of: find.text('Large'), matching: find.byType(LumoButton))), const Size(360, LumoControl.lg));
  });

  testWidgets('IconButton: the name is announced ONCE (the Tooltip copy is excluded) and an icon never names anything', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoIconButton(label: 'بستن', onPressed: () {}, child: const Icon(Icons.close))));
    expect(find.bySemanticsLabel('بستن'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('بستن')), containsSemantics(label: 'بستن', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true));
    // The Tooltip renders no text until it is shown, and carries no semantics.
    expect(find.text('بستن'), findsNothing);
    semantics.dispose();
  });

  testWidgets('IconButton: the HIT AREA is 44 square at every size while the DRAWN button keeps its size step (measured: it was 36x36 / 29x29)', (tester) async {
    for (final (size, side) in [(LumoButtonSize.sm, LumoControl.sm), (LumoButtonSize.md, LumoControl.md), (LumoButtonSize.lg, LumoControl.lg)]) {
      await tester.pumpWidget(app('fa-IR', LumoIconButton(key: ValueKey(size), label: 'بستن', size: size, onPressed: () {}, child: const Icon(Icons.close))));
      expect(tester.getSize(find.byType(LumoIconButton)), const Size(LumoControl.lg, LumoControl.lg), reason: '$size hit area');
      // No visual drift: the painted button is still the size step.
      expect(tester.getSize(find.byType(LumoButton)), Size(side, side), reason: '$size drawn');
    }
  });

  testWidgets('IconButton: a tap in the transparent ring fires the callback EXACTLY once, and so does a tap on the glyph', (tester) async {
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', LumoIconButton(label: 'بستن', onPressed: () => taps++, child: const Icon(Icons.close))));
    final rect = tester.getRect(find.byType(LumoIconButton));
    // The ring: inside the 44 box, outside the 36 the button draws.
    await tester.tapAt(Offset(rect.left + 2, rect.top + 2));
    await tester.pumpAndSettle();
    expect(taps, 1, reason: 'the ring rescues a near miss');
    await tester.tapAt(rect.center);
    await tester.pumpAndSettle();
    expect(taps, 2, reason: 'a centre tap resolves once, in the button — not twice');
  });

  testWidgets('IconButton: disabled has neither ring tap nor button tap', (tester) async {
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', LumoIconButton(label: 'بستن', isDisabled: true, onPressed: () => taps++, child: const Icon(Icons.close))));
    final rect = tester.getRect(find.byType(LumoIconButton));
    await tester.tapAt(Offset(rect.left + 2, rect.top + 2));
    await tester.tapAt(rect.center);
    await tester.pumpAndSettle();
    expect(taps, 0);
  });
}
