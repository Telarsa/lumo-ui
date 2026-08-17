import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

const steps = [LumoStep(title: 'انتخاب طرح'), LumoStep(title: 'پرداخت', description: 'کارت یا کیف پول'), LumoStep(title: 'تأیید')];

void main() {
  testWidgets('Steps: a list named by label; each step announces title + state word once; Persian disc digits; first step at the RIGHT under fa-IR', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoSteps(label: 'مراحل ثبت‌نام', steps: steps, current: 1, completedLabel: 'تکمیل‌شده', currentLabel: 'مرحلهٔ فعلی', upcomingLabel: 'انجام‌نشده')));
    expect(Directionality.of(tester.element(find.text('پرداخت'))), TextDirection.rtl);
    final list = tester.getSemantics(find.bySemanticsLabel('مراحل ثبت‌نام'));
    expect(list.getSemanticsData().role, SemanticsRole.list);
    // The state words, once each — after the title, before the description.
    expect(find.bySemanticsLabel(RegExp('تکمیل‌شده')), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('مرحلهٔ فعلی')), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('انجام‌نشده')), findsOneWidget);
    expect(tester.getSemantics(find.text('انتخاب طرح')).getSemanticsData().label, 'انتخاب طرح\nتکمیل‌شده');
    expect(tester.getSemantics(find.text('پرداخت')).getSemanticsData().label, 'پرداخت\nمرحلهٔ فعلی\nکارت یا کیف پول');
    expect(tester.getSemantics(find.text('پرداخت')).getSemanticsData().role, SemanticsRole.listItem);
    // Disc numbers in Persian digits, decorative.
    expect(find.text('۱'), findsOneWidget);
    expect(find.text('۳'), findsOneWidget);
    expect(find.bySemanticsLabel('۱'), findsNothing);
    // Order: step 1 at the right, step 3 at the left.
    expect(tester.getCenter(find.text('انتخاب طرح')).dx > tester.getCenter(find.text('تأیید')).dx, isTrue, reason: 'right→left under fa-IR');
    expect(tester.getCenter(find.text('۱')).dx > tester.getCenter(find.text('انتخاب طرح')).dx, isTrue, reason: 'the disc precedes its title in reading order');
    semantics.dispose();
  });

  testWidgets('Steps: en-US left→right, Latin digits; vertical orientation stacks top→bottom; all-complete position', (tester) async {
    final semantics = tester.ensureSemantics();
    const en = [LumoStep(title: 'Plan'), LumoStep(title: 'Pay'), LumoStep(title: 'Confirm')];
    await tester.pumpWidget(app('en-US', const LumoSteps(label: 'Signup steps', steps: en, current: 0, completedLabel: 'Completed', currentLabel: 'Current step', upcomingLabel: 'Not started')));
    expect(tester.getCenter(find.text('Plan')).dx < tester.getCenter(find.text('Confirm')).dx, isTrue);
    expect(find.text('1'), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('Not started')), findsNWidgets(2));
    await tester.pumpWidget(app('en-US', const LumoSteps(label: 'Signup steps', steps: en, current: 3, orientation: LumoStepsOrientation.vertical, completedLabel: 'Completed', currentLabel: 'Current step', upcomingLabel: 'Not started')));
    expect(find.bySemanticsLabel(RegExp('Completed')), findsNWidgets(3));
    expect(find.bySemanticsLabel(RegExp('Current step')), findsNothing);
    expect(tester.getCenter(find.text('Plan')).dy < tester.getCenter(find.text('Confirm')).dy, isTrue);
    expect(tester.getRect(find.text('Plan')).left, closeTo(tester.getRect(find.text('Confirm')).left, 0.5), reason: 'titles start-aligned = left under en-US');
    semantics.dispose();
  });

  testWidgets('Steps: a cramped horizontal stepper sheds the description before it truncates a title, and never overflows the row', (tester) async {
    final semantics = tester.ensureSemantics();
    Widget narrow(double width, Widget child) => MaterialApp(
          theme: lumoThemeData(brightness: Brightness.light),
          home: LumoScope(locale: 'fa-IR', brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: width, child: child)))),
        );
    const long = 'گزارش عملکرد سه‌ماههٔ چهارم شرکت';
    const cramped = [LumoStep(title: long, description: long), LumoStep(title: long), LumoStep(title: long)];
    // Before this pass: «A RenderFlex overflowed by 152 pixels on the right» at
    // 320 dp — the LAST step was the one item that was not `Flexible`.
    for (final width in [320.0, 240.0]) {
      await tester.pumpWidget(narrow(width, const LumoSteps(label: 'مراحل', steps: cramped, current: 1, completedLabel: 'تکمیل‌شده', currentLabel: 'مرحلهٔ فعلی', upcomingLabel: 'انجام‌نشده')));
      expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow at $width dp');
    }
    // The description left the PICTURE and stayed in the READING.
    expect(find.text(long), findsNWidgets(3), reason: 'three titles, no fourth line');
    expect(tester.getSemantics(find.text(long).first).getSemanticsData().label, contains(long));
    expect(find.bySemanticsLabel(RegExp(long)), findsWidgets);
    // With room, the description is drawn again.
    await tester.pumpWidget(narrow(360, const LumoSteps(label: 'مراحل', steps: steps, current: 1, completedLabel: 'تکمیل‌شده', currentLabel: 'مرحلهٔ فعلی', upcomingLabel: 'انجام‌نشده')));
    expect(tester.takeException(), isNull);
    semantics.dispose();
  });
}
