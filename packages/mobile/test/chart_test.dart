// Semantics-tree tests for the chart family: the chart named by `label` and
// valued by `summary`, EVERY data point its own child node announcing
// «label: valueLabel», the category axis starting at the reading start (first
// category RIGHT under fa-IR, LEFT under en-US), the empty state, and
// reduce-motion painting the finished chart on frame one.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {bool disableAnimations = false}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: MediaQuery(
          data: MediaQueryData(disableAnimations: disableAnimations),
          child: Scaffold(body: Center(child: SizedBox(width: 360, child: child))),
        ),
      ),
    );

const faDays = [
  LumoChartPoint(label: 'شنبه', value: 120, valueLabel: '۱۲۰'),
  LumoChartPoint(label: 'یکشنبه', value: 60, valueLabel: '۶۰'),
  LumoChartPoint(label: 'دوشنبه', value: 180, valueLabel: '۱۸۰'),
];

const enDays = [
  LumoChartPoint(label: 'Sat', value: 120, valueLabel: '120'),
  LumoChartPoint(label: 'Sun', value: 60, valueLabel: '60'),
  LumoChartPoint(label: 'Mon', value: 180, valueLabel: '180'),
];

void main() {
  testWidgets('BarChart: the chart is ONE named node carrying the summary, and every point is a child node announcing «label: valueLabel»', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoBarChart(
      label: 'بازدید روزانه',
      summary: 'بیشترین بازدید در دوشنبه',
      emptyLabel: 'داده‌ای ثبت نشده است.',
      data: faDays,
    )));
    await tester.pumpAndSettle();

    final chart = tester.getSemantics(find.byType(LumoBarChart)).getSemanticsData();
    expect(chart.label, 'بازدید روزانه');
    expect(chart.value, 'بیشترین بازدید در دوشنبه', reason: 'the summary is the chart node\'s value');
    // The name is announced exactly once, and is not drawn (the app draws its own heading).
    expect(find.bySemanticsLabel('بازدید روزانه'), findsOneWidget);
    expect(find.text('بازدید روزانه'), findsNothing);

    // A screen-reader user can walk the whole series without seeing it.
    for (final p in faDays) {
      expect(find.bySemanticsLabel('${p.label}: ${p.valueLabel}'), findsOneWidget, reason: '${p.label} is its own node');
    }
    semantics.dispose();
  });

  testWidgets('BarChart: the category axis starts at the reading start — first category RIGHT under fa-IR, LEFT under en-US', (tester) async {
    final semantics = tester.ensureSemantics();
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final data = rtl ? faDays : enDays;
      await tester.pumpWidget(app(locale, LumoBarChart(
        key: ValueKey(locale),
        label: rtl ? 'بازدید روزانه' : 'Daily views',
        emptyLabel: rtl ? 'داده‌ای ثبت نشده است.' : 'No data yet.',
        data: data,
      )));
      await tester.pumpAndSettle();

      final plot = tester.getRect(find.byType(LumoBarChart));
      final first = tester.getCenter(find.bySemanticsLabel('${data.first.label}: ${data.first.valueLabel}')).dx;
      final last = tester.getCenter(find.bySemanticsLabel('${data.last.label}: ${data.last.valueLabel}')).dx;
      expect(rtl ? first > plot.center.dx : first < plot.center.dx, isTrue, reason: '$locale: the FIRST category sits at the reading start');
      expect(rtl ? first > last : first < last, isTrue, reason: '$locale: the axis runs from the reading start toward the reading end');
      expect(Directionality.of(tester.element(find.byType(LumoBarChart))), rtl ? TextDirection.rtl : TextDirection.ltr);
    }
    semantics.dispose();
  });

  testWidgets('BarChart: bar heights are proportional; a horizontal chart grows from the inline START (right under fa-IR, left under en-US)', (tester) async {
    // Vertical: the tallest value is the tallest bar.
    await tester.pumpWidget(app('fa-IR', const LumoBarChart(label: 'بازدید روزانه', emptyLabel: 'خالی', data: faDays, plotHeight: 100)));
    await tester.pumpAndSettle();
    double barHeight(String label) => tester.getRect(find.descendant(of: find.bySemanticsLabel(label), matching: find.byType(Container)).first).height;
    expect(barHeight('دوشنبه: ۱۸۰'), moreOrLessEquals(100, epsilon: 0.5), reason: 'the largest value fills the plot');
    expect(barHeight('یکشنبه: ۶۰'), moreOrLessEquals(100 * 60 / 180, epsilon: 0.5));

    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final data = rtl ? faDays : enDays;
      await tester.pumpWidget(app(locale, LumoBarChart(
        key: ValueKey('h$locale'),
        label: rtl ? 'پرتقاضاترین خدمات' : 'Top services',
        emptyLabel: rtl ? 'خالی' : 'Empty',
        orientation: LumoBarChartOrientation.horizontal,
        data: data,
      )));
      await tester.pumpAndSettle();
      final row = find.bySemanticsLabel('${data.first.label}: ${data.first.valueLabel}');
      final track = tester.getRect(find.descendant(of: row, matching: find.byType(ClipRRect)).first);
      final fill = tester.getRect(find.descendant(of: row, matching: find.byType(FractionallySizedBox)).first);
      expect(rtl ? (fill.right - track.right).abs() < 0.5 : (fill.left - track.left).abs() < 0.5, isTrue,
          reason: '$locale: the fill is anchored to the inline start');
      expect(fill.width < track.width, isTrue, reason: '$locale: a value below the max does not fill the track');
      // Categories run down the BLOCK axis, which does not mirror.
      final second = tester.getCenter(find.bySemanticsLabel('${data[1].label}: ${data[1].valueLabel}'));
      expect(second.dy > tester.getCenter(row).dy, isTrue, reason: '$locale: the second row is below the first in both directions');
    }
  });

  testWidgets('BarChart: the empty state is announced as the chart\'s value AND drawn once; no point nodes exist', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoBarChart(
      label: 'بازدید روزانه',
      emptyLabel: 'هنوز داده‌ای برای این بازه ثبت نشده است.',
      data: [],
    )));
    final chart = tester.getSemantics(find.byType(LumoBarChart)).getSemanticsData();
    expect(chart.label, 'بازدید روزانه');
    expect(chart.value, 'هنوز داده‌ای برای این بازه ثبت نشده است.');
    // Announced once (from the chart node), drawn once — not announced twice.
    expect(find.bySemanticsLabel('هنوز داده‌ای برای این بازه ثبت نشده است.'), findsNothing);
    expect(find.text('هنوز داده‌ای برای این بازه ثبت نشده است.'), findsOneWidget);
    expect(find.bySemanticsLabel('شنبه: ۱۲۰'), findsNothing);
    semantics.dispose();
  });

  testWidgets('BarChart: bars GROW on first paint, and under reduce motion the finished chart is what frame one paints', (tester) async {
    // Motion on: at frame one the bar has not grown yet.
    await tester.pumpWidget(app('fa-IR', const LumoBarChart(label: 'بازدید روزانه', emptyLabel: 'خالی', data: faDays, plotHeight: 100)));
    double tallest() => tester.getRect(find.descendant(of: find.bySemanticsLabel('دوشنبه: ۱۸۰'), matching: find.byType(Container)).first).height;
    expect(tallest() < 1, isTrue, reason: 'frame one: nothing has grown yet');
    await tester.pump(const Duration(milliseconds: 200));
    final midway = tallest();
    expect(midway > 0 && midway < 100, isTrue, reason: 'the bar is on its way up');
    await tester.pumpAndSettle();
    expect(tallest(), moreOrLessEquals(100, epsilon: 0.5));

    // Reduce motion: no animation AT ALL — frame one is the final state.
    await tester.pumpWidget(app('fa-IR', const LumoBarChart(key: ValueKey('rm'), label: 'بازدید روزانه', emptyLabel: 'خالی', data: faDays, plotHeight: 100), disableAnimations: true));
    expect(tallest(), moreOrLessEquals(100, epsilon: 0.5), reason: 'reduce motion is total: the chart is finished on the first frame');
  });

  testWidgets('BarChart: a stacked point draws its part inside the bar; tones come from the scheme', (tester) async {
    await tester.pumpWidget(app('fa-IR', const LumoBarChart(
      label: 'بازدید و سرنخ روزانه',
      emptyLabel: 'خالی',
      plotHeight: 100,
      partTone: LumoChartTone.positive,
      data: [LumoChartPoint(label: 'شنبه', value: 120, partValue: 30, valueLabel: '۱۲۰ بازدید · ۳۰ سرنخ')],
    )));
    await tester.pumpAndSettle();
    final row = find.bySemanticsLabel('شنبه: ۱۲۰ بازدید · ۳۰ سرنخ');
    final whole = tester.getRect(find.descendant(of: row, matching: find.byType(Container)).first);
    final part = tester.getRect(find.descendant(of: row, matching: find.byType(FractionallySizedBox)).first);
    expect(part.height, moreOrLessEquals(whole.height * 30 / 120, epsilon: 0.5));
    expect((part.bottom - whole.bottom).abs() < 0.5, isTrue, reason: 'the part is stacked from the baseline');

    final c = LumoScope.of(tester.element(find.byType(LumoBarChart))).colours;
    expect(lumoChartToneColour(LumoChartTone.positive, c), c.positive);
    expect(lumoChartToneColour(LumoChartTone.neutral, c), c.fgMuted, reason: 'the fifth tone is fgMuted, never an invented colour');
    expect(lumoChartSeriesTones.length, 5, reason: 'five tones and no sixth');
  });

  testWidgets('LineChart: every point is a node in reading order — first point RIGHT under fa-IR, LEFT under en-US', (tester) async {
    final semantics = tester.ensureSemantics();
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final data = rtl ? faDays : enDays;
      await tester.pumpWidget(app(locale, LumoLineChart(
        key: ValueKey(locale),
        label: rtl ? 'روند بازدید' : 'View trend',
        summary: rtl ? 'روند رو به بالا' : 'Trending up',
        emptyLabel: rtl ? 'خالی' : 'Empty',
        series: [LumoChartSeries(label: rtl ? 'بازدید' : 'Views', points: data)],
      )));
      await tester.pumpAndSettle();

      final chart = tester.getSemantics(find.byType(LumoLineChart)).getSemanticsData();
      expect(chart.label, rtl ? 'روند بازدید' : 'View trend');
      expect(chart.value, rtl ? 'روند رو به بالا' : 'Trending up');
      for (final p in data) {
        expect(find.bySemanticsLabel('${p.label}: ${p.valueLabel}'), findsOneWidget);
      }
      final first = tester.getCenter(find.bySemanticsLabel('${data.first.label}: ${data.first.valueLabel}')).dx;
      final last = tester.getCenter(find.bySemanticsLabel('${data.last.label}: ${data.last.valueLabel}')).dx;
      expect(rtl ? first > last : first < last, isTrue, reason: '$locale: the value axis runs from the reading start');
    }
    semantics.dispose();
  });

  testWidgets('LineChart: a second series becomes a NAMED group above its own points; a sixth series is refused', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoLineChart(
      label: 'روند',
      emptyLabel: 'خالی',
      series: [
        LumoChartSeries(label: 'بازدید', points: faDays),
        LumoChartSeries(label: 'سرنخ', points: [LumoChartPoint(label: 'شنبه', value: 10, valueLabel: '۱۰')]),
      ],
    )));
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('بازدید'), findsOneWidget, reason: 'the series is named before its figures');
    expect(find.bySemanticsLabel('سرنخ'), findsOneWidget);
    expect(find.bySemanticsLabel('شنبه: ۱۰'), findsOneWidget);

    // Six series is refused rather than given a colour the scheme does not own.
    // The check lives in build(), not the const constructor: `List.length` is
    // not a constant expression, and an assert that reads it makes every
    // `const LumoLineChart(...)` call site a compile error. So the refusal is
    // observed by BUILDING the chart, not by constructing it.
    await tester.pumpWidget(app('fa-IR', LumoLineChart(
      label: 'روند',
      emptyLabel: 'خالی',
      series: [for (var i = 0; i < 6; i++) LumoChartSeries(label: 'خط $i', points: faDays)],
    )));
    expect(tester.takeException(), isAssertionError);
    semantics.dispose();
  });

  testWidgets('LineChart + Sparkline: empty announces emptyLabel; the sparkline keeps every point a node', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoLineChart(label: 'روند', emptyLabel: 'داده‌ای نیست.', series: [])));
    expect(tester.getSemantics(find.byType(LumoLineChart)).getSemanticsData().value, 'داده‌ای نیست.');

    await tester.pumpWidget(app('fa-IR', const LumoSparkline(label: 'روند هفتگی', summary: 'رو به بالا', emptyLabel: 'داده‌ای نیست.', data: faDays)));
    await tester.pumpAndSettle();
    final spark = tester.getSemantics(find.byType(LumoSparkline)).getSemanticsData();
    expect(spark.label, 'روند هفتگی');
    expect(spark.value, 'رو به بالا');
    for (final p in faDays) {
      expect(find.bySemanticsLabel('${p.label}: ${p.valueLabel}'), findsOneWidget, reason: 'compact in pixels, not in the semantics tree');
    }
    semantics.dispose();
  });

  testWidgets('DonutChart: the ring is excluded and the legend IS the series — one named node per slice, selectable', (tester) async {
    final semantics = tester.ensureSemantics();
    int? picked;
    await tester.pumpWidget(app('fa-IR', LumoDonutChart(
      label: 'سرنخ از کدام مناطق',
      summary: 'بیشترین سرنخ از سعادت‌آباد',
      emptyLabel: 'داده‌ای نیست.',
      centreValueLabel: '۱۲۴',
      centreLabel: 'سرنخ',
      selectedIndex: 1,
      onSelected: (i) => picked = i,
      data: const [
        LumoChartPoint(label: 'سعادت‌آباد', value: 60, valueLabel: '۶۰', shareLabel: '۴۸٪'),
        LumoChartPoint(label: 'پونک', value: 40, valueLabel: '۴۰', shareLabel: '۳۲٪'),
        LumoChartPoint(label: 'مرزداران', value: 24, valueLabel: '۲۴', shareLabel: '۲۰٪'),
      ],
    )));
    await tester.pumpAndSettle();

    final chart = tester.getSemantics(find.byType(LumoDonutChart)).getSemanticsData();
    expect(chart.label, 'سرنخ از کدام مناطق');
    expect(chart.value, 'بیشترین سرنخ از سعادت‌آباد');

    final slice = tester.getSemantics(find.bySemanticsLabel('پونک: ۴۰')).getSemanticsData();
    expect(slice.flagsCollection.isButton, isTrue);
    expect(slice.flagsCollection.hasSelectedState, isTrue);
    expect(slice.flagsCollection.isSelected, isTrue, reason: 'selectedIndex 1 is پونک');
    expect(slice.hasAction(SemanticsAction.tap), isTrue);
    expect(tester.getSemantics(find.bySemanticsLabel('سعادت‌آباد: ۶۰')).getSemanticsData().flagsCollection.isSelected, isFalse);

    // The centre shows the SELECTED slice's share, the legend its count.
    expect(find.text('۳۲٪'), findsOneWidget);
    expect(find.text('۱۲۴'), findsNothing, reason: 'the total gives way while a slice is selected');
    expect(find.text('۴۰'), findsOneWidget, reason: 'the legend keeps the count');

    // Tapping the selected slice clears it.
    await tester.tap(find.bySemanticsLabel('پونک: ۴۰'));
    expect(picked, isNull);
    await tester.tap(find.bySemanticsLabel('مرزداران: ۲۴'));
    expect(picked, 2);
    semantics.dispose();
  });

  testWidgets('DonutChart: a static donut announces no selection state; empty announces emptyLabel; a sixth slice is refused', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoDonutChart(
      label: 'Leads by zone',
      emptyLabel: 'No data yet.',
      data: [LumoChartPoint(label: 'North', value: 3, valueLabel: '3')],
    )));
    await tester.pumpAndSettle();
    final slice = tester.getSemantics(find.bySemanticsLabel('North: 3')).getSemanticsData();
    expect(slice.flagsCollection.hasSelectedState, isFalse, reason: 'no onSelected: nothing is selectable, so no state is announced');
    expect(slice.hasAction(SemanticsAction.tap), isFalse);

    await tester.pumpWidget(app('en-US', LumoDonutChart(label: 'Leads by zone', emptyLabel: 'No data yet.', data: [])));
    expect(tester.getSemantics(find.byType(LumoDonutChart)).getSemanticsData().value, 'No data yet.');

    // Asserted in build(), not the const constructor — see the note in the
    // LineChart test above.
    await tester.pumpWidget(app('en-US', LumoDonutChart(
      label: 'Leads by zone',
      emptyLabel: 'No data yet.',
      data: [for (var i = 0; i < 6; i++) LumoChartPoint(label: 'Zone $i', value: 1, valueLabel: '1')],
    )));
    expect(tester.takeException(), isAssertionError);
    semantics.dispose();
  });

  testWidgets('BarChart: a cramped chart sheds its drawn category labels rather than truncating a word — the names stay in the semantics tree', (tester) async {
    final semantics = tester.ensureSemantics();
    const many = [
      LumoChartPoint(label: 'شنبهٔ اول ماه', value: 1, valueLabel: '۱'),
      LumoChartPoint(label: 'یکشنبهٔ دوم ماه', value: 2, valueLabel: '۲'),
      LumoChartPoint(label: 'دوشنبهٔ سوم ماه', value: 3, valueLabel: '۳'),
      LumoChartPoint(label: 'سه‌شنبهٔ چهارم ماه', value: 4, valueLabel: '۴'),
      LumoChartPoint(label: 'چهارشنبهٔ پنجم ماه', value: 5, valueLabel: '۵'),
    ];
    await tester.pumpWidget(MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: const LumoScope(
        locale: 'fa-IR',
        brightness: Brightness.light,
        child: Scaffold(body: Center(child: SizedBox(width: 120, child: LumoBarChart(label: 'بازدید', emptyLabel: 'خالی', data: many)))),
      ),
    ));
    await tester.pumpAndSettle();
    expect(find.text('شنبهٔ اول ماه'), findsNothing, reason: 'the drawn axis is decoration and is dropped before a word is cut');
    expect(find.bySemanticsLabel('شنبهٔ اول ماه: ۱'), findsOneWidget, reason: 'the name was never at risk — it is in the semantics tree');

    // With room, the labels are drawn.
    await tester.pumpWidget(app('fa-IR', const LumoBarChart(key: ValueKey('wide'), label: 'بازدید', emptyLabel: 'خالی', data: faDays)));
    await tester.pumpAndSettle();
    expect(find.text('شنبه'), findsOneWidget);
    semantics.dispose();
  });
}
