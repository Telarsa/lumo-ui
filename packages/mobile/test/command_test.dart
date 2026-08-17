// Command: the search-everything sheet. The route names itself ONCE, the
// search box is named though its label row is hidden, recent items are offered
// before anything is typed, matching folds Persian, and "nothing matched" is a
// LIVE node carrying its own words.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

/// The ✕ by its own widget: `LumoIconButton` merges a `Semantics` and a
/// `MergeSemantics` into ONE node, so an element-predicate finder matches both
/// elements — and the sheet's scrim deliberately carries the same name.
Finder iconButton(String label) => find.byWidgetPredicate((w) => w is LumoIconButton && w.label == label);

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

const groups = [
  LumoCommandGroup(label: 'کارها', items: [
    LumoCommandItem(id: 'new-request', label: 'درخواست تازه', description: 'یک درخواست کار بساز'),
    LumoCommandItem(id: 'invite', label: 'دعوت همکار', keywords: ['invite', 'همکاری']),
  ]),
  LumoCommandGroup(label: 'رفتن به', items: [
    LumoCommandItem(id: 'wallet', label: 'کیف پول'),
  ]),
];

const recent = [LumoCommandItem(id: 'wallet', label: 'کیف پول')];

void main() {
  testWidgets('Command fa-IR: opens as a sheet named once, the search box is named, recent is offered first, and choosing a row answers with its id', (tester) async {
    final semantics = tester.ensureSemantics();
    String? chosen;
    await tester.pumpWidget(app('fa-IR', Builder(
      builder: (context) => LumoButton(
        onPressed: () async {
          chosen = await showLumoCommand(
            context,
            label: 'جست‌وجوی همه‌چیز',
            searchLabel: 'جست‌وجو',
            emptyLabel: 'چیزی پیدا نشد.',
            closeLabel: 'بستن',
            groups: groups,
            recent: recent,
            recentLabel: 'اخیر',
          );
        },
        child: const Text('باز کردن'),
      ),
    )));

    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();

    // The route's name exists once, is a header, and names the route.
    expect(find.text('جست‌وجوی همه‌چیز'), findsOneWidget);
    expect(tester.getSemantics(find.text('جست‌وجوی همه‌چیز')), containsSemantics(label: 'جست‌وجوی همه‌چیز', isHeader: true, namesRoute: true));
    // The search box keeps its NAME although its label row is hidden.
    final field = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(field.label, contains('جست‌وجو'));
    expect(field.flagsCollection.isTextField, isTrue);
    expect(iconButton('بستن'), findsOneWidget);
    // The route inherits the scope's direction, which routes forget by default.
    expect(Directionality.of(tester.element(find.text('جست‌وجوی همه‌چیز'))), TextDirection.rtl);

    // Recent is offered before the reader has said what they want, as a group
    // of its own, above the rest.
    expect(find.text('اخیر'), findsOneWidget);
    expect(find.text('کارها'), findsOneWidget);
    expect(tester.getCenter(find.text('اخیر')).dy < tester.getCenter(find.text('کارها')).dy, isTrue);

    // Each row is ONE named button; its description is a node under it.
    expect(tester.getSemantics(find.bySemanticsLabel('درخواست تازه')), containsSemantics(label: 'درخواست تازه', isButton: true, isEnabled: true));
    expect(find.text('یک درخواست کار بساز'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('درخواست تازه'));
    await tester.pumpAndSettle();
    expect(chosen, 'new-request');
    expect(find.text('جست‌وجوی همه‌چیز'), findsNothing, reason: 'choosing closes the sheet');
    semantics.dispose();
  });

  testWidgets('Command fa-IR: typing filters (folding Persian and keywords), recent disappears, and an empty result is announced on a live node', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', Builder(
      builder: (context) => LumoButton(
        onPressed: () => showLumoCommand(
          context,
          label: 'جست‌وجوی همه‌چیز',
          searchLabel: 'جست‌وجو',
          emptyLabel: 'چیزی پیدا نشد.',
          closeLabel: 'بستن',
          groups: groups,
          recent: recent,
          recentLabel: 'اخیر',
        ),
        child: const Text('باز کردن'),
      ),
    )));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();

    // «كار» with the ARABIC kaf finds «کارها» with the Persian one.
    await tester.enterText(find.byType(TextField), 'كار');
    await tester.pumpAndSettle();
    expect(find.text('اخیر'), findsNothing, reason: 'recent is for an empty query only');
    expect(find.bySemanticsLabel('درخواست تازه'), findsOneWidget, reason: 'matched through its description «یک درخواست کار بساز»');
    expect(find.bySemanticsLabel('کیف پول'), findsNothing);

    // A hidden keyword matches too.
    await tester.enterText(find.byType(TextField), 'invite');
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('دعوت همکار'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'زززز');
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('دعوت همکار'), findsNothing);
    expect(tester.getSemantics(find.text('چیزی پیدا نشد.')), containsSemantics(label: 'چیزی پیدا نشد.', isLiveRegion: true));

    await tester.tap(iconButton('بستن'));
    await tester.pumpAndSettle();
    expect(find.text('جست‌وجوی همه‌چیز'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Command en-US: the same palette, mirrored — the ✕ is at the inline END (right), and the query is reported', (tester) async {
    final semantics = tester.ensureSemantics();
    final queries = <String>[];
    await tester.pumpWidget(app('en-US', Builder(
      builder: (context) => LumoButton(
        onPressed: () => showLumoCommand(
          context,
          label: 'Search everything',
          searchLabel: 'Search',
          emptyLabel: 'Nothing matched.',
          closeLabel: 'Close',
          placeholder: 'Type a command…',
          groups: const [
            LumoCommandGroup(label: 'Actions', items: [LumoCommandItem(id: 'new', label: 'New request')]),
          ],
          onQueryChanged: queries.add,
        ),
        child: const Text('Open'),
      ),
    )));
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    expect(find.text('Type a command…'), findsOneWidget);
    final panel = tester.getRect(find.byType(LumoCommand));
    expect(tester.getCenter(iconButton('Close')).dx > panel.center.dx, isTrue, reason: 'the ✕ sits at the inline end = the right under en-US');
    expect(tester.getCenter(find.text('Search everything')).dx < panel.center.dx, isTrue);

    await tester.enterText(find.byType(TextField), 'new');
    await tester.pumpAndSettle();
    expect(queries, ['new']);
    expect(find.bySemanticsLabel('New request'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Command: recent items with no name for the group are refused at build', (tester) async {
    await tester.pumpWidget(app('fa-IR', const SizedBox(
      height: 400,
      child: LumoCommand(
        label: 'x',
        searchLabel: 'y',
        emptyLabel: 'z',
        closeLabel: 'w',
        groups: [],
        recent: recent,
      ),
    )));
    expect(tester.takeException(), isAssertionError);
  });
}
