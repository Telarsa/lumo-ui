// THE TWO PLATFORMS MUST NAME THE SAME LANGUAGES RTL.
//
// `directionOf` here and `RTL_PRIMARY` in `packages/gate/src/index.ts` answer
// the same question for the same product. They had drifted: both listed `ku`,
// which ICU calls LTR (bare `ku` is Kurmanji, Latin script — `ckb` is the
// Sorani that is RTL), and neither listed `prs`, which ICU calls RTL. The web
// additionally kept `az-arab`, `pa-arab` and `uz-arab` entries it could never
// reach, because it matched on the primary subtag alone.
//
// A comment saying "keep these in step" is not a mechanism. This reads the
// gate's list out of its TypeScript and fails when the two disagree — the same
// trick `latn_test.dart` uses to pin `data-lumo-latn` against `kLumoLatnIsland`,
// and the only other place the two platforms are checked against each other.
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

/// The gate's own set, read from source rather than copied.
Set<String> gateRtlPrimary() {
  final file = File('../gate/src/index.ts');
  expect(file.existsSync(), isTrue,
      reason: 'packages/gate/src/index.ts is where the web keeps the same list; '
          'if it moved, this test must follow it rather than be deleted');
  final source = file.readAsStringSync();
  final match =
      RegExp(r'const RTL_PRIMARY = new Set\(\[(.*?)\]\);', dotAll: true)
          .firstMatch(source);
  expect(match, isNotNull, reason: 'RTL_PRIMARY is no longer a Set literal');
  return RegExp('"([a-z-]+)"')
      .allMatches(match!.group(1)!)
      .map((m) => m.group(1)!)
      .toSet();
}

void main() {
  test('the mobile RTL set is the gate\'s RTL set', () {
    final gate = gateRtlPrimary();
    expect(gate, isNotEmpty);

    // Every tag the gate calls RTL, this platform must lay out RTL.
    for (final tag in gate) {
      expect(directionOf(tag), TextDirection.rtl, reason: 'gate says $tag is RTL');
    }

    // And nothing extra: a tag the gate omits must not be RTL here. Checked
    // through the public function, so the two tables cannot agree while the
    // LOOKUPS differ — which is how `az-Arab` was wrong on the web.
    for (final tag in const ['en', 'de', 'fr', 'tr', 'ku', 'az', 'pa', 'uz', 'ja', 'ru']) {
      expect(directionOf(tag), TextDirection.ltr, reason: '$tag is not in the gate set');
    }
  });

  test('Arabic script flips a language that is otherwise LTR', () {
    // The entries that were unreachable on the web for want of a script lookup.
    expect(directionOf('az'), TextDirection.ltr);
    expect(directionOf('az-Arab'), TextDirection.rtl);
    expect(directionOf('pa-Arab'), TextDirection.rtl);
    expect(directionOf('uz-Arab'), TextDirection.rtl);
    // Underscores are a Dart locale habit and must behave the same.
    expect(directionOf('uz_Arab'), TextDirection.rtl);
  });

  test('the two corrections ICU forced, named so they cannot quietly return', () {
    expect(directionOf('ku'), TextDirection.ltr, reason: 'Kurmanji is Latin script');
    expect(directionOf('ckb'), TextDirection.rtl, reason: 'Sorani is the RTL one');
    expect(directionOf('prs'), TextDirection.rtl, reason: 'Dari is Persian in Arabic script');
  });
}
