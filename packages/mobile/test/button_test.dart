// Semantics and GEOMETRY tests for LumoButton / LumoIconButton: the four
// variants and three sizes on the shared control scale, the disabled state
// announced, the icon button named ONCE (an icon is not a name, and the
// Tooltip's copy is excluded), and the touch floor — a SQUARE icon button gets
// a LumoTouch.floor (48) hit area while the button it DRAWS keeps its size step.
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

  testWidgets('Button: the DRAWN sizes are the shared control scale — 29 / 36 / 44 — while the TARGET is floored at LumoTouch.floor (48), so the web scale never moves and both platforms are met', (tester) async {
    await tester.pumpWidget(app('en-US', const SizedBox(width: 360, child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
      LumoButton(size: LumoButtonSize.sm, child: Text('Small')),
      LumoButton(size: LumoButtonSize.md, child: Text('Medium')),
      LumoButton(size: LumoButtonSize.lg, child: Text('Large')),
    ]))));
    // The DRAWN box is still the token step — that is the shared scale, and it
    // has not moved. What changed is the widget's layout box: `padded` floors
    // the TARGET at `LumoTouch.floor`, which is why the outer size is 48 for the
    // two steps that draw below it. The drawn material is asserted below.
    for (final (label, step) in [('Small', LumoControl.sm), ('Medium', LumoControl.md), ('Large', LumoControl.lg)]) {
      final outer = tester.getSize(find.ancestor(of: find.text(label), matching: find.byType(LumoButton)));
      expect(outer.width, 360, reason: '$label width');
      expect(outer.height, step < LumoTouch.floor ? LumoTouch.floor : step, reason: '$label target height');
      final drawn = tester.getSize(find.ancestor(of: find.text(label), matching: find.byType(Material)).first);
      expect(drawn.height, step, reason: '$label drawn height — the shared scale must not move');
    }
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

  testWidgets('IconButton: the HIT AREA is LumoTouch.floor (48) square at every size while the DRAWN button keeps its size step (measured: it was 36x36 / 29x29, and a 44 rescue passed iOS while failing Android)', (tester) async {
    for (final (size, side) in [(LumoButtonSize.sm, LumoControl.sm), (LumoButtonSize.md, LumoControl.md), (LumoButtonSize.lg, LumoControl.lg)]) {
      await tester.pumpWidget(app('fa-IR', LumoIconButton(key: ValueKey(size), label: 'بستن', size: size, onPressed: () {}, child: const Icon(Icons.close))));
      expect(tester.getSize(find.byType(LumoIconButton)), const Size(LumoTouch.floor, LumoTouch.floor), reason: '$size hit area');
      // No visual drift: the painted button is still the size step.
      expect(tester.getSize(find.byType(LumoButton)), Size(side, side), reason: '$size drawn');
    }
  });

  testWidgets('IconButton: a tap in the transparent ring fires the callback EXACTLY once, and so does a tap on the glyph', (tester) async {
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', LumoIconButton(label: 'بستن', onPressed: () => taps++, child: const Icon(Icons.close))));
    final rect = tester.getRect(find.byType(LumoIconButton));
    // The ring: inside the 48 box, outside the 36 the button draws.
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
