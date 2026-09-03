// The README's example, EXECUTED.
//
// A documented snippet that has never been run is a guess. This one had a real
// chance of being wrong: `ensureSemantics` is the difference between grading a
// tree and grading nothing, and a reader who copies a snippet that silently
// passes learns the wrong lesson twice.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';
import 'package:lumo_ui_mobile/testing.dart';

class TodayScreen extends StatelessWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Column(children: [
          IconButton(
            tooltip: 'تنظیمات',
            onPressed: () {},
            icon: const Icon(Icons.settings),
          ),
          const Text('۸۰ کیلوگرم'),
          Semantics(
            identifier: kLumoLatnIsland,
            child: TextField(
              decoration: const InputDecoration(labelText: 'قد'),
              controller: TextEditingController(text: '180.0'),
            ),
          ),
        ]),
      );
}

Widget myApp({required String locale}) => MaterialApp(
      locale: Locale(locale),
      home: LumoScope(locale: locale, child: const TodayScreen()),
    );

void main() {
  testWidgets('the Today screen announces cleanly in Persian', (tester) async {
    await tester.binding.setSurfaceSize(kLumoStage);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(myApp(locale: 'fa'));

    final tree = lumoAnnouncedTree(tester, of: find.byType(TodayScreen));
    expect(lumoGrade(subject: 'today', locale: 'fa', tree: tree), isEmpty);

    semantics.dispose();
  });

  testWidgets('and the same screen fails once the island is removed',
      (tester) async {
    // The anti-vacuity half. If the example above passes for any reason other
    // than the rules running, this passes too — and then neither means anything.
    await tester.binding.setSurfaceSize(kLumoStage);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(MaterialApp(
      locale: const Locale('fa'),
      home: LumoScope(
        locale: 'fa',
        child: Scaffold(
          body: TextField(
            decoration: const InputDecoration(labelText: 'قد'),
            controller: TextEditingController(text: '180.0'),
          ),
        ),
      ),
    ));

    final tree = lumoAnnouncedTree(tester, of: find.byType(Scaffold));
    expect(
      lumoGrade(subject: 'today', locale: 'fa', tree: tree).map((v) => v.rule),
      contains('persian-digits'),
    );
    semantics.dispose();
  });
}
