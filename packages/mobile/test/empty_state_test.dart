import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

void main() {
  testWidgets('EmptyState: title is a header, description and action rendered, icon decorative (no semantics), fa-IR rtl', (tester) async {
    final semantics = tester.ensureSemantics();
    var pressed = 0;
    await tester.pumpWidget(app('fa-IR', LumoEmptyState(
      icon: const Icon(Icons.inbox),
      title: 'هنوز پروژه‌ای ندارید',
      description: 'اولین پروژه را بسازید تا اینجا نمایش داده شود.',
      actions: [LumoButton(onPressed: () => pressed++, child: const Text('ساخت پروژه'))],
    )));
    expect(Directionality.of(tester.element(find.text('هنوز پروژه‌ای ندارید'))), TextDirection.rtl);
    expect(tester.getSemantics(find.text('هنوز پروژه‌ای ندارید')), matchesSemantics(label: 'هنوز پروژه‌ای ندارید', isHeader: true));
    expect(find.bySemanticsLabel('هنوز پروژه‌ای ندارید'), findsOneWidget);
    expect(find.text('اولین پروژه را بسازید تا اینجا نمایش داده شود.'), findsOneWidget);
    // The icon is excluded: the Icon's semantics label is absent from the tree.
    expect(tester.getSemantics(find.byIcon(Icons.inbox)).getSemanticsData().label, isEmpty);
    await tester.tap(find.text('ساخت پروژه'));
    expect(pressed, 1);
    // Centred: title, description and action share the panel's centre line.
    final panel = tester.getRect(find.byType(LumoEmptyState));
    expect((tester.getCenter(find.text('هنوز پروژه‌ای ندارید')).dx - panel.center.dx).abs() < 1, isTrue);
    expect((tester.getCenter(find.text('ساخت پروژه')).dx - panel.center.dx).abs() < 1, isTrue);
    semantics.dispose();
  });

  testWidgets('EmptyState: en-US, minimal (title only), sizes change the rhythm', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoEmptyState(title: 'No results', size: LumoEmptyStateSize.sm)));
    expect(Directionality.of(tester.element(find.text('No results'))), TextDirection.ltr);
    expect(tester.getSemantics(find.text('No results')), matchesSemantics(label: 'No results', isHeader: true));
    final small = tester.getSize(find.byType(LumoEmptyState)).height;
    await tester.pumpWidget(app('en-US', const LumoEmptyState(title: 'No results', size: LumoEmptyStateSize.lg)));
    expect(tester.getSize(find.byType(LumoEmptyState)).height > small, isTrue);
    semantics.dispose();
  });
}
