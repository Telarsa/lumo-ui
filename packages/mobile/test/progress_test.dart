import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 300, child: child)))),
    );

void main() {
  testWidgets('Progress: named by label, the formatted value is the semantics value (once), fill grows from the reading START (right under fa-IR)', (tester) async {
    final semantics = tester.ensureSemantics();
    final value = '${formatNumber(45, 'fa-IR')}٪';
    await tester.pumpWidget(app('fa-IR', LumoProgress(label: 'بارگذاری پرونده', value: 0.45, valueLabel: value, showValue: true)));
    await tester.pumpAndSettle();
    expect(Directionality.of(tester.element(find.byType(LumoProgress))), TextDirection.rtl);
    expect(tester.getSemantics(find.byType(LumoProgress)), matchesSemantics(label: 'بارگذاری پرونده', value: '۴۵٪'));
    // Seen and announced are the same string; the visible copies are excluded so it is announced ONCE.
    expect(find.text('۴۵٪'), findsOneWidget);
    expect(find.bySemanticsLabel('بارگذاری پرونده'), findsOneWidget);
    final track = tester.getRect(find.byType(ClipRRect));
    final fill = tester.getRect(find.byType(AnimatedFractionallySizedBox));
    expect(fill.width, closeTo(track.width * 0.45, 1));
    expect(fill.right, closeTo(track.right, 0.5), reason: 'the fill starts at the right under fa-IR');
    // The label sits at the start (right), the value at the end (left).
    expect(tester.getCenter(find.text('بارگذاری پرونده')).dx > tester.getCenter(find.text('۴۵٪')).dx, isTrue);
    semantics.dispose();
  });

  testWidgets('Progress: en-US fill from the left; indeterminate = full-width pulse, no value; tone colours from the scope', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoProgress(label: 'Uploading', value: 0.25, valueLabel: '25%', tone: LumoProgressTone.positive)));
    await tester.pumpAndSettle();
    final track = tester.getRect(find.byType(ClipRRect));
    final fill = tester.getRect(find.byType(AnimatedFractionallySizedBox));
    expect(fill.left, closeTo(track.left, 0.5));
    expect(fill.width, closeTo(track.width * 0.25, 1));
    final c = LumoScope.of(tester.element(find.byType(LumoProgress))).colours;
    expect((tester.widget<DecoratedBox>(find.descendant(of: find.byType(AnimatedFractionallySizedBox), matching: find.byType(DecoratedBox))).decoration as BoxDecoration).color, c.positive);
    await tester.pumpWidget(app('en-US', const LumoProgress(label: 'Uploading', value: null)));
    await tester.pump();
    expect(tester.getSemantics(find.byType(LumoProgress)), matchesSemantics(label: 'Uploading'));
    expect(find.byType(AnimatedFractionallySizedBox), findsNothing);
    final fade = find.byType(FadeTransition);
    final o0 = tester.widget<FadeTransition>(fade).opacity.value;
    await tester.pump(const Duration(milliseconds: 500));
    expect(tester.widget<FadeTransition>(fade).opacity.value == o0, isFalse, reason: 'the indeterminate bar pulses');
    semantics.dispose();
  });

  testWidgets('Spinner: a live region named by label, announced once, ring sized to the scale; showLabel shows the same string', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoSpinner(label: 'در حال بارگذاری…', showLabel: true, size: LumoSpinnerSize.lg)));
    expect(tester.getSemantics(find.byType(LumoSpinner)), matchesSemantics(label: 'در حال بارگذاری…', isLiveRegion: true));
    expect(find.bySemanticsLabel('در حال بارگذاری…'), findsOneWidget);
    expect(find.text('در حال بارگذاری…'), findsOneWidget);
    expect(tester.getSize(find.byType(CircularProgressIndicator)), const Size(32, 32));
    await tester.pumpWidget(app('en-US', const LumoSpinner(label: 'Loading')));
    expect(find.text('Loading'), findsNothing);
    expect(tester.getSemantics(find.byType(LumoSpinner)), matchesSemantics(label: 'Loading', isLiveRegion: true));
    expect(tester.getSize(find.byType(CircularProgressIndicator)), const Size(20, 20));
    semantics.dispose();
  });
}
