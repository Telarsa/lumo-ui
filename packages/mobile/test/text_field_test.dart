// TextField: the STATES the web sets on the control — disabled, read-only,
// required, invalid — reaching the reader as STATE and not only as words, and
// each announced string heard EXACTLY ONCE.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {double width = 320}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: width, child: child)))),
    );

void main() {
  testWidgets('TextField fa-IR: ONE node named by the label; description and error are VISIBLE once and ANNOUNCED once', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoTextField(label: 'نام خانوادگی', description: 'مطابق شناسنامه', errorMessage: 'این نام کوتاه است')));
    expect(Directionality.of(tester.element(find.byType(TextField))), TextDirection.rtl);
    // Both are painted…
    expect(find.text('مطابق شناسنامه'), findsOneWidget);
    expect(find.text('این نام کوتاه است'), findsOneWidget);
    // …and neither is a node of its own: they reach the reader as the field's
    // hint. `errorText` used to build a second node for the same words.
    expect(find.bySemanticsLabel('مطابق شناسنامه'), findsNothing);
    expect(find.bySemanticsLabel('این نام کوتاه است'), findsNothing);
    final data = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(data.label, 'نام خانوادگی');
    expect(data.hint, 'مطابق شناسنامه. این نام کوتاه است');
    expect(find.bySemanticsLabel('نام خانوادگی'), findsOneWidget, reason: 'the painted label row is excluded: the name is heard once');
    semantics.dispose();
  });

  testWidgets('TextField: errorMessage puts the INVALID state on the node, not only the sentence', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoTextField(label: 'کد ملی')));
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().validationResult, SemanticsValidationResult.none);
    await tester.pumpWidget(app('fa-IR', const LumoTextField(label: 'کد ملی', errorMessage: 'ده رقم لازم است')));
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().validationResult, SemanticsValidationResult.invalid);
    semantics.dispose();
  });

  testWidgets('TextField: isInvalid marks the field wrong WITHOUT a sentence (the web prop), and still paints the critical border', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoTextField(label: 'کد ملی', isInvalid: true)));
    final data = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(data.validationResult, SemanticsValidationResult.invalid);
    expect(data.hint, isEmpty, reason: 'no message: nothing to say, only a state');
    final c = LumoScope.of(tester.element(find.byType(TextField))).colours;
    final border = tester.widget<TextField>(find.byType(TextField)).decoration!.enabledBorder! as OutlineInputBorder;
    expect(border.borderSide.color, c.critical);
    // And `isInvalid: false` overrules a message, as on the web.
    await tester.pumpWidget(app('fa-IR', const LumoTextField(label: 'کد ملی', errorMessage: 'خطا', isInvalid: false)));
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().validationResult, SemanticsValidationResult.none);
    semantics.dispose();
  });

  testWidgets('TextField: required is a STATE, and an optional field carries none', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoTextField(label: 'نام', isRequired: true)));
    expect(tester.getSemantics(find.byType(TextField)), containsSemantics(label: 'نام', hasRequiredState: true, isRequired: true));
    // The marker is drawn too — a mobile addition; the web paints none.
    expect(find.text('نام *'), findsOneWidget);
    await tester.pumpWidget(app('fa-IR', const LumoTextField(label: 'نام')));
    final data = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(data.flagsCollection.hasRequiredState, isFalse, reason: 'an optional field has no `required=false`, on the web or here');
    expect(find.text('نام *'), findsNothing);
    semantics.dispose();
  });

  testWidgets('TextField en-US: disabled and read-only announce themselves; showLabel false keeps the name', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoTextField(label: 'Full name', isDisabled: true)));
    expect(tester.getSemantics(find.byType(TextField)), containsSemantics(label: 'Full name', hasEnabledState: true, isEnabled: false));
    await tester.pumpWidget(app('en-US', const LumoTextField(label: 'Full name', isReadOnly: true, showLabel: false)));
    expect(find.text('Full name'), findsNothing, reason: 'showLabel: false drops the visible row only');
    expect(find.bySemanticsLabel('Full name'), findsOneWidget, reason: 'the name never leaves');
    expect(tester.widget<TextField>(find.byType(TextField)).readOnly, isTrue);
    semantics.dispose();
  });
}
