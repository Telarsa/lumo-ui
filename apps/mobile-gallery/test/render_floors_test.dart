// RENDER FLOORS — two defect classes that only a rendered frame can show.
//
// The library's semantics-tree tests (`packages/mobile/test/`) prove what a
// widget ANNOUNCES. `gate:flutter-contract` proves what its source may say. On
// 17 Aug 2026 two real defects walked past both, and past the served-HTML gate,
// because neither is expressible in either instrument:
//
//  1. The docs stage laid every demo out with `CrossAxisAlignment.stretch`,
//     which does not centre — it makes every demo full-width, so a demo with
//     nothing to fill that width sat hard against the reading start. Under
//     fa-IR that is the RIGHT edge. 21 demos had their content pinned to one
//     edge with the far side empty.
//  2. `ButtonStyle.textStyle` REPLACES the theme's `labelLarge` instead of
//     merging with it, so a bare `TextStyle(fontSize:, fontWeight:)` in
//     `button.dart` silently dropped `ThemeData.fontFamily`. An app setting
//     `fontFamily: 'Vazirmatn'` got Vazirmatn everywhere except inside its
//     buttons — 26 strings across 11 slugs, every one a button label.
//
// Both were found by rendering the thing and measuring it. These are those two
// measurements, kept.
//
// They live in the GALLERY rather than in `packages/mobile` because this is the
// one place every family is already instantiated with real, required arguments
// and real Persian copy. A sweep here covers a family the day its demo lands.
//
// ── On the instrument for defect 1 ───────────────────────────────────────────
// The obvious measurement is the wrong one, and it was tried first: capture the
// frame and compare the blank margin on each side of the painted ink. It cannot
// work. Measured over all 105 demos, legitimately start-aligned content reaches
// a 64dp imbalance (`timeline-1`, a rail down the reading start), while the
// BROKEN state peaked near 69dp. The two populations overlap, so no threshold
// separates "the stage stopped centring" from "this widget reads start-first",
// and a floor that cannot tell them apart is a floor that gets deleted.
//
// What separates them exactly is structural. Under `stretch` the Column's cross
// size is the incoming maximum, so EVERY demo is the same width. Under `centre`
// it is the widest child, so an intrinsically-sized demo is narrower — today 29
// of 105, each centred to within a pixel. That count going to zero is the
// revert, and it is a synchronous rect read: no image, no threshold, no flake.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_mobile_gallery/demos/all.dart';
import 'package:lumo_mobile_gallery/main.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

/// A family name no font stack can satisfy, so it can only arrive by
/// inheritance from `ThemeData.fontFamily` — never by luck.
const _guardFont = 'LumoGuardFont';

/// The stage the docs site frames: a phone.
const _stage = Size(360, 640);

/// How many demos must be narrower than the frame. Today 29 are; the floor sits
/// below that with room for demos to legitimately grow into the width, and far
/// above the ZERO that a return to `stretch` would produce.
const _minIntrinsicDemos = 20;

Widget _app(String id, String locale, {String? fontFamily}) => MaterialApp(
      debugShowCheckedModeBanner: false,
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      supportedLocales: const [Locale('fa', 'IR'), Locale('en', 'US')],
      locale: Locale(locale.split('-').first, locale.split('-').last),
      theme: lumoThemeData(brightness: Brightness.light, fontFamily: fontFamily),
      builder: (context, child) => LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: child ?? const SizedBox.shrink(),
      ),
      home: DemoStage(demoId: id, locale: locale),
    );

Future<void> _pumpDemo(WidgetTester tester, Widget app) async {
  tester.view.physicalSize = _stage;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(app);
  // Long enough for an entry animation to settle; the demos do not loop.
  await tester.pump(const Duration(milliseconds: 400));
}

/// Private-use codepoints — where icon fonts live. Not language text.
bool _isGlyphCodepoint(int rune) =>
    (rune >= 0xE000 && rune <= 0xF8FF) ||
    (rune >= 0xF0000 && rune <= 0xFFFFD) ||
    (rune >= 0x100000 && rune <= 0x10FFFD);

void main() {
  final ids = lumoDemos.keys.toList()..sort();

  // Measured per demo (one pumped app per test, so a demo that throws is that
  // demo's failure and not a pile of exceptions in one giant test), then
  // asserted once at the end — the signal is a property of the WHOLE set.
  final measured = <String, ({double width, double left, double right})>{};

  group('the stage centres its demo, and does not stretch it', () {
    for (final id in ids) {
      testWidgets('measure $id', (tester) async {
        await _pumpDemo(tester, _app(id, 'fa-IR'));
        final rect = tester.getRect(find.byType(DemoHeightReporter));
        measured[id] = (width: rect.width, left: rect.left, right: _stage.width - rect.right);
      });
    }

    test('the set: some demos are narrower than the frame, and those are centred', () {
      expect(measured.length, ids.length, reason: 'a demo failed to measure — see the failures above');

      // The available content width, read from the demos themselves rather than
      // recomputed from the stage's private padding: the widest demo is the one
      // that filled it.
      final available = measured.values.map((m) => m.width).reduce((a, b) => a > b ? a : b);
      final intrinsic = measured.entries.where((e) => e.value.width < available - 1).toList();

      expect(intrinsic.length, greaterThanOrEqualTo(_minIntrinsicDemos),
          reason: 'only ${intrinsic.length} of ${ids.length} demos are narrower than the '
              '${available.toStringAsFixed(0)}dp frame. When every demo is exactly the frame width the '
              'stage is STRETCHING rather than centring, and a demo with nothing to fill that width '
              'sits hard against the reading start — the right-hand edge under fa-IR. '
              'See `CrossAxisAlignment` in apps/mobile-gallery/lib/main.dart.');

      final offCentre = intrinsic
          .where((e) => (e.value.left - e.value.right).abs() > 1)
          .map((e) => '${e.key}: ${e.value.width.toStringAsFixed(0)}dp wide, '
              '${e.value.left.toStringAsFixed(0)}dp left / ${e.value.right.toStringAsFixed(0)}dp right')
          .toList();
      expect(offCentre, isEmpty,
          reason: 'a demo narrower than the frame must be centred in it:\n  ${offCentre.join("\n  ")}');
    });
  });

  group('every string inherits the app font', () {
    // WHY: an app sets ONE `fontFamily` and expects it everywhere. A widget that
    // builds a `TextStyle` from scratch — rather than merging onto the theme's —
    // silently drops it, and the failure is invisible on a machine whose
    // fallback font happens to cover the script. It is not invisible to a
    // Persian reader, who sees one control in a different typeface.
    //
    // The guard family cannot be satisfied by any real font, so if it appears on
    // the resolved style it can only have arrived by inheritance.

    /// Demos allowed a string in another family, and why.
    const exemptions = <String, String>{};

    for (final id in ids) {
      testWidgets(id, (tester) async {
        await _pumpDemo(tester, _app(id, 'fa-IR', fontFamily: _guardFont));
        final orphans = <String>[];
        for (final text in tester.widgetList<RichText>(find.byType(RichText))) {
          final plain = text.text.toPlainText();
          // An `Icon` is a `RichText` too — one private-use codepoint in an icon
          // font. It must NOT inherit the text family, and forcing it to would
          // replace every glyph in the library with a missing-glyph box.
          if (plain.isEmpty || plain.runes.every(_isGlyphCodepoint)) continue;
          final family = text.text.style?.fontFamily;
          if (family != _guardFont) {
            orphans.add('"${plain.replaceAll("\n", " ")}" resolved to ${family ?? "the platform default"}');
          }
        }
        final reason = exemptions[id];
        if (reason != null) {
          // An exemption must stay EARNED: if every string inherits, the entry
          // is stale and says something false about the widget.
          expect(orphans, isNotEmpty,
              reason: '$id is exempt ("$reason") but every string now inherits — delete the exemption');
          return;
        }
        expect(orphans, isEmpty,
            reason: '$id has ${orphans.length} string(s) that did not inherit `ThemeData.fontFamily`:\n'
                '  ${orphans.join("\n  ")}\n'
                'Build the style by merging onto the ambient one (see the `labelBase` note in '
                'packages/mobile/lib/src/button.dart), not with a bare TextStyle().');
      });
    }
  });
}
