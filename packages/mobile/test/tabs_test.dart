import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

const tabs = [LumoTab(id: 'profile', label: 'پروفایل'), LumoTab(id: 'security', label: 'امنیت', badge: '۳'), LumoTab(id: 'billing', label: 'صورتحساب')];

Finder tabOf(String label) => find.ancestor(of: find.text(label), matching: find.byType(InkWell)).first;
Finder indicatorOf(String label) => find.descendant(of: tabOf(label), matching: find.byType(AnimatedContainer));

void main() {
  testWidgets('Tabs: list named by label; tabs selected/button-like; name announced once; first tab at the RIGHT under fa-IR', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoTabs(label: 'بخش‌های حساب', tabs: tabs, views: {for (final t in tabs) t.id: (_) => Text('محتوای ${t.label}')})));
    await tester.pumpAndSettle();
    expect(Directionality.of(tester.element(find.text('پروفایل'))), TextDirection.rtl);
    // The list is a tabBar group named by `label`.
    final list = tester.getSemantics(find.bySemanticsLabel('بخش‌های حساب'));
    expect(list.getSemanticsData().role, SemanticsRole.tabBar);
    // Each tab: role tab, selected state, tap action, name once — the visible text is excluded.
    final first = tester.getSemantics(tabOf('پروفایل'));
    expect(first, matchesSemantics(label: 'پروفایل', isSelected: true, hasSelectedState: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(first.getSemanticsData().role, SemanticsRole.tab);
    final second = tester.getSemantics(tabOf('امنیت'));
    expect(second, matchesSemantics(label: 'امنیت', value: '۳', isSelected: false, hasSelectedState: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    // The tab node is the only place «امنیت» is a semantics label (the panel names itself after the SELECTED tab only).
    expect(find.bySemanticsLabel('امنیت'), findsOneWidget);
    // Geometry: the first tab sits at the RIGHT under fa-IR; the indicator is under the selected tab only.
    final row = tester.getRect(find.byType(LumoTabs));
    expect(tester.getCenter(tabOf('پروفایل')).dx > row.center.dx, isTrue, reason: 'first tab at the right under fa-IR');
    expect(tester.getCenter(tabOf('صورتحساب')).dx < row.center.dx, isTrue);
    final ind = tester.getRect(indicatorOf('پروفایل'));
    final tabRect = tester.getRect(tabOf('پروفایل'));
    expect(ind.bottom, tabRect.bottom, reason: 'the indicator is at the block end of its tab');
    expect(ind.height, 2);
    final c = LumoScope.of(tester.element(find.text('پروفایل'))).colours;
    expect((tester.widget<AnimatedContainer>(indicatorOf('پروفایل')).decoration as BoxDecoration).color, c.accent);
    expect((tester.widget<AnimatedContainer>(indicatorOf('امنیت')).decoration as BoxDecoration).color, Colors.transparent);
    // The selected panel is shown, the others are not built.
    expect(find.text('محتوای پروفایل'), findsOneWidget);
    expect(find.text('محتوای امنیت'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Tabs: tap selects (uncontrolled), onChanged fires, the indicator moves; controlled value wins', (tester) async {
    final semantics = tester.ensureSemantics();
    String? changed;
    await tester.pumpWidget(app('fa-IR', LumoTabs(label: 'بخش‌ها', tabs: tabs, onChanged: (id) => changed = id, builder: (_, id) => Text('پنل $id'))));
    await tester.tap(find.text('امنیت'));
    await tester.pumpAndSettle();
    expect(changed, 'security');
    expect(find.text('پنل security'), findsOneWidget);
    expect(tester.getSemantics(tabOf('امنیت')), matchesSemantics(label: 'امنیت', value: '۳', isSelected: true, hasSelectedState: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    final c = LumoScope.of(tester.element(find.text('امنیت'))).colours;
    expect((tester.widget<AnimatedContainer>(indicatorOf('امنیت')).decoration as BoxDecoration).color, c.accent);
    expect((tester.widget<AnimatedContainer>(indicatorOf('پروفایل')).decoration as BoxDecoration).color, Colors.transparent);
    // Controlled: the tap reports, the selection does not move until the parent says so.
    await tester.pumpWidget(app('fa-IR', LumoTabs(label: 'بخش‌ها', tabs: tabs, value: 'billing', onChanged: (id) => changed = id, builder: (_, id) => Text('پنل $id'))));
    await tester.pumpAndSettle();
    await tester.tap(find.text('پروفایل'));
    await tester.pumpAndSettle();
    expect(changed, 'profile');
    expect(find.text('پنل billing'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Tabs: first tab at the LEFT under en-US; pill variant; disabled tab has no tap', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoTabs(label: 'Account sections', variant: LumoTabsVariant.pill, tabs: [LumoTab(id: 'a', label: 'Profile'), LumoTab(id: 'b', label: 'Security'), LumoTab(id: 'c', label: 'Billing', isDisabled: true)])));
    await tester.pumpAndSettle();
    expect(Directionality.of(tester.element(find.text('Profile'))), TextDirection.ltr);
    final row = tester.getRect(find.byType(LumoTabs));
    expect(tester.getCenter(tabOf('Profile')).dx < row.center.dx, isTrue, reason: 'first tab at the left under en-US');
    expect(tester.getSemantics(tabOf('Billing')), matchesSemantics(label: 'Billing', isSelected: false, hasSelectedState: true, hasEnabledState: true, isEnabled: false));
    final c = LumoScope.of(tester.element(find.text('Profile'))).colours;
    expect((tester.widget<AnimatedContainer>(find.descendant(of: tabOf('Profile'), matching: find.byType(AnimatedContainer))).decoration as BoxDecoration).color, c.accent);
    semantics.dispose();
  });
}
