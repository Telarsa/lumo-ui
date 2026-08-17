// Combobox: the SEMANTICS TREE — the field's name and role, the named option
// list, the active option's selected state — under fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: 360, child: child)))),
    );

const cities = [
  LumoComboboxOption(id: 'thr', label: 'تهران'),
  LumoComboboxOption(id: 'krj', label: 'کرج'),
  LumoComboboxOption(id: 'isf', label: 'اصفهان'),
  LumoComboboxOption(id: 'shz', label: 'شیراز', isDisabled: true),
];

Finder clearButton(String label) => find.byWidgetPredicate((w) => w is LumoIconButton && w.label == label);

void main() {
  testWidgets('Combobox fa-IR: ONE text-field node named by the label, the list is a NAMED list of buttons, typing filters (Arabic ك folds), choosing reports the id and closes', (tester) async {
    final semantics = tester.ensureSemantics();
    final chosen = <String?>[];
    final queries = <String>[];
    await tester.pumpWidget(app('fa-IR', LumoCombobox(
      label: 'شهر',
      placeholder: 'شهر را بنویسید',
      options: cities,
      suggestionsLabel: 'پیشنهادها',
      emptyLabel: 'شهری پیدا نشد',
      clearLabel: 'پاک کردن شهر',
      description: 'محل انجام کار',
      onChanged: chosen.add,
    )));

    // The field: named ONCE, a text field — NOT SemanticsRole.comboBox, whose
    // debug validator is unimplemented in Flutter 3.35 and throws.
    expect(find.bySemanticsLabel('شهر'), findsOneWidget);
    // One node: the name first, then the placeholder (Material's hint semantics
    // merge in, as they do on `LumoSearchField`), the description as the hint.
    final field0 = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(field0.label, startsWith('شهر'));
    expect(field0.label, contains('شهر را بنویسید'));
    expect(field0.hint, 'محل انجام کار');
    expect(field0.flagsCollection.isTextField && field0.flagsCollection.isEnabled, isTrue);
    expect(Directionality.of(tester.element(find.text('شهر'))), TextDirection.rtl);
    // Closed: no list.
    expect(find.bySemanticsLabel('پیشنهادها'), findsNothing);

    await tester.tap(find.byType(TextField));
    await tester.pumpAndSettle();
    // Open: a named list, each option a button, the disabled one disabled.
    expect(tester.getSemantics(find.bySemanticsLabel('پیشنهادها')), containsSemantics(label: 'پیشنهادها'));
    expect(tester.getSemantics(find.bySemanticsLabel('تهران')), containsSemantics(label: 'تهران', isButton: true, isSelected: false, isEnabled: true));
    expect(tester.getSemantics(find.bySemanticsLabel('شیراز')), containsSemantics(isEnabled: false));

    await tester.enterText(find.byType(TextField), 'اصف');
    await tester.pumpAndSettle();
    expect(find.text('اصفهان'), findsOneWidget);
    expect(find.text('تهران'), findsNothing);

    // The fold: Arabic kaf ك matches the Persian keheh ک of «کرج».
    await tester.enterText(find.byType(TextField), 'كرج');
    await tester.pumpAndSettle();
    expect(find.text('کرج'), findsOneWidget);

    await tester.tap(find.text('کرج'));
    await tester.pumpAndSettle();
    expect(chosen, ['krj']);
    // Chosen: the list is closed and the text is the option's label.
    expect(find.bySemanticsLabel('پیشنهادها'), findsNothing);
    expect(find.text('کرج'), findsOneWidget);
    expect(queries, isEmpty);
    semantics.dispose();
  });

  testWidgets('Combobox fa-IR: nothing matches → the empty message; the ✕ is named and sits at the inline END (left); clearing reports null', (tester) async {
    final semantics = tester.ensureSemantics();
    final chosen = <String?>[];
    await tester.pumpWidget(app('fa-IR', LumoCombobox(
      label: 'شهر',
      options: cities,
      suggestionsLabel: 'پیشنهادها',
      emptyLabel: 'شهری پیدا نشد',
      clearLabel: 'پاک کردن شهر',
      value: 'thr',
      onChanged: chosen.add,
    )));
    // A value: its option is announced selected once the list is open.
    await tester.tap(find.byType(TextField));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(find.bySemanticsLabel('تهران')), containsSemantics(isSelected: true));

    // The ✕ exists because the field is filled, and sits at the inline end = LEFT under fa-IR.
    expect(clearButton('پاک کردن شهر'), findsOneWidget);
    final field = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(clearButton('پاک کردن شهر')).dx, lessThan(field.center.dx));

    await tester.enterText(find.byType(TextField), 'قزقز');
    await tester.pumpAndSettle();
    expect(find.text('شهری پیدا نشد'), findsOneWidget);
    expect(find.bySemanticsLabel('پیشنهادها'), findsNothing);

    await tester.tap(clearButton('پاک کردن شهر'));
    await tester.pumpAndSettle();
    expect(chosen, [null]);
    expect(clearButton('پاک کردن شهر'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Combobox en-US: LTR geometry; allowsCustomValue commits typed text on submit, and refuses it when off; onSearch hands over the filtering', (tester) async {
    final semantics = tester.ensureSemantics();
    final chosen = <String?>[];
    final queries = <String>[];
    await tester.pumpWidget(app('en-US', LumoCombobox(
      label: 'City',
      options: const [LumoComboboxOption(id: 'thr', label: 'Tehran'), LumoComboboxOption(id: 'krj', label: 'Karaj')],
      suggestionsLabel: 'Suggestions',
      emptyLabel: 'No city found',
      clearLabel: 'Clear city',
      allowsCustomValue: true,
      onSearch: queries.add,
      onChanged: chosen.add,
    )));
    expect(Directionality.of(tester.element(find.text('City'))), TextDirection.ltr);
    await tester.tap(find.byType(TextField));
    await tester.pumpAndSettle();
    // The ✕ at the inline end = RIGHT under en-US (it appears once there is text).
    await tester.enterText(find.byType(TextField), 'Qom');
    await tester.pumpAndSettle();
    final field = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(clearButton('Clear city')).dx, greaterThan(field.center.dx));
    // `onSearch` turns the built-in filter OFF: the caller's options stand as given.
    expect(queries, ['Qom']);
    expect(find.text('Tehran'), findsOneWidget);
    expect(find.text('No city found'), findsNothing);

    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(chosen, ['Qom']);
    semantics.dispose();
  });

  testWidgets('Combobox: without allowsCustomValue the text snaps back to the value on blur; invalid announces the error; disabled never opens', (tester) async {
    final semantics = tester.ensureSemantics();
    final chosen = <String?>[];
    await tester.pumpWidget(app('fa-IR', Column(children: [
      LumoCombobox(
        label: 'شهر',
        options: cities,
        suggestionsLabel: 'پیشنهادها',
        emptyLabel: 'شهری پیدا نشد',
        clearLabel: 'پاک کردن شهر',
        value: 'thr',
        errorMessage: 'شهر معتبر نیست',
        onChanged: chosen.add,
      ),
      const TextField(key: Key('elsewhere')),
    ])));
    expect(find.text('شهر معتبر نیست'), findsOneWidget);
    expect(tester.getSemantics(find.byType(TextField).first).getSemanticsData().hint, contains('شهر معتبر نیست'));

    await tester.tap(find.byType(TextField).first);
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, 'قزقز');
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('elsewhere')));
    await tester.pumpAndSettle();
    // Blurred without a match: the text can never claim a selection that is not there.
    expect(find.text('تهران'), findsOneWidget);
    expect(chosen, isEmpty);

    await tester.pumpWidget(app('fa-IR', LumoCombobox(
      label: 'شهر',
      options: cities,
      suggestionsLabel: 'پیشنهادها',
      emptyLabel: 'شهری پیدا نشد',
      clearLabel: 'پاک کردن شهر',
      isDisabled: true,
      onChanged: chosen.add,
    )));
    expect(tester.getSemantics(find.byType(TextField)), containsSemantics(isEnabled: false));
    await tester.tap(find.byType(TextField), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('پیشنهادها'), findsNothing);
    semantics.dispose();
  });
}
