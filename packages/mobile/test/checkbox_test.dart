// Semantics-tree tests for LumoCheckbox / LumoCheckboxGroup: names, the checked
// and MIXED states, the box at the inline START (right under fa-IR, left under
// en-US), the group named once, the error announced.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

Finder box() => find.byWidgetPredicate((w) => w is SizedBox && w.width == 20 && w.height == 20 && w.child is DecoratedBox);

void main() {
  testWidgets('Checkbox: named by its label, checked state, tap toggles (uncontrolled) and reports', (tester) async {
    final semantics = tester.ensureSemantics();
    bool? reported;
    await tester.pumpWidget(app('fa-IR', LumoCheckbox(label: 'قوانین را می‌پذیرم', onChanged: (v) => reported = v)));
    expect(tester.getSemantics(find.bySemanticsLabel('قوانین را می‌پذیرم')), matchesSemantics(label: 'قوانین را می‌پذیرم', hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(find.text('قوانین را می‌پذیرم'), findsOneWidget);
    await tester.tap(find.text('قوانین را می‌پذیرم'));
    await tester.pumpAndSettle();
    expect(reported, isTrue);
    expect(tester.getSemantics(find.bySemanticsLabel('قوانین را می‌پذیرم')), matchesSemantics(label: 'قوانین را می‌پذیرم', hasCheckedState: true, isChecked: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(Directionality.of(tester.element(find.byType(LumoCheckbox))), TextDirection.rtl);
    semantics.dispose();
  });

  testWidgets('Checkbox: controlled stays where the parent says; disabled has no tap; accessibilityLabel names an unlabelled box', (tester) async {
    final semantics = tester.ensureSemantics();
    var calls = 0;
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoCheckbox(label: 'کنترل‌شده', isSelected: false, onChanged: (_) => calls++),
      const LumoCheckbox(label: 'غیرفعال', isDisabled: true),
      const LumoCheckbox(accessibilityLabel: 'انتخاب همه', isSelected: true),
    ])));
    await tester.tap(find.text('کنترل‌شده'));
    await tester.pumpAndSettle();
    expect(calls, 1);
    expect(tester.getSemantics(find.bySemanticsLabel('کنترل‌شده')), matchesSemantics(label: 'کنترل‌شده', hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getSemantics(find.bySemanticsLabel('غیرفعال')), matchesSemantics(label: 'غیرفعال', hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: false));
    expect(tester.getSemantics(find.bySemanticsLabel('انتخاب همه')), matchesSemantics(label: 'انتخاب همه', hasCheckedState: true, isChecked: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(find.text('انتخاب همه'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Checkbox: the mixed state is announced as mixed, and a press on it resolves to checked', (tester) async {
    final semantics = tester.ensureSemantics();
    bool? reported;
    await tester.pumpWidget(app('fa-IR', LumoCheckbox(label: 'همه موارد', isIndeterminate: true, isSelected: false, onChanged: (v) => reported = v)));
    final data = tester.getSemantics(find.bySemanticsLabel('همه موارد')).getSemanticsData();
    expect(data.flagsCollection.hasCheckedState, isTrue);
    expect(data.flagsCollection.isCheckStateMixed, isTrue);
    expect(data.flagsCollection.isChecked, isFalse);
    await tester.tap(find.text('همه موارد'));
    expect(reported, isTrue);
    semantics.dispose();
  });

  testWidgets('Checkbox: the box sits at the inline START — right of the label under fa-IR, left under en-US', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      final label = locale == 'fa-IR' ? 'خبرنامه' : 'Newsletter';
      await tester.pumpWidget(app(locale, SizedBox(width: 300, child: LumoCheckbox(label: label, description: locale == 'fa-IR' ? 'هفته‌ای یک بار' : 'Once a week'))));
      final boxX = tester.getCenter(box()).dx;
      final textX = tester.getCenter(find.text(label)).dx;
      expect(locale == 'fa-IR' ? boxX > textX : boxX < textX, isTrue, reason: '$locale: the box must sit at the reading start');
      expect(Directionality.of(tester.element(find.byType(LumoCheckbox))), locale == 'fa-IR' ? TextDirection.rtl : TextDirection.ltr);
    }
  });

  testWidgets('Checkbox: description read as the hint, errorMessage shown once and announced live', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoCheckbox(label: 'شرایط', description: 'برای ادامه لازم است', errorMessage: 'پذیرش شرایط الزامی است'))));
    expect(find.text('پذیرش شرایط الزامی است'), findsOneWidget);
    expect(find.text('برای ادامه لازم است'), findsOneWidget);
    final data = tester.getSemantics(find.bySemanticsLabel('شرایط')).getSemanticsData();
    expect(data.hint, contains('برای ادامه لازم است'));
    expect(tester.getSemantics(find.text('پذیرش شرایط الزامی است')).getSemanticsData().flagsCollection.isLiveRegion, isTrue);
    semantics.dispose();
  });

  testWidgets('CheckboxGroup: named ONCE by its label, each option its own checked node, disabled and error reach the children', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoCheckboxGroup(
      label: 'روش تماس',
      description: 'یک یا چند مورد',
      errorMessage: 'دست‌کم یک مورد را انتخاب کنید',
      children: [LumoCheckbox(label: 'پیامک', isSelected: true), LumoCheckbox(label: 'رایانامه')],
    ))));
    expect(find.text('روش تماس'), findsOneWidget);
    expect(find.bySemanticsLabel('روش تماس'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('پیامک')), matchesSemantics(label: 'پیامک', hasCheckedState: true, isChecked: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getSemantics(find.bySemanticsLabel('رایانامه')), matchesSemantics(label: 'رایانامه', hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(find.text('دست‌کم یک مورد را انتخاب کنید'), findsOneWidget);

    await tester.pumpWidget(app('en-US', const SizedBox(width: 320, child: LumoCheckboxGroup(label: 'Contact', isDisabled: true, children: [LumoCheckbox(label: 'SMS')]))));
    final sms = tester.getSemantics(find.bySemanticsLabel('SMS')).getSemanticsData();
    expect(sms.flagsCollection.hasCheckedState && sms.flagsCollection.hasEnabledState && !sms.flagsCollection.isEnabled, isTrue, reason: 'the group\'s isDisabled reaches the child');
    expect(sms.hasAction(SemanticsAction.tap), isFalse);
    expect(Directionality.of(tester.element(find.byType(LumoCheckboxGroup))), TextDirection.ltr);
    semantics.dispose();
  });

  test('Checkbox: neither label nor accessibilityLabel is a construction error', () {
    expect(() => LumoCheckbox(), throwsAssertionError);
  });
  testWidgets('Checkbox: the row meets the 44 touch floor on BOTH axes — the drawn box is still 20 and still at the inline start', (tester) async {
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 360, child: LumoCheckboxGroup(
      label: 'روش تماس',
      children: [LumoCheckbox(label: 'ای'), LumoCheckbox(label: 'تماس تلفنی در ساعات اداری')],
    ))));
    for (final label in ['ای', 'تماس تلفنی در ساعات اداری']) {
      final row = tester.getRect(find.ancestor(of: find.text(label), matching: find.byType(InkWell)).first);
      expect(row.width, greaterThanOrEqualTo(LumoControl.lg), reason: '$label width — it measured 56.5 for a short label');
      expect(row.height, greaterThanOrEqualTo(LumoControl.lg), reason: '$label height — it measured 36');
    }
    expect(tester.getSize(box().first), const Size(20, 20));
    final firstRow = tester.getRect(find.ancestor(of: find.text('ای'), matching: find.byType(InkWell)).first);
    expect(tester.getRect(box().first).right, firstRow.right, reason: 'fa-IR: the box is at the RIGHT edge of its row');
  });

}
