// Layout: the GAP is the named step, and every alignment is LOGICAL — the same
// `LumoAlign.start` puts a child on the RIGHT under fa-IR and on the LEFT under
// en-US, with no direction flag anywhere. That mirroring is the whole reason
// these primitives exist instead of a hand-written Row with a SizedBox in it.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: 360, child: child)))),
    );

Widget box(String id, {double w = 40, double h = 20}) => SizedBox(key: ValueKey(id), width: w, height: h);
Rect rectOf(WidgetTester tester, String id) => tester.getRect(find.byKey(ValueKey(id)));

void main() {
  testWidgets('Stack: the gap is the step, and a row mirrors — the first child is at the RIGHT under fa-IR, the LEFT under en-US', (tester) async {
    // The scale is named once and is the same number everywhere.
    expect(lumoGapOf(LumoGap.none), 0);
    expect(lumoGapOf(LumoGap.xs), 4);
    expect(lumoGapOf(LumoGap.sm), 8);
    expect(lumoGapOf(LumoGap.md), 16);
    expect(lumoGapOf(LumoGap.lg), 24);
    expect(lumoGapOf(LumoGap.xl), 32);

    await tester.pumpWidget(app('fa-IR', LumoStack(
      direction: LumoStackDirection.row,
      gap: LumoGap.md,
      align: LumoAlign.center,
      children: [box('اول'), box('دوم')],
    )));
    var first = rectOf(tester, 'اول');
    var second = rectOf(tester, 'دوم');
    // Under fa-IR the row runs right-to-left: the first child is the rightmost,
    // and the gap is the distance between them.
    expect(first.left > second.right, isTrue, reason: 'the first child of a row is at the reading start = the right under fa-IR');
    expect(first.left - second.right, 16, reason: 'LumoGap.md is 16 logical pixels');

    await tester.pumpWidget(app('en-US', LumoStack(
      direction: LumoStackDirection.row,
      gap: LumoGap.md,
      align: LumoAlign.center,
      children: [box('اول'), box('دوم')],
    )));
    first = rectOf(tester, 'اول');
    second = rectOf(tester, 'دوم');
    expect(second.left > first.right, isTrue, reason: 'the same stack, mirrored: the first child is the leftmost under en-US');
    expect(second.left - first.right, 16);
  });

  testWidgets('Stack: a different step is a different gap, and `none` is no gap', (tester) async {
    for (final (gap, expected) in [(LumoGap.none, 0.0), (LumoGap.xs, 4.0), (LumoGap.lg, 24.0)]) {
      await tester.pumpWidget(app('fa-IR', LumoStack(
        direction: LumoStackDirection.row,
        gap: gap,
        align: LumoAlign.center,
        children: [box('اول'), box('دوم')],
      )));
      expect(rectOf(tester, 'اول').left - rectOf(tester, 'دوم').right, expected);
    }
  });

  testWidgets('Stack: `align: start` mirrors — the child hugs the RIGHT edge under fa-IR and the LEFT edge under en-US', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoStack(align: LumoAlign.start, gap: LumoGap.sm, children: [box('تنها')])));
    var stack = tester.getRect(find.byType(LumoStack));
    var child = rectOf(tester, 'تنها');
    expect(stack.width, 360);
    expect(child.right, stack.right, reason: 'the cross-axis START is the right edge under fa-IR');

    await tester.pumpWidget(app('en-US', LumoStack(align: LumoAlign.start, gap: LumoGap.sm, children: [box('تنها')])));
    stack = tester.getRect(find.byType(LumoStack));
    child = rectOf(tester, 'تنها');
    expect(child.left, stack.left, reason: 'the same value, mirrored: the LEFT edge under en-US');

    // …and `end` is the other edge, in both scripts.
    await tester.pumpWidget(app('fa-IR', LumoStack(align: LumoAlign.end, gap: LumoGap.sm, children: [box('تنها')])));
    expect(rectOf(tester, 'تنها').left, tester.getRect(find.byType(LumoStack)).left);
  });

  testWidgets('Stack: a wrapped row breaks into runs, and the run gap is the same step', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoStack(
      direction: LumoStackDirection.row,
      gap: LumoGap.md,
      wrap: true,
      children: [for (var i = 0; i < 3; i++) box('$i', w: 160, h: 20)],
    )));
    // 160 + 16 + 160 = 336 fits; the third goes to a second run 16 below.
    expect(rectOf(tester, '0').top, rectOf(tester, '1').top);
    expect(rectOf(tester, '2').top - rectOf(tester, '0').bottom, 16);
    expect(rectOf(tester, '0').left > rectOf(tester, '1').left, isTrue, reason: 'a wrapped row mirrors too');
  });

  testWidgets('Grid: columns run along the INLINE axis — cell 1 is the reader’s first cell in both scripts, and the gap is the step', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoGrid(
      columns: 2,
      gap: LumoGap.md,
      children: [for (var i = 0; i < 4; i++) box('$i', w: 10, h: 20)],
    )));
    final grid = tester.getRect(find.byType(LumoGrid));
    // Each track is (360 − 16) / 2 = 172 wide; the boxes are centred in them.
    expect(rectOf(tester, '0').center.dx > grid.center.dx, isTrue, reason: 'the first cell is at the reading start = the right under fa-IR');
    expect(rectOf(tester, '1').center.dx < grid.center.dx, isTrue);
    // The second row sits one step below the first.
    expect(rectOf(tester, '2').top - rectOf(tester, '0').bottom, 16);
    expect(rectOf(tester, '2').center.dx, rectOf(tester, '0').center.dx, reason: 'the columns stay put between rows');

    await tester.pumpWidget(app('en-US', LumoGrid(
      columns: 2,
      gap: LumoGap.md,
      children: [for (var i = 0; i < 4; i++) box('$i', w: 10, h: 20)],
    )));
    expect(rectOf(tester, '0').center.dx < tester.getRect(find.byType(LumoGrid)).center.dx, isTrue, reason: 'mirrored under en-US');
  });

  testWidgets('Grid: a short last row keeps its empty cells — the columns do not stretch', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoGrid(
      columns: 3,
      gap: LumoGap.sm,
      children: [for (var i = 0; i < 4; i++) box('$i', w: 10, h: 20)],
    )));
    expect(rectOf(tester, '3').center.dx, rectOf(tester, '0').center.dx, reason: 'the fourth tile starts the second row in the first column, it does not fill the row');
  });

  testWidgets('AspectRatio: a ratio is a dimension, not a direction — the same box in both scripts', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      await tester.pumpWidget(app(locale, const LumoAspectRatio(ratio: 16 / 9, child: SizedBox.expand())));
      final rect = tester.getRect(find.byType(LumoAspectRatio));
      expect(rect.width, 360);
      expect(rect.height, closeTo(360 * 9 / 16, 0.01));
    }
    expect(() => LumoAspectRatio(ratio: 0, child: const SizedBox()), throwsAssertionError);
    expect(() => LumoGrid(columns: 0, children: const []), throwsAssertionError);
  });
}
