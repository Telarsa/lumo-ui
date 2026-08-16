import 'package:intl/intl.dart';

/// Formatting tag for a locale, as `@lumo-ui/core`'s `formatLocale`: `fa-*`
/// gets Persian digits (intl's `fa` symbols carry them); other tags as they are.
String formatLocale(String locale) => locale.replaceAll('-', '_');

/// A number in the reader's digits — the counterpart of `formatNumber(n, locale)`.
/// intl's `fa` locale formats with Persian digits (۰–۹) by its symbol table.
String formatNumber(num value, String locale, {bool grouping = true}) {
  final f = NumberFormat.decimalPattern(formatLocale(locale));
  if (!grouping) f.turnOffGrouping();
  return f.format(value);
}
