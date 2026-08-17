import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {double width = 360}) => MaterialApp(
  theme: lumoThemeData(brightness: Brightness.light),
  home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: width, child: child)))),
);

void main() {
  testWidgets('Toolbar: named group with the controls as its own nodes; first control at the RIGHT under fa-IR; the separator is silent', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoToolbar(
      label: 'قالب‌بندی متن',
      children: [
        LumoIconButton(label: 'پررنگ', onPressed: () {}, child: const Icon(Icons.format_bold)),
        const LumoToolbarSeparator(),
        LumoIconButton(label: 'پیوند', onPressed: () {}, child: const Icon(Icons.link)),
      ],
    )));
    expect(Directionality.of(tester.element(find.byType(LumoToolbar))), TextDirection.rtl);

    // The group is named ONCE; the controls keep their own names under it.
    expect(find.bySemanticsLabel('قالب‌بندی متن'), findsOneWidget);
    expect(find.bySemanticsLabel('پررنگ'), findsOneWidget);
    expect(find.bySemanticsLabel('پیوند'), findsOneWidget);

    // Reading order: the strip hugs the reading START edge — the RIGHT under
    // fa-IR — and the first control is the outermost one on that side.
    final bar = tester.getRect(find.byType(LumoToolbar));
    expect(tester.getRect(find.bySemanticsLabel('پررنگ')).right, closeTo(bar.right, 0.01));
    expect(tester.getCenter(find.bySemanticsLabel('پررنگ')).dx > tester.getCenter(find.bySemanticsLabel('پیوند')).dx, isTrue);

    // The separator is decoration: a vertical hairline beside a horizontal toolbar, no node of its own.
    final rule = tester.getRect(find.descendant(of: find.byType(LumoToolbarSeparator), matching: find.byType(ColoredBox)));
    expect(rule.width, 1);
    expect(rule.height, 24);
    expect(rule.center.dx < tester.getCenter(find.bySemanticsLabel('پررنگ')).dx, isTrue, reason: 'the rule sits between the two controls');
    expect(tester.getSemantics(find.byType(LumoToolbarSeparator)).getSemanticsData().label, isEmpty);
    semantics.dispose();
  });

  testWidgets('Toolbar: first control at the LEFT under en-US; a cramped toolbar SCROLLS rather than truncating; every control stays reachable', (tester) async {
    final semantics = tester.ensureSemantics();
    List<Widget> many() => [for (var i = 0; i < 10; i++) LumoIconButton(label: 'Action ${i + 1}', onPressed: () {}, child: const Icon(Icons.star))];
    await tester.pumpWidget(app('en-US', LumoToolbar(label: 'Editor actions', children: many()), width: 160));
    final strip = tester.getRect(find.descendant(of: find.byType(LumoToolbar), matching: find.byType(Row)).first);
    expect(strip.width > 160, isTrue, reason: 'the strip is wider than the viewport — it overflows into the scroll view');
    expect(find.byType(Scrollable), findsOneWidget);
    // Nothing was dropped: all ten controls are in the tree with their own names.
    expect(find.bySemanticsLabel('Action 1'), findsOneWidget);
    expect(find.bySemanticsLabel('Action 10'), findsOneWidget);
    // The scroll starts at the reading start: the first control is at the LEFT under en-US.
    expect(tester.getCenter(find.bySemanticsLabel('Action 1')).dx < tester.getCenter(find.bySemanticsLabel('Action 2')).dx, isTrue);
    expect(tester.getRect(find.bySemanticsLabel('Action 1')).left, closeTo(tester.getRect(find.byType(LumoToolbar)).left, 0.01));
    semantics.dispose();
  });

  testWidgets('Toolbar: wrap overflow flows onto further lines; vertical orientation stacks and its separator is a horizontal rule', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoToolbar(
      label: 'ابزارها',
      overflow: LumoToolbarOverflow.wrap,
      children: [for (var i = 0; i < 10; i++) LumoIconButton(label: 'کنش ${i + 1}', onPressed: () {}, child: const Icon(Icons.star))],
    ), width: 160));
    expect(find.byType(Wrap), findsOneWidget);
    expect(tester.getRect(find.byType(LumoToolbar)).height > 40, isTrue, reason: 'the controls ran onto further lines');
    // The first control of the first run is at the RIGHT of the second under fa-IR.
    expect(tester.getCenter(find.bySemanticsLabel('کنش 1')).dx > tester.getCenter(find.bySemanticsLabel('کنش 2')).dx, isTrue);

    await tester.pumpWidget(app('fa-IR', LumoToolbar(
      label: 'ابزارهای عمودی',
      orientation: LumoToolbarOrientation.vertical,
      children: [
        LumoIconButton(label: 'بالا', onPressed: () {}, child: const Icon(Icons.arrow_upward)),
        const LumoToolbarSeparator(),
        LumoIconButton(label: 'پایین', onPressed: () {}, child: const Icon(Icons.arrow_downward)),
      ],
    )));
    // The block axis: the first control is ABOVE the second, and nothing mirrors.
    expect(tester.getCenter(find.bySemanticsLabel('بالا')).dy < tester.getCenter(find.bySemanticsLabel('پایین')).dy, isTrue);
    final rule = tester.getRect(find.descendant(of: find.byType(LumoToolbarSeparator), matching: find.byType(ColoredBox)));
    expect(rule.height, 1);
    expect(rule.width > 1, isTrue, reason: 'a vertical toolbar is ruled ACROSS, on the block axis');
    semantics.dispose();
  });
}
