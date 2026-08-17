import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show CustomSemanticsAction, SemanticsAction, SemanticsRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {double width = 360, double height = 500}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: Scaffold(body: Center(child: SizedBox(width: width, height: height, child: child))),
      ),
    );

/// The Khroos job board, four columns and their real names.
List<LumoKanbanColumn> board() => [
      const LumoKanbanColumn(id: 'wait', label: 'در انتظار', cards: [
        LumoKanbanCard(id: 'j1', label: 'تعمیر پکیج — نشتی مبدل', description: 'خانم موسوی · سعادت‌آباد'),
        LumoKanbanCard(id: 'j2', label: 'سرویس سالانهٔ پکیج'),
      ]),
      const LumoKanbanColumn(id: 'doing', label: 'در حال انجام', cards: [LumoKanbanCard(id: 'j3', label: 'تعویض شیر رادیاتور')]),
      const LumoKanbanColumn(id: 'done', label: 'تکمیل‌شده', cards: [], emptyLabel: 'کاری در «تکمیل‌شده» نیست'),
      const LumoKanbanColumn(id: 'paid', label: 'پرداخت‌شده', cards: []),
    ];

void perform(WidgetTester tester, String nodeLabel, String actionLabel) {
  final node = tester.getSemantics(find.bySemanticsLabel(nodeLabel));
  // `node.owner`, not `tester.binding.pipelineOwner.semanticsOwner`: the node
  // knows which owner it belongs to, and that accessor is deprecated.
  node.owner!.performAction(
    node.id,
    SemanticsAction.customAction,
    CustomSemanticsAction.getIdentifier(CustomSemanticsAction(label: actionLabel)),
  );
}

void main() {
  testWidgets('Kanban: a named board of named columns; each column is a list whose VALUE is its count in the reader\'s digits', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoKanban(
      label: 'وضعیت کارها',
      columns: board(),
      moveToColumnLabel: (c) => 'انتقال به «$c»',
      onCardMoved: (a, b, c) {},
    )));
    expect(find.bySemanticsLabel('وضعیت کارها'), findsOneWidget);

    final wait = tester.getSemantics(find.bySemanticsLabel('در انتظار')).getSemanticsData();
    expect(wait.role, SemanticsRole.list);
    expect(wait.label, 'در انتظار');
    // The count, through `formatNumber` — «۲», never «2», and never a raw int.
    expect(wait.value, formatNumber(2, 'fa-IR'));
    expect(tester.getSemantics(find.bySemanticsLabel('در حال انجام')).getSemanticsData().value, formatNumber(1, 'fa-IR'));
    expect(tester.getSemantics(find.bySemanticsLabel('تکمیل‌شده')).getSemanticsData().value, formatNumber(0, 'fa-IR'));

    // A card is named once: the drawn title is silent, the description is not.
    expect(find.bySemanticsLabel('تعمیر پکیج — نشتی مبدل'), findsOneWidget);
    expect(find.text('خانم موسوی · سعادت‌آباد'), findsOneWidget);
    // An empty column says so, in the caller's sentence.
    expect(find.text('کاری در «تکمیل‌شده» نیست'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Kanban: a card MOVES between columns by a named semantic action, not only by a drag', (tester) async {
    final semantics = tester.ensureSemantics();
    var columns = board();
    late StateSetter setOuter;
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(builder: (context, setState) {
      setOuter = setState;
      return LumoKanban(
        label: 'وضعیت کارها',
        columns: columns,
        moveToColumnLabel: (c) => 'انتقال به «$c»',
        onCardMoved: (cardId, toColumnId, toIndex) => setOuter(() => columns = LumoKanban.moveCard(columns, cardId, toColumnId, toIndex)),
      );
    })));

    // The Khroos «advance to the next status» button, as an action.
    perform(tester, 'تعمیر پکیج — نشتی مبدل', 'انتقال به «در حال انجام»');
    await tester.pump();
    expect(columns[0].cards.map((c) => c.id), ['j2']);
    expect(columns[1].cards.map((c) => c.id), ['j3', 'j1'], reason: 'the card lands at the END of its new column');

    // …and on to an EMPTY column, which is not a special case.
    perform(tester, 'تعمیر پکیج — نشتی مبدل', 'انتقال به «تکمیل‌شده»');
    await tester.pump();
    expect(columns[2].cards.map((c) => c.id), ['j1']);
    semantics.dispose();
  });

  testWidgets('Kanban: every card offers one action per OTHER column, never one to where it already is', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoKanban(
      label: 'وضعیت کارها',
      columns: board(),
      moveToColumnLabel: (c) => 'انتقال به «$c»',
      onCardMoved: (a, b, c) {},
    )));
    final ids = tester.getSemantics(find.bySemanticsLabel('تعمیر پکیج — نشتی مبدل')).getSemanticsData().customSemanticsActionIds!;
    expect(ids.length, 3, reason: 'four columns, minus the one the card is in');
    expect(ids, isNot(contains(CustomSemanticsAction.getIdentifier(CustomSemanticsAction(label: 'انتقال به «در انتظار»')))));
    expect(ids, contains(CustomSemanticsAction.getIdentifier(CustomSemanticsAction(label: 'انتقال به «پرداخت‌شده»'))));
    semantics.dispose();
  });

  testWidgets('Kanban: the board scrolls sideways inside itself, keeps the next column peeking, and never moves the page', (tester) async {
    final page = ScrollController();
    final inner = ScrollController();
    await tester.pumpWidget(app('fa-IR', ListView(
      controller: page,
      children: [
        const SizedBox(height: 20),
        SizedBox(
          height: 320,
          child: LumoKanban(
            label: 'وضعیت کارها',
            columns: board(),
            controller: inner,
            moveToColumnLabel: (c) => 'انتقال به «$c»',
            onCardMoved: (a, b, c) {},
          ),
        ),
        const SizedBox(height: 900),
      ],
    )));
    // Four 264 px columns would be over a thousand pixels; the board is 360.
    expect(tester.getSize(find.byType(LumoKanban)).width, 360);
    // A column is capped so the next one still shows an edge.
    expect(tester.getSize(find.text('در انتظار')).width, lessThan(360 - 32));

    await tester.drag(find.text('در انتظار'), const Offset(120, 0));
    await tester.pumpAndSettle();
    expect(inner.offset, greaterThan(0), reason: 'the board scrolled inside itself');
    expect(page.offset, 0, reason: 'the page did not move');
    expect(tester.takeException(), isNull);
    page.dispose();
    inner.dispose();
  });

  testWidgets('Kanban: RTL geometry — the FIRST column sits at the reading start (right under fa-IR, left under en-US)', (tester) async {
    for (final (locale, firstAtRight) in [('fa-IR', true), ('en-US', false)]) {
      final columns = locale == 'fa-IR'
          ? board()
          : const [
              LumoKanbanColumn(id: 'wait', label: 'Waiting', cards: [LumoKanbanCard(id: 'j1', label: 'Boiler repair')]),
              LumoKanbanColumn(id: 'doing', label: 'In progress', cards: []),
            ];
      await tester.pumpWidget(app(locale, LumoKanban(
        label: locale == 'fa-IR' ? 'وضعیت کارها' : 'Job status',
        columns: columns,
        moveToColumnLabel: (c) => locale == 'fa-IR' ? 'انتقال به «$c»' : 'Move to $c',
        onCardMoved: (a, b, c) {},
      )));
      final box = tester.getRect(find.byType(LumoKanban));
      final first = tester.getCenter(find.text(columns.first.label));
      final second = tester.getCenter(find.text(columns[1].label));
      expect(first.dx > box.center.dx, firstAtRight, reason: 'the first column is at the reading start for $locale');
      expect(second.dx < first.dx, firstAtRight, reason: 'later columns run away from the reading start for $locale');
    }
  });

  testWidgets('Kanban: holding a card\'s grip and dragging it into another column moves it there', (tester) async {
    var columns = board();
    late StateSetter setOuter;
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(builder: (context, setState) {
      setOuter = setState;
      return LumoKanban(
        label: 'وضعیت کارها',
        columns: columns,
        moveToColumnLabel: (c) => 'انتقال به «$c»',
        onCardMoved: (cardId, toColumnId, toIndex) => setOuter(() => columns = LumoKanban.moveCard(columns, cardId, toColumnId, toIndex)),
      );
    })));
    final grip = tester.getCenter(find.byIcon(Icons.drag_indicator).first);
    final target = tester.getCenter(find.text('در حال انجام'));
    final gesture = await tester.startGesture(grip);
    // Held, not flicked: a plain pan would be claimed by the board's own
    // horizontal scroller. See `kanban.dart`.
    await tester.pump(const Duration(milliseconds: 600));
    await gesture.moveTo(Offset(target.dx, grip.dy));
    await tester.pump();
    await gesture.up();
    await tester.pumpAndSettle();
    expect(columns[1].cards.any((c) => c.id == 'j1'), isTrue, reason: 'the card crossed into the neighbouring column');
  });

  testWidgets('Kanban.moveCard: clamps the destination index and never mutates the caller\'s board', (tester) async {
    final original = board();
    final moved = LumoKanban.moveCard(original, 'j1', 'paid', 99);
    expect(moved.last.cards.map((c) => c.id), ['j1'], reason: 'an index past the end is clamped');
    expect(LumoKanban.moveCard(original, 'nope', 'paid', 0).map((c) => c.cards.length), [2, 1, 0, 0], reason: 'an unknown card leaves the board as it was');
    expect(original[0].cards.length, 2, reason: 'the caller\'s board is untouched');
  });
}
