// THE ISLAND'S NAME IS A CROSS-PLATFORM CONTRACT.
//
// `kLumoLatnIsland` looks like a constant with nothing to test: a string equals
// itself. The mutation campaign made the point sharper than that. Renaming it
// changes the declaration AND every reader in one move — the app declares the
// island with the constant and the grader looks for it with the same constant —
// so the mutant survived every test in the package. It looked equivalent.
//
// It is not equivalent, and this is where that shows. The value is half of a
// pair: the web marks the same thing with `data-lumo-latn` in `packages/gate`,
// and the two must agree or the "one contract, two platforms" claim is a
// slogan. A consumer reading the docs also writes the literal by hand.
//
// So the test reads the WEB source. That is unusual for a Dart test and it is
// the point: nothing else in either package can notice the two drifting apart.
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

void main() {
  test('the island is named `lumo-latn`, as the docs and the web both say', () {
    expect(kLumoLatnIsland, 'lumo-latn');
  });

  test('and the web gate looks for exactly that attribute', () {
    // packages/mobile/test -> packages/gate/src/rules.ts
    final rules = File('../gate/src/rules.ts');
    expect(
      rules.existsSync(),
      isTrue,
      reason: 'the web gate moved; this test is the only thing pairing the two '
          'platforms\' island names, so repoint it rather than deleting it',
    );
    expect(
      rules.readAsStringSync(),
      contains('[data-$kLumoLatnIsland]'),
      reason: 'the mobile island and the web attribute have drifted apart',
    );
  });
}
