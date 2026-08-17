// `LumoDatePicker` — the rich date control: the read-only field, the sheet, the
// presets the Khroos booking flow had to hand-roll, the month/year jump, and
// the ONE month grid. Graded here: the field's name/value/geometry, that the
// sheet's title is not announced a second time, the presets, the jump, bounds
// and unavailable days reaching the grid, controlled and uncontrolled values,
// and the whole of it in Jalali and in Gregorian.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

final today = DateTime(2026, 8, 17); // دوشنبه ۲۶ مرداد ۱۴۰۵

Finder cell(DateTime d, String locale) => find.bySemanticsLabel(formatLumoDate(d, locale, style: LumoDateStyle.long));

LumoDatePicker picker(
  String locale, {
  DateTime? value,
  DateTime? defaultValue,
  ValueChanged<DateTime>? onChanged,
  List<LumoDatePreset> presets = const [],
  DateTime? minDate,
  DateTime? maxDate,
  bool Function(DateTime)? isDateUnavailable,
  bool Function(DateTime)? isDateMarked,
  String? markedLabel,
  bool isDisabled = false,
  String? errorMessage,
}) {
  final fa = locale.startsWith('fa');
  return LumoDatePicker(
    label: fa ? 'تاریخ سفر' : 'Travel date',
    openLabel: fa ? 'باز کردن تقویم' : 'Open calendar',
    closeLabel: fa ? 'بستن' : 'Close',
    previousMonthLabel: fa ? 'ماه قبل' : 'Previous month',
    nextMonthLabel: fa ? 'ماه بعد' : 'Next month',
    todayLabel: fa ? 'امروز' : 'Today',
    selectMonthLabel: fa ? 'انتخاب ماه و سال' : 'Choose month and year',
    placeholder: fa ? 'یک روز را انتخاب کنید' : 'Pick a day',
    description: fa ? 'روز حرکت' : 'Departure day',
    value: value,
    defaultValue: defaultValue,
    onChanged: onChanged,
    presets: presets,
    minDate: minDate,
    maxDate: maxDate,
    today: today,
    isDateUnavailable: isDateUnavailable,
    isDateMarked: isDateMarked,
    markedLabel: markedLabel,
    isDisabled: isDisabled,
    errorMessage: errorMessage,
  );
}

void main() {
  testWidgets('fa-IR: the field is named, shows the Jalali value and puts the calendar button at the inline END (left)', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', picker('fa-IR', value: today)));
    expect(find.text('تاریخ سفر'), findsOneWidget);
    expect(find.text('۲۶ مرداد ۱۴۰۵'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('تاریخ سفر'))), TextDirection.rtl);

    final data = tester.getSemantics(find.text('۲۶ مرداد ۱۴۰۵')).getSemanticsData();
    expect(data.label, 'تاریخ سفر');
    expect(data.value, '۲۶ مرداد ۱۴۰۵');
    expect(data.hint, 'روز حرکت');
    expect(data.flagsCollection.isReadOnly, isTrue);
    expect(data.flagsCollection.isTextField, isTrue);

    final open = find.bySemanticsLabel('باز کردن تقویم');
    expect(tester.getSemantics(open), matchesSemantics(label: 'باز کردن تقویم', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getCenter(open).dx < tester.getCenter(find.text('۲۶ مرداد ۱۴۰۵')).dx, isTrue, reason: 'the calendar button sits at the inline end = left under fa-IR');
    semantics.dispose();
  });

  testWidgets('fa-IR: placeholder when empty; the error is a live region and marks the field invalid; disabled', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', picker('fa-IR', errorMessage: 'تاریخ الزامی است', isDisabled: true)));
    expect(find.text('یک روز را انتخاب کنید'), findsOneWidget);
    expect(tester.getSemantics(find.text('تاریخ الزامی است')), matchesSemantics(label: 'تاریخ الزامی است', isLiveRegion: true));
    expect(tester.getSemantics(find.text('یک روز را انتخاب کنید')).getSemanticsData().hint, 'روز حرکت. تاریخ الزامی است');
    expect(tester.getSemantics(find.bySemanticsLabel('باز کردن تقویم')), matchesSemantics(label: 'باز کردن تقویم', isButton: true, hasEnabledState: true, isEnabled: false));
    semantics.dispose();
  });

  testWidgets('fa-IR: opens the sheet; the title is not announced twice; the grid picks a day and closes', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app('fa-IR', picker('fa-IR', value: DateTime(2026, 8, 20), onChanged: (d) => picked = d)));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();

    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('مرداد ۱۴۰۵'))), TextDirection.rtl, reason: 'the sheet is a route above the field: it re-provides the scope');
    // The sheet shows the title and the grid announces it — and the visible copy
    // is decoration, so «تاریخ سفر» is heard exactly once inside the sheet.
    expect(find.descendant(of: find.byType(LumoCalendar), matching: find.text('تاریخ سفر')), findsNothing, reason: 'the sheet paints the title but the grid announces it');
    expect(find.descendant(of: find.byType(LumoCalendar), matching: find.bySemanticsLabel('تاریخ سفر')), findsOneWidget, reason: 'inside the sheet the name is announced exactly once');
    expect(find.bySemanticsLabel('بستن'), findsWidgets);

    expect(tester.getSemantics(cell(today, 'fa-IR')).getSemanticsData().hint, 'امروز');
    expect(tester.getSemantics(cell(DateTime(2026, 8, 20), 'fa-IR')).getSemanticsData().flagsCollection.isSelected, isTrue);

    await tester.tap(find.bySemanticsLabel('ماه بعد'));
    await tester.pumpAndSettle();
    expect(find.text('شهریور ۱۴۰۵'), findsOneWidget);
    await tester.tap(cell(DateTime(2026, 8, 25), 'fa-IR')); // ۳ شهریور ۱۴۰۵
    await tester.pumpAndSettle();
    expect(picked, DateTime(2026, 8, 25));
    expect(find.text('شهریور ۱۴۰۵'), findsNothing, reason: 'the sheet closes on a pick');
    semantics.dispose();
  });

  testWidgets('fa-IR: presets — «امروز» and «فردا» select without touching the grid, and each carries its own required label', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app(
      'fa-IR',
      picker(
        'fa-IR',
        onChanged: (d) => picked = d,
        presets: [
          LumoDatePreset(label: 'امروز', date: today),
          LumoDatePreset(label: 'فردا', date: DateTime(2026, 8, 18)),
          LumoDatePreset(label: 'هفتهٔ بعد', date: DateTime(2026, 8, 24)),
        ],
      ),
    ));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    expect(find.text('امروز'), findsOneWidget, reason: 'the Today action stands down when the caller brought presets');
    expect(find.text('فردا'), findsOneWidget);
    expect(find.text('هفتهٔ بعد'), findsOneWidget);

    await tester.tap(find.text('فردا'));
    await tester.pumpAndSettle();
    expect(picked, DateTime(2026, 8, 18)); // ۲۷ مرداد ۱۴۰۵
    expect(find.text('مرداد ۱۴۰۵'), findsNothing);
    // Uncontrolled: the field now shows what the preset chose.
    expect(find.text('۲۷ مرداد ۱۴۰۵'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('fa-IR: a preset outside the bounds is disabled, and an unavailable day is unselectable in the grid', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app(
      'fa-IR',
      picker(
        'fa-IR',
        minDate: DateTime(2026, 8, 17),
        maxDate: DateTime(2026, 8, 22),
        isDateUnavailable: (d) => DateUtils.isSameDay(d, DateTime(2026, 8, 19)),
        onChanged: (d) => picked = d,
        presets: [
          LumoDatePreset(label: 'دیروز', date: DateTime(2026, 8, 16)),
          LumoDatePreset(label: 'فردا', date: DateTime(2026, 8, 18)),
        ],
      ),
    ));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(find.text('دیروز')).getSemanticsData().flagsCollection.isEnabled, isFalse);
    expect(tester.getSemantics(find.text('فردا')).getSemanticsData().flagsCollection.isEnabled, isTrue);
    expect(tester.getSemantics(cell(DateTime(2026, 8, 19), 'fa-IR')).getSemanticsData().flagsCollection.isEnabled, isFalse);
    await tester.tap(cell(DateTime(2026, 8, 19), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(picked, isNull);
    semantics.dispose();
  });

  testWidgets('fa-IR: the caption jumps months, and a marked day says why', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app(
      'fa-IR',
      picker(
        'fa-IR',
        minDate: DateTime(2026, 3, 21), // ۱ فروردین ۱۴۰۵
        maxDate: DateTime(2027, 3, 20), // ۲۹ اسفند ۱۴۰۵
        isDateMarked: (d) => DateUtils.isSameDay(d, DateTime(2026, 8, 15)),
        markedLabel: 'نوبت دارد',
      ),
    ));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(cell(DateTime(2026, 8, 15), 'fa-IR')).getSemanticsData().hint, 'نوبت دارد');

    final caption = find.bySemanticsLabel('مرداد ۱۴۰۵');
    expect(tester.getSemantics(caption).getSemanticsData().hint, 'انتخاب ماه و سال');
    await tester.tap(caption);
    await tester.pumpAndSettle();
    await tester.tap(find.text('شهریور ۱۴۰۵'));
    await tester.pumpAndSettle();
    expect(cell(DateTime(2026, 8, 23), 'fa-IR'), findsOneWidget); // ۱ شهریور ۱۴۰۵
    semantics.dispose();
  });

  testWidgets('fa-IR: controlled — the field only changes when the caller changes it', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app('fa-IR', picker('fa-IR', value: today, onChanged: (d) => picked = d)));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    await tester.tap(cell(DateTime(2026, 8, 18), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(picked, DateTime(2026, 8, 18));
    expect(find.text('۲۶ مرداد ۱۴۰۵'), findsOneWidget, reason: 'value is owned by the caller');
    expect(find.text('۲۷ مرداد ۱۴۰۵'), findsNothing);
    semantics.dispose();
  });

  testWidgets('fa-IR: uncontrolled — defaultValue seeds the field and a pick replaces it', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', picker('fa-IR', defaultValue: today)));
    expect(find.text('۲۶ مرداد ۱۴۰۵'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    await tester.tap(cell(DateTime(2026, 8, 18), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(find.text('۲۷ مرداد ۱۴۰۵'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('en-US: Gregorian field and grid, calendar button at the inline END (right), Sunday first at the LEFT', (tester) async {
    final semantics = tester.ensureSemantics();
    DateTime? picked;
    await tester.pumpWidget(app('en-US', picker('en-US', value: today, onChanged: (d) => picked = d, presets: [LumoDatePreset(label: 'Tomorrow', date: DateTime(2026, 8, 18))])));
    expect(find.text('Aug 17, 2026'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('Travel date'))), TextDirection.ltr);
    final open = find.bySemanticsLabel('Open calendar');
    expect(tester.getCenter(open).dx > tester.getCenter(find.text('Aug 17, 2026')).dx, isTrue, reason: 'the calendar button sits at the inline end = right under en-US');

    await tester.tap(open);
    await tester.pumpAndSettle();
    expect(find.text('August 2026'), findsOneWidget);
    final sun = cell(DateTime(2026, 8, 16), 'en-US');
    final mon = cell(DateTime(2026, 8, 17), 'en-US');
    expect(tester.getSemantics(sun).getSemanticsData().label, 'Sunday, August 16, 2026');
    expect(tester.getCenter(sun).dx < tester.getCenter(mon).dx, isTrue);
    expect(tester.getCenter(find.bySemanticsLabel('Previous month')).dx < tester.getCenter(find.bySemanticsLabel('Next month')).dx, isTrue);

    await tester.tap(find.text('Tomorrow'));
    await tester.pumpAndSettle();
    expect(picked, DateTime(2026, 8, 18));
    semantics.dispose();
  });
}
