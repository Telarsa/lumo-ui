// PhoneInput: the number is an LTR island in every script, the digits are the
// reader's on screen and ASCII on the wire, and the country selector is named.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: 380, child: child)))),
    );

Finder numberField() => find.byType(TextField).first;

void main() {
  test('PhoneInput helpers: any digits in, ASCII E.164 out — 00 before the trunk zero, longest dial code first', () {
    // Persian digits with the trunk zero — the line the widget exists for.
    expect(lumoPhoneE164('۰۹۱۲۳۴۵۶۷۸۹', '98'), '+989123456789');
    expect(lumoPhoneE164('0912 345 6789', '98'), '+989123456789');
    expect(lumoPhoneE164('00989123456789', '98'), '+989123456789');
    expect(lumoPhoneE164('+98 912 345 6789', '98'), '+989123456789');
    expect(lumoPhoneE164('', '98'), '');
    expect(lumoPhoneNational('+989123456789', '98'), '9123456789');
    expect(lumoPhoneDigits('۰۹۱۲‌ ۳۴۵'), '0912345');
    // «1» must not shadow «98».
    expect(lumoPhoneIsValid('+989123456789'), isTrue);
    expect(lumoPhoneIsValid('+98912345'), isFalse);
    expect(lumoPhoneIsValid('+12025550123'), isTrue);
    // Germany has no stated plan length: any non-empty national number passes.
    expect(lumoPhoneIsValid('+4915112345'), isTrue);
    expect(lumoPhoneIsValid('+49'), isFalse);
    // A country name is never another language's word: an unnamed tag gets the CODE.
    const ir = LumoPhoneCountry(code: 'IR', dial: '98', names: {'fa': 'ایران', 'en': 'Iran'});
    expect(ir.nameFor('fa-IR'), 'ایران');
    expect(ir.nameFor('en-US'), 'Iran');
    expect(ir.nameFor('ja-JP'), 'IR');
  });

  testWidgets('PhoneInput fa-IR: ONE named text field, the number is an LTR island inside a mirrored row, Persian digits on screen and ASCII E.164 on the wire', (tester) async {
    final semantics = tester.ensureSemantics();
    final seen = <String>[];
    await tester.pumpWidget(app('fa-IR', LumoPhoneInput(
      label: 'شمارهٔ موبایل',
      countryLabel: 'کشور',
      closeLabel: 'بستن',
      searchLabel: 'جست‌وجوی کشور',
      description: 'برای ورود استفاده می‌شود',
      placeholder: '۹۱۲۳۴۵۶۷۸۹',
      onChanged: seen.add,
    )));
    expect(Directionality.of(tester.element(find.text('شمارهٔ موبایل'))), TextDirection.rtl);
    final data = tester.getSemantics(numberField()).getSemanticsData();
    expect(data.label, startsWith('شمارهٔ موبایل'));
    expect(data.hint, 'برای ورود استفاده می‌شود');
    expect(data.flagsCollection.isTextField, isTrue);

    // The country selector: named, a button, valued by the country and its dial code.
    expect(tester.getSemantics(find.bySemanticsLabel('کشور')), containsSemantics(label: 'کشور', value: 'ایران +۹۸', isButton: true, isEnabled: true));
    // The ROW mirrors: the selector takes the reading start = RIGHT under fa-IR.
    final row = tester.getRect(find.byType(LumoPhoneInput));
    expect(tester.getCenter(find.bySemanticsLabel('کشور')).dx, greaterThan(row.center.dx));
    // The number is an LTR ISLAND: «+۹۸» keeps its place to the LEFT of the digits, in Persian too.
    expect(tester.getCenter(find.text('+۹۸')).dx, lessThan(tester.getCenter(numberField()).dx));
    expect(Directionality.of(tester.element(numberField())), TextDirection.ltr);

    // The trunk zero survives the keystroke that types it, and E.164 drops it.
    await tester.enterText(numberField(), '۰۹۱۲۳۴۵۶۷۸۹');
    await tester.pumpAndSettle();
    expect(seen.last, '+989123456789');
    expect(find.text('۰۹۱۲۳۴۵۶۷۸۹'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('PhoneInput fa-IR: a controlled value shows the reader\'s digits; the country sheet is Lumo\'s, searchable, and switching keeps the national number', (tester) async {
    final semantics = tester.ensureSemantics();
    var value = '+989123456789';
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(
      builder: (context, setState) => LumoPhoneInput(
        label: 'شمارهٔ موبایل',
        countryLabel: 'کشور',
        closeLabel: 'بستن',
        searchLabel: 'جست‌وجوی کشور',
        value: value,
        onChanged: (v) => setState(() => value = v),
      ),
    )));
    // Derived from the value, never stored beside it — and in Persian digits.
    expect(find.text('۹۱۲۳۴۵۶۷۸۹'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('کشور'));
    await tester.pumpAndSettle();
    // Lumo's own sheet route: no English platform name anywhere.
    expect(find.bySemanticsLabel('Dialog'), findsNothing);
    expect(find.bySemanticsLabel(RegExp('Dismiss')), findsNothing);
    expect(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن'), findsOneWidget);
    // The current country is announced selected; the dial codes are the reader's digits.
    expect(tester.getSemantics(find.bySemanticsLabel('ایران +۹۸')), containsSemantics(isSelected: true, isButton: true));
    expect(find.text('+۴۹'), findsOneWidget);

    // The search box filters the plan.
    await tester.enterText(find.byType(TextField).last, 'آلمان');
    await tester.pumpAndSettle();
    // The trigger BEHIND the sheet still reads «ایران», so the list is the scope.
    expect(find.descendant(of: find.byType(ListView), matching: find.text('ایران')), findsNothing);
    await tester.tap(find.descendant(of: find.byType(ListView), matching: find.text('آلمان')));
    await tester.pumpAndSettle();
    // The national number survives the country change.
    expect(value, '+499123456789');
    expect(tester.getSemantics(find.bySemanticsLabel('کشور')), containsSemantics(value: 'آلمان +۴۹'));
    semantics.dispose();
  });

  testWidgets('PhoneInput en-US: LTR geometry, Latin digits, defaultCountry and a caller\'s own plan', (tester) async {
    final semantics = tester.ensureSemantics();
    final seen = <String>[];
    await tester.pumpWidget(app('en-US', LumoPhoneInput(
      label: 'Mobile number',
      countryLabel: 'Country',
      closeLabel: 'Close',
      searchLabel: 'Search countries',
      defaultCountry: 'US',
      onChanged: seen.add,
    )));
    expect(tester.getSemantics(find.bySemanticsLabel('Country')), containsSemantics(value: 'United States +1'));
    // The row mirrors the other way: the selector at the reading start = LEFT.
    final row = tester.getRect(find.byType(LumoPhoneInput));
    expect(tester.getCenter(find.bySemanticsLabel('Country')).dx, lessThan(row.center.dx));
    // Still an LTR island — the prefix is left of the digits in every script.
    expect(tester.getCenter(find.text('+1')).dx, lessThan(tester.getCenter(numberField()).dx));
    await tester.enterText(numberField(), '2025550123');
    await tester.pumpAndSettle();
    expect(seen.last, '+12025550123');

    // A caller's own plan: names per locale tag, the code when the tag is unnamed.
    await tester.pumpWidget(app('en-US', const LumoPhoneInput(
      label: 'Mobile number',
      countryLabel: 'Country',
      closeLabel: 'Close',
      searchLabel: 'Search countries',
      defaultCountry: 'QA',
      countries: [LumoPhoneCountry(code: 'QA', dial: '974', nationalLength: 8, names: {'en': 'Qatar'})],
    )));
    expect(tester.getSemantics(find.bySemanticsLabel('Country')), containsSemantics(value: 'Qatar +974'));
    semantics.dispose();
  });

  testWidgets('PhoneInput: invalid announces the error and takes the critical border; disabled neither types nor opens the country sheet', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoPhoneInput(
      label: 'شمارهٔ موبایل',
      countryLabel: 'کشور',
      closeLabel: 'بستن',
      searchLabel: 'جست‌وجوی کشور',
      errorMessage: 'شماره کامل نیست',
    )));
    expect(find.text('شماره کامل نیست'), findsOneWidget);
    expect(tester.getSemantics(numberField()).getSemanticsData().hint, contains('شماره کامل نیست'));
    final c = LumoScope.of(tester.element(find.text('شمارهٔ موبایل'))).colours;
    final border = tester.widget<TextField>(numberField()).decoration!.enabledBorder!;
    expect(border.borderSide.color, c.critical);

    await tester.pumpWidget(app('fa-IR', const LumoPhoneInput(
      label: 'شمارهٔ موبایل',
      countryLabel: 'کشور',
      closeLabel: 'بستن',
      searchLabel: 'جست‌وجوی کشور',
      isDisabled: true,
    )));
    expect(tester.getSemantics(numberField()), containsSemantics(isEnabled: false));
    expect(tester.getSemantics(find.bySemanticsLabel('کشور')), containsSemantics(isEnabled: false));
    await tester.tap(find.bySemanticsLabel('کشور'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن'), findsNothing);
    semantics.dispose();
  });

  testWidgets('PhoneInput: errorMessage is the INVALID state on the number field, the web\'s aria-invalid', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoPhoneInput(label: 'شمارهٔ همراه', countryLabel: 'کشور', closeLabel: 'بستن', searchLabel: 'جستجو')));
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().validationResult, SemanticsValidationResult.none);
    await tester.pumpWidget(app('fa-IR', const LumoPhoneInput(label: 'شمارهٔ همراه', countryLabel: 'کشور', closeLabel: 'بستن', searchLabel: 'جستجو', errorMessage: 'شماره کامل نیست')));
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().validationResult, SemanticsValidationResult.invalid);
    // Painted once, announced once.
    expect(find.text('شماره کامل نیست'), findsOneWidget);
    expect(find.bySemanticsLabel('شماره کامل نیست'), findsNothing);
    semantics.dispose();
  });
}
