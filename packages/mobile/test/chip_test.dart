// Semantics-tree tests for LumoChip / LumoTagGroup: the label as text, the ✕
// a button named by removeLabel (once) at the inline END (left under fa-IR,
// right under en-US), the selectable chip a button with its selected state,
// the group named once and its remove names built by the function.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

void main() {
  testWidgets('Chip: static — the label is text, no button; removable — the ✕ is a button named by removeLabel, exactly once, and fires onRemove', (tester) async {
    final semantics = tester.ensureSemantics();
    var removed = 0;
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      const LumoChip(label: 'تهران'),
      LumoChip(label: 'شیراز', onRemove: () => removed++, removeLabel: 'حذف شیراز'),
    ])));
    expect(find.text('تهران'), findsOneWidget);
    expect(tester.getSemantics(find.text('تهران')).getSemanticsData().flagsCollection.isButton, isFalse);
    expect(find.bySemanticsLabel('حذف شیراز'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('حذف شیراز')), matchesSemantics(label: 'حذف شیراز', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(find.text('حذف شیراز'), findsNothing, reason: 'the remove name is announced, not drawn');
    await tester.tap(find.bySemanticsLabel('حذف شیراز'));
    expect(removed, 1);
    semantics.dispose();
  });

  testWidgets('Chip: the ✕ sits at the inline END — left of the text under fa-IR, right under en-US', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final label = rtl ? 'اصفهان' : 'Isfahan';
      await tester.pumpWidget(app(locale, LumoChip(label: label, onRemove: () {}, removeLabel: rtl ? 'حذف اصفهان' : 'Remove Isfahan')));
      final xX = tester.getCenter(find.byIcon(Icons.close)).dx;
      final textX = tester.getCenter(find.text(label)).dx;
      expect(rtl ? xX < textX : xX > textX, isTrue, reason: '$locale: the ✕ must sit at the reading end');
      expect(Directionality.of(tester.element(find.byType(LumoChip))), rtl ? TextDirection.rtl : TextDirection.ltr);
    }
  });

  testWidgets('Chip: selectable — a button with its selected state, named ONCE by the label, tap reports the next state; disabled has no tap', (tester) async {
    final semantics = tester.ensureSemantics();
    bool? reported;
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoChip(label: 'ارزان‌ترین', isSelected: true, onChanged: (v) => reported = v),
      LumoChip(label: 'جدیدترین', onChanged: (v) => reported = v, isDisabled: true),
    ])));
    expect(find.bySemanticsLabel('ارزان‌ترین'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('ارزان‌ترین')), matchesSemantics(label: 'ارزان‌ترین', isButton: true, hasSelectedState: true, isSelected: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    await tester.tap(find.text('ارزان‌ترین'));
    expect(reported, isFalse);
    final off = tester.getSemantics(find.bySemanticsLabel('جدیدترین')).getSemanticsData();
    expect(off.flagsCollection.isEnabled, isFalse);
    expect(off.hasAction(SemanticsAction.tap), isFalse);
    semantics.dispose();
  });

  testWidgets('Chip: selectable AND removable — one button for the chip, one for the ✕, each named once', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoChip(label: 'Tehran', icon: const Icon(Icons.place), isSelected: false, onChanged: (_) {}, onRemove: () {}, removeLabel: 'Remove Tehran')));
    expect(find.bySemanticsLabel('Tehran'), findsOneWidget);
    expect(find.bySemanticsLabel('Remove Tehran'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('Remove Tehran')).getSemanticsData().flagsCollection.isButton, isTrue);
    semantics.dispose();
  });

  testWidgets('TagGroup: named ONCE by its label; static tags are text; removable tags get ✕ buttons named by removeLabel(textValue) and onRemove gets the id', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoTagGroup(label: 'برچسب‌ها', items: [LumoTagItem(id: 'a', textValue: 'طراحی'), LumoTagItem(id: 'b', textValue: 'وب')]))));
    expect(find.bySemanticsLabel('برچسب‌ها'), findsOneWidget);
    expect(find.text('طراحی'), findsOneWidget);
    expect(find.byIcon(Icons.close), findsNothing);

    String? removed;
    await tester.pumpWidget(app('fa-IR', SizedBox(width: 320, child: LumoTagGroup(
      label: 'فیلترهای فعال',
      items: const [LumoTagItem(id: 'thr', textValue: 'تهران'), LumoTagItem(id: 'shz', textValue: 'شیراز')],
      onRemove: (id) => removed = id,
      removeLabel: (t) => 'حذف $t',
    ))));
    expect(find.bySemanticsLabel('فیلترهای فعال'), findsOneWidget);
    expect(find.bySemanticsLabel('حذف تهران'), findsOneWidget);
    expect(find.bySemanticsLabel('حذف شیراز'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('حذف شیراز'));
    expect(removed, 'shz');
    semantics.dispose();
  });

  test('Chip / TagGroup: onRemove without removeLabel is a construction error', () {
    expect(() => LumoChip(label: 'x', onRemove: () {}), throwsAssertionError);
    expect(() => LumoTagGroup(label: 'x', items: const [], onRemove: (_) {}), throwsAssertionError);
    expect(() => LumoTagGroup(label: 'x', items: const [], removeLabel: (t) => t), throwsAssertionError);
  });
}
