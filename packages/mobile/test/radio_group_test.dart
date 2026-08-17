// Semantics-tree tests for LumoRadioGroup / LumoRadio: the group named once,
// each option a member of an exclusive group with its checked state, the
// circle at the inline START, controlled and uncontrolled selection.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

Finder circle() => find.byWidgetPredicate((w) => w is SizedBox && w.width == 20 && w.height == 20 && w.child is DecoratedBox);

void main() {
  testWidgets('RadioGroup: named ONCE by its label; each radio names ITSELF, in an exclusive group, with its checked state', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoRadioGroup(
      label: 'روش پرداخت',
      description: 'یکی را برگزینید',
      defaultValue: 'card',
      children: [LumoRadio(value: 'card', label: 'کارت بانکی'), LumoRadio(value: 'cash', label: 'نقدی', description: 'هنگام تحویل')],
    ))));
    expect(find.text('روش پرداخت'), findsOneWidget);
    expect(find.bySemanticsLabel('روش پرداخت'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('کارت بانکی')), matchesSemantics(label: 'کارت بانکی', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getSemantics(find.bySemanticsLabel('نقدی')), matchesSemantics(label: 'نقدی', hint: 'هنگام تحویل', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(find.text('هنگام تحویل'), findsOneWidget);
    expect(Directionality.of(tester.element(find.byType(LumoRadioGroup))), TextDirection.rtl);
    semantics.dispose();
  });

  testWidgets('RadioGroup: uncontrolled tap moves the selection and reports; controlled stays where the parent says', (tester) async {
    final semantics = tester.ensureSemantics();
    String? reported;
    await tester.pumpWidget(app('fa-IR', SizedBox(width: 320, child: LumoRadioGroup(
      label: 'اندازه',
      onChanged: (v) => reported = v,
      children: const [LumoRadio(value: 's', label: 'کوچک'), LumoRadio(value: 'l', label: 'بزرگ')],
    ))));
    expect(tester.getSemantics(find.bySemanticsLabel('کوچک')).getSemanticsData().flagsCollection.isChecked, isFalse);
    await tester.tap(find.text('بزرگ'));
    await tester.pumpAndSettle();
    expect(reported, 'l');
    expect(tester.getSemantics(find.bySemanticsLabel('بزرگ')).getSemanticsData().flagsCollection.isChecked, isTrue);
    expect(tester.getSemantics(find.bySemanticsLabel('کوچک')).getSemanticsData().flagsCollection.isChecked, isFalse);

    await tester.pumpWidget(app('fa-IR', SizedBox(width: 320, child: LumoRadioGroup(
      label: 'اندازه',
      value: 's',
      onChanged: (v) => reported = v,
      children: const [LumoRadio(value: 's', label: 'کوچک'), LumoRadio(value: 'l', label: 'بزرگ')],
    ))));
    await tester.tap(find.text('بزرگ'));
    await tester.pumpAndSettle();
    expect(reported, 'l');
    expect(tester.getSemantics(find.bySemanticsLabel('کوچک')).getSemanticsData().flagsCollection.isChecked, isTrue, reason: 'controlled: the parent did not move it');
    semantics.dispose();
  });

  testWidgets('RadioGroup: the circle sits at the inline START — right under fa-IR, left under en-US; horizontal lays out along the inline axis', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      final a = locale == 'fa-IR' ? 'روزانه' : 'Daily';
      final b = locale == 'fa-IR' ? 'هفتگی' : 'Weekly';
      await tester.pumpWidget(app(locale, SizedBox(width: 320, child: LumoRadioGroup(
        label: locale == 'fa-IR' ? 'بسامد' : 'Frequency',
        orientation: LumoRadioOrientation.horizontal,
        children: [LumoRadio(value: 'd', label: a), LumoRadio(value: 'w', label: b)],
      ))));
      final circleX = tester.getCenter(circle().first).dx;
      final textX = tester.getCenter(find.text(a)).dx;
      final rtl = locale == 'fa-IR';
      expect(rtl ? circleX > textX : circleX < textX, isTrue, reason: '$locale: the circle must sit at the reading start');
      // The first option is at the reading start of the row.
      final firstX = tester.getCenter(find.text(a)).dx;
      final secondX = tester.getCenter(find.text(b)).dx;
      expect(rtl ? firstX > secondX : firstX < secondX, isTrue, reason: '$locale: horizontal options follow the reading order');
      expect(Directionality.of(tester.element(find.byType(LumoRadioGroup))), rtl ? TextDirection.rtl : TextDirection.ltr);
    }
  });

  testWidgets('RadioGroup: disabled reaches every option (no tap); errorMessage shown once and announced live', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const SizedBox(width: 320, child: LumoRadioGroup(
      label: 'Plan',
      isDisabled: true,
      errorMessage: 'Choose a plan',
      children: [LumoRadio(value: 'a', label: 'Basic')],
    ))));
    final basic = tester.getSemantics(find.bySemanticsLabel('Basic')).getSemanticsData();
    expect(basic.flagsCollection.isEnabled, isFalse);
    expect(basic.hasAction(SemanticsAction.tap), isFalse);
    expect(find.text('Choose a plan'), findsOneWidget);
    expect(tester.getSemantics(find.text('Choose a plan')).getSemanticsData().flagsCollection.isLiveRegion, isTrue);
    semantics.dispose();
  });

  testWidgets('RadioGroup: accessibilityLabel names an unlabelled group', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoRadioGroup(accessibilityLabel: 'مرتب‌سازی', children: [LumoRadio(value: 'n', label: 'جدیدترین')]))));
    expect(find.bySemanticsLabel('مرتب‌سازی'), findsOneWidget);
    expect(find.text('مرتب‌سازی'), findsNothing);
    semantics.dispose();
  });

  test('RadioGroup: neither label nor accessibilityLabel is a construction error', () {
    expect(() => LumoRadioGroup(children: const []), throwsAssertionError);
  });
  testWidgets('RadioGroup: every option meets the 44 touch floor on BOTH axes — the drawn circle is still 20 and still at the inline start', (tester) async {
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 360, child: LumoRadioGroup(
      label: 'روش پرداخت',
      defaultValue: 'a',
      children: [LumoRadio(value: 'a', label: 'ای'), LumoRadio(value: 'b', label: 'کارت به کارت اینترنتی')],
    ))));
    for (final label in ['ای', 'کارت به کارت اینترنتی']) {
      final row = tester.getRect(find.ancestor(of: find.text(label), matching: find.byType(InkWell)).first);
      expect(row.width, greaterThanOrEqualTo(LumoControl.lg), reason: '$label width — it measured 56.5 for a short label');
      expect(row.height, greaterThanOrEqualTo(LumoControl.lg), reason: '$label height — it measured 36');
    }
    // No visual drift: the indicator is untouched and still starts the row.
    expect(tester.getSize(circle().first), const Size(20, 20));
    final firstRow = tester.getRect(find.ancestor(of: find.text('ای'), matching: find.byType(InkWell)).first);
    expect(tester.getRect(circle().first).right, firstRow.right, reason: 'fa-IR: the circle is at the RIGHT edge of its row');
  });

  testWidgets('RadioGroup: under disableAnimations the dot ARRIVES at full size in ONE frame', (tester) async {
    Widget build(String value, bool reduce) => MaterialApp(
          theme: lumoThemeData(brightness: Brightness.light),
          home: MediaQuery(
            data: MediaQueryData(disableAnimations: reduce),
            child: LumoScope(locale: 'fa-IR', brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: LumoRadioGroup(
              label: 'روش پرداخت',
              value: value,
              children: const [LumoRadio(value: 'a', label: 'کارت'), LumoRadio(value: 'b', label: 'نقدی')],
            ))))),
          ),
        );
    Finder dotOf(String label) => find.descendant(
          of: find.ancestor(of: find.text(label), matching: find.byType(LumoRadio)),
          matching: find.descendant(of: find.byType(AnimatedScale), matching: find.byType(Container)),
        );

    // Sanity: WITH motion, one frame after the change the dot is still growing.
    await tester.pumpWidget(build('a', false));
    await tester.pumpAndSettle();
    await tester.pumpWidget(build('b', false));
    await tester.pump();
    expect(tester.getRect(dotOf('نقدی')).width, lessThan(8.0));
    await tester.pumpAndSettle();

    // Under «Reduce motion»: full size on the next frame, with no animation pumped through.
    await tester.pumpWidget(build('a', true));
    await tester.pumpAndSettle();
    await tester.pumpWidget(build('b', true));
    await tester.pump();
    expect(tester.getRect(dotOf('نقدی')).width, 8.0);
    expect(tester.getRect(dotOf('کارت')).width, 0.0);
  });

}
