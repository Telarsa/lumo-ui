import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

void main() {
  testWidgets('Card: static by default (no button); header title is a header; action at the inline END (left under fa-IR); footer actions at the end', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
        LumoCardHeader(title: 'پروژهٔ لومو', description: 'کتابخانهٔ رابط کاربری', action: LumoIconButton(label: 'گزینه‌ها', onPressed: () {}, child: const Icon(Icons.more_horiz))),
        const Text('بدنهٔ کارت'),
        LumoCardFooter(children: [LumoButton(onPressed: () {}, child: const Text('ذخیره'))]),
      ]),
    )));
    expect(Directionality.of(tester.element(find.text('پروژهٔ لومو'))), TextDirection.rtl);
    expect(tester.getSemantics(find.text('پروژهٔ لومو')), matchesSemantics(label: 'پروژهٔ لومو', isHeader: true));
    expect(find.text('کتابخانهٔ رابط کاربری'), findsOneWidget);
    // Not a button: no tap action anywhere above the body text.
    expect(tester.getSemantics(find.text('بدنهٔ کارت')).getSemanticsData().hasAction(SemanticsAction.tap), isFalse);
    final card = tester.getRect(find.byType(LumoCard));
    expect(tester.getCenter(find.bySemanticsLabel('گزینه‌ها')).dx < card.center.dx, isTrue, reason: 'the header action sits at the inline end = left under fa-IR');
    expect(tester.getCenter(find.text('پروژهٔ لومو')).dx > card.center.dx, isTrue, reason: 'the title starts at the right under fa-IR');
    expect(tester.getCenter(find.text('ذخیره')).dx < card.center.dx, isTrue, reason: 'footer actions at the inline end');
    semantics.dispose();
  });

  testWidgets('Card: tappable = ONE button named by label, content as child nodes under it, tap fires; en-US action at the right', (tester) async {
    final semantics = tester.ensureSemantics();
    var taps = 0;
    await tester.pumpWidget(app('en-US', LumoCard(
      label: 'Open the Lumo project',
      onTap: () => taps++,
      variant: LumoCardVariant.elevated,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
        LumoCardHeader(title: 'Lumo project', action: LumoIconButton(label: 'Options', onPressed: () {}, child: const Icon(Icons.more_horiz))),
        const Text('Body'),
      ]),
    )));
    final node = tester.getSemantics(find.byType(LumoCard));
    final data = node.getSemanticsData();
    expect(data.flagsCollection.isButton, isTrue);
    expect(data.hasAction(SemanticsAction.tap), isTrue);
    expect(data.label, 'Open the Lumo project');
    // The name appears exactly once in the tree; the nested button and the header stay their own nodes under the card.
    expect(find.bySemanticsLabel('Open the Lumo project'), findsOneWidget);
    expect(find.bySemanticsLabel('Options'), findsOneWidget);
    expect(tester.getSemantics(find.text('Lumo project')), matchesSemantics(label: 'Lumo project', isHeader: true));
    await tester.tap(find.text('Body'));
    expect(taps, 1);
    final card = tester.getRect(find.byType(LumoCard));
    expect(tester.getCenter(find.bySemanticsLabel('Options')).dx > card.center.dx, isTrue, reason: 'inline end = right under en-US');
    semantics.dispose();
  });

  testWidgets('Card: variants take their colours from the scope; sunken has no border', (tester) async {
    await tester.pumpWidget(app('fa-IR', const Column(mainAxisSize: MainAxisSize.min, children: [
      LumoCard(child: Text('الف')),
      LumoCard(variant: LumoCardVariant.sunken, child: Text('ب')),
    ])));
    final c = LumoScope.of(tester.element(find.text('الف'))).colours;
    BoxDecoration deco(String t) => tester.widget<DecoratedBox>(find.ancestor(of: find.text(t), matching: find.byType(DecoratedBox)).first).decoration as BoxDecoration;
    expect(deco('الف').color, c.surface);
    expect(deco('الف').border, isNotNull);
    expect(deco('ب').color, c.surfaceSunken);
    expect(deco('ب').border, isNull);
    // A tappable card without a label is refused at construction.
    expect(() => LumoCard(onTap: () {}, child: const SizedBox()), throwsAssertionError);
  });

  testWidgets('Card: the press cross-fade collapses to zero under «reduce motion», and the press fill still lands', (tester) async {
    Widget scoped({required bool disableAnimations}) => MaterialApp(
          theme: lumoThemeData(brightness: Brightness.light),
          home: MediaQuery(
            data: MediaQueryData(disableAnimations: disableAnimations),
            child: LumoScope(
              locale: 'fa-IR',
              brightness: Brightness.light,
              child: Scaffold(body: LumoCard(label: 'باز کردن', onTap: () {}, child: const Text('بدنه'))),
            ),
          ),
        );

    // Motion on: the house's 80ms.
    await tester.pumpWidget(scoped(disableAnimations: false));
    expect(tester.widget<AnimatedContainer>(find.byType(AnimatedContainer)).duration, const Duration(milliseconds: 80));

    // Motion off: no duration at all — the fill swaps on the same frame.
    await tester.pumpWidget(scoped(disableAnimations: true));
    expect(tester.widget<AnimatedContainer>(find.byType(AnimatedContainer)).duration, Duration.zero);

    // The STATE is still there, only the tween is gone: pressing takes the
    // hover fill immediately rather than after 80ms.
    final c = LumoScope.of(tester.element(find.text('بدنه'))).colours;
    final gesture = await tester.startGesture(tester.getCenter(find.text('بدنه')));
    await tester.pump();
    expect(tester.widget<AnimatedContainer>(find.byType(AnimatedContainer)).decoration, isA<BoxDecoration>().having((d) => d.color, 'pressed fill', c.surfaceHover));
    await gesture.up();
    await tester.pump();
  });
}
