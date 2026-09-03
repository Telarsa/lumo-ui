import 'package:intl/intl.dart';

/// Formatting tag for a locale, as `@lumo-ui/core`'s `formatLocale`: `fa-*`
/// gets Persian digits (intl's `fa` symbols carry them); other tags as they are.
String formatLocale(String locale) => locale.replaceAll('-', '_');

/// A number in the reader's digits — the counterpart of `formatNumber(n, locale)`.
/// intl's `fa` locale formats with Persian digits (۰–۹) by its symbol table.
///
/// **A locale intl does not carry falls back to `en` rather than throwing.**
/// This used to be `NumberFormat.decimalPattern(formatLocale(locale))` with no
/// guard, and `formatNumber(12, 'zz')` raised `ArgumentError: Invalid locale`.
/// Three things make that the wrong behaviour rather than a strict one:
///
///  - `formatLumoDate` in the same package already falls back — `_symbolsFor`
///    says so out loud, "so a `LumoScope` locale never throws". Two formatters
///    with one contract disagreeing on the same input is not strictness, it is
///    an oversight.
///  - the web contract this is the counterpart of is OPEN: `Locale` is
///    `BuiltinLocale | (string & {})`, and `Intl.NumberFormat` resolves an
///    unknown tag instead of throwing.
///  - `LumoScope` takes any `String`, and a consumer commonly feeds it from
///    `PlatformDispatcher.instance.locales`. Throwing there takes down a screen
///    over a language tag, in release, on a device nobody tested.
///
/// The fallback is deliberately `en` and not silent-but-different: an unknown
/// locale gets Latin digits and grouping, which is visibly not Persian, so a
/// misconfigured tag still looks wrong to anyone reading the screen.
String formatNumber(num value, String locale, {bool grouping = true}) {
  final tag = Intl.verifiedLocale(
    formatLocale(locale),
    NumberFormat.localeExists,
    onFailure: (_) => 'en',
  );
  final f = NumberFormat.decimalPattern(tag);
  if (!grouping) f.turnOffGrouping();
  return f.format(value);
}
