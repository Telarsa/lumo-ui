// NATIVE DIGITS — `formatNumber` and `formatLocale`.
//
// These had no test file of their own. `format.dart` is thirteen lines and its
// contract was asserted in passing by the barrel test, which retired with the
// widget roster in §54; the mutation campaign then had nothing to point at.
// That is a thin reason to write a test and a good reason to notice one was
// missing: this function is why a Persian screen reads ۱٬۲۳۴ and not 1,234, and
// it is called from every consumer.
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

void main() {
  group('formatNumber', () {
    test('writes Persian digits and the Persian group separator under fa', () {
      // Both halves matter. A locale table that carried the digits but not the
      // separator would render «۱,۲۳۴» — the right glyphs with a comma a
      // Persian reader does not use.
      expect(formatNumber(1234, 'fa'), '۱٬۲۳۴');
      expect(formatNumber(1234567, 'fa-IR'), '۱٬۲۳۴٬۵۶۷');
      expect(formatNumber(0, 'fa'), '۰');
    });

    test('leaves a Latin-numbered locale alone', () {
      expect(formatNumber(1234, 'en'), '1,234');
      expect(formatNumber(1234, 'en-US'), '1,234');
    });

    test('grouping: false drops the separator and keeps the digits', () {
      // The case a step counter and an OTP cell need: a native digit, no
      // thousands mark, because «۱٬۲» is not how anyone writes step 12.
      expect(formatNumber(1234, 'fa', grouping: false), '۱۲۳۴');
      expect(formatNumber(1234, 'en', grouping: false), '1234');
    });

    test('decimals carry the locale\'s own separator too', () {
      expect(formatNumber(3.5, 'fa'), '۳٫۵');
      expect(formatNumber(3.5, 'en'), '3.5');
    });

    test('a locale nobody configured falls back instead of throwing', () {
      // This threw `ArgumentError: Invalid locale "zz"` until 31 Aug 2026,
      // while `formatLumoDate` in the same package resolved the same tag to
      // English without complaint. A consumer feeds `LumoScope` from
      // `PlatformDispatcher.instance.locales`; a language tag must not be able
      // to take down a screen in release.
      for (final tag in ['zz', 'xx-YY', '', 'q']) {
        expect(formatNumber(1234, tag), '1,234', reason: tag);
      }
      // And the fallback is VISIBLE — Latin digits on a screen that expected
      // Persian ones is still obviously wrong to whoever is reading it.
      expect(formatNumber(1234, 'fa'), isNot('1,234'));
    });
  });

  group('formatLocale', () {
    test('turns a BCP-47 tag into the shape intl indexes by', () {
      // intl keys its symbol tables on `fa_IR`, not `fa-IR`. Passing the tag
      // through unchanged silently falls back to the root locale, which is
      // exactly the mutant the campaign plants in this file.
      expect(formatLocale('fa-IR'), 'fa_IR');
      expect(formatLocale('en-US'), 'en_US');
      expect(formatLocale('fa'), 'fa');
    });
  });
}
