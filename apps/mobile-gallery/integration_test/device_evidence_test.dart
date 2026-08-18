// ON-DEVICE EVIDENCE — the same demos, the same rules, real hardware.
//
// Every other mobile test in this repo is `flutter test` on the host: a
// headless engine, a substitute font, a device pixel ratio of 1, and no
// platform accessibility bridge. That is a good instrument and it is not the
// same instrument as a phone. This file runs the SAME rules from
// `lib/src/semantics_rules.dart` — one implementation, so a device number and a
// host number are comparable — on a real device, and prints a report.
//
// What this proves: the library builds for iOS, renders on a real screen with
// the real text stack, and what its semantics tree says there.
//
// What this does NOT prove, and must never be written up as though it did:
// this is not a screen-reader run. VoiceOver is not driven here; nothing in
// this file asks the system what it would SPEAK. It reads the same tree the
// host tests read, on hardware. A VoiceOver transcript is a human recording it,
// and until someone does that, no VoiceOver claim exists.
//
// Run (device attached):
//   cd apps/mobile-gallery && flutter test integration_test/device_evidence_test.dart -d <device-id>
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:lumo_mobile_gallery/demos/all.dart';
import 'package:lumo_mobile_gallery/src/semantics_rules.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final ids = lumoDemos.keys.toList()..sort();
  const locales = ['fa-IR', 'en-US'];
  final violations = <Violation>[];
  final iosMisses = <String>{};
  final androidMisses = <String>{};
  final contrastMisses = <String>{};
  var rendered = 0;
  final failedToRender = <String>[];

  for (final id in ids) {
    testWidgets('$id on this device', (tester) async {
      final handle = tester.ensureSemantics();
      for (final locale in locales) {
        try {
          await tester.pumpWidget(demoApp(id, locale));
          // `pump`, NOT `pumpAndSettle`: a spinner, a skeleton shimmer and a
          // progress bar are continuous, so "settled" is a frame that never
          // arrives. The host grader uses the same fixed pump for the same
          // reason, and the first device run hung for 12 minutes without it.
          await tester.pump(const Duration(milliseconds: 400));
        } catch (error) {
          failedToRender.add('$id · $locale: $error');
          continue;
        }
        rendered++;
        violations.addAll(grade(id, locale, announcedTree(tester)));
        if (locale == 'fa-IR') {
          if (!(await iOSTapTargetGuideline.evaluate(tester)).passed) iosMisses.add(id);
          if (!(await androidTapTargetGuideline.evaluate(tester)).passed) androidMisses.add(id);
          if (!(await textContrastGuideline.evaluate(tester)).passed) contrastMisses.add(id);
        }
      }
      handle.dispose();
    });
  }

  testWidgets('the report', (tester) async {
    final view = tester.view;
    final earned = violations.where((v) => !kExemptions.containsKey('${v.demo}/${v.rule}')).toList();

    // Printed rather than asserted: this run's job is to say what the DEVICE did,
    // and a number that differs from the host's is a finding to read, not a
    // build to fail.
    debugPrint('=== LUMO DEVICE EVIDENCE ===');
    debugPrint('screen: ${view.physicalSize.width.toInt()}×${view.physicalSize.height.toInt()} physical px '
        'at dpr ${view.devicePixelRatio}');
    debugPrint('rendered: $rendered of ${ids.length * locales.length} (demo × locale)');
    debugPrint('failed to render: ${failedToRender.length}');
    for (final failure in failedToRender) {
      debugPrint('  $failure');
    }
    debugPrint('semantics rules: ${earned.length} violation(s) '
        '(${violations.length - earned.length} exempted)');
    for (final v in earned.take(20)) {
      debugPrint('  ${v.rule} · ${v.demo}: ${v.detail}');
    }
    debugPrint('iOS 44pt tap target:     ${iosMisses.length}/${ids.length} demos miss');
    debugPrint('Android 48dp tap target: ${androidMisses.length}/${ids.length} demos miss');
    debugPrint('WCAG AA text contrast:   ${contrastMisses.length}/${ids.length} demos miss');
    debugPrint('=== END ===');

    expect(failedToRender, isEmpty, reason: 'demos that could not render on the device');
    expect(earned, isEmpty, reason: 'the semantics rules hold on the host; they must hold here too');
  });

  // Keeps the binding referenced under every analyzer setting.
  assert(binding.runtimeType.toString().isNotEmpty);
}
