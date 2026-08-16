import 'package:intl/date_symbol_data_custom.dart' as intl_custom;
import 'package:intl/date_symbol_data_local.dart' as intl_local;
import 'package:intl/date_symbols.dart';
import 'package:intl/date_time_patterns.dart' as intl_patterns;
import 'package:intl/intl.dart';
import 'format.dart';

/// Jalali (Solar Hijri) dates, pure Dart, no dependency — the ONE thing mobile
/// has to solve itself: Flutter's `intl` is Gregorian-only and Lumo is
/// Persian-first (the web's `formatDate` selects the Persian calendar through
/// `-u-ca-persian`; `@internationalized/date`'s `PersianCalendar` owns the
/// arithmetic there). This file is the mobile counterpart of both.
///
/// Algorithm: the "jalaali-js" arithmetic (Behrang Norouzinia, MIT —
/// https://github.com/jalaali/jalaali-js), itself the JavaScript port of
/// Kazimierz M. Borkowski's "The Persian calendar for 3000 years" (1996) —
/// the vetted 33-year-cycle table behind every serious Jalali library
/// (jalaali-js, jdatetime, moment-jalaali, the PHP/Go/Rust ports). `jalCal`,
/// `j2d`, `d2j`, `g2d`, `d2g` are implemented faithfully, with the same
/// break table and the same TRUNCATING integer division (`~/`, `remainder`) —
/// Dart's `%` floors for negative operands and would corrupt `jalCal`'s
/// `leap == -1` branch and `g2d`'s `(gm - 8) ~/ 6`. Valid for Jalali years
/// -61 .. 3177 (Gregorian 560 .. 3798), the range the table covers.

/// The 33-year-cycle break years of the Jalali leap rule (jalaali-js `breaks`).
const _breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

/// Truncating remainder — JS `a - ~~(a / b) * b`, NOT Dart's flooring `%`.
int _mod(int a, int b) => a.remainder(b);

/// Result of `jalCal`: whether/how far the year is into a leap cycle, the
/// Gregorian year that starts it, and the March day of its Nowruz.
class _JalCal {
  const _JalCal({required this.leap, required this.gy, required this.march});
  /// Number of years since the last leap year (0 = this year is leap; 1..4).
  final int leap;
  /// Gregorian year of the first day of this Jalali year.
  final int gy;
  /// The Gregorian March day (1-based) that is 1 Farvardin.
  final int march;
}

/// jalaali-js `jalCal(jy, withoutLeap)`: leap status, Gregorian year and
/// Nowruz's March date for a Jalali year. Throws outside -61..3177.
_JalCal _jalCal(int jy, {bool withoutLeap = false}) {
  final bl = _breaks.length;
  final gy = jy + 621;
  var leapJ = -14;
  var jp = _breaks[0];
  if (jy < jp || jy >= _breaks[bl - 1]) throw ArgumentError.value(jy, 'jy', 'Invalid Jalali year');
  var jump = 0;
  for (var i = 1; i < bl; i += 1) {
    final jm = _breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + (jump ~/ 33) * 8 + (_mod(jump, 33) ~/ 4);
    jp = jm;
  }
  var n = jy - jp;
  leapJ = leapJ + (n ~/ 33) * 8 + ((_mod(n, 33) + 3) ~/ 4);
  if (_mod(jump, 33) == 4 && jump - n == 4) leapJ += 1;
  final leapG = gy ~/ 4 - (((gy ~/ 100) + 1) * 3) ~/ 4 - 150;
  final march = 20 + leapJ - leapG;
  if (withoutLeap) return _JalCal(leap: 0, gy: gy, march: march);
  if (jump - n < 6) n = n - jump + ((jump + 4) ~/ 33) * 33;
  var leap = _mod(_mod(n + 1, 33) - 1, 4);
  if (leap == -1) leap = 4;
  return _JalCal(leap: leap, gy: gy, march: march);
}

/// jalaali-js `j2d`: Jalali date → Julian Day Number.
int _j2d(int jy, int jm, int jd) {
  final r = _jalCal(jy, withoutLeap: true);
  return _g2d(r.gy, 3, r.march) + (jm - 1) * 31 - (jm ~/ 7) * (jm - 7) + jd - 1;
}

/// jalaali-js `d2j`: Julian Day Number → Jalali (year, month, day).
JalaliDate _d2j(int jdn) {
  final gy = _d2g(jdn).year;
  var jy = gy - 621;
  final r = _jalCal(jy);
  final jdn1f = _g2d(gy, 3, r.march);
  var k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) return JalaliDate(jy, 1 + k ~/ 31, _mod(k, 31) + 1);
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap == 1) k += 1;
  }
  return JalaliDate(jy, 7 + k ~/ 30, _mod(k, 30) + 1);
}

/// jalaali-js `g2d`: Gregorian date → Julian Day Number (proleptic Gregorian).
int _g2d(int gy, int gm, int gd) {
  var d = ((gy + (gm - 8) ~/ 6 + 100100) * 1461) ~/ 4 + (153 * _mod(gm + 9, 12) + 2) ~/ 5 + gd - 34840408;
  d = d - (((gy + 100100 + (gm - 8) ~/ 6) ~/ 100) * 3) ~/ 4 + 752;
  return d;
}

/// jalaali-js `d2g`: Julian Day Number → Gregorian date (local, at midnight).
DateTime _d2g(int jdn) {
  var j = 4 * jdn + 139361631;
  j = j + (((4 * jdn + 183187720) ~/ 146097) * 3) ~/ 4 * 4 - 3908;
  final i = (_mod(j, 1461) ~/ 4) * 5 + 308;
  final gd = _mod(i, 153) ~/ 5 + 1;
  final gm = _mod(i ~/ 153, 12) + 1;
  final gy = j ~/ 1461 - 100100 + (8 - gm) ~/ 6;
  return DateTime(gy, gm, gd);
}

/// An immutable Jalali calendar date. `month` is 1..12 (1 = Farvardin), `day`
/// 1..`monthLength`. Conversions use a `DateTime`'s LOCAL year/month/day fields
/// only — never an instant — so no time zone or DST edge can shift a day
/// (`toDateTime` returns local midnight of that day).
class JalaliDate implements Comparable<JalaliDate> {
  const JalaliDate(this.year, this.month, this.day)
      : assert(month >= 1 && month <= 12, 'month must be 1..12'),
        assert(day >= 1 && day <= 31, 'day must be 1..31');

  /// The Jalali date of `date`'s local calendar day.
  factory JalaliDate.fromDateTime(DateTime date) => _d2j(_g2d(date.year, date.month, date.day));

  /// Today, from the device clock (local).
  factory JalaliDate.now() => JalaliDate.fromDateTime(DateTime.now());

  final int year;
  final int month;
  final int day;

  /// Whether `year` has 30 days in Esfand (jalaali-js `isLeapJalaaliYear`).
  static bool isLeapYear(int year) => _jalCal(year).leap == 0;

  /// Days in `month` of `year`: 31 for Farvardin..Shahrivar, 30 for
  /// Mehr..Bahman, 30 or 29 for Esfand (jalaali-js `jalaaliMonthLength`).
  static int monthLengthOf(int year, int month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isLeapYear(year) ? 30 : 29;
  }

  /// Days in this date's month.
  int get monthLength => monthLengthOf(year, month);

  /// Whether this date exists (day within its month's length).
  bool get isValid => day <= monthLength;

  /// The Julian Day Number of this date.
  int get julianDay => _j2d(year, month, day);

  /// Local midnight of this Jalali day, as a `DateTime`.
  DateTime toDateTime() => _d2g(julianDay);

  /// The day of the Persian week, 1..7 with SATURDAY = 1 (شنبه, the first day
  /// of the Persian week) through FRIDAY = 7 (جمعه). Not `DateTime.weekday`'s
  /// ISO numbering (Monday = 1): a Jalali grid's first column is Saturday, and
  /// `weekday - 1` indexes `persianWeekdayNames`. `(dt.weekday + 1) % 7 + 1`
  /// converts from a `DateTime`.
  int get weekday => (toDateTime().weekday + 1) % 7 + 1;

  /// This date moved by `days` (negative allowed), crossing month and year ends.
  JalaliDate add(int days) => _d2j(julianDay + days);

  /// A copy with the given fields replaced. Not clamped: `copyWith(month: 12)`
  /// on day 31 is invalid (`isValid` false); callers clamp with `monthLength`.
  JalaliDate copyWith({int? year, int? month, int? day}) => JalaliDate(year ?? this.year, month ?? this.month, day ?? this.day);

  @override
  int compareTo(JalaliDate other) {
    if (year != other.year) return year.compareTo(other.year);
    if (month != other.month) return month.compareTo(other.month);
    return day.compareTo(other.day);
  }

  bool operator <(JalaliDate other) => compareTo(other) < 0;
  bool operator >(JalaliDate other) => compareTo(other) > 0;

  @override
  bool operator ==(Object other) => other is JalaliDate && other.year == year && other.month == month && other.day == day;

  @override
  int get hashCode => Object.hash(year, month, day);

  /// ISO-like `1405-01-01` (ASCII digits, zero-padded) — a machine form, not
  /// the reader's; the reader's form is `formatLumoDate`.
  @override
  String toString() => '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
}

/// The calendar a locale's readers count in — a THIRD property beside
/// direction and digits (the web's `calendarFor` in `calendar-datelib.ts`).
enum LumoCalendarSystem { jalali, gregorian }

/// The web's rule, copied (`formatLocale` + `calendarFor`): a tag that STATES
/// its calendar in a Unicode `-u-` extension counts in that one (`-u-ca-persian`
/// → Jalali, `-u-ca-gregory` → Gregorian, even on `fa-IR-u-ca-gregory`); a
/// tag without one counts in Jalali when its primary subtag is `fa` (Iran,
/// Afghanistan, any region) and in Gregorian otherwise. `_` is accepted as `-`
/// (Dart-style `fa_IR`). Deterministic on every device: not an ICU lookup.
LumoCalendarSystem calendarOf(String locale) {
  final tag = locale.toLowerCase().replaceAll('_', '-');
  final stated = _statedCalendar(tag);
  if (stated != null) return stated == 'persian' ? LumoCalendarSystem.jalali : LumoCalendarSystem.gregorian;
  return _primary(tag) == 'fa' ? LumoCalendarSystem.jalali : LumoCalendarSystem.gregorian;
}

/// The `ca` keyword of a tag's `-u-` extension, or null (the web's `statedCalendar`).
String? _statedCalendar(String lowerTag) {
  final subtags = lowerTag.split('-');
  final u = subtags.indexOf('u');
  if (u == -1) return null;
  final values = <String>[];
  var collecting = false;
  for (final subtag in subtags.sublist(u + 1)) {
    // A two-character subtag is a KEY; longer ones are its values (`ca-islamic-umalqura`).
    if (subtag.length == 2) {
      if (collecting) break;
      collecting = subtag == 'ca';
    } else if (collecting) {
      values.add(subtag);
    }
  }
  return values.isEmpty ? null : values.join('-');
}

String _primary(String tag) => tag.toLowerCase().split(RegExp('[-_]')).first;

/// The tag stripped of its `-u-` extension, for `intl` (which knows languages
/// and regions, not Unicode extensions): `en-US-u-ca-persian` → `en-US`.
String _bareTag(String locale) {
  final parts = locale.replaceAll('_', '-').split('-');
  final u = parts.indexWhere((p) => p.toLowerCase() == 'u');
  return (u == -1 ? parts : parts.sublist(0, u)).join('-');
}

/// Persian month names, index 0 = Farvardin.
const persianMonthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/// The Jalali month names transliterated, for a non-Persian language counting
/// in the Persian calendar (`en-u-ca-persian`): index 0 = Farvardin.
const jalaliMonthNamesLatin = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'];

/// Persian weekday names in the PERSIAN week order: index 0 = Saturday (شنبه)
/// … 6 = Friday (جمعه) — `JalaliDate.weekday - 1` indexes them.
const persianWeekdayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

/// One-letter Persian weekday names, same order as `persianWeekdayNames`.
const persianWeekdayShortNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/// The Jalali month name for `month` (1..12) in the language of `locale`:
/// Persian names under `fa`, transliterated Latin names otherwise.
String jalaliMonthName(int month, String locale) => (_primary(locale) == 'fa' ? persianMonthNames : jalaliMonthNamesLatin)[month - 1];

/// The three lengths the field can show; the picker's cell name uses `long`.
enum LumoDateStyle {
  /// Numeric: «۱۴۰۵/۵/۲۶» / `8/17/2026`.
  short,
  /// Day, month name, year: «۲۶ مرداد ۱۴۰۵» / `Aug 17, 2026`.
  medium,
  /// With the weekday: «دوشنبه ۲۶ مرداد ۱۴۰۵» / `Monday, August 17, 2026`.
  long,
}

/// A date in the reader's calendar, digits and language — the counterpart of
/// the web's `formatDate(value, locale)`. Jalali per `calendarOf(locale)` is
/// composed here (day, month name, year — «۲۶ مرداد ۱۴۰۵»; `26 Mordad 1405`
/// for a non-Persian language) with digits from `formatNumber`; Gregorian goes
/// through `intl`'s `DateFormat` for the locale, whose symbols are loaded on
/// demand (`_symbolsFor`). Only the `DateTime`'s local calendar day is read.
String formatLumoDate(DateTime date, String locale, {LumoDateStyle style = LumoDateStyle.medium}) {
  if (calendarOf(locale) == LumoCalendarSystem.gregorian) {
    final tag = _intlTag(locale);
    switch (style) {
      case LumoDateStyle.short:
        return DateFormat.yMd(tag).format(date);
      case LumoDateStyle.medium:
        return DateFormat.yMMMd(tag).format(date);
      case LumoDateStyle.long:
        return DateFormat.yMMMMEEEEd(tag).format(date);
    }
  }
  final j = JalaliDate.fromDateTime(date);
  String n(int v) => formatNumber(v, locale, grouping: false);
  final persian = _primary(locale) == 'fa';
  switch (style) {
    case LumoDateStyle.short:
      return '${n(j.year)}/${n(j.month)}/${n(j.day)}';
    case LumoDateStyle.medium:
      return '${n(j.day)} ${jalaliMonthName(j.month, locale)} ${n(j.year)}';
    case LumoDateStyle.long:
      final weekday = weekdayName(date, locale);
      return persian ? '$weekday ${n(j.day)} ${jalaliMonthName(j.month, locale)} ${n(j.year)}' : '$weekday, ${n(j.day)} ${jalaliMonthName(j.month, locale)} ${n(j.year)}';
  }
}

/// The month-and-year caption of a Jalali month («مرداد ۱۴۰۵», `Mordad 1405`).
String formatJalaliMonth(int year, int month, String locale) => '${jalaliMonthName(month, locale)} ${formatNumber(year, locale, grouping: false)}';

/// The month-and-year caption of a Gregorian month, by intl (`August 2026`).
String formatGregorianMonth(int year, int month, String locale) => DateFormat.yMMMM(_intlTag(locale)).format(DateTime(year, month));

/// The weekday name of `date` in the language of `locale`: the Persian names
/// under `fa`, `intl`'s otherwise. Weekday names are a LANGUAGE property, not a
/// calendar one — `en-u-ca-persian` says `Monday`.
String weekdayName(DateTime date, String locale, {bool short = false}) {
  if (_primary(locale) == 'fa') return (short ? persianWeekdayShortNames : persianWeekdayNames)[(date.weekday + 1) % 7];
  final s = _symbolsFor(locale);
  // intl's arrays are indexed 0 = Sunday; `DateTime.weekday` is 1 = Monday .. 7 = Sunday.
  return (short ? s.STANDALONENARROWWEEKDAYS : s.STANDALONEWEEKDAYS)[date.weekday % 7];
}

/// The first day of the week for a locale as a `DateTime.weekday` value
/// (1 = Monday .. 7 = Sunday): SATURDAY (6) under a Jalali calendar; intl's
/// `FIRSTDAYOFWEEK` for the language otherwise (Sunday for `en-US`, Monday
/// for `de`) — the same table `MaterialLocalizations.firstDayOfWeekIndex` reads.
int firstDayOfWeek(String locale) {
  if (calendarOf(locale) == LumoCalendarSystem.jalali) return DateTime.saturday;
  // intl: 0 = Monday .. 6 = Sunday.
  return _symbolsFor(locale).FIRSTDAYOFWEEK + 1;
}

/// The locale tag intl resolves for `locale`, with its date symbols loaded.
String _intlTag(String locale) => _symbolsFor(locale).NAME;

Map<String, DateSymbols>? _allSymbols;
Map<String, Map<String, String>>? _allPatterns;

/// intl's date symbols for `locale`. `initializeDateFormatting()` (idempotent,
/// completes synchronously) loads the whole table when nothing has; when the
/// app's `flutter_localizations` delegates pre-loaded ONLY their locales, a
/// Lumo locale outside that set is filled in from intl's own table, so a
/// `LumoScope` locale never throws `LocaleDataException`. Falls back to `en`
/// for a language intl does not carry.
DateSymbols _symbolsFor(String locale) {
  intl_local.initializeDateFormatting();
  final tag = formatLocale(_bareTag(locale));
  var resolved = Intl.verifiedLocale(tag, DateFormat.localeExists, onFailure: (_) => '');
  if (resolved == null || resolved.isEmpty) {
    final all = _allSymbols ??= intl_local.dateTimeSymbolMap();
    final patterns = _allPatterns ??= intl_patterns.dateTimePatternMap();
    resolved = Intl.verifiedLocale(tag, all.containsKey, onFailure: (_) => 'en')!;
    intl_custom.initializeDateFormattingCustom(locale: resolved, symbols: all[resolved], patterns: patterns[resolved]);
  }
  return DateFormat.yMd(resolved).dateSymbols;
}
