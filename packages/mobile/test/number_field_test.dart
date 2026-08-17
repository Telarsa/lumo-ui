import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 320, child: child)))),
    );

void main() {
  testWidgets('NumberField under fa-IR: shows Persian digits; parses «۱۲» typed as 12; +/− named, at the inline end (left); step; RTL', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <num?>[];
    await tester.pumpWidget(app('fa-IR', LumoNumberField(label: 'تعداد', incrementLabel: 'افزایش تعداد', decrementLabel: 'کاهش تعداد', defaultValue: 1234, description: 'به عدد', onChanged: changes.add)));
    expect(Directionality.of(tester.element(find.byType(TextField))), TextDirection.rtl);
    // Display through formatNumber: Persian digits and separator, never «1,234».
    expect(find.text('۱٬۲۳۴'), findsOneWidget);
    expect(find.text('1,234'), findsNothing);
    expect(find.text('1234'), findsNothing);
    // One text field named by the label, its value the formatted number.
    final node = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(node.label, 'تعداد');
    expect(node.hint, 'به عدد');
    expect(node.value, '۱٬۲۳۴');
    expect(node.flagsCollection.isTextField && node.flagsCollection.isEnabled, isTrue);
    expect(node.hasAction(SemanticsAction.tap) && node.hasAction(SemanticsAction.focus), isTrue);
    // The steppers: named once each, buttons, at the inline end = LEFT under fa-IR.
    final up = find.bySemanticsLabel('افزایش تعداد');
    final down = find.bySemanticsLabel('کاهش تعداد');
    expect(up, findsOneWidget);
    expect(down, findsOneWidget);
    expect(tester.getSemantics(up), matchesSemantics(label: 'افزایش تعداد', isButton: true, hasEnabledState: true, isEnabled: true, isFocusable: true, hasTapAction: true, hasFocusAction: true));
    final field = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(up).dx < field.center.dx, isTrue, reason: 'inline end = left under fa-IR');
    expect(tester.getCenter(up).dy < tester.getCenter(down).dy, isTrue, reason: 'stacked on the block axis: up above down');
    // The digits are an LTR island whose text sits at the reading start (right).
    final tf = tester.widget<TextField>(find.byType(TextField));
    expect(tf.textDirection, TextDirection.ltr);
    expect(tf.textAlign, TextAlign.end);
    // Tap +: 1235, shown in Persian.
    await tester.tap(up);
    await tester.pump();
    expect(changes.last, 1235);
    expect(find.text('۱٬۲۳۵'), findsOneWidget);
    // Type Persian digits: parsed to a number.
    await tester.enterText(find.byType(TextField), '۱۲');
    expect(changes.last, 12);
    await tester.enterText(find.byType(TextField), '۱٬۲۳۴٫۵');
    expect(changes.last, 1234.5);
    await tester.enterText(find.byType(TextField), '-۷');
    expect(changes.last, -7);
    await tester.enterText(find.byType(TextField), '');
    expect(changes.last, isNull);
    // Blur formats what was typed.
    await tester.enterText(find.byType(TextField), '۴۲');
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();
    expect(find.text('۴۲'), findsOneWidget);
    expect(changes.last, 42);
    semantics.dispose();
  });

  testWidgets('NumberField under en-US: steppers at the right; bounds disable the stepper; controlled value; disabled and error announced', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <num?>[];
    await tester.pumpWidget(app('en-US', LumoNumberField(label: 'Quantity', incrementLabel: 'Increase quantity', decrementLabel: 'Decrease quantity', value: 10, min: 0, max: 10, step: 5, onChanged: changes.add)));
    expect(Directionality.of(tester.element(find.byType(TextField))), TextDirection.ltr);
    expect(find.text('10'), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField)).textAlign, TextAlign.start);
    final up = find.bySemanticsLabel('Increase quantity');
    final down = find.bySemanticsLabel('Decrease quantity');
    final field = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(up).dx > field.center.dx, isTrue, reason: 'inline end = right under en-US');
    // At max: + is disabled and announced so; − works and clamps to the step.
    expect(tester.getSemantics(up), matchesSemantics(label: 'Increase quantity', isButton: true, hasEnabledState: true, isEnabled: false));
    expect(tester.getSemantics(down), matchesSemantics(label: 'Decrease quantity', isButton: true, hasEnabledState: true, isEnabled: true, isFocusable: true, hasTapAction: true, hasFocusAction: true));
    await tester.tap(down);
    expect(changes.last, 5);
    // ASCII typed under en-US parses too; a typed value beyond max reports raw while typing and clamps on blur.
    await tester.enterText(find.byType(TextField), '1,234');
    expect(changes.last, 1234);
    // Controlled empty and disabled: no text, disabled announced with the error as hint.
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();
    await tester.pumpWidget(app('en-US', LumoNumberField(label: 'Quantity', incrementLabel: 'Increase quantity', decrementLabel: 'Decrease quantity', value: double.nan, isDisabled: true, errorMessage: 'مقدار لازم است', onChanged: changes.add)));
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, '');
    expect(find.text('مقدار لازم است'), findsOneWidget);
    expect(tester.getSemantics(find.byType(TextField)), matchesSemantics(label: 'Quantity', hint: 'مقدار لازم است', isTextField: true, hasEnabledState: true, isEnabled: false, isReadOnly: true));
    expect(tester.getSemantics(up), matchesSemantics(label: 'Increase quantity', isButton: true, hasEnabledState: true, isEnabled: false));
    semantics.dispose();
  });

  testWidgets('NumberField: the steppers hit test at 44 wide over the control\'s full height, and the chevrons paint where the web puts them', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoNumberField(label: 'تعداد', incrementLabel: 'افزایش تعداد', decrementLabel: 'کاهش تعداد', defaultValue: 3)));
    // Measured before this pass: 24x14 each, the smallest pair of buttons in the
    // library. 44 tall is impossible — two stack inside one 36 px control.
    for (final name in ['افزایش تعداد', 'کاهش تعداد']) {
      final size = tester.getSize(find.bySemanticsLabel(name));
      expect(size.width, greaterThanOrEqualTo(44), reason: '$name grew on the inline axis');
      expect(size.height, greaterThanOrEqualTo(18), reason: '$name owns half the control height');
    }
    // The paint did not move: the chevron column is still `end-1 w-6`, so its
    // centre sits 16 from the field's inline END — the LEFT under fa-IR.
    final field = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(find.byIcon(Icons.keyboard_arrow_up)).dx, closeTo(field.left + 16, 0.5));
    expect(tester.getCenter(find.byIcon(Icons.keyboard_arrow_up)).dy, lessThan(tester.getCenter(find.byIcon(Icons.keyboard_arrow_down)).dy), reason: 'up is more, in both scripts');
    // Under en-US the same column mirrors to the right edge.
    await tester.pumpWidget(app('en-US', const LumoNumberField(label: 'Quantity', incrementLabel: 'Increase quantity', decrementLabel: 'Decrease quantity', defaultValue: 3)));
    final en = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(find.byIcon(Icons.keyboard_arrow_up)).dx, closeTo(en.right - 16, 0.5));
    semantics.dispose();
  });
}
