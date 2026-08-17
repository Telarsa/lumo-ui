import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 300, child: child)))),
    );

void main() {
  testWidgets('Skeleton: decorative — no semantics node at all; pulses (opacity changes over time); shapes size as documented', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const Column(mainAxisSize: MainAxisSize.min, children: [
      LumoSkeleton(shape: LumoSkeletonShape.text),
      LumoSkeleton(shape: LumoSkeletonShape.circle, width: 40),
      LumoSkeleton(shape: LumoSkeletonShape.rect, width: 120, height: 80),
    ])));
    // Nothing announced: the whole subtree is excluded.
    expect(tester.getSemantics(find.byType(LumoSkeleton).first).getSemanticsData().label, isEmpty);
    expect(find.bySemanticsLabel(RegExp('.+')).evaluate().where((e) => e.widget is LumoSkeleton), isEmpty);
    expect(tester.getSize(find.byType(LumoSkeleton).at(0)), const Size(300, 16));
    expect(tester.getSize(find.byType(LumoSkeleton).at(1)), const Size(40, 40));
    expect(tester.getSize(find.byType(LumoSkeleton).at(2)), const Size(120, 80));
    final fade = find.descendant(of: find.byType(LumoSkeleton).first, matching: find.byType(FadeTransition));
    final o0 = tester.widget<FadeTransition>(fade).opacity.value;
    await tester.pump(const Duration(milliseconds: 500));
    final o1 = tester.widget<FadeTransition>(fade).opacity.value;
    expect(o0 == o1, isFalse, reason: 'the pulse animates');
    final c = LumoScope.of(tester.element(find.byType(LumoSkeleton).first)).colours;
    expect((tester.widget<Container>(find.descendant(of: find.byType(LumoSkeleton).first, matching: find.byType(Container))).decoration as BoxDecoration).color, c.surfaceSunken);
    semantics.dispose();
  });

  testWidgets('SkeletonText: N lines, the last two-thirds wide and at the reading START (right under fa-IR, left under en-US)', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      await tester.pumpWidget(app(locale, const LumoSkeletonText(lines: 3)));
      expect(find.byType(LumoSkeleton), findsNWidgets(3));
      final box = tester.getRect(find.byType(LumoSkeletonText));
      final last = tester.getRect(find.byType(LumoSkeleton).last);
      expect(last.width, closeTo(200, 0.5));
      if (locale == 'fa-IR') {
        expect(last.right, closeTo(box.right, 0.5), reason: 'flush with the reading start = right under fa-IR');
      } else {
        expect(last.left, closeTo(box.left, 0.5), reason: 'flush with the reading start = left under en-US');
      }
    }
  });
}
