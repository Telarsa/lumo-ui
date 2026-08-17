// Mask input: the one thing a masked field on an Iranian phone must do —
// accept the digits an Iranian keyboard produces. «۱۲۳۴۵۶۷۸» fills a
// `'####-####'` mask, the raw value comes back ASCII, and the box is an LTR
// island in an otherwise right-to-left form.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: 360, child: child)))),
    );

void main() {
  test('lumoMaskValue: Persian and Arabic-Indic digits fill the mask, raw is ASCII, and re-masking is stable', () {
    // The defect this file exists for: a mask that only understands U+0030–0039
    // silently refuses every keystroke a Persian keyboard sends.
    final persian = lumoMaskValue('۱۲۳۴۵۶۷۸', '####-####', locale: 'fa-IR');
    expect(persian.masked, '1234-5678');
    expect(persian.raw, '12345678');
    expect(persian.isComplete, isTrue);

    // Persian digits fold under EVERY locale (the fold carries `fa` always);
    // another script's digits fold when that script is the reader's — the table
    // is learned from `intl` per locale, never hardcoded. intl's bare `ar`
    // formats with Latin digits, so `ar-EG` is the tag that carries ٤٥٦.
    expect(lumoMaskValue('۴۵۶', '###', locale: 'en-US').raw, '456');
    expect(lumoMaskValue('٤٥٦', '###', locale: 'ar-EG').raw, '456');

    // Already masked, pasted with junk, half typed.
    expect(lumoMaskValue('1234-5678', '####-####').masked, '1234-5678');
    expect(lumoMaskValue('1234 5678', '####-####').raw, '12345678');
    final half = lumoMaskValue('۱۲۳۴', '####-####', locale: 'fa-IR');
    expect(half.masked, '1234', reason: 'a half-typed value ends on a digit, never on a dangling separator');
    expect(half.isComplete, isFalse);
    expect(lumoMaskValue('۱۲۳۴۵', '####-####', locale: 'fa-IR').masked, '1234-5', reason: 'the separator arrives with the digit after it');

    // Letters and the alphanumeric token.
    expect(lumoMaskValue('ایران۱۲', '@@@@-##', locale: 'fa-IR').masked, 'ایرا-12', reason: 'a letter slot takes any script’s letters');
    expect(lumoMaskValue('a1b2', '****').raw, 'a1b2');
    // Anything no slot accepts is dropped rather than stuffed into a slot.
    expect(lumoMaskValue('12-34', '####').raw, '1234');
  });

  testWidgets('MaskInput fa-IR: typing «۱۲۳۴۵۶۷۸» fills the mask, the raw value is ASCII, and the field is an LTR island named by its label', (tester) async {
    final semantics = tester.ensureSemantics();
    LumoMaskValue? last;
    await tester.pumpWidget(app('fa-IR', LumoMaskInput(
      label: 'شمارهٔ کارت',
      mask: '####-####',
      maskPlaceholder: '_',
      description: 'هشت رقم پشت کارت',
      incompleteMessage: 'شماره کامل نیست.',
      onChanged: (value) => last = value,
    )));

    // The name, the description as the hint, one text-field node — and the
    // skeleton as the placeholder, which carries no word in any language.
    final field = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(field.label, contains('شمارهٔ کارت'));
    expect(field.hint, 'هشت رقم پشت کارت');
    expect(field.flagsCollection.isTextField, isTrue);
    expect(find.text('____-____'), findsOneWidget);
    // The FORM is right-to-left; the BOX is not — a code reads left-to-right.
    expect(Directionality.of(tester.element(find.text('شمارهٔ کارت'))), TextDirection.rtl);
    expect(tester.widget<TextField>(find.byType(TextField)).textDirection, TextDirection.ltr);

    await tester.enterText(find.byType(TextField), '۱۲۳۴۵۶۷۸');
    await tester.pumpAndSettle();
    expect(find.text('1234-5678'), findsOneWidget, reason: 'Persian digits fill the mask');
    expect(last!.raw, '12345678', reason: 'the raw value is ASCII — that is what a server is sent');
    expect(last!.masked, '1234-5678');
    expect(last!.isComplete, isTrue);
    expect(find.text('شماره کامل نیست.'), findsNothing);
    semantics.dispose();
  });

  testWidgets('MaskInput fa-IR: a half-filled mask announces the incomplete message in the FIELD’s own hint', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoMaskInput(
      label: 'شمارهٔ کارت',
      mask: '####-####',
      incompleteMessage: 'شماره کامل نیست.',
    )));

    await tester.enterText(find.byType(TextField), '۱۲۳');
    await tester.pumpAndSettle();
    expect(find.text('123'), findsOneWidget);
    // The binding: the message is this field's hint, not a loose Text beside it.
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().hint, 'شماره کامل نیست.');

    await tester.enterText(find.byType(TextField), '۱۲۳۴۵۶۷۸');
    await tester.pumpAndSettle();
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().hint, '', reason: 'a full mask is not an error');
    semantics.dispose();
  });

  testWidgets('MaskInput en-US: controlled — the caller’s value is re-masked, and an app error wins over the incomplete message', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoMaskInput(
      label: 'Card number',
      mask: '####-####',
      value: '12345678',
      incompleteMessage: 'The number is incomplete.',
      errorMessage: 'That card was declined.',
    )));
    expect(find.text('1234-5678'), findsOneWidget, reason: 'a raw controlled value is masked for display');
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().hint, 'That card was declined.');

    // A letter mask takes the text keyboard back; a digit mask keeps the numeric one.
    await tester.pumpWidget(app('en-US', const LumoMaskInput(label: 'Plate', mask: '@@-###')));
    expect(tester.widget<TextField>(find.byType(TextField)).keyboardType, TextInputType.text);
    await tester.pumpWidget(app('en-US', const LumoMaskInput(label: 'Code', mask: '###')));
    expect(tester.widget<TextField>(find.byType(TextField)).keyboardType, TextInputType.number);
    semantics.dispose();
  });

  testWidgets('MaskInput: an empty mask and a multi-character maskPlaceholder are refused at construction', (tester) async {
    expect(() => LumoMaskInput(label: 'x', mask: ''), throwsAssertionError);
    expect(() => LumoMaskInput(label: 'x', mask: '###', maskPlaceholder: '--'), throwsAssertionError);
  });
}
