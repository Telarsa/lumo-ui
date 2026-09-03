// THE GRADER'S OWN TESTS.
//
// It had none. `lib/src/testing/testing/semantics.dart` is the mobile
// counterpart of lumo-gate — the thing that reads every consumer's screens —
// and the only exercise it got was incidental, from files testing something
// else. The mutation campaign could not see it either: `readdirSync` was
// non-recursive, so the one file in a subdirectory was neither BEHAVIOURAL nor
// PENDING and the startup guard that promises "a family added tomorrow cannot
// fall silently into untested" never looked at it.
//
// Eleven operators were run against it by hand. EIGHT survived. What follows
// targets those survivors: each test here fails if a specific line of the walk
// is broken, and they are written against rendered widgets rather than
// hand-built records, because the walk is the half a record cannot exercise.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';
import 'package:lumo_ui_mobile/testing.dart';

Widget app(Widget home) => MaterialApp(
      locale: const Locale('fa'),
      supportedLocales: const [Locale('fa'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: LumoScope(locale: 'fa', child: Scaffold(body: home)),
    );

Future<List<LumoAnnounced>> walk(WidgetTester tester, Widget home) async {
  await tester.binding.setSurfaceSize(kLumoStage);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  final semantics = tester.ensureSemantics();
  await tester.pumpWidget(app(home));
  await tester.pumpAndSettle();
  final tree = lumoAnnouncedTree(tester, of: find.byType(MaterialApp));
  semantics.dispose();
  return tree;
}

Future<List<String>> rulesFor(WidgetTester tester, Widget home) async =>
    lumoGrade(subject: 't', locale: 'fa', tree: await walk(tester, home))
        .map((v) => v.rule)
        .toList();

void main() {
  testWidgets('a named ANCESTOR does not name a differently-placed descendant',
      (tester) async {
    // `namedByAncestor` compares RECTS, and must. A text field emits a labelled
    // node with an unlabelled editable child at the SAME rect — one control
    // drawn once — and that is the only thing the carry-down is for. Weakened
    // to "some ancestor has a name", every unnamed control inside any labelled
    // container passes, which is most of them.
    final rules = await rulesFor(tester, Semantics(
      label: 'کارت پرداخت',
      container: true,
      child: Column(children: [
        const SizedBox(height: 40, child: Text('مبلغ')),
        IconButton(onPressed: () {}, icon: const Icon(Icons.add)),
      ]),
    ));
    expect(rules, contains('named-controls'),
        reason: 'an unnamed button inside a labelled card was treated as named');
  });

  testWidgets('a text field is ONE control, not a control plus an unnamed child',
      (tester) async {
    // The other side of the same line. Remove the carry-down entirely and every
    // TextField in every app reports as an unnamed control.
    final rules = await rulesFor(tester, TextField(
      controller: TextEditingController(),
      decoration: const InputDecoration(labelText: 'نام'),
    ));
    expect(rules, isNot(contains('named-controls')));
  });

  testWidgets('the reported rect is where the control actually is', (tester) async {
    // The walk accumulates `node.transform` on the way down. Without that every
    // rect is local to its own parent, which reports three different controls
    // as "48x48 at 0,0" — and silently breaks the rect comparison above.
    final tree = await walk(tester, Padding(
      padding: const EdgeInsets.only(left: 100, top: 200),
      child: Align(
        alignment: Alignment.topLeft,
        child: IconButton(onPressed: () {}, icon: const Icon(Icons.add)),
      ),
    ));
    final button = tree.firstWhere((n) => n.interactive);
    expect(button.rect.left, greaterThan(50),
        reason: 'the rect was not transformed into a shared space');
    expect(button.rect.top, greaterThan(100),
        reason: 'the rect was not transformed into a shared space');
  });

  test('a hidden node is not graded', () {
    // At the RULE level, deliberately. `isHidden` is set by the platform for
    // things a reader cannot reach — an off-screen row in a scrollable — and
    // there is no honest way to conjure one from a widget in a test:
    // `Semantics(hidden:)` merges away, `Offstage` and `ExcludeSemantics`
    // delete the node outright. What IS testable, and what the surviving mutant
    // broke, is `lumoGrade` skipping such a node when the walk reports one.
    final hidden = lumoAnnounced(interactive: true, hidden: true);
    expect(lumoGrade(subject: 't', locale: 'fa', tree: [hidden]), isEmpty);

    // The same node visible must fail, or this proves only that the list was
    // empty for some other reason.
    final shown = lumoAnnounced(interactive: true);
    expect(lumoGrade(subject: 't', locale: 'fa', tree: [shown]).map((v) => v.rule),
        contains('named-controls'));
  });

  testWidgets('the latn island reaches nodes NESTED inside it', (tester) async {
    // Inheritance, not just the marked node. `Semantics(identifier:)` sits on a
    // wrapper and the digits are always further down.
    final inside = await rulesFor(tester, Semantics(
      identifier: kLumoLatnIsland,
      child: const Column(children: [Text('SKU'), Text('AC-4825')]),
    ));
    expect(inside, isNot(contains('persian-digits')),
        reason: 'the island did not inherit to the node that holds the digits');

    final outside = await rulesFor(
      tester, const Column(children: [Text('SKU'), Text('AC-4825')]));
    expect(outside, contains('persian-digits'),
        reason: 'without the island this must still fail, or the test proves nothing');
  });

  testWidgets('a tooltip is graded like any other announced string', (tester) async {
    // `tooltip` is a separate field of `SemanticsData` and has to be in the
    // spoken list explicitly. Drop it and every `IconButton(tooltip:)` in every
    // app stops being read by the digit and English rules.
    final rules = await rulesFor(tester, IconButton(
      tooltip: 'صفحه 2',
      onPressed: () {},
      icon: const Icon(Icons.add),
    ));
    expect(rules, contains('persian-digits'));
  });

  testWidgets('announced-once catches a label repeated as the VALUE', (tester) async {
    // The `label == value` half. `label == hint` has a case elsewhere; this one
    // had none, and a slider or a field whose value restates its name reads the
    // same string twice.
    final rules = await rulesFor(tester, Semantics(
      container: true,
      label: 'وضعیت',
      value: 'وضعیت',
      child: const SizedBox(width: 80, height: 40),
    ));
    expect(rules, contains('announced-once'));
  });

  group('native-calendar — the rule this package needed most', () {
    // The gap was not hypothetical and not a consumer's fault: THIS package
    // ships a generator for the defect. `formatGregorianMonth(2024, 7, 'fa-IR')`
    // returns «ژوئیهٔ ۲۰۲۴» — Persian words, Persian digits, and 622 years wrong
    // — and the grader beside it was green on that output.
    bool fires(String announced) => lumoGrade(
          subject: 't',
          locale: 'fa',
          tree: [lumoAnnounced(label: announced)],
        ).any((v) => v.rule == 'native-calendar');

    test('catches every month the package itself can produce', () {
      final missed = <String>[];
      for (var m = 1; m <= 12; m++) {
        final label = formatGregorianMonth(2024, m, 'fa-IR');
        if (!fires(label)) missed.add(label);
      }
      expect(missed, isEmpty, reason: 'the package generates what its grader cannot see');
    });

    test("and date-fns's transliterations, which a WebView or a shared token file brings", () {
      for (final name in ['جولای', 'آپریل', 'جون', 'آگوست', 'می']) {
        expect(fires('۲۲ $name ۲۰۲۴'), isTrue, reason: name);
      }
    });

    test('says nothing about a Jalali date', () {
      expect(fires('۲۲ مرداد ۱۴۰۳'), isFalse);
      expect(fires('۹ شهریور ۱۴۰۵'), isFalse);
    });

    test('says nothing about the imperfective می, which is date-fns\'s May', () {
      // Digit ADJACENCY is what decides, not the word. Letters between the
      // number and the word mean it is a sentence, not a date.
      for (final sentence in [
        'این کار ۳ بار تکرار می شود',
        'قیمت ۱۲۰۰ تومان می باشد',
        '۵ نفر می آیند',
        'شما ۲ پیام دارید که می خواهید ببینید',
      ]) {
        expect(fires(sentence), isFalse, reason: sentence);
      }
    });
  });

  testWidgets('native-script catches a raw key announced to a Persian reader',
      (tester) async {
    // The defect this exists for: a Select shipping «thr», an admin console
    // printing `providers` into a cell. `engine-english` cannot see either —
    // it fires only when every word is Material's own vocabulary, on purpose.
    expect(await rulesFor(tester, const Text('providers')),
        contains('native-script'));

    // Persian text is not a finding.
    expect(await rulesFor(tester, const Text('ارائه‌دهنده‌ها')),
        isNot(contains('native-script')));

    // NEITHER ARE DIGITS. Persian digits carry Script=Arabic, so a script test
    // without a LETTER guard reads «۱۲۳» as Persian and never fires; one with
    // the guard but no letter check fires on every price in the app.
    expect(await rulesFor(tester, const Text('۱۲۳٬۴۵۶')),
        isNot(contains('native-script')));

    // A deliberately foreign run is what the island is for.
    expect(
      await rulesFor(
        tester,
        Semantics(identifier: kLumoLatnIsland, child: const Text('ACME-SARA')),
      ),
      isNot(contains('native-script')),
    );
  });

  testWidgets('persian-zwnj catches the verbal prefix joined with a space',
      (tester) async {
    expect(await rulesFor(tester, const Text('صفحه بارگیری می شود')),
        contains('persian-zwnj'));
    expect(await rulesFor(tester, const Text('انجام نمی شود')),
        contains('persian-zwnj'));

    // The correct form is not a finding.
    expect(await rulesFor(tester, const Text('صفحه بارگیری می\u200Cشود')),
        isNot(contains('persian-zwnj')));

    // NOT the comparative. «چوب تر» is wet wood and correct Persian; تر/ترین
    // share the orthography, which is why this rule is the verbal prefix only.
    expect(await rulesFor(tester, const Text('چوب تر از دیروز')),
        isNot(contains('persian-zwnj')));
  });
}
