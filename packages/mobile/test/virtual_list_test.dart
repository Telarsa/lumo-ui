import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsData, SemanticsNode, SemanticsRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {double width = 360, double height = 400}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: Scaffold(body: Center(child: SizedBox(width: width, height: height, child: child))),
      ),
    );

/// The node that carries the SET: with two-pane viewport semantics the scroll
/// data lives on the viewport's inner node, not on the one `Scrollable`'s own
/// render object creates, so the tree is walked for it rather than guessed at.
SemanticsData scrollData(WidgetTester tester) {
  SemanticsData? found;
  void visit(SemanticsNode node) {
    final data = node.getSemanticsData();
    if (data.scrollChildCount != null) found ??= data;
    node.visitChildren((child) {
      visit(child);
      return true;
    });
  }

  visit(tester.getSemantics(find.byType(Scrollable)));
  return found!;
}

void main() {
  testWidgets('VirtualList: a NAMED list that builds a window, not a corpus — 2,000 rows, a handful of widgets', (tester) async {
    final semantics = tester.ensureSemantics();
    final built = <int>[];
    await tester.pumpWidget(app('fa-IR', LumoVirtualList(
      label: 'فهرست سفارش‌ها',
      emptyLabel: 'سفارشی ثبت نشده است.',
      itemCount: 2000,
      estimatedItemExtent: 64,
      itemBuilder: (context, i) {
        built.add(i);
        return SizedBox(height: 64, child: Text('ردیف ${formatNumber(i + 1, 'fa-IR', grouping: false)}'));
      },
    )));

    final list = tester.getSemantics(find.bySemanticsLabel('فهرست سفارش‌ها')).getSemanticsData();
    expect(list.role, SemanticsRole.list);
    expect(list.label, 'فهرست سفارش‌ها');
    expect(find.bySemanticsLabel('فهرست سفارش‌ها'), findsOneWidget);

    // A 400 px viewport of 64 px rows: a screenful and a little, never 2,000.
    expect(built.length, lessThan(40));
    expect(find.text('ردیف ۱'), findsOneWidget);
    expect(find.text('ردیف ۲۰۰۰'), findsNothing);
    semantics.dispose();
  });

  testWidgets('VirtualList: the SET is on the scrollable — total is itemCount, as a raw integer, and the position is the true index', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoVirtualList(
      label: 'فهرست سفارش‌ها',
      emptyLabel: 'سفارشی ثبت نشده است.',
      itemCount: 2000,
      estimatedItemExtent: 64,
      itemBuilder: (context, i) => SizedBox(height: 64, child: Text('ردیف ${formatNumber(i + 1, 'fa-IR', grouping: false)}')),
    )));
    final scroller = scrollData(tester);
    // Flutter's counterpart of `aria-setsize` / `aria-posinset`.
    expect(scroller.scrollChildCount, 2000);
    expect(scroller.scrollIndex, 0);
    // A raw integer, never `formatNumber`ed: «۲۰۰۰» in a set size is not a value.
    expect(scroller.scrollChildCount.toString(), '2000');

    await tester.drag(find.byType(Scrollable), const Offset(0, -640));
    await tester.pumpAndSettle();
    final after = scrollData(tester);
    expect(after.scrollChildCount, 2000);
    expect(after.scrollIndex, 10, reason: 'the position is the TRUE index in the corpus, not the index in the window');
    semantics.dispose();
  });

  testWidgets('VirtualList: no rows shows and announces the required empty message; the list is still named', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoVirtualList(
      label: 'فهرست سفارش‌ها',
      emptyLabel: 'سفارشی ثبت نشده است.',
      itemCount: 0,
      itemBuilder: (context, i) => const SizedBox.shrink(),
    )));
    expect(tester.getSemantics(find.bySemanticsLabel('فهرست سفارش‌ها')).getSemanticsData().role, SemanticsRole.list);
    expect(find.text('سفارشی ثبت نشده است.'), findsOneWidget);
    expect(find.bySemanticsLabel('سفارشی ثبت نشده است.'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('VirtualList: itemKey alone RESETS a moved row\'s state; itemKey + findItemIndex carries it with the datum', (tester) async {
    // A sliver does not relocate elements by key on its own. Both halves are
    // needed, and this is the difference between them.
    for (final withFinder in [false, true]) {
      var data = ['الف', 'ب', 'ج'];
      late StateSetter setOuter;
      await tester.pumpWidget(app('fa-IR', StatefulBuilder(builder: (context, setState) {
        setOuter = setState;
        return LumoVirtualList(
          label: 'فهرست',
          emptyLabel: 'خالی',
          itemCount: data.length,
          itemKey: (i) => data[i],
          findItemIndex: withFinder ? (key) => data.indexOf(key as String) : null,
          itemBuilder: (context, i) => SizedBox(height: 60, child: _Counter(name: data[i])),
        );
      })));
      await tester.tap(find.text('ب ۰'));
      await tester.pump();
      expect(find.text('ب ۱'), findsOneWidget);

      // Insert at the head: every row shifts down one slot.
      setOuter(() => data = ['د', 'الف', 'ب', 'ج']);
      await tester.pump();
      // Either way the new head is fresh — no state was inherited from a
      // stranger, which is the defect an unkeyed list has.
      expect(find.text('د ۰'), findsOneWidget);
      if (withFinder) {
        expect(find.text('ب ۱'), findsOneWidget, reason: 'the state travelled with the datum');
      } else {
        expect(find.text('ب ۰'), findsOneWidget, reason: 'without findItemIndex the row is rebuilt, so its state is discarded — not misattributed');
      }
    }
  });

  testWidgets('VirtualList: rows read right-to-left under fa-IR and left-to-right under en-US, with the locale\'s digits', (tester) async {
    for (final (locale, direction, first) in [('fa-IR', TextDirection.rtl, '۱'), ('en-US', TextDirection.ltr, '1')]) {
      await tester.pumpWidget(app(locale, LumoVirtualList(
        label: locale == 'fa-IR' ? 'فهرست سفارش‌ها' : 'Orders',
        emptyLabel: locale == 'fa-IR' ? 'سفارشی نیست' : 'No orders',
        itemCount: 20,
        estimatedItemExtent: 64,
        itemBuilder: (context, i) => SizedBox(height: 64, child: Text(formatNumber(i + 1, locale, grouping: false))),
      )));
      expect(find.text(first), findsOneWidget);
      expect(Directionality.of(tester.element(find.text(first))), direction);
    }
  });

  testWidgets('InfiniteList: asks for a page once per corpus size, announces the loading row, and the footer is NOT in the set', (tester) async {
    final semantics = tester.ensureSemantics();
    var requests = 0;
    var count = 20;
    var loading = false;
    late StateSetter setOuter;
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(builder: (context, setState) {
      setOuter = setState;
      return LumoInfiniteList(
        label: 'فهرست سفارش‌ها',
        emptyLabel: 'سفارشی ثبت نشده است.',
        loadingLabel: 'در حال بارگذاری…',
        itemCount: count,
        isLoadingMore: loading,
        onEndReached: () => requests++,
        itemBuilder: (context, i) => SizedBox(height: 64, child: Text('ردیف ${formatNumber(i + 1, 'fa-IR', grouping: false)}')),
      );
    })));
    expect(requests, 0, reason: 'the first screenful is nowhere near the end');

    await tester.drag(find.byType(Scrollable), const Offset(0, -1200));
    await tester.pumpAndSettle();
    expect(requests, 1);
    // Scrolling around the end again does not ask twice for the same page.
    await tester.drag(find.byType(Scrollable), const Offset(0, 200));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(Scrollable), const Offset(0, -200));
    await tester.pumpAndSettle();
    expect(requests, 1, reason: 'the guard is the corpus size, as on the web');

    // The page is in flight: the row is drawn and announced from a live region.
    setOuter(() => loading = true);
    await tester.pump();
    // The footer lives past the last row, so scroll onto it. `pump`, not
    // `pumpAndSettle`: the spinner's ring never stops turning.
    await tester.drag(find.byType(Scrollable), const Offset(0, -200));
    await tester.pump();
    expect(find.text('در حال بارگذاری…'), findsOneWidget);
    expect(find.bySemanticsLabel('در حال بارگذاری…'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('در حال بارگذاری…')).getSemanticsData().flagsCollection.isLiveRegion, isTrue);
    // …and it did not inflate the total the reader is told.
    expect(scrollData(tester).scrollChildCount, 20);

    // The page arrived: the guard is spent and the next end is a new question.
    setOuter(() {
      count = 40;
      loading = false;
    });
    await tester.pumpAndSettle();
    await tester.drag(find.byType(Scrollable), const Offset(0, -1400));
    await tester.pumpAndSettle();
    expect(requests, 2);
    semantics.dispose();
  });
}

/// A row that owns state, to prove `itemKey` moves it with its datum.
class _Counter extends StatefulWidget {
  const _Counter({required this.name});
  final String name;
  @override
  State<_Counter> createState() => _CounterState();
}

class _CounterState extends State<_Counter> {
  int n = 0;
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => setState(() => n++),
        child: Text('${widget.name} ${formatNumber(n, 'fa-IR', grouping: false)}'),
      );
}
