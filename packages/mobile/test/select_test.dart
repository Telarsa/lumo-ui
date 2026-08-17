// Select had no test file at all, and it had two defects because of that: the
// option rows announced themselves BUTTONS WITH NO TAP ACTION (`ExcludeSemantics`
// dropped the `ListTile`'s action along with its drawn name, so a reader or a
// switch could focus a row it could not activate), and an empty `options` list
// opened a sheet that said nothing. This file is why neither can come back.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

const cities = [
  LumoSelectOption(id: 'thr', label: 'تهران'),
  LumoSelectOption(id: 'shz', label: 'شیراز'),
  LumoSelectOption(id: 'tbz', label: 'تبریز', isDisabled: true),
];

/// The semantics node the reader lands on for [label] inside the open sheet.
SemanticsData rowData(WidgetTester tester, String label) => tester.getSemantics(find.bySemanticsLabel(label)).getSemanticsData();

void main() {
  testWidgets('Select fa-IR: the label is visible and names the trigger, the value is the placeholder until a choice is made, and the sheet is Lumo\'s (no English route name)', (tester) async {
    final semantics = tester.ensureSemantics();
    String? chosen;
    // CONTROLLED, as the web is: the caller owns `value`, so the round-trip
    // through `onChanged` is part of what this asserts.
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(builder: (context, setState) => LumoSelect(
      label: 'شهر',
      placeholder: 'انتخاب کنید',
      closeLabel: 'بستن',
      options: cities,
      value: chosen,
      onChanged: (v) => setState(() => chosen = v),
    ))));

    // The trigger is ONE node: named by `label`, valued by the placeholder —
    // and each string is in the tree exactly once, the drawn copies excluded.
    expect(find.text('شهر'), findsOneWidget);
    expect(find.text('انتخاب کنید'), findsOneWidget);
    expect(tester.getSemantics(find.byType(InkWell)), containsSemantics(label: 'شهر', value: 'انتخاب کنید', isButton: true, isEnabled: true));
    expect(find.bySemanticsLabel('شهر'), findsOneWidget, reason: 'the visible label merged into the trigger node and the name was heard twice');
    expect(find.bySemanticsLabel('انتخاب کنید'), findsNothing, reason: 'the placeholder is the VALUE, not part of the name');

    await tester.tap(find.text('انتخاب کنید'));
    await tester.pumpAndSettle();
    // Not Material's `showModalBottomSheet`: no «Dialog», no «Dismiss».
    expect(find.bySemanticsLabel('Dialog'), findsNothing);
    expect(find.bySemanticsLabel('Dismiss'), findsNothing);
    expect(find.text('تهران'), findsOneWidget);
    expect(find.text('شیراز'), findsOneWidget);

    await tester.tap(find.text('شیراز'));
    await tester.pumpAndSettle();
    expect(chosen, 'shz');
    expect(find.text('انتخاب کنید'), findsNothing, reason: 'the trigger now shows the choice, not the placeholder');
    expect(tester.getSemantics(find.byType(InkWell)), containsSemantics(label: 'شهر', value: 'شیراز'));
    semantics.dispose();
  });

  testWidgets('Select: an option row is a button that CAN BE ACTIVATED — it carries the tap action, the chosen one is selected, the disabled one is neither', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoSelect(
      label: 'شهر',
      placeholder: 'انتخاب کنید',
      closeLabel: 'بستن',
      options: cities,
      value: 'thr',
      onChanged: (_) {},
    )));
    await tester.tap(find.text('تهران'));
    await tester.pumpAndSettle();

    // The defect this file exists for: `button: true` with no
    // `SemanticsAction.tap` is a control a reader cannot work.
    final selected = rowData(tester, 'تهران');
    expect(selected.hasAction(SemanticsAction.tap), isTrue, reason: 'a row announced a button must carry the action that makes it one');
    expect(selected.flagsCollection.isSelected, isTrue);

    final plain = rowData(tester, 'شیراز');
    expect(plain.hasAction(SemanticsAction.tap), isTrue);
    expect(plain.flagsCollection.isSelected, isFalse);

    final disabled = rowData(tester, 'تبریز');
    expect(disabled.flagsCollection.isEnabled, isFalse);
    expect(disabled.hasAction(SemanticsAction.tap), isFalse, reason: 'a disabled option offers no action');

    // Each option's name is in the tree exactly once (the drawn copy is excluded).
    for (final label in ['تهران', 'شیراز', 'تبریز']) {
      expect(find.bySemanticsLabel(label), findsOneWidget, reason: '«$label» must be announced once, not once per wrapper');
    }
    semantics.dispose();
  });

  testWidgets('Select: an empty options list SAYS SO — emptyLabel is announced as a live region instead of an empty sheet', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoSelect(
      label: 'شهر',
      placeholder: 'انتخاب کنید',
      closeLabel: 'بستن',
      options: [],
      emptyLabel: 'شهری برای این کشور ثبت نشده است',
    )));
    await tester.tap(find.text('انتخاب کنید'));
    await tester.pumpAndSettle();
    expect(find.text('شهری برای این کشور ثبت نشده است'), findsOneWidget);
    expect(tester.getSemantics(find.text('شهری برای این کشور ثبت نشده است')), containsSemantics(label: 'شهری برای این کشور ثبت نشده است', isLiveRegion: true));
    semantics.dispose();
  });

  testWidgets('Select: an empty options list without an emptyLabel is a programming error, not a blank sheet', (tester) async {
    await tester.pumpWidget(app('fa-IR', const LumoSelect(
      label: 'شهر',
      placeholder: 'انتخاب کنید',
      closeLabel: 'بستن',
      options: [],
    )));
    expect(tester.takeException(), isA<AssertionError>());
  });

  testWidgets('Select: the invalid state is announced (a live region) and painted critical; description is a hint, not a second name', (tester) async {
    final semantics = tester.ensureSemantics();
    final c = lightColours(LumoBrand.achromatic);
    await tester.pumpWidget(app('fa-IR', LumoSelect(
      label: 'شهر',
      placeholder: 'انتخاب کنید',
      closeLabel: 'بستن',
      options: cities,
      description: 'شهر محل سکونت شما',
      errorMessage: 'انتخاب شهر الزامی است',
      onChanged: (_) {},
    )));
    expect(tester.getSemantics(find.byType(InkWell)), containsSemantics(label: 'شهر', hint: 'شهر محل سکونت شما', isButton: true, validationResult: SemanticsValidationResult.invalid));
    expect(tester.getSemantics(find.text('انتخاب شهر الزامی است')), containsSemantics(label: 'انتخاب شهر الزامی است', isLiveRegion: true));
    expect(find.bySemanticsLabel('شهر محل سکونت شما'), findsNothing, reason: 'the description is the trigger\'s hint; the drawn copy is excluded');
    final box = tester.widget<Container>(find.descendant(of: find.byType(InkWell), matching: find.byType(Container)).first);
    expect(((box.decoration! as BoxDecoration).border! as Border).top.color, c.critical, reason: 'data-invalid:border-critical');
    semantics.dispose();
  });

  testWidgets('Select: disabled announces itself disabled and does not open', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoSelect(
      label: 'شهر',
      placeholder: 'انتخاب کنید',
      closeLabel: 'بستن',
      options: cities,
      isDisabled: true,
      onChanged: (_) {},
    )));
    expect(tester.getSemantics(find.byType(InkWell)), containsSemantics(label: 'شهر', isButton: true, isEnabled: false));
    await tester.tap(find.text('انتخاب کنید'));
    await tester.pumpAndSettle();
    expect(find.text('تهران'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Select fa-IR vs en-US: the label starts at the READING start — right under fa-IR, left under en-US', (tester) async {
    Future<Rect> labelRect(String locale, String label) async {
      await tester.pumpWidget(app(locale, LumoSelect(
        label: label,
        placeholder: '—',
        closeLabel: 'x',
        options: cities,
        onChanged: (_) {},
      )));
      return tester.getRect(find.text(label));
    }

    final fa = await labelRect('fa-IR', 'شهر');
    final faField = tester.getRect(find.byType(InkWell));
    expect((fa.right - faField.right).abs(), lessThan(1), reason: 'start = right under fa-IR');

    final en = await labelRect('en-US', 'City');
    final enField = tester.getRect(find.byType(InkWell));
    expect((en.left - enField.left).abs(), lessThan(1), reason: 'start = left under en-US');
  });

  testWidgets('Select at 320dp: a long option label wraps inside the sheet instead of overflowing', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(app('fa-IR', LumoSelect(
      label: 'شهر',
      placeholder: 'انتخاب کنید',
      closeLabel: 'بستن',
      options: const [LumoSelectOption(id: 'a', label: 'شهرستان بندر ماهشهر و حومهٔ صنعتی آن')],
      onChanged: (_) {},
    )));
    await tester.tap(find.text('انتخاب کنید'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'a RenderFlex overflow at 320dp is a real bug');
    final row = tester.getRect(find.text('شهرستان بندر ماهشهر و حومهٔ صنعتی آن'));
    expect(row.width, lessThanOrEqualTo(320));
    // The option row stands on the 44 floor even when it wraps to two lines.
    expect(tester.getSize(find.byType(ListTile)).height, greaterThanOrEqualTo(44));
  });
}
