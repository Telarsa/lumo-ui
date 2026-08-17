import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
  theme: lumoThemeData(brightness: Brightness.light),
  home: LumoScope(
    locale: locale,
    brightness: Brightness.light,
    child: Scaffold(body: Column(mainAxisSize: MainAxisSize.min, children: [SizedBox(width: 360, child: child)])),
  ),
);

void main() {
  testWidgets('AppBar: title is a header announced once; back button at the inline START (right under fa-IR); actions at the END; the chevron is DIRECTIONAL', (tester) async {
    final semantics = tester.ensureSemantics();
    var backs = 0;
    await tester.pumpWidget(app('fa-IR', LumoAppBar(
      title: 'جزئیات سفارش',
      subtitle: 'کد ۱۲۳۴',
      onBack: () => backs++,
      backLabel: 'بازگشت',
      actions: [LumoIconButton(label: 'اعلان‌ها', onPressed: () {}, child: const Icon(Icons.notifications_none))],
    )));
    expect(Directionality.of(tester.element(find.text('جزئیات سفارش'))), TextDirection.rtl);

    // The title is a header, and the words exist exactly once in the tree.
    expect(tester.getSemantics(find.text('جزئیات سفارش')).getSemanticsData().flagsCollection.isHeader, isTrue);
    expect(find.bySemanticsLabel('جزئیات سفارش'), findsOneWidget);
    expect(find.text('کد ۱۲۳۴'), findsOneWidget);
    expect(find.bySemanticsLabel('بازگشت'), findsOneWidget);

    // Geometry: the back button is at the reading START = the RIGHT under fa-IR; actions at the END.
    final bar = tester.getRect(find.byType(LumoAppBar));
    expect(tester.getCenter(find.bySemanticsLabel('بازگشت')).dx > bar.center.dx, isTrue, reason: 'back at the inline start = right under fa-IR');
    expect(tester.getCenter(find.bySemanticsLabel('اعلان‌ها')).dx < bar.center.dx, isTrue, reason: 'actions at the inline end = left under fa-IR');

    // The chevron mirrors ITSELF: `matchTextDirection` is what makes "back" point
    // the way the reading order came from, and under RTL the Icon flips the glyph.
    final chevron = tester.widget<Icon>(find.byIcon(Icons.chevron_left));
    expect(chevron.icon!.matchTextDirection, isTrue);
    expect(find.descendant(of: find.byIcon(Icons.chevron_left), matching: find.byType(Transform)), findsOneWidget, reason: 'the glyph is mirrored under fa-IR');

    await tester.tap(find.bySemanticsLabel('بازگشت'));
    expect(backs, 1);
    semantics.dispose();
  });

  testWidgets('AppBar: back button at the LEFT under en-US and the chevron is NOT mirrored; a custom leading takes the slot; no back button, no chevron', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoAppBar(title: 'Order details', onBack: () {}, backLabel: 'Back to orders')));
    final bar = tester.getRect(find.byType(LumoAppBar));
    expect(tester.getCenter(find.bySemanticsLabel('Back to orders')).dx < bar.center.dx, isTrue, reason: 'back at the inline start = left under en-US');
    expect(find.descendant(of: find.byIcon(Icons.chevron_left), matching: find.byType(Transform)), findsNothing, reason: 'no mirror under en-US');

    // A caller's own leading widget takes the slot, and no chevron is drawn.
    await tester.pumpWidget(app('fa-IR', LumoAppBar(title: 'خانه', leading: LumoIconButton(label: 'منو', onPressed: () {}, child: const Icon(Icons.menu)))));
    expect(find.byIcon(Icons.chevron_left), findsNothing);
    final bar2 = tester.getRect(find.byType(LumoAppBar));
    expect(tester.getCenter(find.bySemanticsLabel('منو')).dx > bar2.center.dx, isTrue);
    // Without a back button the title is NOT centred: it starts at the reading start.
    expect(tester.getCenter(find.text('خانه')).dx > bar2.center.dx, isTrue);
    semantics.dispose();
  });

  testWidgets('AppBar: onBack without backLabel is refused at construction; centerTitle overrides; preferredSize grows with a subtitle', (tester) async {
    expect(() => LumoAppBar(title: 'جزئیات', onBack: () {}), throwsAssertionError);
    expect(() => LumoAppBar(title: 'جزئیات', onBack: () {}, backLabel: 'بازگشت', leading: const SizedBox()), throwsAssertionError);
    expect(const LumoAppBar(title: 'جزئیات').preferredSize.height, 57);
    expect(const LumoAppBar(title: 'جزئیات', subtitle: 'کد ۱۲۳۴').preferredSize.height, 65);

    // centerTitle: false keeps the title at the reading start even with a back button.
    await tester.pumpWidget(app('fa-IR', LumoAppBar(title: 'جزئیات', onBack: () {}, backLabel: 'بازگشت', centerTitle: false)));
    final bar = tester.getRect(find.byType(LumoAppBar));
    final title = tester.getRect(find.text('جزئیات'));
    expect(title.right > bar.center.dx, isTrue, reason: 'the title starts at the right under fa-IR');
  });
}
