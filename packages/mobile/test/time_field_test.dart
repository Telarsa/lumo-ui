// TimeField: the hour cycle is the LOCALE's, the digits are the reader's, the
// picker is Lumo's own sheet — never Material's English-stringed showTimePicker.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: 380, child: child)))),
    );

Finder openButton(String label) => find.byWidgetPredicate((w) => w is LumoIconButton && w.label == label);

void main() {
  test('The hour cycle is DERIVED from the locale, never defaulted to the English convention', () {
    expect(lumoLocaleUses24Hour('fa-IR'), isTrue);
    expect(lumoLocaleUses24Hour('fa'), isTrue);
    expect(lumoLocaleUses24Hour('de-DE'), isTrue);
    expect(lumoLocaleUses24Hour('en-US'), isFalse);
    // The day-period words come from intl's symbols for the locale, not from a table of ours.
    expect(lumoDayPeriodNames('en-US'), ['AM', 'PM']);
    expect(lumoDayPeriodNames('fa-IR').length, 2);
    expect(lumoDayPeriodNames('fa-IR').first, isNot('AM'));
    // Formatting: Persian digits and the 24-hour convention by default.
    expect(formatLumoTime(const TimeOfDay(hour: 9, minute: 30), 'fa-IR'), '۰۹:۳۰');
    expect(formatLumoTime(const TimeOfDay(hour: 23, minute: 45), 'fa-IR'), '۲۳:۴۵');
    expect(formatLumoTime(const TimeOfDay(hour: 15, minute: 30), 'en-US'), '3:30 PM');
    expect(formatLumoTime(const TimeOfDay(hour: 0, minute: 5), 'en-US'), '12:05 AM');
    expect(formatLumoTime(const TimeOfDay(hour: 15, minute: 30), 'en-US', use24Hour: true), '15:30');
  });

  testWidgets('TimeField fa-IR: a read-only named field valued by the formatted time, a NAMED open button, Lumo\'s sheet with hour and minute columns, picking reports the time', (tester) async {
    final semantics = tester.ensureSemantics();
    final picked = <TimeOfDay>[];
    await tester.pumpWidget(app('fa-IR', LumoTimeField(
      label: 'ساعت بازدید',
      openLabel: 'انتخاب ساعت',
      closeLabel: 'بستن',
      hourLabel: 'ساعت',
      minuteLabel: 'دقیقه',
      description: 'زمان با متخصص هماهنگ می‌شود',
      value: const TimeOfDay(hour: 9, minute: 30),
      onChanged: picked.add,
    )));
    expect(Directionality.of(tester.element(find.text('ساعت بازدید'))), TextDirection.rtl);
    // 24-hour by the LOCALE, digits by the reader.
    expect(find.text('۰۹:۳۰'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('ساعت بازدید')), containsSemantics(label: 'ساعت بازدید', value: '۰۹:۳۰', isTextField: true, isReadOnly: true, isEnabled: true, hint: 'زمان با متخصص هماهنگ می‌شود'));
    // The open button is at the inline END = LEFT under fa-IR.
    expect(openButton('انتخاب ساعت'), findsOneWidget);
    expect(tester.getCenter(openButton('انتخاب ساعت')).dx, lessThan(tester.getCenter(find.text('۰۹:۳۰')).dx));

    await tester.tap(openButton('انتخاب ساعت'));
    await tester.pumpAndSettle();
    // Lumo's own sheet: Material's showTimePicker would carry MaterialLocalizations' English.
    expect(find.bySemanticsLabel('Dialog'), findsNothing);
    expect(find.bySemanticsLabel(RegExp('Dismiss')), findsNothing);
    expect(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن'), findsOneWidget);
    // Both columns, headed by their required labels.
    expect(tester.getSemantics(find.text('ساعت')), containsSemantics(label: 'ساعت', isHeader: true));
    expect(tester.getSemantics(find.text('دقیقه')), containsSemantics(label: 'دقیقه', isHeader: true));
    // The hour column takes the reading START = RIGHT under fa-IR.
    expect(tester.getCenter(find.text('ساعت')).dx, greaterThan(tester.getCenter(find.text('دقیقه')).dx));
    // No day period on a 24-hour clock.
    expect(find.text('AM'), findsNothing);
    // The offered minutes are the default step of 15; nothing else. («۵۵» is
    // neither an hour nor a step, so it carries the negative assertion.)
    expect(find.text('۳۰'), findsOneWidget);
    expect(find.text('۴۵'), findsOneWidget);
    expect(find.text('۵۵'), findsNothing);
    // The column opened with the current hour IN VIEW, named by its number.
    expect(tester.getSemantics(find.bySemanticsLabel('۹')), containsSemantics(label: '۹', isButton: true, isSelected: true));
    // Another hour reports the WHOLE time — the minute is kept.
    await tester.tap(find.text('۱۲'));
    await tester.pumpAndSettle();
    expect(picked.last, const TimeOfDay(hour: 12, minute: 30));
    await tester.tap(find.text('۴۵'));
    await tester.pumpAndSettle();
    expect(picked.last, const TimeOfDay(hour: 12, minute: 45));
    semantics.dispose();
  });

  testWidgets('TimeField en-US: the locale\'s own 12-hour clock adds a day-period column named from intl; LTR geometry; minuteStep changes what is offered', (tester) async {
    final semantics = tester.ensureSemantics();
    final picked = <TimeOfDay>[];
    await tester.pumpWidget(app('en-US', LumoTimeField(
      label: 'Visit time',
      openLabel: 'Pick a time',
      closeLabel: 'Close',
      hourLabel: 'Hour',
      minuteLabel: 'Minute',
      minuteStep: 30,
      value: const TimeOfDay(hour: 9, minute: 30),
      onChanged: picked.add,
    )));
    expect(find.text('9:30 AM'), findsOneWidget);
    // The open button at the inline END = RIGHT under en-US.
    expect(tester.getCenter(openButton('Pick a time')).dx, greaterThan(tester.getCenter(find.text('9:30 AM')).dx));

    await tester.tap(openButton('Pick a time'));
    await tester.pumpAndSettle();
    // The hour column at the reading START = LEFT under en-US.
    expect(tester.getCenter(find.text('Hour')).dx, lessThan(tester.getCenter(find.text('Minute')).dx));
    // minuteStep: 30 → two minutes only.
    expect(find.text('00'), findsOneWidget);
    expect(find.text('30'), findsOneWidget);
    expect(find.text('15'), findsNothing);
    // The day-period column: words from intl's symbols, not a table of Lumo's.
    expect(tester.getSemantics(find.bySemanticsLabel('AM')), containsSemantics(label: 'AM', isButton: true, isSelected: true));
    await tester.tap(find.text('PM'));
    await tester.pumpAndSettle();
    expect(picked.last, const TimeOfDay(hour: 21, minute: 30));
    semantics.dispose();
  });

  testWidgets('TimeField: use24Hour overrides the locale; an empty field shows the placeholder; invalid announces the error; disabled never opens; a bad minuteStep is refused', (tester) async {
    final semantics = tester.ensureSemantics();
    // The convention is overridable — an hour cycle is a user-visible choice.
    await tester.pumpWidget(app('en-US', const LumoTimeField(
      label: 'Visit time',
      openLabel: 'Pick a time',
      closeLabel: 'Close',
      hourLabel: 'Hour',
      minuteLabel: 'Minute',
      use24Hour: true,
      value: TimeOfDay(hour: 21, minute: 30),
    )));
    expect(find.text('21:30'), findsOneWidget);
    await tester.tap(openButton('Pick a time'));
    await tester.pumpAndSettle();
    expect(find.text('AM'), findsNothing);
    expect(find.text('23'), findsOneWidget); // an hour only a 24-hour clock offers
    await tester.tap(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'Close'));
    await tester.pumpAndSettle();

    // Empty + invalid.
    await tester.pumpWidget(app('fa-IR', const LumoTimeField(
      label: 'ساعت بازدید',
      openLabel: 'انتخاب ساعت',
      closeLabel: 'بستن',
      hourLabel: 'ساعت',
      minuteLabel: 'دقیقه',
      placeholder: 'انتخاب کنید',
      errorMessage: 'ساعت لازم است',
    )));
    expect(find.text('انتخاب کنید'), findsOneWidget);
    expect(find.text('ساعت لازم است'), findsOneWidget);
    final data = tester.getSemantics(find.bySemanticsLabel('ساعت بازدید')).getSemanticsData();
    expect(data.value, 'انتخاب کنید');
    expect(data.hint, contains('ساعت لازم است'));

    // A first pick completes the other column with zero — never a half time.
    final picked = <TimeOfDay>[];
    await tester.pumpWidget(app('fa-IR', LumoTimeField(
      label: 'ساعت بازدید',
      openLabel: 'انتخاب ساعت',
      closeLabel: 'بستن',
      hourLabel: 'ساعت',
      minuteLabel: 'دقیقه',
      onChanged: picked.add,
    )));
    await tester.tap(openButton('انتخاب ساعت'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('۰۴'));
    await tester.pumpAndSettle();
    expect(picked.last, const TimeOfDay(hour: 4, minute: 0));
    await tester.tap(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن'));
    await tester.pumpAndSettle();

    // Disabled.
    await tester.pumpWidget(app('fa-IR', const LumoTimeField(
      label: 'ساعت بازدید',
      openLabel: 'انتخاب ساعت',
      closeLabel: 'بستن',
      hourLabel: 'ساعت',
      minuteLabel: 'دقیقه',
      isDisabled: true,
    )));
    expect(tester.getSemantics(find.bySemanticsLabel('ساعت بازدید')), containsSemantics(isEnabled: false));
    await tester.tap(openButton('انتخاب ساعت'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('دقیقه'), findsNothing);

    // A step that does not divide the hour is refused at construction.
    for (final step in [7, 0]) {
      expect(() => LumoTimeField(label: 'a', openLabel: 'b', closeLabel: 'c', hourLabel: 'd', minuteLabel: 'e', minuteStep: step), throwsAssertionError);
    }
    semantics.dispose();
  });

  testWidgets('TimeField: every picker cell is a 44-tall TARGET around the 40-px pill it always drew', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoTimeField(
      label: 'ساعت جلسه', openLabel: 'انتخاب ساعت', closeLabel: 'بستن', hourLabel: 'ساعت', minuteLabel: 'دقیقه', value: TimeOfDay(hour: 9, minute: 30))));
    await tester.tap(find.bySemanticsLabel('انتخاب ساعت'));
    await tester.pumpAndSettle();
    // The pill still draws 40; the button node around it is 44.
    final pill = tester.getSize(find.ancestor(of: find.text('۰۹'), matching: find.byType(Container)).first);
    expect(pill.height, 40);
    expect(tester.getSize(find.ancestor(of: find.text('۰۹'), matching: find.byType(InkWell)).first).height, LumoControl.lg);
    semantics.dispose();
  });

  testWidgets('TimeField: required and invalid are STATES on the field, not only words', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoTimeField(label: 'ساعت', openLabel: 'ب', closeLabel: 'ب', hourLabel: 'س', minuteLabel: 'د', isRequired: true, isInvalid: true)));
    // The web `TimeField` is the one component of the family that emits
    // aria-required; here it is a real semantics flag.
    final field = find.byWidgetPredicate((w) => w is Semantics && w.properties.label == 'ساعت').first;
    final data = tester.getSemantics(field).getSemanticsData();
    expect(data.label, 'ساعت');
    expect(data.flagsCollection.isRequired, isTrue);
    expect(data.validationResult, SemanticsValidationResult.invalid);
    expect(find.text('ساعت *'), findsOneWidget);
    semantics.dispose();
  });
}
