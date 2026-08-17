// Form: the three things a phone form must not get wrong when a submit is
// rejected — the summary is ANNOUNCED (and counts in the reader's digits),
// focus moves to the FIRST invalid field in declaration order, and each
// message lands in ITS OWN FIELD's semantics hint (Flutter has no
// `aria-describedby`; the field's hint is the binding).
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: 360, child: child)))),
    );

/// Every node in the tree whose label contains [text].
int nodesLabelled(WidgetTester tester, String text) {
  var count = 0;
  void walk(SemanticsNode node) {
    if (node.label.contains(text)) count++;
    node.visitChildren((child) {
      walk(child);
      return true;
    });
  }

  // ignore: deprecated_member_use
  walk(tester.binding.pipelineOwner.semanticsOwner!.rootSemanticsNode!);
  return count;
}

Widget form(LumoFormState state, {required String Function(String) summary}) => Builder(
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LumoForm(
            state: state,
            errorSummaryLabel: summary,
            children: [
              LumoFormField<String>(
                name: 'name',
                label: 'نام',
                initialValue: '',
                validators: [(value) => value.trim().isEmpty ? 'نام را بنویسید.' : null],
                builder: (context, field) => LumoTextField(
                  label: field.label,
                  errorMessage: field.errorMessage,
                  focusNode: field.focusNode,
                  onChanged: field.onChanged,
                ),
              ),
              LumoFormField<String>(
                name: 'city',
                label: 'شهر',
                initialValue: '',
                validators: [(value) => value.trim().isEmpty ? 'شهر را بنویسید.' : null],
                builder: (context, field) => LumoTextField(
                  label: field.label,
                  errorMessage: field.errorMessage,
                  focusNode: field.focusNode,
                  onChanged: field.onChanged,
                ),
              ),
            ],
          ),
          LumoButton(onPressed: () => state.submit(), child: const Text('ثبت')),
        ],
      ),
    );

void main() {
  testWidgets('Form fa-IR: a rejected submit ANNOUNCES the summary (Persian digits, live, once), focuses the FIRST invalid field, and each error is in that field’s own hint', (tester) async {
    final semantics = tester.ensureSemantics();
    final state = LumoFormState();
    addTearDown(state.dispose);
    await tester.pumpWidget(app('fa-IR', form(state, summary: (count) => '$count فیلد را کامل کنید.')));

    // Nothing is wrong until something is submitted: no summary, no message.
    expect(find.text('۲ فیلد را کامل کنید.'), findsNothing);
    expect(tester.getSemantics(find.byType(TextField).first).getSemanticsData().hint, '');
    expect(state.isSubmitted, isFalse);

    await tester.tap(find.text('ثبت'));
    await tester.pumpAndSettle();

    // 1. The summary: the count through `formatNumber` (۲, not 2), inside the
    //    caller's sentence, on a LIVE node — and in the tree exactly once.
    expect(find.text('۲ فیلد را کامل کنید.'), findsOneWidget);
    expect(nodesLabelled(tester, '۲ فیلد را کامل کنید.'), 1, reason: 'the summary is announced once, not once per wrapper');
    expect(tester.getSemantics(find.text('۲ فیلد را کامل کنید.')), containsSemantics(label: '۲ فیلد را کامل کنید.', isLiveRegion: true, isHeader: true));

    // 2. Focus is on the FIRST invalid field in DECLARATION order.
    expect(state.focusNodeOf('name')!.hasFocus, isTrue);
    expect(state.focusNodeOf('city')!.hasFocus, isFalse);

    // 3. Each message is bound to ITS OWN field: it is that node's hint, not a
    //    loose `Text` beside it that a reader on the field never hears.
    final name = tester.getSemantics(find.byType(TextField).first).getSemanticsData();
    expect(name.label, contains('نام'));
    expect(name.flagsCollection.isTextField, isTrue);
    expect(name.hint, 'نام را بنویسید.');
    final city = tester.getSemantics(find.byType(TextField).last).getSemanticsData();
    expect(city.label, contains('شهر'));
    expect(city.hint, 'شهر را بنویسید.');
    expect(state.invalidFields, ['name', 'city']);
    expect(state.errorCount, 2);
    expect(state.isValid, isFalse);

    semantics.dispose();
  });

  testWidgets('Form fa-IR: a correction revalidates as it is typed, the count follows, and the next rejection focuses the field that is still invalid', (tester) async {
    final semantics = tester.ensureSemantics();
    final state = LumoFormState();
    addTearDown(state.dispose);
    await tester.pumpWidget(app('fa-IR', form(state, summary: (count) => '$count فیلد را کامل کنید.')));

    await tester.tap(find.text('ثبت'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'کامیاب');
    await tester.pumpAndSettle();
    // Revalidated on change, because a submit had already been rejected.
    expect(state.errorOf('name'), isNull);
    expect(tester.getSemantics(find.byType(TextField).first).getSemanticsData().hint, '', reason: 'the corrected field carries no message');
    expect(find.text('۱ فیلد را کامل کنید.'), findsOneWidget, reason: 'the summary counts what is still wrong');

    await tester.tap(find.text('ثبت'));
    await tester.pumpAndSettle();
    expect(state.focusNodeOf('city')!.hasFocus, isTrue, reason: 'the first invalid field is now the second one');

    await tester.enterText(find.byType(TextField).last, 'تهران');
    await tester.pumpAndSettle();
    expect(find.textContaining('فیلد را کامل کنید.'), findsNothing, reason: 'nothing is wrong, so nothing is announced');
    expect(state.submit(), isTrue);
    expect(state.values, {'name': 'کامیاب', 'city': 'تهران'});
    expect(state.valueOf<String>('city'), 'تهران');
    semantics.dispose();
  });

  testWidgets('Form en-US: the same form, Latin digits, and the rules run in order (the first message wins)', (tester) async {
    final semantics = tester.ensureSemantics();
    final state = LumoFormState();
    addTearDown(state.dispose);
    await tester.pumpWidget(app('en-US', Builder(
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LumoForm(
            state: state,
            errorSummaryLabel: (count) => 'Complete $count fields.',
            children: [
              LumoFormField<String>(
                name: 'code',
                label: 'Code',
                initialValue: 'ab',
                validators: [
                  (value) => value.isEmpty ? 'Enter the code.' : null,
                  (value) => value.length < 4 ? 'The code is four characters.' : null,
                ],
                builder: (context, field) => LumoTextField(label: field.label, errorMessage: field.errorMessage, focusNode: field.focusNode, onChanged: field.onChanged),
              ),
            ],
          ),
          LumoButton(onPressed: () => state.submit(), child: const Text('Submit')),
        ],
      ),
    )));

    await tester.tap(find.text('Submit'));
    await tester.pumpAndSettle();
    expect(find.text('Complete 1 fields.'), findsOneWidget, reason: 'the same count, in the reader’s digits');
    expect(state.errorOf('code'), 'The code is four characters.', reason: 'the value is present, so the second rule is the one that fires');
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().hint, 'The code is four characters.');
    expect(state.focusNodeOf('code')!.hasFocus, isTrue);
    semantics.dispose();
  });

  testWidgets('Form: an error from outside — a server’s answer — is bound and focused exactly as a local one, and reset clears them', (tester) async {
    final semantics = tester.ensureSemantics();
    final state = LumoFormState();
    addTearDown(state.dispose);
    await tester.pumpWidget(app('fa-IR', form(state, summary: (count) => '$count فیلد را کامل کنید.')));

    state.setErrors({'city': 'این شهر پشتیبانی نمی‌شود.'});
    await tester.pumpAndSettle();
    expect(find.text('۱ فیلد را کامل کنید.'), findsOneWidget);
    expect(tester.getSemantics(find.byType(TextField).last).getSemanticsData().hint, 'این شهر پشتیبانی نمی‌شود.');
    expect(state.focusNodeOf('city')!.hasFocus, isTrue);

    state.reset();
    await tester.pumpAndSettle();
    expect(find.textContaining('فیلد را کامل کنید.'), findsNothing);
    expect(state.isSubmitted, isFalse);
    expect(state.errorOf('city'), isNull);
    semantics.dispose();
  });

  test('FormState: an empty form is valid, and an unknown field is a no-op rather than a crash', () {
    final state = LumoFormState();
    addTearDown(state.dispose);
    expect(state.validate(), isTrue);
    expect(state.errorCount, 0);
    expect(state.valueOf<String>('nothing'), isNull);
    expect(state.errorOf('nothing'), isNull);
    expect(state.focusNodeOf('nothing'), isNull);
    state.setValue('nothing', 'x');
    state.setErrors({'nothing': 'x'});
    expect(state.errorCount, 0);
  });
}
