// `announced-once` against Flutter's OWN navigation widgets.
//
// FROM THE FIELD, 31 Aug 2026, and from a mistake made an hour earlier in this
// same file's rules. When `tooltip` became an announced field, a `label ==
// tooltip` case was added to `announced-once` at the same time — written beside
// the implementation rather than drawn from a defect, which is the discipline
// this repository has broken twice before and paid for twice.
//
// Flutter's `BackButton` and the `AppBar` drawer button each wrap an
// `IconButton(tooltip:)` in a `Semantics(label:)` carrying the SAME string. So
// the check fired on two standard navigation widgets, in every app, in every
// locale, for something no consumer can fix. It never showed up in the
// grader's own corpus because neither the consumer's tab roots nor the example
// screen has a back button — which is exactly how a rule nobody can satisfy
// gets shipped.
//
// This file renders those two widgets and requires them to grade CLEAN.
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
      home: LumoScope(locale: 'fa', child: home),
    );

Future<List<LumoViolation>> grade(WidgetTester tester, Widget home) async {
  await tester.binding.setSurfaceSize(kLumoStage);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  final semantics = tester.ensureSemantics();
  await tester.pumpWidget(app(home));
  await tester.pumpAndSettle();
  final out = lumoGrade(
    subject: 'nav',
    locale: 'fa',
    tree: lumoAnnouncedTree(tester, of: find.byType(MaterialApp)),
  );
  semantics.dispose();
  return out;
}

void main() {
  testWidgets('a Material back button grades clean', (tester) async {
    final v = await grade(tester, Scaffold(
      appBar: AppBar(title: const Text('صفحه'), leading: const BackButton()),
    ));
    expect(v.map((x) => '${x.rule}: ${x.detail}'), isEmpty);
  });

  testWidgets('the AppBar drawer button grades clean', (tester) async {
    final v = await grade(tester, Scaffold(
      appBar: AppBar(title: const Text('صفحه')),
      drawer: const Drawer(child: Text('منو')),
    ));
    expect(v.map((x) => '${x.rule}: ${x.detail}'), isEmpty);
  });

  testWidgets('but a genuine double announcement still fails', (tester) async {
    // The case the rule was BUILT for and must keep catching: a string used as
    // both a control's name and its hint, read twice in a row. Nine families
    // once carried an error message that way.
    final poison = lumoAnnounced(
      label: 'کد نامعتبر',
      hint: 'کد نامعتبر',
      interactive: true,
    );
    expect(
      lumoGrade(subject: 'fixture', locale: 'fa', tree: [poison]).map((v) => v.rule),
      contains('announced-once'),
    );
  });
}
