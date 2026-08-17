// `LumoDateRangePicker` — two named halves, one range grid. Graded here: each
// half named by `startLabel`/`endLabel` and placed on the right side of the
// inline axis, the en dash kept OUT of the accessibility tree, the sheet that
// stays open on a partial span and closes on a complete one, a span that
// starts in مرداد and ends in شهریور, and the same in Gregorian.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 420, child: child)))),
    );

final today = DateTime(2026, 8, 17); // دوشنبه ۲۶ مرداد ۱۴۰۵

Finder cell(DateTime d, String locale) => find.bySemanticsLabel(formatLumoDate(d, locale, style: LumoDateStyle.long));

LumoDateRangePicker rangePicker(
  String locale, {
  LumoDateRange? value,
  LumoDateRange? defaultValue,
  ValueChanged<LumoDateRange>? onChanged,
  DateTime? minDate,
  DateTime? maxDate,
  bool Function(DateTime)? isDateUnavailable,
  bool isDisabled = false,
  String? errorMessage,
}) {
  final fa = locale.startsWith('fa');
  return LumoDateRangePicker(
    label: fa ? 'بازهٔ اقامت' : 'Stay',
    startLabel: fa ? 'تاریخ شروع' : 'Start date',
    endLabel: fa ? 'تاریخ پایان' : 'End date',
    inRangeLabel: fa ? 'در بازه' : 'In range',
    openLabel: fa ? 'باز کردن تقویم' : 'Open calendar',
    closeLabel: fa ? 'بستن' : 'Close',
    previousMonthLabel: fa ? 'ماه قبل' : 'Previous month',
    nextMonthLabel: fa ? 'ماه بعد' : 'Next month',
    todayLabel: fa ? 'امروز' : 'Today',
    selectMonthLabel: fa ? 'انتخاب ماه و سال' : 'Choose month and year',
    startPlaceholder: fa ? 'از' : 'From',
    endPlaceholder: fa ? 'تا' : 'To',
    description: fa ? 'شب‌های اقامت' : 'Nights',
    value: value,
    defaultValue: defaultValue,
    onChanged: onChanged,
    minDate: minDate,
    maxDate: maxDate,
    today: today,
    isDateUnavailable: isDateUnavailable,
    isDisabled: isDisabled,
    errorMessage: errorMessage,
  );
}

void main() {
  testWidgets('fa-IR: each half is named by its own label, the start half sits at the RIGHT, the dash is not announced', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', rangePicker('fa-IR', value: LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 8, 25)))));

    expect(find.text('بازهٔ اقامت'), findsOneWidget);
    expect(find.text('۲۷ مرداد ۱۴۰۵'), findsOneWidget);
    expect(find.text('۳ شهریور ۱۴۰۵'), findsOneWidget);

    final start = tester.getSemantics(find.text('۲۷ مرداد ۱۴۰۵')).getSemanticsData();
    final end = tester.getSemantics(find.text('۳ شهریور ۱۴۰۵')).getSemanticsData();
    expect(start.label, 'تاریخ شروع');
    expect(start.value, '۲۷ مرداد ۱۴۰۵');
    expect(start.hint, 'شب‌های اقامت');
    expect(start.flagsCollection.isReadOnly, isTrue);
    expect(end.label, 'تاریخ پایان');
    expect(end.value, '۳ شهریور ۱۴۰۵');

    expect(
      tester.getCenter(find.text('۲۷ مرداد ۱۴۰۵')).dx > tester.getCenter(find.text('۳ شهریور ۱۴۰۵')).dx,
      isTrue,
      reason: 'the start half is at the inline start = right under fa-IR',
    );
    // The en dash is painted but never announced.
    expect(find.text('–'), findsOneWidget);
    expect(find.bySemanticsLabel('–'), findsNothing);

    final open = find.bySemanticsLabel('باز کردن تقویم');
    expect(tester.getCenter(open).dx < tester.getCenter(find.text('۳ شهریور ۱۴۰۵')).dx, isTrue, reason: 'the calendar button sits at the inline end = left under fa-IR');
    semantics.dispose();
  });

  testWidgets('fa-IR: placeholders when empty; disabled halves and disabled button', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', rangePicker('fa-IR', isDisabled: true, errorMessage: 'بازه الزامی است')));
    expect(find.text('از'), findsOneWidget);
    expect(find.text('تا'), findsOneWidget);
    expect(tester.getSemantics(find.text('از')).getSemanticsData().flagsCollection.isEnabled, isFalse);
    expect(tester.getSemantics(find.text('بازه الزامی است')), matchesSemantics(label: 'بازه الزامی است', isLiveRegion: true));
    expect(tester.getSemantics(find.bySemanticsLabel('باز کردن تقویم')), matchesSemantics(label: 'باز کردن تقویم', isButton: true, hasEnabledState: true, isEnabled: false));
    semantics.dispose();
  });

  testWidgets('fa-IR: the sheet stays open on a partial span and closes on a complete one — مرداد → شهریور', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <LumoDateRange>[];
    await tester.pumpWidget(app('fa-IR', rangePicker('fa-IR', onChanged: changes.add)));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget);

    // ۲۷ مرداد ۱۴۰۵ — one end only: the sheet stays, the span is announced.
    await tester.tap(cell(DateTime(2026, 8, 18), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(find.text('مرداد ۱۴۰۵'), findsOneWidget, reason: 'a partial span keeps the sheet open for the second end');
    expect(changes.single.from, DateTime(2026, 8, 18));
    expect(changes.single.to, isNull);
    expect(tester.getSemantics(cell(DateTime(2026, 8, 18), 'fa-IR')).getSemanticsData().hint, 'تاریخ شروع');

    await tester.tap(find.bySemanticsLabel('ماه بعد'));
    await tester.pumpAndSettle();
    // ۳ شهریور ۱۴۰۵ — the span is complete, so the sheet closes.
    await tester.tap(cell(DateTime(2026, 8, 25), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(find.text('شهریور ۱۴۰۵'), findsNothing);
    expect(changes.last, LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 8, 25)));
    // Uncontrolled: both halves now carry their end, each in the reader's calendar.
    expect(find.text('۲۷ مرداد ۱۴۰۵'), findsOneWidget);
    expect(find.text('۳ شهریور ۱۴۰۵'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('fa-IR: the grid announces the middle days of the span while the sheet is open', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', rangePicker('fa-IR', defaultValue: LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 8, 20)))));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(cell(DateTime(2026, 8, 18), 'fa-IR')).getSemanticsData().hint, 'تاریخ شروع');
    expect(tester.getSemantics(cell(DateTime(2026, 8, 19), 'fa-IR')).getSemanticsData().hint, 'در بازه');
    expect(tester.getSemantics(cell(DateTime(2026, 8, 20), 'fa-IR')).getSemanticsData().hint, 'تاریخ پایان');
    expect(tester.getSemantics(cell(DateTime(2026, 8, 21), 'fa-IR')).getSemanticsData().hint, '');
    semantics.dispose();
  });

  testWidgets('fa-IR: controlled — the halves change only when the caller changes them; bounds disable days', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <LumoDateRange>[];
    await tester.pumpWidget(app(
      'fa-IR',
      rangePicker('fa-IR', value: LumoDateRange(from: DateTime(2026, 8, 18)), minDate: DateTime(2026, 8, 17), maxDate: DateTime(2026, 8, 22), onChanged: changes.add),
    ));
    await tester.tap(find.bySemanticsLabel('باز کردن تقویم'));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(cell(DateTime(2026, 8, 16), 'fa-IR')).getSemanticsData().flagsCollection.isEnabled, isFalse);
    expect(tester.getSemantics(cell(DateTime(2026, 8, 20), 'fa-IR')).getSemanticsData().flagsCollection.isEnabled, isTrue);
    await tester.tap(cell(DateTime(2026, 8, 20), 'fa-IR'));
    await tester.pumpAndSettle();
    expect(changes.last, LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 8, 20)));
    // The caller did not change `value`, so the field still shows only the start.
    expect(find.text('۲۷ مرداد ۱۴۰۵'), findsOneWidget);
    expect(find.text('تا'), findsOneWidget, reason: 'the end half still shows its placeholder');
    semantics.dispose();
  });

  testWidgets('en-US: the start half sits at the LEFT, and the span is Gregorian', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <LumoDateRange>[];
    await tester.pumpWidget(app('en-US', rangePicker('en-US', onChanged: changes.add)));
    expect(find.text('Stay'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('Stay'))), TextDirection.ltr);
    expect(tester.getCenter(find.text('From')).dx < tester.getCenter(find.text('To')).dx, isTrue, reason: 'the start half is at the inline start = left under en-US');
    expect(tester.getSemantics(find.text('From')).getSemanticsData().label, 'Start date');

    await tester.tap(find.bySemanticsLabel('Open calendar'));
    await tester.pumpAndSettle();
    expect(find.text('August 2026'), findsOneWidget);
    await tester.tap(cell(DateTime(2026, 8, 18), 'en-US'));
    await tester.pumpAndSettle();
    expect(find.text('August 2026'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('Next month'));
    await tester.pumpAndSettle();
    await tester.tap(cell(DateTime(2026, 9, 2), 'en-US'));
    await tester.pumpAndSettle();
    expect(changes.last, LumoDateRange(from: DateTime(2026, 8, 18), to: DateTime(2026, 9, 2)));
    expect(find.text('Aug 18, 2026'), findsOneWidget);
    expect(find.text('Sep 2, 2026'), findsOneWidget);
    semantics.dispose();
  });
}
