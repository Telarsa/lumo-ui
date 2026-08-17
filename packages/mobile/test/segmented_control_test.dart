// Semantics-tree tests for LumoSegmentedControl: the group named by `label`,
// each segment a button with its selected state, the pill at the reading START
// for the first segment (right under fa-IR, left under en-US) and travelling
// toward the reading END on selection, controlled and uncontrolled.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

const faSegments = [LumoSegment(id: 'list', label: 'فهرست'), LumoSegment(id: 'grid', label: 'شبکه'), LumoSegment(id: 'map', label: 'نقشه')];
const enSegments = [LumoSegment(id: 'list', label: 'List'), LumoSegment(id: 'grid', label: 'Grid'), LumoSegment(id: 'map', label: 'Map')];

/// The pill: the one FractionallySizedBox inside the AnimatedAlign.
Finder pill() => find.descendant(of: find.byType(AnimatedAlign), matching: find.byType(FractionallySizedBox));

void main() {
  testWidgets('SegmentedControl: the group is named by label (announced, not drawn); each segment a button with its selected state', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', SizedBox(width: 320, child: LumoSegmentedControl(label: 'نمای نتایج', segments: faSegments, defaultValue: 'grid', onChanged: (_) {}))));
    expect(find.bySemanticsLabel('نمای نتایج'), findsOneWidget);
    expect(find.text('نمای نتایج'), findsNothing);
    expect(tester.getSemantics(find.bySemanticsLabel('شبکه')), matchesSemantics(label: 'شبکه', isButton: true, hasSelectedState: true, isSelected: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getSemantics(find.bySemanticsLabel('فهرست')), matchesSemantics(label: 'فهرست', isButton: true, hasSelectedState: true, isSelected: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    // Each name appears ONCE in the tree.
    expect(find.bySemanticsLabel('شبکه'), findsOneWidget);
    expect(find.text('شبکه'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('SegmentedControl: the pill sits at the reading START for the first segment and travels toward the reading END — right→left under fa-IR, left→right under en-US', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final segments = rtl ? faSegments : enSegments;
      String? reported;
      await tester.pumpWidget(app(locale, SizedBox(width: 320, child: LumoSegmentedControl(key: ValueKey(locale), label: rtl ? 'نمای نتایج' : 'Results view', segments: segments, onChanged: (v) => reported = v))));
      await tester.pumpAndSettle();
      final track = tester.getRect(find.byType(AnimatedAlign));
      final atStart = tester.getCenter(pill()).dx;
      expect(rtl ? atStart > track.center.dx : atStart < track.center.dx, isTrue, reason: '$locale: the first segment (selected by default) sits at the reading start');
      // The first segment's TEXT is under the pill — the pill and the segments share the axis.
      expect((tester.getCenter(find.text(segments.first.label)).dx - atStart).abs() < 2, isTrue, reason: '$locale: the pill covers the first segment');

      await tester.tap(find.text(segments.last.label));
      await tester.pumpAndSettle();
      expect(reported, 'map');
      final atEnd = tester.getCenter(pill()).dx;
      expect(rtl ? atEnd < atStart : atEnd > atStart, isTrue, reason: '$locale: selecting the last segment moves the pill toward the reading end');
      expect(rtl ? atEnd < track.center.dx : atEnd > track.center.dx, isTrue);
      expect(tester.getSemantics(find.bySemanticsLabel(segments.last.label)).getSemanticsData().flagsCollection.isSelected, isTrue);
      expect(Directionality.of(tester.element(find.byType(LumoSegmentedControl))), rtl ? TextDirection.rtl : TextDirection.ltr);
    }
  });

  testWidgets('SegmentedControl: controlled stays where the parent says; disabled (group and one segment) has no tap', (tester) async {
    final semantics = tester.ensureSemantics();
    String? reported;
    await tester.pumpWidget(app('fa-IR', SizedBox(width: 320, child: LumoSegmentedControl(label: 'نمای نتایج', segments: faSegments, value: 'list', onChanged: (v) => reported = v))));
    await tester.tap(find.text('نقشه'));
    await tester.pumpAndSettle();
    expect(reported, 'map');
    expect(tester.getSemantics(find.bySemanticsLabel('فهرست')).getSemanticsData().flagsCollection.isSelected, isTrue, reason: 'controlled: the parent did not move it');

    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoSegmentedControl(label: 'نمای نتایج', segments: [LumoSegment(id: 'a', label: 'الف'), LumoSegment(id: 'b', label: 'ب', isDisabled: true)]))));
    final b = tester.getSemantics(find.bySemanticsLabel('ب')).getSemanticsData();
    expect(b.flagsCollection.isEnabled, isFalse);
    expect(b.hasAction(SemanticsAction.tap), isFalse);
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoSegmentedControl(label: 'نمای نتایج', isDisabled: true, segments: [LumoSegment(id: 'a', label: 'الف'), LumoSegment(id: 'b', label: 'ب')]))));
    expect(tester.getSemantics(find.bySemanticsLabel('الف')).getSemanticsData().hasAction(SemanticsAction.tap), isFalse);
    semantics.dispose();
  });

  testWidgets('SegmentedControl: an icon-only segment is still named by its label; sm size', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 240, child: LumoSegmentedControl(
      label: 'چیدمان',
      size: LumoSegmentedControlSize.sm,
      segments: [LumoSegment(id: 'list', label: 'فهرست', icon: Icon(Icons.view_list), iconOnly: true), LumoSegment(id: 'grid', label: 'شبکه', icon: Icon(Icons.grid_view), iconOnly: true)],
    ))));
    expect(find.bySemanticsLabel('فهرست'), findsOneWidget);
    expect(find.text('فهرست'), findsNothing);
    expect(tester.getSemantics(find.bySemanticsLabel('شبکه')).getSemanticsData().flagsCollection.isButton, isTrue);
    semantics.dispose();
  });

  testWidgets('SegmentedControl: fewer than two segments is a build error; an icon-only segment needs an icon', (tester) async {
    await tester.pumpWidget(app('fa-IR', const LumoSegmentedControl(label: 'x', segments: [LumoSegment(id: 'a', label: 'a')])));
    expect(tester.takeException(), isAssertionError);
    expect(() => LumoSegment(id: 'a', label: 'a', iconOnly: true), throwsAssertionError);
  });

  testWidgets('a narrow control sheds its padding instead of truncating the label', (tester) async {
    // The defect this pins: «نقشه» / «فهرست» rendering as «ن…» / «ف…» in a
    // filter row beside a search field (Khroos results screen, 17 Aug 2026).
    for (final width in [320.0, 240.0, 200.0]) {
      await tester.pumpWidget(app(
        'fa-IR',
        SizedBox(
          width: width,
          child: LumoSegmentedControl(
            label: 'نمای نتایج',
            segments: const [
              LumoSegment(id: 'list', label: 'فهرست', icon: Icon(Icons.list)),
              LumoSegment(id: 'map', label: 'نقشه', icon: Icon(Icons.map)),
            ],
            value: 'list',
            onChanged: (_) {},
          ),
        ),
      ));
      for (final label in ['فهرست', 'نقشه']) {
        final paragraph = tester.renderObject<RenderParagraph>(find.text(label));
        expect(paragraph.didExceedMaxLines, isFalse, reason: '«$label» must render whole at ${width}px, not ellipsize');
      }
    }
  });
  testWidgets('SegmentedControl: a segment FILLS the track — it was 175x20 top-aligned inside a 32-tall control, so the labels rode high and two thirds of the pill was dead', (tester) async {
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 360, child: LumoSegmentedControl(label: 'نمای نتایج', segments: faSegments))));
    final track = tester.getRect(pill());
    for (final s in faSegments) {
      final seg = tester.getRect(find.ancestor(of: find.text(s.label), matching: find.byType(InkWell)).first);
      expect(seg.height, 32.0, reason: '${s.label}: as tall as the md track');
      expect(seg.top, track.top, reason: '${s.label}: flush with the pill, not floating above it');
      expect(seg.bottom, track.bottom, reason: '${s.label}: no dead track under the label');
    }
  });

  testWidgets('SegmentedControl: under disableAnimations the pill ARRIVES at the new segment in ONE frame', (tester) async {
    Widget build(String value, bool reduce) => MaterialApp(
          theme: lumoThemeData(brightness: Brightness.light),
          home: MediaQuery(
            data: MediaQueryData(disableAnimations: reduce),
            child: LumoScope(locale: 'fa-IR', brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(
              width: 360,
              child: LumoSegmentedControl(label: 'نمای نتایج', segments: faSegments, value: value),
            )))),
          ),
        );

    // The end state, measured.
    await tester.pumpWidget(build('map', true));
    await tester.pumpAndSettle();
    final end = tester.getRect(pill());

    // Sanity: WITH motion, one frame after the change the pill is still travelling.
    await tester.pumpWidget(build('list', false));
    await tester.pumpAndSettle();
    await tester.pumpWidget(build('map', false));
    await tester.pump();
    expect(tester.getRect(pill()).left, isNot(end.left));
    await tester.pumpAndSettle();

    // Under «Reduce motion»: the pill is at the new segment on the next frame.
    await tester.pumpWidget(build('list', true));
    await tester.pumpAndSettle();
    await tester.pumpWidget(build('map', true));
    await tester.pump();
    expect(tester.getRect(pill()), end);
  });

}
