import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 320, child: child)))),
    );

void main() {
  testWidgets('TextArea under fa-IR: one multiline text field named by label; counter in Persian digits; RTL; onChanged; required mark', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <String>[];
    await tester.pumpWidget(app('fa-IR', LumoTextArea(label: 'توضیحات', description: 'اختیاری', maxLength: 200, isRequired: true, onChanged: changes.add)));
    expect(Directionality.of(tester.element(find.byType(TextField))), TextDirection.rtl);
    expect(find.text('توضیحات *'), findsOneWidget);
    expect(find.text('اختیاری'), findsOneWidget);
    // The counter: never raw «0/200».
    expect(find.text('۰/۲۰۰'), findsOneWidget);
    expect(find.text('0/200'), findsNothing);
    final s = tester.getSemantics(find.byType(TextField));
    expect(s, matchesSemantics(label: 'توضیحات', hint: 'اختیاری', isTextField: true, isMultiline: true, hasEnabledState: true, isEnabled: true, hasRequiredState: true, isRequired: true, hasTapAction: true, hasFocusAction: true, maxValueLength: 200, currentValueLength: 0));
    // The name and the description are PAINTED once and ANNOUNCED once: both
    // visible copies are excluded, because the node already carries them.
    expect(find.bySemanticsLabel('توضیحات'), findsOneWidget);
    expect(find.bySemanticsLabel('اختیاری'), findsNothing);
    // Persian text typed: counted in Persian digits; taller than one line.
    await tester.enterText(find.byType(TextField), 'سلام لومو');
    await tester.pump();
    expect(changes.last, 'سلام لومو');
    expect(find.text('۹/۲۰۰'), findsOneWidget);
    expect(tester.getSize(find.byType(TextField)).height, greaterThan(LumoControl.md * 1.5), reason: 'minLines 3: the box is a minimum height, not a control height');
    semantics.dispose();
  });

  testWidgets('TextArea under en-US: ASCII counter; maxLength enforced; error announced; disabled', (tester) async {
    final semantics = tester.ensureSemantics();
    final controller = TextEditingController();
    await tester.pumpWidget(app('en-US', LumoTextArea(label: 'Notes', maxLength: 5, controller: controller)));
    expect(Directionality.of(tester.element(find.byType(TextField))), TextDirection.ltr);
    expect(find.text('0/5'), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'abcdefgh');
    await tester.pump();
    expect(controller.text, 'abcde', reason: 'maxLength is enforced, not only counted');
    expect(find.text('5/5'), findsOneWidget);
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pumpWidget(app('en-US', const LumoTextArea(label: 'Notes', errorMessage: 'خیلی کوتاه است', isDisabled: true, minLines: 2, maxLines: 4)));
    expect(find.text('خیلی کوتاه است'), findsOneWidget);
    expect(tester.getSemantics(find.byType(TextField)), matchesSemantics(label: 'Notes', hint: 'خیلی کوتاه است', isTextField: true, isMultiline: true, hasEnabledState: true, isEnabled: false, isReadOnly: true, validationResult: SemanticsValidationResult.invalid));
    // The message is painted once and is NOT a second announcing node: it used
    // to reach the reader twice, as the field's hint and as Material's own
    // `errorText` node.
    expect(find.bySemanticsLabel('خیلی کوتاه است'), findsNothing);
    controller.dispose();
    semantics.dispose();
  });

  testWidgets('TextArea: minLines defaults to the web TextArea\'s `rows` — FOUR, not three', (tester) async {
    await tester.pumpWidget(app('en-US', const LumoTextArea(label: 'Notes')));
    expect(tester.widget<TextField>(find.byType(TextField)).minLines, 4, reason: 'text-area.tsx defaults rows to 4; this used to default to 3');
  });

  testWidgets('TextArea: isInvalid marks the box wrong with no message, and required is a real state', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoTextArea(label: 'توضیحات', isInvalid: true)));
    final data = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(data.validationResult, SemanticsValidationResult.invalid);
    expect(data.flagsCollection.hasRequiredState, isFalse, reason: 'optional: no required state at all');
    final c = LumoScope.of(tester.element(find.byType(TextField))).colours;
    expect((tester.widget<TextField>(find.byType(TextField)).decoration!.enabledBorder! as OutlineInputBorder).borderSide.color, c.critical);
    semantics.dispose();
  });
}
