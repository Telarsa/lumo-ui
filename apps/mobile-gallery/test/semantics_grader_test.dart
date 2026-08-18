// THE MOBILE SEMANTICS GRADER — the counterpart of `gate:html`.
//
// The web library's strongest instrument is not its tests. It is ONE grader
// applying 13 rules to 688 served documents: a component written tomorrow is
// graded whether or not its author remembered, and the rules are stated once
// rather than re-expressed per family.
//
// The mobile library had no such thing. It has a semantics-tree test per family
// — which is better than nothing and better than most — but a family added
// tomorrow gets exactly the assertions its author thought of, and a defect class
// nobody has thought of yet is caught nowhere. `gate:flutter-contract` grades
// SOURCE, so it cannot see a string that arrives from Material's own defaults at
// runtime, which is precisely where English leaks in.
//
// So: every demo rendered, its semantics tree walked, four rules applied to
// every node. A Flutter app serves no HTML, and the semantics tree is the thing
// a screen reader actually reads — it is the mobile equivalent of served bytes.
//
// Each rule carries a poison fixture that must fail it, in the group at the
// bottom. A rule that has never rejected anything is a rule nobody has tested.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_mobile_gallery/demos/all.dart';
import 'package:lumo_mobile_gallery/src/semantics_rules.dart';

void main() {
  final ids = lumoDemos.keys.toList()..sort();
  const locales = ['fa-IR', 'en-US'];
  final found = <Violation>[];
  var graded = 0;

  group('the semantics grader', () {
    for (final id in ids) {
      for (final locale in locales) {
        testWidgets('$id · $locale', (tester) async {
          final handle = tester.ensureSemantics();
          tester.view.physicalSize = kStage;
          tester.view.devicePixelRatio = 1;
          addTearDown(tester.view.reset);
          await tester.pumpWidget(demoApp(id, locale));
          await tester.pump(const Duration(milliseconds: 400));
          found.addAll(grade(id, locale, announcedTree(tester)));
          graded++;
          handle.dispose();
        });
      }
    }

    test('the sweep: every demo, every rule', () {
      // The gate's own line, in the shape `gate:html` prints.
      final exempted = found.where((v) => kExemptions.containsKey('${v.demo}/${v.rule}')).length;
      debugPrint('  mobile-semantics: $graded render(s) of ${ids.length} demo(s) × 2 locale(s), '
          '4 rules, ${found.length - exempted} violation(s), $exempted exempted');
      expect(graded, ids.length * locales.length, reason: 'a demo failed to render — see the failures above');

      // An exemption must stay EARNED: one that no longer fires is stale, and a
      // stale exemption says something false about the component.
      final claimed = found.map((v) => '${v.demo}/${v.rule}').toSet();
      final stale = kExemptions.keys.where((k) => !claimed.contains(k)).toList();
      expect(stale, isEmpty, reason: 'these exemptions no longer describe anything — delete them:\n  ${stale.join("\n  ")}');

      final byRule = <String, List<Violation>>{};
      for (final v in found.where((v) => !kExemptions.containsKey('${v.demo}/${v.rule}'))) {
        byRule.putIfAbsent(v.rule, () => []).add(v);
      }
      final report = byRule.entries
          .map((e) => '${e.key} (${e.value.length}):\n    ${e.value.take(8).map((v) => "${v.demo}: ${v.detail}").join("\n    ")}')
          .join('\n  ');
      expect(byRule, isEmpty, reason: 'the semantics tree is what a screen reader reads:\n  $report');
    });
  });

  group("Flutter's own accessibility guidelines", () {
    iosTapMisses.clear();
    androidTapMisses.clear();
    contrastMisses.clear();
    // NOT hand-rolled. `flutter_test` ships `AccessibilityGuideline`
    // implementations maintained by the Flutter team — the Android 48dp and iOS
    // 44pt tap-target rules, the WCAG AA text-contrast maths, and a check that
    // every tappable node is labelled. This repo had written its own versions of
    // the first two (`tap_target_floor_test.dart`, `token_contrast_test.dart`)
    // and, in this file, of the third. Where the platform already states the
    // rule, the platform's statement is the one to run: it is maintained
    // upstream, it encodes the real per-platform pixel sizes, and it does the
    // contrast arithmetic properly over what was actually painted.
    //
    // The house floors stay: they grade the TOKENS and the component API before
    // a demo exists. These grade what a demo actually rendered.
    for (final id in ids) {
      testWidgets('$id meets the SDK guidelines', (tester) async {
        final handle = tester.ensureSemantics();
        tester.view.physicalSize = kStage;
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);
        await tester.pumpWidget(demoApp(id, 'fa-IR'));
        await tester.pump(const Duration(milliseconds: 400));
        // MET today, so it is a hard floor: every tappable node is labelled.
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        // The other three are NOT met today. Counted, not asserted — the ratchet
        // below is the honest record of where the library actually stands.
        if (!(await iOSTapTargetGuideline.evaluate(tester)).passed) iosTapMisses.add(id);
        if (!(await androidTapTargetGuideline.evaluate(tester)).passed) androidTapMisses.add(id);
        if (!(await textContrastGuideline.evaluate(tester)).passed) contrastMisses.add(id);
        handle.dispose();
      });
    }

    test('the two guidelines Lumo does not meet yet, ratcheted', () {
      String pct(int n) => '${(n / ids.length * 100).toStringAsFixed(0)}%';
      debugPrint('  mobile-a11y: of ${ids.length} demos — iOS-44pt misses ${iosTapMisses.length} (${pct(iosTapMisses.length)}), '
          'android-48dp ${androidTapMisses.length} (${pct(androidTapMisses.length)}), '
          'WCAG-AA-contrast ${contrastMisses.length} (${pct(contrastMisses.length)})');
      expect(iosTapMisses.length / ids.length, lessThanOrEqualTo(kIosTapCeiling),
          reason: 'a larger share of demos misses the iOS tap target: ${iosTapMisses.join(", ")}');
      expect(androidTapMisses.length / ids.length, lessThanOrEqualTo(kAndroidTapCeiling),
          reason: 'a larger share of demos misses the Android tap target: ${androidTapMisses.join(", ")}');
      expect(contrastMisses.length / ids.length, lessThanOrEqualTo(kContrastCeiling),
          reason: 'a larger share of demos misses WCAG AA contrast: ${contrastMisses.join(", ")}');
    });
  });

  group('poison — every rule rejects its own defect', () {
    // The rules run over hand-built trees, so a fixture proves the RULE and not
    // a widget. Same `grade()` the sweep calls.
    const clean = (label: 'ذخیره', value: '', hint: '', increased: '', decreased: '', interactive: true, hidden: false, namedByAncestor: false);

    test('a clean node passes every rule', () {
      expect(grade('fixture', 'fa-IR', const [clean]), isEmpty);
    });

    test('named-controls rejects an unnamed interactive node', () {
      const poison = (label: '', value: '', hint: '', increased: '', decreased: '', interactive: true, hidden: false, namedByAncestor: false);
      expect(grade('fixture', 'fa-IR', const [poison]).map((v) => v.rule), contains('named-controls'));
    });

    test('persian-digits rejects a Latin digit announced under fa', () {
      const poison = (label: 'صفحهٔ 2', value: '', hint: '', increased: '', decreased: '', interactive: true, hidden: false, namedByAncestor: false);
      expect(grade('fixture', 'fa-IR', const [poison]).map((v) => v.rule), contains('persian-digits'));
      // …and does NOT fire under en-US, where Latin digits are the language.
      expect(grade('fixture', 'en-US', const [poison]).map((v) => v.rule), isNot(contains('persian-digits')));
    });

    test('engine-english rejects a Material string announced under fa', () {
      const poison = (label: 'Dismiss', value: '', hint: '', increased: '', decreased: '', interactive: true, hidden: false, namedByAncestor: false);
      expect(grade('fixture', 'fa-IR', const [poison]).map((v) => v.rule), contains('engine-english'));
      expect(grade('fixture', 'en-US', const [poison]).map((v) => v.rule), isNot(contains('engine-english')));
    });

    test('announced-once rejects a name repeated as its own hint', () {
      const poison = (label: 'کد نامعتبر', value: '', hint: 'کد نامعتبر', increased: '', decreased: '', interactive: true, hidden: false, namedByAncestor: false);
      expect(grade('fixture', 'fa-IR', const [poison]).map((v) => v.rule), contains('announced-once'));
    });

    test('a hidden node is not graded — it is not announced', () {
      const poison = (label: '', value: '', hint: '', increased: '', decreased: '', interactive: true, hidden: true, namedByAncestor: false);
      expect(grade('fixture', 'fa-IR', const [poison]), isEmpty);
    });
  });
}
