// Demos for the `date-field` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'date-field-1': dateFieldBasic,
  'date-field-2': dateFieldBounded,
};

const copy = <String, Map<String, String>>{
  'birthDate': {'fa-IR': 'تاریخ تولد', 'en-US': 'Date of birth'},
  'openCalendar': {'fa-IR': 'باز کردن تقویم', 'en-US': 'Open the calendar'},
  'closeCalendar': {'fa-IR': 'بستن تقویم', 'en-US': 'Close the calendar'},
  'previousMonth': {'fa-IR': 'ماه پیش', 'en-US': 'Previous month'},
  'nextMonth': {'fa-IR': 'ماه بعد', 'en-US': 'Next month'},
  'today': {'fa-IR': 'امروز', 'en-US': 'Today'},
  'pickADay': {'fa-IR': 'یک روز انتخاب کنید', 'en-US': 'Choose a day'},
  'travelDate': {'fa-IR': 'تاریخ سفر', 'en-US': 'Travel date'},
  'openTravelCalendar': {'fa-IR': 'باز کردن تقویم سفر', 'en-US': 'Open the travel calendar'},
  'untilYearEnd': {
    'fa-IR': 'فقط تا پایان سال میلادی جاری.',
    'en-US': 'Only up to the end of this calendar year.',
  },
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'date-field-1': {
    'title': {'fa-IR': 'ورودی تاریخ', 'en-US': 'Date field'},
    'description': {
      'fa-IR': 'تقویم از locale می‌آید: fa جلالی است و هفته‌اش از شنبه شروع می‌شود. intl فقط میلادی می‌داند، پس تقویم از آنِ خود Lumo است.',
      'en-US': 'The calendar comes from the locale: fa is Jalali and its week starts on Saturday. intl only knows Gregorian, so the calendar is Lumo’s own.',
    },
  },
  'date-field-2': {
    'title': {'fa-IR': 'با کران و سبک بلند', 'en-US': 'Bounded, long style'},
    'description': {
      'fa-IR': 'minDate و maxDate روزهای بیرون بازه را ازکار می‌اندازند؛ style سبک نوشتن تاریخ را می‌گوید.',
      'en-US': 'minDate and maxDate disable the days outside the range; style states how the date is written.',
    },
  },
};

Widget dateFieldBasic(BuildContext context) => const _DateFieldBasic();

class _DateFieldBasic extends StatefulWidget {
  const _DateFieldBasic();
  @override
  State<_DateFieldBasic> createState() => _DateFieldBasicState();
}

class _DateFieldBasicState extends State<_DateFieldBasic> {
  DateTime? _date = DateTime(2026, 8, 17);

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN date-field-1
    return LumoDateField(
      label: t['birthDate'],
      openLabel: t['openCalendar'],
      closeLabel: t['closeCalendar'],
      previousMonthLabel: t['previousMonth'],
      nextMonthLabel: t['nextMonth'],
      todayLabel: t['today'],
      placeholder: t['pickADay'],
      value: _date,
      onChanged: (next) => setState(() => _date = next),
    );
    // END date-field-1
  }
}

Widget dateFieldBounded(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN date-field-2
  return LumoDateField(
    label: t['travelDate'],
    openLabel: t['openTravelCalendar'],
    closeLabel: t['closeCalendar'],
    previousMonthLabel: t['previousMonth'],
    nextMonthLabel: t['nextMonth'],
    todayLabel: t['today'],
    isRequired: true,
    style: LumoDateStyle.long,
    minDate: DateTime(2026, 8, 17),
    maxDate: DateTime(2026, 12, 31),
    description: t['untilYearEnd'],
    value: DateTime(2026, 9, 2),
  );
  // END date-field-2
}
