// DIRECTION FROM THE LOCALE — the package's flagship promise, tested here.
//
// It was not, until 31 Aug 2026. The claim "a layout mirrors because the
// language changed, and not because someone remembered to flip a flag" is the
// first line of this library's README, and the only thing asserting it lived in
// `apps/mobile-example`. That was survivable while the package was mostly
// widgets whose own tests happened to exercise a `LumoScope`; it stopped being
// survivable when the widgets left and `scope.dart` became one eighth of the
// product. The mutation campaign found it: flip `rtl` to `ltr` in `directionOf`
// and every test in this package still passed.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

void main() {
  group('directionOf', () {
    test('reads the primary subtag, in either separator and any case', () {
      // The same language, written five ways a real app writes it.
      for (final tag in ['fa', 'fa-IR', 'fa_IR', 'FA', 'fa-IR-u-ca-persian-nu-arabext']) {
        expect(directionOf(tag), TextDirection.rtl, reason: tag);
      }
      for (final tag in ['en', 'en-US', 'en_GB', 'EN', 'de-DE']) {
        expect(directionOf(tag), TextDirection.ltr, reason: tag);
      }
    });

    test('more than one right-to-left language, not just Persian', () {
      // A list with one entry that happens to be the language this repository
      // cares about would pass every test above and be wrong for every user of
      // the other seventeen.
      for (final tag in ['ar-EG', 'he', 'ur-PK', 'ps', 'ckb', 'sd', 'ug', 'yi']) {
        expect(directionOf(tag), TextDirection.rtl, reason: tag);
      }
    });

    test('matches the whole subtag, not a prefix of one', () {
      // `startsWith` would be the obvious implementation and it is wrong:
      // «fake», «here» and «used» all begin with a right-to-left tag. This is
      // the case that tells an exact match from a sloppy one.
      for (final tag in ['fake', 'fantasy', 'heb-x', 'here', 'used', 'urban']) {
        expect(directionOf(tag), TextDirection.ltr, reason: tag);
      }
    });

    test('an unknown language is left-to-right rather than an exception', () {
      // A locale this library has never heard of must still render. Defaulting
      // is the right answer; throwing would take down a screen over a tag.
      expect(directionOf('zz'), TextDirection.ltr);
      expect(directionOf(''), TextDirection.ltr);
    });
  });

  testWidgets('LumoScope hands that direction to the widgets below it', (tester) async {
    // The unit above proves the function. This proves the wiring: a Material
    // widget under a `LumoScope` mirrors without being told to, which is the
    // whole claim.
    for (final (locale, expected) in const [
      ('fa-IR', TextDirection.rtl),
      ('en-US', TextDirection.ltr),
    ]) {
      late BuildContext seen;
      await tester.pumpWidget(MaterialApp(
        home: LumoScope(
          locale: locale,
          child: Builder(builder: (context) {
            seen = context;
            return const SizedBox.shrink();
          }),
        ),
      ));
      expect(Directionality.of(seen), expected, reason: locale);
      expect(LumoScope.of(seen).direction, expected, reason: '$locale via LumoScope.of');
      expect(LumoScope.of(seen).locale, locale);
    }
  });
}
