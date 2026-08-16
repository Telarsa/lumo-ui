// The date field's semantics tree and geometry: named by its label, the calendar
// button named by openLabel, the sheet's month caption in the reader's calendar,
// the grid's first column (Saturday under fa-IR, at the RIGHT; Sunday under
// en-US, at the LEFT), previous/next named and ordered for the direction, a
// tap on a cell handing back the Gregorian day and closing, bounds disabling.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

final today = DateTime(2026, 8, 17); // دوشنبه ۲۶ مرداد ۱۴۰۵

LumoDateField field(String locale, {DateTime? value, ValueChanged<DateTime>? onChanged, DateTime? minDate, DateTime? maxDate}) {
  final fa = locale.startsWith('fa');
  return LumoDateField(
    label: fa ? 'تاریخ سفر' : 'Travel date',
    openLabel: fa ? 'باز کردن تقویم' : 'Open calendar',
    closeLabel: fa ? 'بستن' : 'Close',
    previousMonthLabel: fa ? 'ماه قبل' : 'Previous month',
    nextMonthLabel: fa ? 'ماه بعد' : 'Next month',
    todayLabel: fa ? 'امروز' : 'Today',
    placeholder: fa ? 'یک روز را انتخاب کنید' : 'Pick a day',
    description: fa ? 'روز حرکت' : 'Departure day',
    value: value,
    onChanged: onChanged,
    minDate: minDate,
    maxDate: maxDate,
    today: today,
  );
}

Finder cell(DateTime d, String locale) => find.bySemanticsLabel(formatLumoDate(d, locale, style: LumoDateStyle.long));

void main() {
  testWidgets('fa-IR: named field showing the Jalali value; calendar button named by openLabel at the inline END (left)', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', field('fa-IR', value: today)));
    expect(find.text('تاریخ سفر'), findsOneWidget);
    expect(find.text('۲۶ مرداد ۱۴۰۵'), findsOneWidget);
    expect(find.bySemanticsLabel('باز کردن تقویم'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('تاریخ سفر'))), TextDirection.rtl);
    final open = find.bySemanticsLabel('باز کردن تقویم');
    expect(tester.getSemantics(open), matchesSemantics(label: 'باز کردن تقویم', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getCenter(open).dx < tester.getCenter(find.text('۲۶ مرداد ۱۴۰۵')).dx, isTrue, reason: 'the calendar button sits at the inline end = left under fa-IR');
    // The field itself: label + value + description hint, read-only.
    final data = tester.getSemantics(find.text('۲۶ مرداد ۱۴۰۵')).getSemanticsData();
    expect(data.label, 'تاریخ سفر');
    expect(data.value, '۲۶ مرداد ۱۴۰۵');
    expect(data.hint, 'روز حرکت');
    expect(data.flagsCollection.isReadOnly, isTrue);
    semantics.dispose();
  });

  testWidgets('fa-IR: placeholder when empty; error announced; disabled', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoDateField(label: 'تاریخ', openLabel: 'تقویم', closeLabel: 'بستن', previousMonthLabel: 'قبل', nextMonthLabel: 'بعد', todayLabel: 'امروز', placeholder: 'انتخاب کنید', errorMessage: 'تاریخ الزامی است', isRequired: true, isDisabled: true)));
    expect(find.text('انتخاب کنید'), findsOneWidget);
    expect(find.text('تاریخ الزامی است'), findsOneWidget);
    expect(tester.getSemantics(find.text('تاریخ الزامی است')), matchesSemantics(label: 'تاریخ الزامی است', isLiveRegion: true));
    expect(tester.getSemantics(find.bySemanticsLabel('تقویم')), matchesSemantics(label: 'تقویم', isButton: true, hasEnabledState: true, isEnabled: false));
    semantics.dispose();
  });

  testWidgets('fa-IR: opens from openLabel; caption «مرداد ۱۴۰۵» as a header; Saturday first column at the RIGHT; previous at the RIGHT of next; today and selected marked; tap → onChanged Gregorian and closes', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app('fa-IR', field('fa-IR', value: DateTime(2026, 8, 20), onChanged: (d) => picked = d)));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget);
    expect(tester.getSemantics(find.text('مرداد ۱۴۰۵')), matchesSemantics(label: 'مرداد ۱۴۰۵', isHeader: true));
    // The sheet is a route above the field's LumoScope: it must still be RTL, and named.
    expect(Directionality.of(tester.element(find.text('مرداد ۱۴۰۵'))), TextDirection.rtl);
    expect(find.descendant(of: find.byType(LumoCalendarSheet), matching: find.text('تاریخ سفر')), findsOneWidget);
    expect(find.descendant(of: find.byType(LumoCalendarSheet), matching: find.bySemanticsLabel('بستن')), findsOneWidget);
    // Column headers, from the first day of the week: شنبه first = right.
    expect(find.text('ش'), findsOneWidget);
    expect(find.text('ج'), findsOneWidget);
    expect(tester.getCenter(find.text('ش')).dx > tester.getCenter(find.text('ج')).dx, isTrue, reason: 'Saturday is the first column = right under fa-IR');
    // 2026-08-15 is a Saturday (۲۴ مرداد), 2026-08-16 the Sunday after it: same row, Saturday further right.
    final sat = cell(DateTime(2026, 8, 15), 'fa-IR');
    final sun = cell(DateTime(2026, 8, 16), 'fa-IR');
    expect(DateTime(2026, 8, 15).weekday, DateTime.saturday);
    expect(sat, findsOneWidget);
    expect(sun, findsOneWidget);
    expect(tester.getSemantics(sat).getSemanticsData().label, 'شنبه ۲۴ مرداد ۱۴۰۵');
    expect(tester.getCenter(sat).dy, tester.getCenter(sun).dy);
    expect(tester.getCenter(sat).dx > tester.getCenter(sun).dx, isTrue, reason: 'the Saturday column is at the right under fa-IR');
    // The grid holds exactly the month's 31 days: ۱ مرداد = 2026-07-23, ۳۱ مرداد = 2026-08-22.
    expect(cell(DateTime(2026, 7, 23), 'fa-IR'), findsOneWidget);
    expect(cell(DateTime(2026, 7, 22), 'fa-IR'), findsNothing);
    expect(cell(DateTime(2026, 8, 22), 'fa-IR'), findsOneWidget);
    expect(cell(DateTime(2026, 8, 23), 'fa-IR'), findsNothing);
    expect(find.text('۳۱'), findsOneWidget);
    // Previous/next named by the labels; previous at the inline start = right.
    final prev = find.bySemanticsLabel('ماه قبل');
    final next = find.bySemanticsLabel('ماه بعد');
    expect(prev, findsOneWidget);
    expect(next, findsOneWidget);
    expect(tester.getSemantics(prev), matchesSemantics(label: 'ماه قبل', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getSemantics(next), matchesSemantics(label: 'ماه بعد', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getCenter(prev).dx > tester.getCenter(next).dx, isTrue, reason: 'previous sits at the inline start = right under fa-IR');
    // Today (۲۶) hinted with todayLabel; the selected day (۲۹) marked selected; the Today action present once.
    expect(tester.getSemantics(cell(today, 'fa-IR')), matchesSemantics(label: 'دوشنبه ۲۶ مرداد ۱۴۰۵', hint: 'امروز', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true, hasSelectedState: true, isSelected: false));
    expect(tester.getSemantics(cell(DateTime(2026, 8, 20), 'fa-IR')), matchesSemantics(label: 'پنجشنبه ۲۹ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true, hasSelectedState: true, isSelected: true));
    expect(find.text('امروز'), findsOneWidget);
    // Paging: next → شهریور; previous twice → تیر.
    await tester.tap(next);
    await tester.pumpAndSettle();
    expect(find.text('شهریور ۱۴۰۵'), findsOneWidget);
    expect(cell(DateTime(2026, 8, 23), 'fa-IR'), findsOneWidget);
    await tester.tap(prev);
    await tester.tap(prev);
    await tester.pumpAndSettle();
    expect(find.text('تیر ۱۴۰۵'), findsOneWidget);
    await tester.tap(next);
    await tester.pumpAndSettle();
    // Tap ۲۷ مرداد → onChanged(2026-08-18) at local midnight, and the sheet closes.
    await tester.tap(cell(DateTime(2026, 8, 18), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(picked, DateTime(2026, 8, 18));
    expect(find.text('مرداد ۱۴۰۵'), findsNothing);
    semantics.dispose();
  });

  testWidgets('fa-IR: out-of-range days disabled; Today action selects today; Esfand grid has 29 days in 1404', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app('fa-IR', field('fa-IR', minDate: DateTime(2026, 8, 10), maxDate: DateTime(2026, 8, 20), onChanged: (d) => picked = d)));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    // No value: opens on today's month.
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget);
    expect(tester.getSemantics(cell(DateTime(2026, 8, 9), 'fa-IR')), matchesSemantics(label: 'یکشنبه ۱۸ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: false, hasSelectedState: true));
    expect(tester.getSemantics(cell(DateTime(2026, 8, 10), 'fa-IR')), matchesSemantics(label: 'دوشنبه ۱۹ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true, hasSelectedState: true));
    expect(tester.getSemantics(cell(DateTime(2026, 8, 21), 'fa-IR')), matchesSemantics(label: 'جمعه ۳۰ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: false, hasSelectedState: true));
    await tester.tap(cell(DateTime(2026, 8, 21), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(picked, isNull);
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget);
    // Page back to اسفند ۱۴۰۴ (five months): 29 days, no ۳۰.
    for (var i = 0; i < 5; i++) {
      await tester.tap(find.bySemanticsLabel('ماه قبل'));
      await tester.pumpAndSettle();
    }
    expect(find.text('اسفند ۱۴۰۴'), findsOneWidget);
    expect(find.text('۲۹'), findsOneWidget);
    expect(find.text('۳۰'), findsNothing);
    // Today: selects today and closes.
    await tester.tap(find.text('امروز'));
    await tester.pumpAndSettle();
    expect(picked, today);
    expect(find.text('اسفند ۱۴۰۴'), findsNothing);
    semantics.dispose();
  });

  testWidgets('en-US: Gregorian value; grid with Sunday first at the LEFT; previous at the LEFT; caption from intl', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app('en-US', field('en-US', value: today, onChanged: (d) => picked = d)));
    expect(find.text('Aug 17, 2026'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('Travel date'))), TextDirection.ltr);
    final open = find.bySemanticsLabel('Open calendar');
    expect(tester.getCenter(open).dx > tester.getCenter(find.text('Aug 17, 2026')).dx, isTrue, reason: 'the calendar button sits at the inline end = right under en-US');
    await tester.tap(open);
    await tester.pumpAndSettle();
    expect(find.text('August 2026'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('August 2026'))), TextDirection.ltr);
    // Sunday first: 2026-08-16 (Sunday) left of 2026-08-17 (Monday), same row; the day cells are the 31 of August.
    final sun = cell(DateTime(2026, 8, 16), 'en-US');
    final mon = cell(DateTime(2026, 8, 17), 'en-US');
    expect(tester.getSemantics(sun).getSemanticsData().label, 'Sunday, August 16, 2026');
    expect(tester.getCenter(sun).dy, tester.getCenter(mon).dy);
    expect(tester.getCenter(sun).dx < tester.getCenter(mon).dx, isTrue, reason: 'the Sunday column is at the left under en-US');
    // 2026-08-01 is a Saturday: the last column of the first row, alone; 2026-08-02 starts row two.
    expect(tester.getCenter(cell(DateTime(2026, 8, 1), 'en-US')).dy < tester.getCenter(cell(DateTime(2026, 8, 2), 'en-US')).dy, isTrue);
    expect(cell(DateTime(2026, 7, 31), 'en-US'), findsNothing);
    expect(cell(DateTime(2026, 8, 31), 'en-US'), findsOneWidget);
    expect(cell(DateTime(2026, 9, 1), 'en-US'), findsNothing);
    final prev = find.bySemanticsLabel('Previous month');
    final next = find.bySemanticsLabel('Next month');
    expect(tester.getCenter(prev).dx < tester.getCenter(next).dx, isTrue, reason: 'previous sits at the inline start = left under en-US');
    expect(tester.getSemantics(mon), matchesSemantics(label: 'Monday, August 17, 2026', hint: 'Today', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true, hasSelectedState: true, isSelected: true));
    await tester.tap(next);
    await tester.pumpAndSettle();
    expect(find.text('September 2026'), findsOneWidget);
    await tester.tap(cell(DateTime(2026, 9, 3), 'en-US'));
    await tester.pumpAndSettle();
    expect(picked, DateTime(2026, 9, 3));
    expect(find.text('September 2026'), findsNothing);
    semantics.dispose();
  });

  testWidgets('any language: de opens a Monday-first Gregorian grid; en-u-ca-persian a Saturday-first Jalali grid in English', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('de', field('de', value: today)));
    expect(find.text('17. Aug. 2026'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('Open calendar'));
    await tester.pumpAndSettle();
    expect(find.text('August 2026'), findsOneWidget);
    final mon = cell(DateTime(2026, 8, 17), 'de');
    final sun = cell(DateTime(2026, 8, 23), 'de');
    expect(tester.getCenter(mon).dy, tester.getCenter(sun).dy, reason: 'Monday..Sunday is one row under de');
    expect(tester.getCenter(mon).dx < tester.getCenter(sun).dx, isTrue);
    await tester.tap(find.descendant(of: find.byType(LumoCalendarSheet), matching: find.bySemanticsLabel('Close')));
    await tester.pumpAndSettle();

    await tester.pumpWidget(app('en-u-ca-persian', field('en-u-ca-persian', value: today)));
    expect(find.text('26 Mordad 1405'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('Travel date'))), TextDirection.ltr);
    await tester.tap(find.bySemanticsLabel('Open calendar'));
    await tester.pumpAndSettle();
    expect(find.text('Mordad 1405'), findsOneWidget);
    final sat = cell(DateTime(2026, 8, 15), 'en-u-ca-persian');
    expect(tester.getSemantics(sat).getSemanticsData().label, 'Saturday, 24 Mordad 1405');
    final fri = cell(DateTime(2026, 8, 21), 'en-u-ca-persian');
    expect(tester.getCenter(sat).dy, tester.getCenter(fri).dy, reason: 'Saturday..Friday is one row under a Jalali calendar');
    expect(tester.getCenter(sat).dx < tester.getCenter(fri).dx, isTrue, reason: 'first column at the left: LTR language, Jalali week');
    expect(find.text('31'), findsOneWidget);
    semantics.dispose();
  });
}
