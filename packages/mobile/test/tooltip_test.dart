// Tooltip: the message is the child's semantic `tooltip` (a description after
// the name, never the name), shown on long-press, on the inverted surface, in
// the reader's direction, under fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

/// The tip's own box: the Container carrying the tokens' decoration.
Finder tipBox(Color colour) => find.byWidgetPredicate((w) => w is Container && w.decoration is BoxDecoration && (w.decoration! as BoxDecoration).color == colour);

void main() {
  testWidgets('Tooltip fa-IR: the message is the button\'s tooltip (name stays the label, announced once), long-press shows it ONCE on the inverted surface, RTL inside, and it goes away', (tester) async {
    final semantics = tester.ensureSemantics();
    final c = lightColours(LumoBrand.achromatic);
    await tester.pumpWidget(app('fa-IR', LumoTooltip(message: 'حذف این ردیف', child: LumoIconButton(label: 'حذف', onPressed: () {}, child: const Icon(Icons.delete)))));
    // Not shown until asked; the semantics already carry it as a description.
    expect(find.text('حذف این ردیف'), findsNothing);
    expect(find.bySemanticsLabel('حذف'), findsOneWidget);
    expect(tester.getSemantics(find.byType(LumoIconButton)), containsSemantics(label: 'حذف', tooltip: 'حذف این ردیف', isButton: true));
    expect(find.bySemanticsLabel('حذف این ردیف'), findsNothing, reason: 'a tooltip is a description, never a name');
    await tester.longPress(find.byType(LumoIconButton));
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.text('حذف این ردیف'), findsOneWidget);
    expect(find.text('حذف'), findsNothing, reason: 'the icon button\'s own label tip lost the gesture: one tip, the description');
    expect(tipBox(c.fg), findsOneWidget, reason: 'the inverted surface: fg as background');
    expect(tester.widget<Text>(find.text('حذف این ردیف')).style?.color ?? DefaultTextStyle.of(tester.element(find.text('حذف این ردیف'))).style.color, c.bg);
    expect(Directionality.of(tester.element(find.text('حذف این ردیف'))), TextDirection.rtl);
    // The tip sits above the trigger by default (the web's `top`).
    expect(tester.getRect(find.text('حذف این ردیف')).bottom, lessThanOrEqualTo(tester.getRect(find.byType(LumoIconButton)).top));
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(find.text('حذف این ردیف'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Tooltip en-US: LTR inside, `bottom` placement below, `isDisabled` renders the child alone (no tooltip semantics)', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoTooltip(message: 'Delete this row', placement: LumoTooltipPlacement.bottom, child: LumoIconButton(label: 'Delete', onPressed: () {}, child: const Icon(Icons.delete))),
      LumoTooltip(message: 'Never shown', isDisabled: true, child: LumoButton(onPressed: () {}, child: const Text('Plain'))),
    ])));
    expect(tester.getSemantics(find.byType(LumoIconButton)), containsSemantics(label: 'Delete', tooltip: 'Delete this row'));
    expect(find.byType(Tooltip), findsNWidgets(2), reason: 'the icon button\'s own (excluded) tooltip and ours; the disabled one adds none');
    expect(tester.getSemantics(find.text('Plain')), isNot(containsSemantics(tooltip: 'Never shown')));
    await tester.longPress(find.byType(LumoIconButton));
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.text('Delete this row'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('Delete this row'))), TextDirection.ltr);
    expect(tester.getRect(find.text('Delete this row')).top, greaterThanOrEqualTo(tester.getRect(find.byType(LumoIconButton)).bottom));
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(find.text('Delete this row'), findsNothing);
    semantics.dispose();
  });
}
