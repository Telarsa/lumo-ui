// Colour: a swatch is announced by the colour's NAME, or by its hex — never by
// a word meaning "colour", which would make nine controls indistinguishable.
// The trigger carries the colour as its VALUE, the hex box is an LTR island,
// and a hex written in Persian digits parses.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: 360, child: child)))),
    );

const brand = Color(0xFF1E90FF);
const clay = Color(0xFFB94A3C);

const swatches = [
  LumoColorSwatch(color: brand, name: 'آبی نفتی'),
  LumoColorSwatch(color: clay, name: 'خاکی'),
  // No name: announced by its hex, which is still a fact a reader can act on.
  LumoColorSwatch(color: Color(0xFF0A0A0A)),
];

void main() {
  test('hex: formats, parses, and folds Persian digits — «#۱۲۳۴۵۶» is what a Persian keyboard sends', () {
    expect(lumoColorHex(brand), '#1E90FF');
    expect(lumoColorHex(const Color(0x801E90FF)), '#1E90FF80', reason: 'alpha is carried, in CSS order');
    expect(lumoParseColor('#1e90ff'), brand);
    expect(lumoParseColor('1E90FF'), brand, reason: 'the hash is optional');
    expect(lumoParseColor('#f00'), const Color(0xFFFF0000), reason: 'the three-digit form expands');
    expect(lumoParseColor('#۱۲۳۴۵۶', locale: 'fa-IR'), const Color(0xFF123456));
    expect(lumoParseColor('  #1E90FF  '), brand);
    expect(lumoParseColor('red'), isNull, reason: 'a colour keyword is an English word; this field is not English-only');
    expect(lumoParseColor(''), isNull);
    expect(lumoParseColor('#12345'), isNull);
  });

  testWidgets('ColorPicker fa-IR: an exclusive group of named swatches; the unnamed one is announced by its hex; choosing reports the colour', (tester) async {
    final semantics = tester.ensureSemantics();
    Color? chosen;
    await tester.pumpWidget(app('fa-IR', LumoColorPicker(
      label: 'رنگ‌های آماده',
      swatches: swatches,
      value: brand,
      onChanged: (color) => chosen = color,
    )));

    expect(find.bySemanticsLabel('رنگ‌های آماده'), findsOneWidget);
    // Named by the colour, with its selected state — not by colour alone.
    expect(tester.getSemantics(find.bySemanticsLabel('آبی نفتی')), containsSemantics(label: 'آبی نفتی', isChecked: true, isInMutuallyExclusiveGroup: true, isEnabled: true));
    expect(tester.getSemantics(find.bySemanticsLabel('خاکی')), containsSemantics(isChecked: false, isInMutuallyExclusiveGroup: true));
    // No name given: the hex IS the name.
    expect(find.bySemanticsLabel('#0A0A0A'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('خاکی'));
    await tester.pumpAndSettle();
    expect(chosen, clay);

    // The first swatch is at the reading start = the right under fa-IR.
    final group = tester.getRect(find.byType(LumoColorPicker));
    expect(tester.getCenter(find.bySemanticsLabel('آبی نفتی')).dx > group.center.dx, isTrue);
    semantics.dispose();
  });

  testWidgets('ColorInput fa-IR: the trigger is named by the field with the COLOUR as its value; the sheet names the group separately; a swatch changes it', (tester) async {
    final semantics = tester.ensureSemantics();
    Color? changed;
    await tester.pumpWidget(app('fa-IR', LumoColorInput(
      label: 'رنگ برند',
      pickerLabel: 'رنگ‌های آماده',
      closeLabel: 'بستن',
      swatches: swatches,
      defaultValue: brand,
      description: 'روی نمایهٔ عمومی دیده می‌شود',
      onChanged: (color) => changed = color,
    )));

    final trigger = tester.getSemantics(find.bySemanticsLabel('رنگ برند')).getSemanticsData();
    expect(trigger.label, 'رنگ برند');
    // The colour is the VALUE — a coloured square is not a value.
    expect(trigger.value, 'آبی نفتی');
    expect(trigger.hint, 'روی نمایهٔ عمومی دیده می‌شود');
    expect(trigger.flagsCollection.isButton, isTrue);

    await tester.tap(find.bySemanticsLabel('رنگ برند'));
    await tester.pumpAndSettle();
    // The route is named by the FIELD; the swatch group by `pickerLabel` —
    // two different names, so nothing is announced twice. (`pickerLabel` is
    // announced, not drawn: a grid of colours needs no caption on screen.)
    expect(find.bySemanticsLabel('رنگ‌های آماده'), findsOneWidget);
    // The ✕ AND the scrim carry `closeLabel` — deliberately, per `sheet.dart`:
    // a dismissible barrier must have a name, and it is the same name.
    expect(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('خاکی'));
    await tester.pumpAndSettle();
    expect(changed, clay);
    await tester.tap(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن'));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(find.bySemanticsLabel('رنگ برند')).getSemanticsData().value, 'خاکی', reason: 'the trigger repaints from the same source the sheet writes');
    semantics.dispose();
  });

  testWidgets('ColorInput fa-IR: the hex box is an LTR island, accepts Persian digits, and says so when the text is not a colour', (tester) async {
    final semantics = tester.ensureSemantics();
    Color? changed;
    await tester.pumpWidget(app('fa-IR', LumoColorInput(
      label: 'رنگ برند',
      pickerLabel: 'رنگ‌های آماده',
      closeLabel: 'بستن',
      hexLabel: 'کد رنگ',
      invalidColorMessage: 'این یک کد رنگ نیست.',
      onChanged: (color) => changed = color,
    )));

    await tester.tap(find.bySemanticsLabel('رنگ برند'));
    await tester.pumpAndSettle();
    // A code reads left-to-right, inside a right-to-left sheet.
    expect(tester.widget<TextField>(find.byType(TextField)).textDirection, TextDirection.ltr);

    await tester.enterText(find.byType(TextField), '#۱۲۳۴۵۶');
    await tester.pumpAndSettle();
    expect(changed, const Color(0xFF123456), reason: 'Persian digits parse');
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().hint, '');

    await tester.enterText(find.byType(TextField), 'قرمز');
    await tester.pumpAndSettle();
    // The refusal is bound to the box itself, as its hint.
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().hint, 'این یک کد رنگ نیست.');
    semantics.dispose();
  });

  testWidgets('ColorInput en-US: an unnamed colour is announced by its hex, and the trigger mirrors', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoColorInput(
      label: 'Brand colour',
      pickerLabel: 'Presets',
      closeLabel: 'Close',
      swatches: [LumoColorSwatch(color: Color(0xFF0A0A0A))],
      defaultValue: Color(0xFF0A0A0A),
    )));
    expect(tester.getSemantics(find.bySemanticsLabel('Brand colour')).getSemanticsData().value, '#0A0A0A');
    // The swatch preview sits at the inline start = the left under en-US.
    final trigger = tester.getRect(find.byType(InkWell).first);
    expect(tester.getCenter(find.text('#0A0A0A')).dx > trigger.left, isTrue);
    semantics.dispose();
  });

  testWidgets('ColorInput: a hex box with no message is refused at construction; an empty picker and a way-in-less field are refused at build', (tester) async {
    expect(() => LumoColorInput(label: 'x', pickerLabel: 'y', closeLabel: 'z', hexLabel: 'h'), throwsAssertionError);
    // A `length` check cannot live in a const constructor (it would make
    // `const LumoColorPicker(…)` a compile error), so it is checked at build.
    await tester.pumpWidget(app('fa-IR', const LumoColorPicker(label: 'x', swatches: [])));
    expect(tester.takeException(), isAssertionError);
    await tester.pumpWidget(app('fa-IR', const LumoColorInput(label: 'x', pickerLabel: 'y', closeLabel: 'z')));
    expect(tester.takeException(), isAssertionError);
  });
}
