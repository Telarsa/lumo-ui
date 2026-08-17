// The two month grids: `LumoCalendar` (one day) and `LumoRangeCalendar` (a
// span). What is graded here is what a reader gets — the calendar SYSTEM per
// locale (Jalali under fa-IR and en-u-ca-persian, Gregorian under en-US and
// de), the Saturday-first column order and the side it lands on, every cell
// named by its FULL date, month paging, bounds and unavailable days, the
// month/year jump, the announced marker, and a range whose middle days are
// announced and not merely tinted — including a span that starts in مرداد and
// ends in شهریور.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

final today = DateTime(2026, 8, 17); // دوشنبه ۲۶ مرداد ۱۴۰۵

Finder cell(DateTime d, String locale) => find.bySemanticsLabel(formatLumoDate(d, locale, style: LumoDateStyle.long));

LumoCalendar calendar(
  String locale, {
  DateTime? value,
  ValueChanged<DateTime>? onChanged,
  DateTime? minDate,
  DateTime? maxDate,
  bool Function(DateTime)? isDateUnavailable,
  bool Function(DateTime)? isDateMarked,
  String? markedLabel,
  DateTime? focusedMonth,
  ValueChanged<DateTime>? onMonthChanged,
  String? selectMonthLabel,
  bool showTodayAction = true,
}) {
  final fa = locale.startsWith('fa');
  return LumoCalendar(
    label: fa ? 'تقویم نوبت‌ها' : 'Booking calendar',
    previousMonthLabel: fa ? 'ماه قبل' : 'Previous month',
    nextMonthLabel: fa ? 'ماه بعد' : 'Next month',
    todayLabel: fa ? 'امروز' : 'Today',
    value: value,
    onChanged: onChanged,
    minDate: minDate,
    maxDate: maxDate,
    today: today,
    isDateUnavailable: isDateUnavailable,
    isDateMarked: isDateMarked,
    markedLabel: markedLabel,
    focusedMonth: focusedMonth,
    onMonthChanged: onMonthChanged,
    selectMonthLabel: selectMonthLabel,
    showTodayAction: showTodayAction,
  );
}

LumoRangeCalendar rangeCalendar(
  String locale, {
  LumoDateRange? value,
  ValueChanged<LumoDateRange>? onChanged,
  DateTime? minDate,
  DateTime? maxDate,
  bool Function(DateTime)? isDateUnavailable,
}) {
  final fa = locale.startsWith('fa');
  return LumoRangeCalendar(
    label: fa ? 'بازهٔ اقامت' : 'Stay',
    previousMonthLabel: fa ? 'ماه قبل' : 'Previous month',
    nextMonthLabel: fa ? 'ماه بعد' : 'Next month',
    todayLabel: fa ? 'امروز' : 'Today',
    startLabel: fa ? 'آغاز بازه' : 'Range start',
    endLabel: fa ? 'پایان بازه' : 'Range end',
    inRangeLabel: fa ? 'در بازه' : 'In range',
    value: value,
    onChanged: onChanged,
    minDate: minDate,
    maxDate: maxDate,
    today: today,
    isDateUnavailable: isDateUnavailable,
  );
}

void main() {
  // ------------------------------------------------------------ LumoCalendar

  testWidgets('fa-IR: the grid is named once; caption «مرداد ۱۴۰۵» is a header; Saturday is the first column and it is at the RIGHT; previous sits right of next', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', calendar('fa-IR', value: DateTime(2026, 8, 20))));

    // The name exists exactly once — on the grid itself, not on a stray Text.
    expect(find.bySemanticsLabel('تقویم نوبت‌ها'), findsOneWidget);
    expect(find.text('تقویم نوبت‌ها'), findsNothing);
    expect(Directionality.of(tester.element(find.text('مرداد ۱۴۰۵'))), TextDirection.rtl);
    expect(tester.getSemantics(find.text('مرداد ۱۴۰۵')), matchesSemantics(label: 'مرداد ۱۴۰۵', isHeader: true));

    // Column headers run from the week's first day: شنبه first, so it is the RIGHTMOST.
    expect(find.text('ش'), findsOneWidget);
    expect(find.text('ج'), findsOneWidget);
    expect(tester.getCenter(find.text('ش')).dx > tester.getCenter(find.text('ج')).dx, isTrue, reason: 'Saturday is the first column = right under fa-IR');

    // 2026-08-15 is a Saturday (۲۴ مرداد); 2026-08-16 the Sunday after it.
    final sat = cell(DateTime(2026, 8, 15), 'fa-IR');
    final sun = cell(DateTime(2026, 8, 16), 'fa-IR');
    expect(tester.getSemantics(sat).getSemanticsData().label, 'شنبه ۲۴ مرداد ۱۴۰۵');
    expect(tester.getCenter(sat).dy, tester.getCenter(sun).dy);
    expect(tester.getCenter(sat).dx > tester.getCenter(sun).dx, isTrue, reason: 'the Saturday column is at the right under fa-IR');

    // Exactly the 31 days of مرداد ۱۴۰۵: ۱ مرداد = 2026-07-23, ۳۱ مرداد = 2026-08-22.
    expect(cell(DateTime(2026, 7, 22), 'fa-IR'), findsNothing);
    expect(cell(DateTime(2026, 7, 23), 'fa-IR'), findsOneWidget);
    expect(cell(DateTime(2026, 8, 22), 'fa-IR'), findsOneWidget);
    expect(cell(DateTime(2026, 8, 23), 'fa-IR'), findsNothing);
    expect(find.text('۳۱'), findsOneWidget);

    final prev = find.bySemanticsLabel('ماه قبل');
    final next = find.bySemanticsLabel('ماه بعد');
    expect(tester.getSemantics(prev), matchesSemantics(label: 'ماه قبل', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getCenter(prev).dx > tester.getCenter(next).dx, isTrue, reason: 'previous sits at the inline start = right under fa-IR');

    // Today is hinted, the value is selected, and both are named in full.
    expect(tester.getSemantics(cell(today, 'fa-IR')), matchesSemantics(label: 'دوشنبه ۲۶ مرداد ۱۴۰۵', hint: 'امروز', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true, hasSelectedState: true, isSelected: false));
    expect(tester.getSemantics(cell(DateTime(2026, 8, 20), 'fa-IR')), matchesSemantics(label: 'پنجشنبه ۲۹ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true, hasSelectedState: true, isSelected: true));
    expect(find.text('امروز'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('fa-IR: paging by month, and اسفند ۱۴۰۴ has 29 days while اسفند ۱۴۰۳ has 30', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app('fa-IR', calendar('fa-IR', onChanged: (d) => picked = d)));
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('ماه بعد'));
    await tester.pumpAndSettle();
    expect(find.text('شهریور ۱۴۰۵'), findsOneWidget);
    expect(cell(DateTime(2026, 8, 23), 'fa-IR'), findsOneWidget); // ۱ شهریور ۱۴۰۵

    // Back to اسفند ۱۴۰۴: six months.
    for (var i = 0; i < 6; i++) {
      await tester.tap(find.bySemanticsLabel('ماه قبل'));
      await tester.pumpAndSettle();
    }
    expect(find.text('اسفند ۱۴۰۴'), findsOneWidget);
    expect(find.text('۲۹'), findsOneWidget);
    expect(find.text('۳۰'), findsNothing);

    // And a year earlier, اسفند ۱۴۰۳ is a leap Esfand: 30 days.
    for (var i = 0; i < 12; i++) {
      await tester.tap(find.bySemanticsLabel('ماه قبل'));
      await tester.pumpAndSettle();
    }
    expect(find.text('اسفند ۱۴۰۳'), findsOneWidget);
    expect(find.text('۳۰'), findsOneWidget);
    // 2025-03-20 is ۳۰ اسفند ۱۴۰۳.
    expect(cell(DateTime(2025, 3, 20), 'fa-IR'), findsOneWidget);

    // A tap hands back local midnight of the Gregorian day.
    await tester.tap(cell(DateTime(2025, 3, 20), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(picked, DateTime(2025, 3, 20));
    semantics.dispose();
  });

  testWidgets('fa-IR: minDate/maxDate and isDateUnavailable each disable a day; paging past a bound is still allowed', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app(
      'fa-IR',
      calendar(
        'fa-IR',
        minDate: DateTime(2026, 8, 10),
        maxDate: DateTime(2026, 8, 20),
        // ۲۹ مرداد (2026-08-20) is inside the bounds but booked.
        isDateUnavailable: (d) => DateUtils.isSameDay(d, DateTime(2026, 8, 20)),
        onChanged: (d) => picked = d,
      ),
    ));

    expect(tester.getSemantics(cell(DateTime(2026, 8, 9), 'fa-IR')), matchesSemantics(label: 'یکشنبه ۱۸ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: false, hasSelectedState: true));
    expect(tester.getSemantics(cell(DateTime(2026, 8, 10), 'fa-IR')), matchesSemantics(label: 'دوشنبه ۱۹ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true, hasSelectedState: true));
    expect(tester.getSemantics(cell(DateTime(2026, 8, 21), 'fa-IR')), matchesSemantics(label: 'جمعه ۳۰ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: false, hasSelectedState: true));
    // Unavailable, though inside the bounds.
    expect(tester.getSemantics(cell(DateTime(2026, 8, 20), 'fa-IR')), matchesSemantics(label: 'پنجشنبه ۲۹ مرداد ۱۴۰۵', isButton: true, hasEnabledState: true, isEnabled: false, hasSelectedState: true));

    await tester.tap(cell(DateTime(2026, 8, 20), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(picked, isNull, reason: 'an unavailable day does not fire onChanged');

    // A bound bounds SELECTION, not looking around: the chevron still pages.
    await tester.tap(find.bySemanticsLabel('ماه قبل'));
    await tester.pumpAndSettle();
    expect(find.text('تیر ۱۴۰۵'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('fa-IR: an announced marker; the Today action selects today and brings the grid back to it', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app(
      'fa-IR',
      calendar(
        'fa-IR',
        isDateMarked: (d) => DateUtils.isSameDay(d, DateTime(2026, 8, 15)),
        markedLabel: 'نوبت دارد',
        onChanged: (d) => picked = d,
      ),
    ));
    // The dot is announced, not merely painted.
    expect(tester.getSemantics(cell(DateTime(2026, 8, 15), 'fa-IR')), matchesSemantics(label: 'شنبه ۲۴ مرداد ۱۴۰۵', hint: 'نوبت دارد', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true, hasSelectedState: true));
    // A day with nothing on it says nothing extra.
    expect(tester.getSemantics(cell(DateTime(2026, 8, 16), 'fa-IR')).getSemanticsData().hint, '');

    await tester.tap(find.bySemanticsLabel('ماه قبل'));
    await tester.pumpAndSettle();
    expect(find.text('تیر ۱۴۰۵'), findsOneWidget);
    await tester.tap(find.text('امروز'));
    await tester.pumpAndSettle();
    expect(picked, today);
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget, reason: 'the Today action also brings the grid back to today');
    semantics.dispose();
  });

  testWidgets('fa-IR: focusedMonth is controlled — the grid does not move itself, and onMonthChanged reports day 1', (tester) async {
    final semantics = tester.ensureSemantics();
    final months = <DateTime>[];
    await tester.pumpWidget(app('fa-IR', calendar('fa-IR', focusedMonth: DateTime(2026, 8, 17), onMonthChanged: months.add, showTodayAction: false)));
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget);
    expect(find.text('امروز'), findsNothing, reason: 'showTodayAction: false hides the action; todayLabel still hints today');

    await tester.tap(find.bySemanticsLabel('ماه بعد'));
    await tester.pumpAndSettle();
    // The caller owns the month, so the caption has NOT moved…
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget);
    // …but it was told which month to move to: ۱ شهریور ۱۴۰۵ = 2026-08-23.
    expect(months, [DateTime(2026, 8, 23)]);
    semantics.dispose();
  });

  testWidgets('fa-IR: the caption is a button when selectMonthLabel is given, and the list jumps months', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app(
      'fa-IR',
      calendar(
        'fa-IR',
        selectMonthLabel: 'انتخاب ماه و سال',
        minDate: DateTime(2026, 3, 21), // ۱ فروردین ۱۴۰۵
        maxDate: DateTime(2027, 3, 20), // ۲۹ اسفند ۱۴۰۵
      ),
    ));
    final caption = find.bySemanticsLabel('مرداد ۱۴۰۵');
    expect(tester.getSemantics(caption).getSemanticsData().hint, 'انتخاب ماه و سال');
    expect(tester.getSemantics(caption).getSemanticsData().flagsCollection.isButton, isTrue);

    await tester.tap(caption);
    await tester.pumpAndSettle();
    // The grid is replaced by the month list; every row is named by its own caption.
    expect(cell(today, 'fa-IR'), findsNothing);
    expect(find.text('شهریور ۱۴۰۵'), findsOneWidget);
    await tester.tap(find.text('شهریور ۱۴۰۵'));
    await tester.pumpAndSettle();
    expect(find.text('شهریور ۱۴۰۵'), findsOneWidget);
    expect(cell(DateTime(2026, 8, 23), 'fa-IR'), findsOneWidget); // ۱ شهریور ۱۴۰۵
    semantics.dispose();
  });

  testWidgets('en-US: Gregorian months, Sunday first and at the LEFT, previous at the LEFT; en-u-ca-persian is Jalali in English', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app('en-US', calendar('en-US', value: today, onChanged: (d) => picked = d)));
    expect(find.text('August 2026'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('August 2026'))), TextDirection.ltr);
    expect(find.bySemanticsLabel('Booking calendar'), findsOneWidget);

    final sun = cell(DateTime(2026, 8, 16), 'en-US');
    final mon = cell(DateTime(2026, 8, 17), 'en-US');
    expect(tester.getSemantics(sun).getSemanticsData().label, 'Sunday, August 16, 2026');
    expect(tester.getCenter(sun).dy, tester.getCenter(mon).dy);
    expect(tester.getCenter(sun).dx < tester.getCenter(mon).dx, isTrue, reason: 'the Sunday column is at the left under en-US');
    expect(cell(DateTime(2026, 7, 31), 'en-US'), findsNothing);
    expect(cell(DateTime(2026, 8, 31), 'en-US'), findsOneWidget);
    expect(cell(DateTime(2026, 9, 1), 'en-US'), findsNothing);
    expect(tester.getCenter(find.bySemanticsLabel('Previous month')).dx < tester.getCenter(find.bySemanticsLabel('Next month')).dx, isTrue);

    await tester.tap(find.bySemanticsLabel('Next month'));
    await tester.pumpAndSettle();
    expect(find.text('September 2026'), findsOneWidget);
    await tester.tap(cell(DateTime(2026, 9, 3), 'en-US'));
    await tester.pumpAndSettle();
    expect(picked, DateTime(2026, 9, 3));

    semantics.dispose();
  });

  testWidgets('en-u-ca-persian: a Jalali calendar in English — Jalali months, a Saturday-first week, first column at the LEFT', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-u-ca-persian', calendar('en-u-ca-persian', value: today)));
    expect(find.text('Mordad 1405'), findsOneWidget);
    final sat = cell(DateTime(2026, 8, 15), 'en-u-ca-persian');
    final fri = cell(DateTime(2026, 8, 21), 'en-u-ca-persian');
    expect(tester.getSemantics(sat).getSemanticsData().label, 'Saturday, 24 Mordad 1405');
    expect(tester.getCenter(sat).dy, tester.getCenter(fri).dy, reason: 'Saturday..Friday is one row under a Jalali calendar');
    expect(tester.getCenter(sat).dx < tester.getCenter(fri).dx, isTrue, reason: 'first column at the left: LTR language, Jalali week');
    expect(find.text('31'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('de: a Monday-first Gregorian grid', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('de', calendar('de', value: today)));
    expect(find.text('August 2026'), findsOneWidget);
    final mon = cell(DateTime(2026, 8, 17), 'de');
    final sun = cell(DateTime(2026, 8, 23), 'de');
    expect(tester.getCenter(mon).dy, tester.getCenter(sun).dy, reason: 'Monday..Sunday is one row under de');
    expect(tester.getCenter(mon).dx < tester.getCenter(sun).dx, isTrue);
    semantics.dispose();
  });

  // ------------------------------------------------------- LumoRangeCalendar

  testWidgets('fa-IR range: the ends and every day between them are ANNOUNCED, not merely tinted', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app(
      'fa-IR',
      // ۲۵..۲۹ مرداد ۱۴۰۵ — today (۲۶ مرداد) falls INSIDE it.
      rangeCalendar('fa-IR', value: LumoDateRange(from: DateTime(2026, 8, 16), to: DateTime(2026, 8, 20))),
    ));
    expect(find.bySemanticsLabel('بازهٔ اقامت'), findsOneWidget);

    final from = tester.getSemantics(cell(DateTime(2026, 8, 16), 'fa-IR')).getSemanticsData();
    final middle = tester.getSemantics(cell(DateTime(2026, 8, 19), 'fa-IR')).getSemanticsData();
    final to = tester.getSemantics(cell(DateTime(2026, 8, 20), 'fa-IR')).getSemanticsData();
    final outside = tester.getSemantics(cell(DateTime(2026, 8, 21), 'fa-IR')).getSemanticsData();

    expect(from.hint, 'آغاز بازه');
    expect(middle.hint, 'در بازه');
    expect(middle.label, 'چهارشنبه ۲۸ مرداد ۱۴۰۵');
    expect(to.hint, 'پایان بازه');
    expect(to.label, 'پنجشنبه ۲۹ مرداد ۱۴۰۵');
    expect(outside.hint, '');
    for (final d in [from, middle, to]) {
      expect(d.flagsCollection.isSelected, isTrue);
    }
    expect(outside.flagsCollection.isSelected, isFalse);
    // Today is inside this span, so the cell says both.
    expect(tester.getSemantics(cell(today, 'fa-IR')).getSemanticsData().hint, 'در بازه. امروز');
    semantics.dispose();
  });

  testWidgets('fa-IR range: two taps build a span that starts in مرداد and ends in شهریور', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <LumoDateRange>[];
    await tester.pumpWidget(app('fa-IR', rangeCalendar('fa-IR', onChanged: changes.add)));

    // ۲۷ مرداد ۱۴۰۵
    await tester.tap(cell(DateTime(2026, 8, 18), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(changes.single.from, DateTime(2026, 8, 18));
    expect(changes.single.to, isNull, reason: 'a start with no end is a real state');
    expect(tester.getSemantics(cell(DateTime(2026, 8, 18), 'fa-IR')).getSemanticsData().hint, 'آغاز بازه');

    await tester.tap(find.bySemanticsLabel('ماه بعد'));
    await tester.pumpAndSettle();
    expect(find.text('شهریور ۱۴۰۵'), findsOneWidget);

    // ۳ شهریور ۱۴۰۵ = 2026-08-25
    await tester.tap(cell(DateTime(2026, 8, 25), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(changes.length, 2);
    expect(changes.last, LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 8, 25)));
    expect(changes.last.isComplete, isTrue);
    // The days of شهریور inside the span are announced in this month too.
    expect(tester.getSemantics(cell(DateTime(2026, 8, 24), 'fa-IR')).getSemanticsData().hint, 'در بازه');
    expect(tester.getSemantics(cell(DateTime(2026, 8, 25), 'fa-IR')).getSemanticsData().hint, 'پایان بازه');
    // …and so are the ones back in مرداد.
    await tester.tap(find.bySemanticsLabel('ماه قبل'));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(cell(DateTime(2026, 8, 22), 'fa-IR')).getSemanticsData().hint, 'در بازه'); // ۳۱ مرداد
    semantics.dispose();
  });

  testWidgets('fa-IR range: a third tap starts over; a tap BEFORE the open start moves the start instead of inverting the span', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <LumoDateRange>[];
    await tester.pumpWidget(app('fa-IR', rangeCalendar('fa-IR', onChanged: changes.add)));

    await tester.tap(cell(DateTime(2026, 8, 18), 'fa-IR'));
    await tester.pumpAndSettle();
    // Earlier than the open start: the start MOVES, and no inverted span exists.
    await tester.tap(cell(DateTime(2026, 8, 12), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(changes.last, LumoDateRange(from: DateTime(2026, 8, 12)));
    expect(changes.last.to, isNull);

    await tester.tap(cell(DateTime(2026, 8, 14), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(changes.last, LumoDateRange(from: DateTime(2026, 8, 12), to: DateTime(2026, 8, 14)));

    // A tap on a complete span starts a new one.
    await tester.tap(cell(DateTime(2026, 8, 19), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(changes.last, LumoDateRange(from: DateTime(2026, 8, 19)));
    semantics.dispose();
  });

  testWidgets('fa-IR range: bounds and unavailable days are unselectable and cannot anchor a span', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <LumoDateRange>[];
    await tester.pumpWidget(app(
      'fa-IR',
      rangeCalendar('fa-IR', minDate: DateTime(2026, 8, 10), maxDate: DateTime(2026, 8, 20), isDateUnavailable: (d) => DateUtils.isSameDay(d, DateTime(2026, 8, 14)), onChanged: changes.add),
    ));
    expect(tester.getSemantics(cell(DateTime(2026, 8, 9), 'fa-IR')).getSemanticsData().flagsCollection.isEnabled, isFalse);
    expect(tester.getSemantics(cell(DateTime(2026, 8, 21), 'fa-IR')).getSemanticsData().flagsCollection.isEnabled, isFalse);
    expect(tester.getSemantics(cell(DateTime(2026, 8, 14), 'fa-IR')).getSemanticsData().flagsCollection.isEnabled, isFalse);
    await tester.tap(cell(DateTime(2026, 8, 14), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(changes, isEmpty);
    semantics.dispose();
  });

  testWidgets('en-US range: the same span in English, and its cells are named by the Gregorian date', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <LumoDateRange>[];
    await tester.pumpWidget(app('en-US', rangeCalendar('en-US', onChanged: changes.add)));
    expect(find.text('August 2026'), findsOneWidget);
    await tester.tap(cell(DateTime(2026, 8, 18), 'en-US'));
    await tester.pumpAndSettle();
    await tester.tap(cell(DateTime(2026, 8, 20), 'en-US'));
    await tester.pumpAndSettle();
    expect(changes.last, LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 8, 20)));
    final middle = tester.getSemantics(cell(DateTime(2026, 8, 19), 'en-US')).getSemanticsData();
    expect(middle.label, 'Wednesday, August 19, 2026');
    expect(middle.hint, 'In range');
    expect(tester.getSemantics(cell(DateTime(2026, 8, 18), 'en-US')).getSemanticsData().hint, 'Range start');
    expect(tester.getSemantics(cell(DateTime(2026, 8, 20), 'en-US')).getSemanticsData().hint, 'Range end');
    semantics.dispose();
  });

  test('LumoDateRange: value equality by DAY, and containment on both ends', () {
    final a = LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 8, 20));
    expect(a, LumoDateRange(from: DateTime(2026, 8, 18, 13, 5), to: DateTime(2026, 8, 20, 23, 59)));
    expect(a.isComplete, isTrue);
    expect(a.contains(DateTime(2026, 8, 18)), isTrue);
    expect(a.contains(DateTime(2026, 8, 19)), isTrue);
    expect(a.contains(DateTime(2026, 8, 20)), isTrue);
    expect(a.contains(DateTime(2026, 8, 21)), isFalse);
    final open = LumoDateRange(from: DateTime(2026, 8, 18));
    expect(open.isComplete, isFalse);
    expect(open.contains(DateTime(2026, 8, 18)), isTrue);
    expect(open.contains(DateTime(2026, 8, 19)), isFalse);
    expect(open == a, isFalse);
    expect({a, LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 8, 20))}.length, 1);
  });
}
