import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
  theme: lumoThemeData(brightness: Brightness.light),
  home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, height: 400, child: child)))),
);

void main() {
  testWidgets('ContextMenu: a LONG PRESS opens the menu named by label, hanging from the press point — its START edge is the RIGHT one under fa-IR', (tester) async {
    final semantics = tester.ensureSemantics();
    var removed = 0;
    await tester.pumpWidget(app('fa-IR', LumoContextMenu(
      label: 'گزینه‌های سند',
      items: [
        const LumoMenuItem(label: 'رونوشت'),
        const LumoMenuSeparator(),
        LumoMenuItem(label: 'حذف', isDestructive: true, onSelected: () => removed++),
      ],
      child: const ColoredBox(color: Colors.transparent, child: SizedBox.expand(child: Center(child: Text('سند من')))),
    )));
    // The surface is not a button, but it does carry a longPress action — the
    // only route a screen reader has to a gesture it cannot see.
    expect(tester.getSemantics(find.text('سند من')).getSemanticsData().hasAction(SemanticsAction.longPress), isTrue);
    expect(find.bySemanticsLabel('گزینه‌های سند'), findsNothing);

    final point = tester.getCenter(find.byType(LumoContextMenu));
    await tester.longPressAt(point);
    await tester.pumpAndSettle();

    // The menu is named, and its entries are menu.dart's own rows.
    expect(find.bySemanticsLabel('گزینه‌های سند'), findsOneWidget);
    expect(find.text('رونوشت'), findsOneWidget);
    expect(find.text('حذف'), findsOneWidget);
    // The destructive entry takes `critical`; the separator is silent.
    final c = LumoScope.of(tester.element(find.text('حذف'))).colours;
    expect(tester.widget<Text>(find.text('حذف')).style!.color, c.critical);

    // It hangs from the PRESS POINT at `bottomStart`: under fa-IR the surface's
    // start edge is its RIGHT one, so the surface's right edge is the press point.
    final surface = tester.getRect(find.bySemanticsLabel('گزینه‌های سند'));
    expect(surface.right, closeTo(point.dx, 1));
    expect(surface.top > point.dy, isTrue, reason: 'the menu hangs below the point when there is room');

    await tester.tap(find.text('حذف'));
    await tester.pumpAndSettle();
    expect(removed, 1);
    expect(find.bySemanticsLabel('گزینه‌های سند'), findsNothing, reason: 'selecting closes the menu, then acts');
    semantics.dispose();
  });

  testWidgets('ContextMenu: under en-US the surface hangs from the LEFT of the press point; a tap outside dismisses it', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoContextMenu(
      label: 'Document options',
      items: [LumoMenuItem(label: 'Duplicate'), LumoMenuItem(label: 'Remove')],
      child: ColoredBox(color: Colors.transparent, child: SizedBox.expand(child: Center(child: Text('My document')))),
    )));
    final point = tester.getCenter(find.byType(LumoContextMenu));
    await tester.longPressAt(point);
    await tester.pumpAndSettle();
    final surface = tester.getRect(find.bySemanticsLabel('Document options'));
    expect(surface.left, closeTo(point.dx, 1));
    expect(find.text('Duplicate'), findsOneWidget);

    // A tap outside closes it, and the press-point anchor goes with it.
    await tester.tapAt(const Offset(8, 8));
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('Document options'), findsNothing);
    expect(find.text('Duplicate'), findsNothing);
    semantics.dispose();
  });

  testWidgets('ContextMenu: opens where the finger landed, not where the surface is; a disabled menu never opens; checkbox entries carry their state', (tester) async {
    final semantics = tester.ensureSemantics();
    var ticked = true;
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(
      builder: (context, setState) => LumoContextMenu(
        label: 'گزینه‌ها',
        items: [
          LumoMenuCheckboxItem(label: 'نمایش پیش‌نمایش', isSelected: ticked, onChanged: (v) => setState(() => ticked = v)),
        ],
        child: const ColoredBox(color: Colors.transparent, child: SizedBox.expand()),
      ),
    )));
    final rect = tester.getRect(find.byType(LumoContextMenu));
    // A press near the block start of the surface, well above its centre.
    final point = Offset(rect.center.dx, rect.top + 40);
    await tester.longPressAt(point);
    await tester.pumpAndSettle();
    final surface = tester.getRect(find.bySemanticsLabel('گزینه‌ها'));
    expect(surface.top, closeTo(point.dy + 4, 1), reason: 'the menu opens at the finger, not at the surface');
    expect(surface.right, closeTo(point.dx, 1));

    final row = tester.getSemantics(find.ancestor(of: find.text('نمایش پیش‌نمایش'), matching: find.byType(InkWell)).first).getSemanticsData();
    expect(row.flagsCollection.hasCheckedState, isTrue);
    expect(row.flagsCollection.isChecked, isTrue);
    await tester.tapAt(const Offset(8, 8));
    await tester.pumpAndSettle();

    // Disabled: the long press does nothing at all.
    await tester.pumpWidget(app('fa-IR', const LumoContextMenu(
      label: 'گزینه‌ها',
      isDisabled: true,
      items: [LumoMenuItem(label: 'رونوشت')],
      child: ColoredBox(color: Colors.transparent, child: SizedBox.expand()),
    )));
    await tester.longPressAt(tester.getCenter(find.byType(LumoContextMenu)));
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('گزینه‌ها'), findsNothing);
    semantics.dispose();
  });
}
