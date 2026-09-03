// The Jalali arithmetic, pinned to known dates (Nowruz 1405 = 21 March 2026,
// the 1979 revolution = 22 Bahman 1357, …), round-tripped over 21 years, and
// the leap table checked against the published one; then the formatter under
// fa-IR, en-US and an `en-u-ca-persian` tag.
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

void main() {
  test('known conversions, Gregorian → Jalali and back', () {
    const known = {
      (2026, 3, 21): (1405, 1, 1),
      (2026, 8, 17): (1405, 5, 26),
      (2025, 3, 20): (1403, 12, 30),
      (2024, 3, 20): (1403, 1, 1),
      (2021, 3, 21): (1400, 1, 1),
      (1979, 2, 11): (1357, 11, 22),
      (2000, 1, 1): (1378, 10, 11),
    };
    known.forEach((g, j) {
      final date = DateTime(g.$1, g.$2, g.$3);
      final jalali = JalaliDate.fromDateTime(date);
      expect(jalali, JalaliDate(j.$1, j.$2, j.$3), reason: '$date');
      expect(jalali.toDateTime(), date, reason: '${JalaliDate(j.$1, j.$2, j.$3)}');
    });
    expect(JalaliDate.fromDateTime(DateTime(2026, 3, 21)).toString(), '1405-01-01');
  });

  test('round trips over every day of 1390..1410', () {
    var d = const JalaliDate(1390, 1, 1);
    while (d.year <= 1410) {
      expect(JalaliDate.fromDateTime(d.toDateTime()), d, reason: '$d');
      expect(d.isValid, isTrue);
      final next = d.add(1);
      expect(next.toDateTime().difference(d.toDateTime()).inHours, inInclusiveRange(23, 25), reason: '$d');
      d = next;
    }
    // And by Gregorian days, the other way round.
    var g = DateTime(2011, 3, 21);
    final end = DateTime(2032, 3, 20);
    while (!g.isAfter(end)) {
      expect(JalaliDate.fromDateTime(g).toDateTime(), g, reason: '$g');
      g = DateTime(g.year, g.month, g.day + 1);
    }
  });

  test('leap years in 1370..1410 are exactly the published ones', () {
    final leaps = [for (var y = 1370; y <= 1410; y++) if (JalaliDate.isLeapYear(y)) y];
    expect(leaps, [1370, 1375, 1379, 1383, 1387, 1391, 1395, 1399, 1403, 1408]);
    expect(JalaliDate.monthLengthOf(1403, 12), 30);
    expect(JalaliDate.monthLengthOf(1404, 12), 29);
    expect(JalaliDate.monthLengthOf(1405, 1), 31);
    expect(JalaliDate.monthLengthOf(1405, 7), 30);
    expect(const JalaliDate(1404, 12, 30).isValid, isFalse);
  });

  test('weekday: Saturday = 1 … Friday = 7; add/copyWith/compare/hash', () {
    // 2026-08-22 is a Saturday.
    expect(DateTime(2026, 8, 22).weekday, DateTime.saturday);
    final sat = JalaliDate.fromDateTime(DateTime(2026, 8, 22));
    expect(sat.weekday, 1);
    expect(sat.add(1).weekday, 2);
    expect(sat.add(6).weekday, 7);
    expect(persianWeekdayNames[sat.weekday - 1], 'شنبه');
    expect(persianWeekdayShortNames[sat.add(6).weekday - 1], 'ج');
    expect(const JalaliDate(1405, 6, 31).add(1), const JalaliDate(1405, 7, 1));
    expect(const JalaliDate(1404, 12, 29).add(1), const JalaliDate(1405, 1, 1));
    expect(const JalaliDate(1405, 1, 1).add(-1), const JalaliDate(1404, 12, 29));
    expect(const JalaliDate(1405, 5, 26).copyWith(month: 6), const JalaliDate(1405, 6, 26));
    expect(const JalaliDate(1405, 5, 26).compareTo(const JalaliDate(1405, 6, 1)), lessThan(0));
    expect(const JalaliDate(1405, 5, 26) < const JalaliDate(1406, 1, 1), isTrue);
    expect(const JalaliDate(1405, 5, 26).hashCode, const JalaliDate(1405, 5, 26).hashCode);
    expect({JalaliDate.fromDateTime(DateTime(2026, 8, 17)), const JalaliDate(1405, 5, 26)}.length, 1);
  });

  test('calendarOf: the web rule — fa → Jalali, a stated -u-ca- wins, else Gregorian', () {
    expect(calendarOf('fa'), LumoCalendarSystem.jalali);
    expect(calendarOf('fa-IR'), LumoCalendarSystem.jalali);
    expect(calendarOf('fa-AF'), LumoCalendarSystem.jalali);
    expect(calendarOf('fa_IR'), LumoCalendarSystem.jalali);
    expect(calendarOf('en-u-ca-persian'), LumoCalendarSystem.jalali);
    expect(calendarOf('en-US-u-ca-persian'), LumoCalendarSystem.jalali);
    expect(calendarOf('fa-IR-u-ca-gregory'), LumoCalendarSystem.gregorian);
    expect(calendarOf('en-US'), LumoCalendarSystem.gregorian);
    expect(calendarOf('de'), LumoCalendarSystem.gregorian);
    expect(calendarOf('ar-EG'), LumoCalendarSystem.gregorian);
    expect(calendarOf('ps-AF'), LumoCalendarSystem.gregorian);
  });

  test('formatLumoDate: Jalali in Persian, Gregorian through intl, Jalali in English', () {
    final d = DateTime(2026, 8, 17);
    expect(formatLumoDate(d, 'fa-IR'), '۲۶ مرداد ۱۴۰۵');
    expect(formatLumoDate(d, 'fa-IR', style: LumoDateStyle.short), '۱۴۰۵/۵/۲۶');
    expect(formatLumoDate(d, 'fa-IR', style: LumoDateStyle.long), 'دوشنبه ۲۶ مرداد ۱۴۰۵');
    expect(formatLumoDate(d, 'en-US'), 'Aug 17, 2026');
    expect(formatLumoDate(d, 'en-US', style: LumoDateStyle.long), 'Monday, August 17, 2026');
    expect(formatLumoDate(d, 'en-u-ca-persian'), '26 Mordad 1405');
    expect(formatLumoDate(d, 'en-u-ca-persian', style: LumoDateStyle.long), 'Monday, 26 Mordad 1405');
    expect(formatLumoDate(d, 'de'), '17. Aug. 2026');
  });

  // The year is the noisiest part of a date and usually already known — a
  // diary header wants «۲۶ مرداد», not «۲۶ مرداد ۱۴۰۵». Consumers were
  // composing this by hand from an English month-name array, which is
  // precisely the code that breaks under a non-Gregorian calendar.
  test('formatLumoDate: dayMonth drops the year in both calendars', () {
    final d = DateTime(2026, 8, 17);
    expect(formatLumoDate(d, 'fa-IR', style: LumoDateStyle.dayMonth),
        '۲۶ مرداد');
    expect(formatLumoDate(d, 'en-US', style: LumoDateStyle.dayMonth),
        'August 17');
    expect(formatLumoDate(d, 'en-u-ca-persian', style: LumoDateStyle.dayMonth),
        '26 Mordad');
    expect(formatLumoDate(d, 'de', style: LumoDateStyle.dayMonth), '17. August');

    // No year anywhere in the output, in any calendar — the whole point.
    for (final locale in ['fa-IR', 'en-US', 'de', 'en-u-ca-persian']) {
      final out = formatLumoDate(d, locale, style: LumoDateStyle.dayMonth);
      expect(out, isNot(contains('2026')), reason: locale);
      expect(out, isNot(contains('1405')), reason: locale);
      expect(out, isNot(contains('۱۴۰۵')), reason: locale);
    }
    expect(formatJalaliMonth(1405, 5, 'fa-IR'), 'مرداد ۱۴۰۵');
    expect(formatJalaliMonth(1405, 5, 'en'), 'Mordad 1405');
    expect(formatGregorianMonth(2026, 8, 'en-US'), 'August 2026');
    expect(jalaliMonthName(1, 'fa-IR'), 'فروردین');
    expect(jalaliMonthName(12, 'en'), 'Esfand');
  });

  test('weekday names and the first day of the week follow language and calendar', () {
    final mon = DateTime(2026, 8, 17);
    expect(weekdayName(mon, 'fa-IR'), 'دوشنبه');
    expect(weekdayName(mon, 'fa-IR', short: true), 'د');
    expect(weekdayName(mon, 'en-US'), 'Monday');
    expect(weekdayName(mon, 'en-u-ca-persian'), 'Monday');
    expect(weekdayName(DateTime(2026, 8, 23), 'en-US', short: true), 'S');
    expect(firstDayOfWeek('fa-IR'), DateTime.saturday);
    expect(firstDayOfWeek('en-u-ca-persian'), DateTime.saturday);
    expect(firstDayOfWeek('en-US'), DateTime.sunday);
    expect(firstDayOfWeek('de'), DateTime.monday);
  });
}
