// Semantics-tree tests for LumoDescriptionList: the block named by `label`,
// each pair ONE node reading term then value, the term at the reading start and
// the value at the reading end for `inline`, the value under the term for
// `stacked`, and a drawn value that still announces words.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

void main() {
  testWidgets('DescriptionList: the block is named by `label` (announced, not drawn); each pair is ONE node reading term then value', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoDescriptionList(
      label: 'جزئیات صورتحساب',
      entries: [
        LumoDescription(term: 'احراز هویت', value: '۲۵۰٬۰۰۰ تومان'),
        LumoDescription(term: 'جمع پرداخت', value: '۵۰۰٬۰۰۰ تومان'),
      ],
    )));
    expect(find.bySemanticsLabel('جزئیات صورتحساب'), findsOneWidget);
    expect(find.text('جزئیات صورتحساب'), findsNothing);
    // One merged node per pair: the term and the value are heard together.
    final pair = tester.getSemantics(find.text('احراز هویت')).getSemanticsData();
    expect(pair.label, 'احراز هویت\n۲۵۰٬۰۰۰ تومان');
    expect(tester.getSemantics(find.text('جمع پرداخت')).getSemanticsData().label, 'جمع پرداخت\n۵۰۰٬۰۰۰ تومان');
    // Each string is drawn exactly once.
    expect(find.text('۲۵۰٬۰۰۰ تومان'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('DescriptionList: inline puts the term at the reading START and the value at the reading END — right/left under fa-IR, left/right under en-US', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final term = rtl ? 'جمع پرداخت' : 'Total';
      final value = rtl ? '۵۰۰٬۰۰۰ تومان' : '500,000 Toman';
      await tester.pumpWidget(app(locale, LumoDescriptionList(
        key: ValueKey(locale),
        label: rtl ? 'جزئیات' : 'Details',
        entries: [LumoDescription(term: term, value: value)],
      )));
      final block = tester.getRect(find.byType(LumoDescriptionList));
      expect(tester.getCenter(find.text(term)).dx > block.center.dx, rtl, reason: '$locale: the term starts at the reading start');
      expect(tester.getCenter(find.text(value)).dx < block.center.dx, rtl, reason: '$locale: the value hangs off the reading end');
      // Never a physical alignment: the value resolves its own alignment against direction.
      expect(tester.widget<Text>(find.text(value)).textAlign, TextAlign.end);
    }
  });

  testWidgets('DescriptionList: stacked puts the value UNDER the term, and the pair still reads as one node', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoDescriptionList(
      label: 'مشخصات',
      orientation: LumoDescriptionListOrientation.stacked,
      size: LumoDescriptionListSize.sm,
      entries: [LumoDescription(term: 'تخصص', value: 'تعمیر کولر گازی')],
    )));
    expect(tester.getCenter(find.text('تعمیر کولر گازی')).dy > tester.getCenter(find.text('تخصص')).dy, isTrue);
    expect(tester.getSemantics(find.text('تخصص')).getSemanticsData().label, 'تخصص\nتعمیر کولر گازی');
    // The stacked value starts at the reading start, it does not hang off the end.
    expect(tester.widget<Text>(find.text('تعمیر کولر گازی')).textAlign, TextAlign.start);
    // The `sm` step is denser than `md`, which IS the web's `text-sm` scale.
    expect(tester.widget<Text>(find.text('تخصص')).style!.fontSize, 13);
    semantics.dispose();
  });

  testWidgets('DescriptionList: a DRAWN value is silent; the required `value` is what is announced', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoDescriptionList(
      label: 'وضعیت',
      entries: [
        LumoDescription.widget(term: 'احراز', value: 'تأییدشده', child: LumoBadge(label: 'تأیید')),
      ],
    )));
    // The badge's own text is excluded; the pair reads term then the announced words.
    expect(tester.getSemantics(find.text('احراز')).getSemanticsData().label, 'احراز\nتأییدشده');
    expect(find.text('تأیید'), findsOneWidget);
    expect(find.text('تأییدشده'), findsNothing);
    semantics.dispose();
  });

  testWidgets('DescriptionList: colours come from the scope (term muted, value fg)', (tester) async {
    await tester.pumpWidget(app('en-US', const LumoDescriptionList(
      label: 'Details',
      entries: [LumoDescription(term: 'Response time', value: 'Under 2 hours')],
    )));
    final c = LumoScope.of(tester.element(find.text('Response time'))).colours;
    expect(tester.widget<Text>(find.text('Response time')).style!.color, c.fgMuted);
    expect(tester.widget<Text>(find.text('Under 2 hours')).style!.color, c.fg);
  });
}
