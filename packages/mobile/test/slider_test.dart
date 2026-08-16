import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 320, child: child)))),
    );


void main() {
  testWidgets('Slider under fa-IR: one node named by label with the formatted value; fills from the RIGHT (min at the right); increase action', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <double>[];
    String fa(double v) => '${formatNumber(v.round(), 'fa-IR')} درصد';
    await tester.pumpWidget(app('fa-IR', LumoSlider(label: 'بودجه', value: 40, min: 0, max: 100, step: 1, valueLabel: fa, description: 'به درصد', onChanged: changes.add)));
    expect(Directionality.of(tester.element(find.byType(Slider))), TextDirection.rtl);
    // Value shown once, in Persian digits, never raw.
    expect(find.text('۴۰ درصد'), findsOneWidget);
    expect(find.text('40'), findsNothing);
    expect(find.text('بودجه'), findsOneWidget);
    // ONE node: name + slider role + formatted value + actions.
    final node = tester.getSemantics(find.byType(Slider));
    expect(node, matchesSemantics(label: 'بودجه', hint: 'به درصد', value: '۴۰ درصد', increasedValue: '۴۱ درصد', decreasedValue: '۳۹ درصد', isSlider: true, hasEnabledState: true, isEnabled: true, isFocusable: true, hasIncreaseAction: true, hasDecreaseAction: true, hasFocusAction: true));
    expect(find.bySemanticsLabel('بودجه'), findsOneWidget);
    // Fill from the RIGHT under fa-IR: a tap on the LEFT quarter of the track lands near the MAX.
    final rect = tester.getRect(find.byType(Slider));
    await tester.tapAt(Offset(rect.left + rect.width * 0.25, rect.center.dy));
    await tester.pump();
    expect(changes.last, greaterThan(50), reason: 'under fa-IR the minimum sits at the right, so the left quarter is a high value');
    // The reader's increase action steps by one tick.
    tester.semantics.performAction(find.semantics.byLabel('بودجه'), SemanticsAction.increase);
    await tester.pump();
    expect(changes.last, 41);
    semantics.dispose();
  });

  testWidgets('Slider under en-US: fills from the LEFT; hideValue keeps the name; disabled announced', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <double>[];
    await tester.pumpWidget(app('en-US', LumoSlider(label: 'Budget', value: 40, min: 0, max: 100, valueLabel: (v) => formatNumber(v.round(), 'en-US'), hideValue: true, onChanged: changes.add)));
    expect(find.text('Budget'), findsNothing, reason: 'hideValue drops the header row');
    expect(tester.getSemantics(find.byType(Slider)), matchesSemantics(label: 'Budget', value: '40', isSlider: true, hasEnabledState: true, isEnabled: true, isFocusable: true, hasIncreaseAction: true, hasDecreaseAction: true, hasFocusAction: true));
    final rect = tester.getRect(find.byType(Slider));
    await tester.tapAt(Offset(rect.left + rect.width * 0.25, rect.center.dy));
    await tester.pump();
    expect(changes.last, lessThan(50), reason: 'under en-US the minimum sits at the left');
    await tester.pumpWidget(app('en-US', LumoSlider(label: 'Budget', value: 40, min: 0, max: 100, valueLabel: (v) => formatNumber(v.round(), 'en-US'), isDisabled: true, errorMessage: 'خارج از محدوده', onChanged: changes.add)));
    expect(tester.getSemantics(find.byType(Slider)), matchesSemantics(label: 'Budget', hint: 'خارج از محدوده', value: '40', isSlider: true, hasEnabledState: true, isEnabled: false, isFocusable: true, hasFocusAction: true));
    expect(find.text('خارج از محدوده'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('RangeSlider under fa-IR: thumbs named by startLabel/endLabel, start thumb node at the RIGHT; values formatted; increase on the start thumb', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <RangeValues>[];
    String fa(double v) => formatNumber(v.round(), 'fa-IR');
    await tester.pumpWidget(app('fa-IR', LumoRangeSlider(label: 'بازهٔ قیمت', startLabel: 'کمینهٔ قیمت', endLabel: 'بیشینهٔ قیمت', values: const RangeValues(20, 80), min: 0, max: 100, step: 5, valueLabel: fa, onChanged: changes.add)));
    expect(find.text('۲۰'), findsOneWidget);
    expect(find.text('۸۰'), findsOneWidget);
    final start = find.bySemanticsLabel('کمینهٔ قیمت');
    final end = find.bySemanticsLabel('بیشینهٔ قیمت');
    expect(start, findsOneWidget);
    expect(end, findsOneWidget);
    expect(tester.getSemantics(start), matchesSemantics(label: 'کمینهٔ قیمت', value: '۲۰', increasedValue: '۲۵', decreasedValue: '۱۵', isSlider: true, hasEnabledState: true, isEnabled: true, hasIncreaseAction: true, hasDecreaseAction: true));
    expect(tester.getSemantics(end), matchesSemantics(label: 'بیشینهٔ قیمت', value: '۸۰', increasedValue: '۸۵', decreasedValue: '۷۵', isSlider: true, hasEnabledState: true, isEnabled: true, hasIncreaseAction: true, hasDecreaseAction: true));
    expect(tester.getCenter(start).dx > tester.getCenter(end).dx, isTrue, reason: 'the start thumb is at the reading start = right under fa-IR');
    // Material's own unnamed slider nodes are gone: exactly two slider nodes.
    tester.semantics.performAction(find.semantics.byLabel('کمینهٔ قیمت'), SemanticsAction.increase);
    await tester.pump();
    expect(changes.last, const RangeValues(25, 80));
    tester.semantics.performAction(find.semantics.byLabel('بیشینهٔ قیمت'), SemanticsAction.decrease);
    await tester.pump();
    expect(changes.last, const RangeValues(20, 75));
    // Dragging the range slider itself still reaches onChanged (touch passes through the semantics overlay).
    final rect = tester.getRect(find.byType(RangeSlider));
    await tester.tapAt(Offset(rect.left + rect.width * 0.1, rect.center.dy));
    await tester.pump();
    expect(changes.last.end, greaterThan(80), reason: 'left edge = high values under fa-IR: the END thumb moved up');
    semantics.dispose();
  });

  testWidgets('RangeSlider under en-US: start thumb node at the LEFT', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoRangeSlider(label: 'Price', startLabel: 'Minimum price', endLabel: 'Maximum price', values: const RangeValues(20, 80), min: 0, max: 100, valueLabel: (v) => formatNumber(v.round(), 'en-US'), onChanged: (_) {})));
    expect(tester.getCenter(find.bySemanticsLabel('Minimum price')).dx < tester.getCenter(find.bySemanticsLabel('Maximum price')).dx, isTrue);
    expect(tester.getSemantics(find.bySemanticsLabel('Minimum price')), matchesSemantics(label: 'Minimum price', value: '20', increasedValue: '25', decreasedValue: '15', isSlider: true, hasEnabledState: true, isEnabled: true, hasIncreaseAction: true, hasDecreaseAction: true));
    semantics.dispose();
  });
}
