import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show CustomSemanticsAction, SemanticsAction;
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

Widget rows(int n) => ListView(children: [for (var i = 0; i < n; i++) SizedBox(height: 80, child: Text('ردیف ${formatNumber(i + 1, 'fa-IR', grouping: false)}'))]);

void main() {
  testWidgets('PullToRefresh: pulling past the trigger runs the refresh; the hint changes on the way and the label is announced live', (tester) async {
    final semantics = tester.ensureSemantics();
    var refreshes = 0;
    final gate = Completer<void>();
    await tester.pumpWidget(app('fa-IR', LumoPullToRefresh(
      refreshLabel: 'در حال به‌روزرسانی…',
      pullLabel: 'برای تازه‌کردن بکشید',
      releaseLabel: 'رها کنید تا تازه شود',
      onRefresh: () {
        refreshes++;
        return gate.future;
      },
      child: rows(20),
    )));

    // A short pull: the "keep pulling" hint, and no refresh yet.
    final gesture = await tester.startGesture(tester.getCenter(find.byType(LumoPullToRefresh)));
    await gesture.moveBy(const Offset(0, 30));
    await tester.pump();
    expect(find.text('برای تازه‌کردن بکشید'), findsOneWidget);
    expect(refreshes, 0);

    // Past the trigger: the hint changes to "let go".
    await gesture.moveBy(const Offset(0, 60));
    await tester.pump();
    expect(find.text('رها کنید تا تازه شود'), findsOneWidget);
    expect(refreshes, 0, reason: 'a pull is not a refresh until the finger lifts');

    await gesture.up();
    await tester.pump();
    expect(refreshes, 1);
    expect(find.text('در حال به‌روزرسانی…'), findsOneWidget);
    // Announced from a live region — the reader is told, not shown.
    expect(tester.getSemantics(find.bySemanticsLabel('در حال به‌روزرسانی…')).getSemanticsData().flagsCollection.isLiveRegion, isTrue);
    // …and exactly once: the drawn row is silent so the name is not doubled.
    expect(find.bySemanticsLabel('در حال به‌روزرسانی…'), findsOneWidget);

    gate.complete();
    await tester.pumpAndSettle();
    expect(find.text('در حال به‌روزرسانی…'), findsNothing);
    semantics.dispose();
  });

  testWidgets('PullToRefresh: a pull that stops short of the trigger refreshes nothing', (tester) async {
    var refreshes = 0;
    await tester.pumpWidget(app('fa-IR', LumoPullToRefresh(
      refreshLabel: 'در حال به‌روزرسانی…',
      onRefresh: () async => refreshes++,
      child: rows(20),
    )));
    final gesture = await tester.startGesture(tester.getCenter(find.byType(LumoPullToRefresh)));
    await gesture.moveBy(const Offset(0, 40));
    await tester.pump();
    await gesture.up();
    await tester.pumpAndSettle();
    expect(refreshes, 0);
  });

  testWidgets('PullToRefresh: the refresh is a NAMED semantic action — the route for a reader who cannot perform a pull', (tester) async {
    final semantics = tester.ensureSemantics();
    var refreshes = 0;
    await tester.pumpWidget(app('fa-IR', LumoPullToRefresh(
      refreshLabel: 'به‌روزرسانی فهرست',
      onRefresh: () async => refreshes++,
      child: rows(20),
    )));
    final node = tester.getSemantics(find.byType(LumoPullToRefresh));
    final data = node.getSemanticsData();
    expect(data.hasAction(SemanticsAction.customAction), isTrue);
    // Performing it is the whole point: no drag, and the list still refreshes.
    node.owner!.performAction(
      node.id,
      SemanticsAction.customAction,
      CustomSemanticsAction.getIdentifier(CustomSemanticsAction(label: 'به‌روزرسانی فهرست')),
    );
    await tester.pumpAndSettle();
    expect(refreshes, 1);
    semantics.dispose();
  });

  testWidgets('PullToRefresh: a list SHORTER than its viewport is still pullable — the physics are imposed, not left to the caller', (tester) async {
    var refreshes = 0;
    final gate = Completer<void>();
    await tester.pumpWidget(app('fa-IR', LumoPullToRefresh(
      refreshLabel: 'در حال به‌روزرسانی…',
      onRefresh: () {
        refreshes++;
        return gate.future;
      },
      // One 80 px row in a 400 px box: nothing to scroll, everything to pull.
      child: rows(1),
    )));
    final gesture = await tester.startGesture(tester.getCenter(find.byType(LumoPullToRefresh)));
    await gesture.moveBy(const Offset(0, 100));
    await tester.pump();
    await gesture.up();
    await tester.pump();
    expect(refreshes, 1);
    gate.complete();
    await tester.pumpAndSettle();
  });

  testWidgets('PullToRefresh: a pull mid-list is a scroll, not a refresh', (tester) async {
    var refreshes = 0;
    await tester.pumpWidget(app('fa-IR', LumoPullToRefresh(
      refreshLabel: 'در حال به‌روزرسانی…',
      onRefresh: () async => refreshes++,
      child: rows(30),
    )));
    // Scroll away from the top first.
    await tester.drag(find.byType(Scrollable), const Offset(0, -300));
    await tester.pumpAndSettle();
    // Now drag downwards: the list scrolls back, and nothing refreshes.
    await tester.drag(find.byType(Scrollable), const Offset(0, 120));
    await tester.pumpAndSettle();
    expect(refreshes, 0);
  });

  testWidgets('PullToRefresh: the glyph leads the words at the reading start — right of them under fa-IR, left under en-US', (tester) async {
    for (final (locale, label, glyphAtRight) in [('fa-IR', 'در حال به‌روزرسانی…', true), ('en-US', 'Refreshing…', false)]) {
      final gate = Completer<void>();
      await tester.pumpWidget(app(locale, LumoPullToRefresh(
        refreshLabel: label,
        onRefresh: () => gate.future,
        child: ListView(children: const [SizedBox(height: 200, child: Text('Row'))]),
      )));
      final gesture = await tester.startGesture(tester.getCenter(find.byType(LumoPullToRefresh)));
      await gesture.moveBy(const Offset(0, 100));
      await tester.pump();
      await gesture.up();
      await tester.pump();
      expect(find.text(label), findsOneWidget);
      // The indicator is a `Row`, which mirrors itself: nothing in the widget
      // names a side, and the glyph still leads.
      final glyph = tester.getCenter(find.byIcon(Icons.refresh));
      final words = tester.getCenter(find.text(label));
      expect(glyph.dx > words.dx, glyphAtRight, reason: 'the glyph leads at the reading start for $locale');
      // …and it sits at the block start, which does not mirror.
      final box = tester.getRect(find.byType(LumoPullToRefresh));
      expect(words.dy < box.top + 100, isTrue);
      gate.complete();
      await tester.pumpAndSettle();
    }
  });
}
