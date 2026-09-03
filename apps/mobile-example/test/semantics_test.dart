// THE GRADER'S CORPUS.
//
// Until §53 the only thing the semantics grader could read was
// `apps/mobile-gallery`: 120 demos of the widgets Lumo used to ship. That made
// the gate circular — the rules were written beside the widgets they graded, so
// a defect class neither had thought of was invisible to both. Pointing the
// grader at a real consumer app proved it: four grader bugs surfaced in one
// afternoon, and not one of them could have been caught by a demo.
//
// So the corpus is now a CONSUMER, built out of Material widgets Lumo does not
// own, exactly as `apps/website` is a shadcn app rather than a Lumo showcase.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_mobile_example/main.dart';
import 'package:lumo_mobile_example/src/booking_screen.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';
import 'package:lumo_ui_mobile/testing.dart';

/// Fixed, so «۹ شهریور ۱۴۰۵» is the same string on every machine and in a year.
final _today = DateTime(2026, 8, 31, 12);

Future<List<LumoViolation>> gradeApp(WidgetTester tester, String locale) async {
  await tester.binding.setSurfaceSize(kLumoStage);
  addTearDown(() => tester.binding.setSurfaceSize(null));

  // Flutter builds a semantics tree only while something is listening. Without
  // this every screen grades clean, which is the most dangerous way for a gate
  // to pass.
  final semantics = tester.ensureSemantics();
  await tester.pumpWidget(ExampleApp(initialLocale: locale, today: _today));
  await tester.pumpAndSettle();

  final tree = lumoAnnouncedTree(tester, of: find.byType(BookingScreen));

  // THE FLOOR, and the counterpart of the web gate's `persian-digit-floor`:
  // every rule below passes trivially on an empty tree, and an empty tree is
  // one refactor away — rename the screen and the `Finder` matches nothing.
  // Numbers deliberately below what the screen renders (16 spoken, 10
  // interactive) so ordinary edits do not trip them.
  expect(tree.where((n) => !n.hidden && n.label.isNotEmpty).length,
      greaterThanOrEqualTo(10),
      reason: 'the corpus stopped announcing; a rule cannot fail on nothing');
  expect(tree.where((n) => n.interactive).length, greaterThanOrEqualTo(6),
      reason: 'the corpus stopped offering controls to grade');

  final out = lumoGrade(subject: 'booking', locale: locale, tree: tree);
  semantics.dispose();
  return out;
}

String describe(List<LumoViolation> v) =>
    v.map((x) => '  ${x.rule} · ${x.subject} · ${x.detail}').join('\n');

void main() {
  for (final locale in const ['fa', 'en']) {
    testWidgets('the booking screen announces cleanly in $locale',
        (tester) async {
      final violations = await gradeApp(tester, locale);
      expect(violations, isEmpty, reason: '\n${describe(violations)}');
    });
  }

  testWidgets('the Persian screen really is Persian', (tester) async {
    // The anti-vacuity pair, and the reason it is not redundant with the run
    // above: "no Latin digits" passes trivially on a screen with no numbers.
    // These assert the digits and the calendar are PRESENT and native, which is
    // the whole thing the mobile package exists to supply.
    await tester.binding.setSurfaceSize(kLumoStage);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(ExampleApp(initialLocale: 'fa', today: _today));
    await tester.pumpAndSettle();

    // 2026-08-31 is 9 Shahrivar 1405. If `formatLumoDate` silently fell back to
    // Gregorian this would read «۳۱ اوت ۲۰۲۶».
    expect(find.textContaining('شهریور ۱۴۰۵'), findsWidgets);
    // ۴۸۰٬۰۰۰ — Persian digits AND a Persian group separator.
    expect(find.textContaining('۴۸۰'), findsWidgets);
    // …and no Western digit anywhere a reader can see it, except inside the
    // declared island, whose ASCII is the correct answer.
    final latin = tester
        .widgetList<Text>(find.byType(Text))
        .map((t) => t.data ?? '')
        .where((s) => RegExp(r'[0-9]').hasMatch(s))
        .toList();
    expect(latin, isEmpty, reason: 'Western digits in visible text: $latin');
  });

  // `LumoScope` derives direction from the locale. An app that took it from a
  // flag is an app that will one day ship the flag unset.
  //
  // One test per locale, not a loop inside one: `initialLocale` SEEDS state, so
  // pumping a second `ExampleApp` of the same type reuses the first one's
  // `State` and its `_locale`. The loop version reported the English screen as
  // right-to-left, and it would have been just as happy to report the reverse.
  for (final (locale, expected) in const [
    ('fa', TextDirection.rtl),
    ('en', TextDirection.ltr),
  ]) {
    testWidgets('$locale lays out $expected', (tester) async {
      await tester.pumpWidget(ExampleApp(initialLocale: locale, today: _today));
      await tester.pumpAndSettle();
      final ctx = tester.element(find.byType(BookingScreen));
      expect(Directionality.of(ctx), expected);
    });
  }

  testWidgets('the clean grade is earned by the localisation wiring, not luck',
      (tester) async {
    // WHY THIS IS HERE. The screen above grades clean on all four rules, and
    // three of them can be seen firing on it in principle. `engine-english`
    // cannot: it catches chrome MATERIAL supplies in English, and this app is
    // wired correctly, so Material supplies Persian. A rule that never fires on
    // the corpus is a rule the corpus does not test.
    //
    // So: the same widgets, one line of configuration removed. An app that sets
    // its own locale and forgets `GlobalMaterialLocalizations` gets a Persian
    // interface around English Material chrome — «Back» on the back button,
    // «50%» on the slider — and that is not a hypothetical misconfiguration, it
    // is the default `MaterialApp`.
    await tester.binding.setSurfaceSize(kLumoStage);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final semantics = tester.ensureSemantics();

    await tester.pumpWidget(MaterialApp(
      // No `localizationsDelegates`, no `locale`: English Material chrome.
      home: LumoScope(
        locale: 'fa',
        child: Scaffold(
          appBar: AppBar(title: const Text('صفحه'), leading: const BackButton()),
          body: Slider(value: 0.5, onChanged: (_) {}),
        ),
      ),
    ));
    await tester.pumpAndSettle();

    final rules = lumoGrade(
      subject: 'unlocalised',
      locale: 'fa',
      tree: lumoAnnouncedTree(tester, of: find.byType(MaterialApp)),
    ).map((v) => v.rule);

    expect(rules, contains('engine-english'),
        reason: 'Material announced English chrome and the rule did not see it');
    expect(rules, contains('persian-digits'),
        reason: "the slider's «50%» is Latin under fa");

    semantics.dispose();
  });

  testWidgets('a validation message that repeats its field name is heard twice',
      (tester) async {
    // The fourth rule's app-level case, and the last of the four to get one.
    // `announced-once` was built for a real defect — nine families carrying an
    // error message as both a node of its own and the field's hint — and until
    // now only a synthetic fixture exercised it. This is the same defect in
    // plain Material, which is how a consumer would actually write it:
    // `errorText` repeating `labelText`, because the validator says "کد نامعتبر"
    // and so does the field.
    //
    // Worth knowing: `hintText` equal to `labelText` does NOT do this. Material
    // drops the hint once the label floats, so the tree carries one string. Only
    // the error path doubles it, which is exactly the kind of thing a rule
    // cannot be trusted about until someone renders it.
    await tester.binding.setSurfaceSize(kLumoStage);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final semantics = tester.ensureSemantics();

    await tester.pumpWidget(MaterialApp(
      locale: const Locale('fa'),
      supportedLocales: const [Locale('fa'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: LumoScope(
        locale: 'fa',
        child: Scaffold(
          body: TextField(
            controller: TextEditingController(),
            decoration: const InputDecoration(
              labelText: 'کد نامعتبر',
              errorText: 'کد نامعتبر',
            ),
          ),
        ),
      ),
    ));
    await tester.pumpAndSettle();

    expect(
      lumoGrade(
        subject: 'double-announced',
        locale: 'fa',
        tree: lumoAnnouncedTree(tester, of: find.byType(MaterialApp)),
      ).map((v) => v.rule),
      contains('announced-once'),
    );
    semantics.dispose();
  });

  testWidgets('and the grader would fail this app if the app were wrong',
      (tester) async {
    // The poison fixture, at the app level rather than the rule level. Every
    // assertion above passes if the tree arrives empty or the rules never fire.
    // This plants the two defects the screen is built to avoid and requires
    // both to be caught.
    await tester.binding.setSurfaceSize(kLumoStage);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final semantics = tester.ensureSemantics();

    await tester.pumpWidget(MaterialApp(
      locale: const Locale('fa'),
      home: Scaffold(
        body: Column(children: [
          // No tooltip, no label: unnamed to a screen reader.
          IconButton(onPressed: () {}, icon: const Icon(Icons.add)),
          // A number the app forgot to shape.
          const Text('Total 42'),
        ]),
      ),
    ));
    await tester.pump();

    final rules = lumoGrade(
      subject: 'poison',
      locale: 'fa',
      tree: lumoAnnouncedTree(tester, of: find.byType(Scaffold)),
    ).map((v) => v.rule);

    expect(rules, contains('named-controls'));
    expect(rules, contains('persian-digits'));
    semantics.dispose();
  });
}
