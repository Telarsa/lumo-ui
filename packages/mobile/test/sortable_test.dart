import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show CustomSemanticsAction, SemanticsAction;
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

LumoSortableItem item(String id, String label) => LumoSortableItem(
      id: id,
      label: label,
      moveUpLabel: 'انتقال «$label» به بالا',
      moveDownLabel: 'انتقال «$label» به پایین',
    );

/// Performs a named custom action on the node that carries it.
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
  testWidgets('Sortable: a named list of named items, each announced exactly once', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoSortable(
      label: 'ترتیب مراحل',
      items: [item('a', 'بازدید'), item('b', 'برآورد'), item('c', 'اجرا')],
      onReorder: (from, to) {},
    )));
    expect(find.bySemanticsLabel('ترتیب مراحل'), findsOneWidget);
    // The name is on the item's node; the drawn copy is silent.
    expect(find.bySemanticsLabel('بازدید'), findsOneWidget);
    expect(find.text('بازدید'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Sortable: an item MOVES by a named semantic action, not only by a drag', (tester) async {
    final semantics = tester.ensureSemantics();
    var order = ['بازدید', 'برآورد', 'اجرا'];
    late StateSetter setOuter;
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(builder: (context, setState) {
      setOuter = setState;
      return LumoSortable(
        label: 'ترتیب مراحل',
        items: [for (final label in order) item(label, label)],
        onReorder: (from, to) => setOuter(() => order = LumoSortable.reorder(order, from, to)),
      );
    })));

    // «برآورد» is second; the reader moves it up with the rotor, no finger.
    perform(tester, 'برآورد', 'انتقال «برآورد» به بالا');
    await tester.pump();
    expect(order, ['برآورد', 'بازدید', 'اجرا']);

    // …and down again, all the way to the end.
    perform(tester, 'برآورد', 'انتقال «برآورد» به پایین');
    await tester.pump();
    expect(order, ['بازدید', 'برآورد', 'اجرا']);
    semantics.dispose();
  });

  testWidgets('Sortable: an action is offered only where it can go — no "up" on the first, no "down" on the last', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoSortable(
      label: 'ترتیب مراحل',
      items: [item('a', 'بازدید'), item('b', 'برآورد'), item('c', 'اجرا')],
      onReorder: (from, to) {},
    )));
    int actions(String label) => tester.getSemantics(find.bySemanticsLabel(label)).getSemanticsData().customSemanticsActionIds?.length ?? 0;
    expect(actions('بازدید'), 1, reason: 'the first item can only go down');
    expect(actions('برآورد'), 2);
    expect(actions('اجرا'), 1, reason: 'the last item can only go up');
    semantics.dispose();
  });

  testWidgets('Sortable: dragging the grip reorders, and the held row is marked', (tester) async {
    var order = ['بازدید', 'برآورد', 'اجرا'];
    late StateSetter setOuter;
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(builder: (context, setState) {
      setOuter = setState;
      return LumoSortable(
        label: 'ترتیب مراحل',
        items: [for (final label in order) item(label, label)],
        onReorder: (from, to) => setOuter(() => order = LumoSortable.reorder(order, from, to)),
      );
    })));
    final firstGrip = tester.getCenter(find.byIcon(Icons.drag_indicator).first);
    final thirdRow = tester.getCenter(find.text('اجرا'));
    final gesture = await tester.startGesture(firstGrip);
    await gesture.moveBy(const Offset(0, 20));
    await tester.pump();
    await gesture.moveTo(Offset(firstGrip.dx, thirdRow.dy));
    await tester.pump();
    await gesture.up();
    await tester.pumpAndSettle();
    expect(order.last, 'بازدید', reason: 'the dragged row landed in the third slot');
  });

  testWidgets('Sortable: RTL geometry — the grip is at the reading start (right under fa-IR, left under en-US)', (tester) async {
    for (final (locale, gripAtRight) in [('fa-IR', true), ('en-US', false)]) {
      await tester.pumpWidget(app(locale, LumoSortable(
        label: locale == 'fa-IR' ? 'ترتیب مراحل' : 'Step order',
        items: [
          LumoSortableItem(
            id: 'a',
            label: locale == 'fa-IR' ? 'بازدید' : 'Visit',
            moveUpLabel: locale == 'fa-IR' ? 'به بالا' : 'Move up',
            moveDownLabel: locale == 'fa-IR' ? 'به پایین' : 'Move down',
          ),
        ],
        onReorder: (from, to) {},
      )));
      final row = tester.getRect(find.byType(LumoSortable));
      final grip = tester.getCenter(find.byIcon(Icons.drag_indicator));
      expect(grip.dx > row.center.dx, gripAtRight, reason: 'the grip is at the reading start for $locale');
    }
  });

  testWidgets('Sortable: disabled offers no actions and refuses the drag', (tester) async {
    final semantics = tester.ensureSemantics();
    var moves = 0;
    await tester.pumpWidget(app('fa-IR', LumoSortable(
      label: 'ترتیب مراحل',
      isDisabled: true,
      items: [item('a', 'بازدید'), item('b', 'برآورد')],
      onReorder: (from, to) => moves++,
    )));
    expect(tester.getSemantics(find.bySemanticsLabel('بازدید')).getSemanticsData().customSemanticsActionIds ?? const <int>[], isEmpty);
    await tester.drag(find.byIcon(Icons.drag_indicator).first, const Offset(0, 120));
    await tester.pumpAndSettle();
    expect(moves, 0);
    semantics.dispose();
  });

  testWidgets('Sortable.reorder: clamps, never mutates the caller\'s list', (tester) async {
    const original = ['a', 'b', 'c'];
    expect(LumoSortable.reorder(original, 0, 2), ['b', 'c', 'a']);
    expect(LumoSortable.reorder(original, 2, 0), ['c', 'a', 'b']);
    expect(LumoSortable.reorder(original, 0, 99), ['b', 'c', 'a'], reason: 'the destination is clamped');
    expect(LumoSortable.reorder(original, 7, 0), ['a', 'b', 'c'], reason: 'an index off the end is a no-op');
    expect(original, ['a', 'b', 'c'], reason: 'the caller\'s list is untouched');
  });
}
