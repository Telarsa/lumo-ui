import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {double width = 360, double height = 300}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: Scaffold(body: Center(child: SizedBox(width: width, height: height, child: child))),
      ),
    );

void main() {
  testWidgets('ScrollArea: names the region once and scrolls the block axis', (tester) async {
    final semantics = tester.ensureSemantics();
    final controller = ScrollController();
    await tester.pumpWidget(app('fa-IR', LumoScrollArea(
      label: 'فهرست تراکنش‌ها',
      controller: controller,
      child: const Column(children: [SizedBox(height: 200, child: Text('الف')), SizedBox(height: 400, child: Text('ب'))]),
    )));
    expect(find.bySemanticsLabel('فهرست تراکنش‌ها'), findsOneWidget);
    expect(controller.offset, 0);
    await tester.drag(find.byType(LumoScrollArea), const Offset(0, -120));
    await tester.pumpAndSettle();
    expect(controller.offset, greaterThan(0));
    controller.dispose();
    semantics.dispose();
  });

  testWidgets('ScrollArea: a horizontal area scrolls inside itself and never moves the page', (tester) async {
    final page = ScrollController();
    final inner = ScrollController();
    await tester.pumpWidget(app('fa-IR', ListView(
      controller: page,
      children: [
        const SizedBox(height: 40),
        SizedBox(
          height: 60,
          child: LumoScrollArea(
            label: 'دسته‌بندی‌ها',
            orientation: LumoScrollAreaOrientation.horizontal,
            controller: inner,
            child: const Row(children: [SizedBox(width: 300, child: Text('الف')), SizedBox(width: 300, child: Text('ب')), SizedBox(width: 300, child: Text('ج'))]),
          ),
        ),
        const SizedBox(height: 900),
      ],
    )));
    // The area is exactly its box, not the 900 px of content inside it.
    expect(tester.getSize(find.byType(LumoScrollArea)).width, 360);
    // +120: under fa-IR the horizontal axis is `AxisDirection.left`, so the
    // offset grows when the content is dragged towards the right.
    await tester.drag(find.text('الف'), const Offset(120, 0));
    await tester.pumpAndSettle();
    expect(inner.offset, greaterThan(0), reason: 'the area scrolled inside itself');
    expect(page.offset, 0, reason: 'the page did not move');
    expect(tester.takeException(), isNull);
    page.dispose();
    inner.dispose();
  });

  testWidgets('ScrollArea: the first child sits at the reading start — right under fa-IR, left under en-US', (tester) async {
    for (final (locale, atRight) in [('fa-IR', true), ('en-US', false)]) {
      await tester.pumpWidget(app(locale, SizedBox(
        height: 60,
        child: LumoScrollArea(
          label: locale == 'fa-IR' ? 'دسته‌بندی‌ها' : 'Categories',
          orientation: LumoScrollAreaOrientation.horizontal,
          child: const Row(children: [SizedBox(width: 300, child: Text('اول')), SizedBox(width: 300, child: Text('دوم'))]),
        ),
      )));
      final box = tester.getRect(find.byType(LumoScrollArea));
      final first = tester.getCenter(find.text('اول'));
      expect(first.dx > box.center.dx, atRight, reason: 'the first child is at the reading start for $locale');
    }
  });

  testWidgets('ScrollArea: the fade is a mask, not a paint, and its presence does not depend on the offset', (tester) async {
    // A mask, so the fade reveals whatever is BEHIND the area rather than
    // painting `surface` over content that may be sitting on `bgSubtle`.
    final controller = ScrollController();
    await tester.pumpWidget(app('fa-IR', LumoScrollArea(
      label: 'بلند',
      controller: controller,
      child: const SizedBox(height: 900, child: Text('ب')),
    )));
    await tester.pumpAndSettle();
    expect(find.byType(ShaderMask), findsOneWidget);
    expect(tester.widget<ShaderMask>(find.byType(ShaderMask)).blendMode, BlendMode.dstIn);

    // Present even with nothing to fade: the tree's SHAPE must not depend on
    // the scroll state, or the scroll view is rebuilt and loses its position.
    await tester.pumpWidget(app('fa-IR', const LumoScrollArea(label: 'کوتاه', child: SizedBox(height: 100, child: Text('الف')))));
    await tester.pumpAndSettle();
    expect(find.byType(ShaderMask), findsOneWidget);

    // …and declining it removes the layer entirely.
    await tester.pumpWidget(app('fa-IR', const LumoScrollArea(label: 'کوتاه', fadeEdges: false, child: SizedBox(height: 100, child: Text('الف')))));
    await tester.pumpAndSettle();
    expect(find.byType(ShaderMask), findsNothing);
    controller.dispose();
  });

  testWidgets('ScrollArea: a drag on the FIRST frame still scrolls — the fade layer does not re-parent the scroll view', (tester) async {
    final controller = ScrollController();
    await tester.pumpWidget(app('fa-IR', LumoScrollArea(
      label: 'فهرست تراکنش‌ها',
      controller: controller,
      child: const SizedBox(height: 900, child: Text('ب')),
    )));
    // Deliberately NO pumpAndSettle: this is the regression where the fade
    // appeared on frame two, re-parented the scroller and reset the offset.
    await tester.drag(find.byType(LumoScrollArea), const Offset(0, -120));
    await tester.pumpAndSettle();
    expect(controller.offset, greaterThan(0));
    controller.dispose();
  });

  testWidgets('ScrollArea: a too-wide child clips instead of overflowing the page', (tester) async {
    await tester.pumpWidget(app('fa-IR', const LumoScrollArea(
      label: 'فهرست تراکنش‌ها',
      child: SizedBox(width: 900, height: 100, child: Text('پهن')),
    )));
    expect(tester.getSize(find.byType(LumoScrollArea)).width, 360);
    expect(tester.takeException(), isNull);
  });
}
