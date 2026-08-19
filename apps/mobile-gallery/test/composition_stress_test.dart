// COMPOSITION AND STRESS — the failures a gallery cannot show you.
//
// Every demo in this app is rendered once, in a comfortable stage, at one text
// size. That is how the rating bug survived 679 library tests and 120 demos:
// `LumoRating` wrapped itself in a `LayoutBuilder`, so it threw inside any
// parent that measures it — and nothing here had ever put it in one. A
// component library cannot discover its own composition failures; only a
// consumer composes. This file is the closest a library can get to being its
// own consumer.
//
// Three sweeps, each chosen because its signal is CLEAN — a failure is a defect
// rather than a judgement call:
//
//   1. TEXT SCALE. iOS Dynamic Type and Android font size go far past 2.0, and
//      a reader who needs them is not an edge case. An overflow here is a
//      defect, full stop. Nothing in this repo tested it before.
//   2. NARROW WIDTH. 320 dp is an iPhone SE. Overflow is invisible on the
//      simulator someone develops on and obvious to whoever holds the phone.
//   3. INTRINSICS. The rating-bug class. Restricted to demos with no Scrollable
//      in them, because `RenderViewport` legitimately refuses intrinsics — that
//      filter is what keeps this sweep's failures meaningful.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_mobile_gallery/demos/all.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

/// One case's outcome for one demo.
typedef Miss = ({String demo, String detail});

/// Wraps a demo in the app shell the library expects, with `frame` applied
/// between the shell and the demo so each sweep controls the constraints.
Widget staged(String id, Widget Function(Widget) frame, {TextScaler? scaler}) => MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: lumoThemeData(brightness: Brightness.light),
      builder: (context, child) => LumoScope(
        locale: 'fa-IR',
        brightness: Brightness.light,
        child: child ?? const SizedBox.shrink(),
      ),
      home: Builder(builder: (context) {
        final demo = Scaffold(
          body: SafeArea(child: Builder(builder: (c) => frame(lumoDemos[id]!(c)))),
        );
        return scaler == null
            ? demo
            : MediaQuery(
                data: MediaQuery.of(context).copyWith(textScaler: scaler),
                child: demo,
              );
      }),
    );

/// The demos that cannot report an intrinsic width, and WHY that is a floor
/// rather than a bug list.
///
/// Flutter's `LayoutBuilder` throws on any intrinsic query — it would have to
/// run the builder speculatively against a constraint it has not been given.
/// Nine families in this library legitimately need their incoming width to lay
/// themselves out (a badge sheds its icon before its words, a segmented control
/// divides the row, a toolbar decides what to overflow), and each one poisons
/// whatever composes it — which is why `card-2`, `item-2`, `description-list-2`
/// and `stack-1` are here: they hold a badge.
///
/// So this set may only SHRINK. A new entry means a family started depending on
/// its constraints, and that is a decision to make on purpose. `rating-2` is
/// the interactive rating and is expected: the read-only one was split out of
/// the builder precisely so a rating could sit in a table.
const kNoIntrinsicWidth = <String>{
  'badge-1', 'badge-2', 'card-2', 'description-list-2', 'file-upload-2', 'item-2',
  'message-1', 'message-2', 'navigation-bar-1', 'rating-2', 'segmented-control-1',
  'segmented-control-2', 'stack-1', 'steps-1', 'steps-2', 'toggle-3', 'toolbar-1',
};

void main() {
  final ids = lumoDemos.keys.toList()..sort();

  /// True when the demo contains a Scrollable — a viewport refuses intrinsics
  /// by design, so those cases are excluded rather than counted as defects.
  bool hasScrollable(WidgetTester tester) =>
      find.byType(Scrollable).evaluate().isNotEmpty;

  group('text scale 2.0 at 390 dp — a reader who needs large type', () {
    final misses = <Miss>[];
    for (final id in ids) {
      testWidgets(id, (tester) async {
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        await tester.pumpWidget(staged(
          id,
          (demo) => SingleChildScrollView(child: demo),
          scaler: const TextScaler.linear(2),
        ));
        await tester.pump(const Duration(milliseconds: 400));
        final error = tester.takeException();
        if (error != null) misses.add((demo: id, detail: '$error'.split('\n').first));
      });
    }
    tearDownAll(() {
      report('TEXT SCALE 2.0', misses, ids.length);
      // A hard zero. An overflow at 2x is a reader who cannot use the screen,
      // and there is no version of that which is acceptable-for-now.
      expect(misses, isEmpty, reason: 'demos that overflow at 2x text');
    });
  });

  group('320 dp — an iPhone SE, narrower than anything this ships to', () {
    final misses = <Miss>[];
    for (final id in ids) {
      testWidgets(id, (tester) async {
        await tester.binding.setSurfaceSize(const Size(320, 640));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        await tester.pumpWidget(staged(id, (demo) => SingleChildScrollView(child: demo)));
        await tester.pump(const Duration(milliseconds: 400));
        final error = tester.takeException();
        if (error != null) misses.add((demo: id, detail: '$error'.split('\n').first));
      });
    }
    tearDownAll(() {
      report('320 dp', misses, ids.length);
      expect(misses, isEmpty, reason: 'demos that overflow on a 320 dp phone');
    });
  });

  group('intrinsic width — a Table cell, an IntrinsicWidth, a Row sizing to content', () {
    final misses = <Miss>[];
    var examined = 0;
    for (final id in ids) {
      testWidgets(id, (tester) async {
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        // Rendered plainly first, only to ask whether it scrolls.
        await tester.pumpWidget(staged(id, (demo) => demo));
        await tester.pump(const Duration(milliseconds: 400));
        tester.takeException();
        if (hasScrollable(tester)) return;
        examined++;

        await tester.pumpWidget(staged(
          id,
          (demo) => Align(
            alignment: AlignmentDirectional.topStart,
            child: IntrinsicWidth(child: demo),
          ),
        ));
        await tester.pump(const Duration(milliseconds: 400));
        final error = tester.takeException();
        if (error != null) {
          misses.add((demo: id, detail: '$error'.split('\n').first));
          return;
        }
        // A box that reports nothing collapses silently rather than throwing,
        // which is the worse failure of the two.
        final box = tester.firstRenderObject<RenderBox>(find.byType(IntrinsicWidth));
        if (box.size.width <= 0) {
          misses.add((demo: id, detail: 'reported an intrinsic width of zero'));
        }
      });
    }
    tearDownAll(() {
      report('INTRINSIC WIDTH', misses, examined, unit: 'measurable demo');
      final names = misses.map((m) => m.demo).toSet();
      final regressed = names.difference(kNoIntrinsicWidth);
      expect(regressed, isEmpty,
          reason: 'a demo that could be measured no longer can — see kNoIntrinsicWidth');
      // The set may only shrink, and a fix must be recorded rather than
      // silently leaving a stale name behind.
      final fixed = kNoIntrinsicWidth.difference(names);
      expect(fixed, isEmpty,
          reason: 'these can be measured now — remove them from kNoIntrinsicWidth');
    });
  });
}

void report(String sweep, List<Miss> misses, int total, {String unit = 'demo'}) {
  debugPrint('=== $sweep: ${misses.length} of $total ${unit}s failed ===');
  for (final m in misses) {
    debugPrint('  ${m.demo}: ${m.detail}');
  }
}
