// Demos for the `time-field` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'time-field-1': timeFieldBasic,
  'time-field-2': timeFieldFineGrained,
};

const copy = <String, Map<String, String>>{
  'appointmentTime': {'fa-IR': 'ساعت نوبت', 'en-US': 'Appointment time'},
  'openTimePicker': {'fa-IR': 'باز کردن انتخابگر ساعت', 'en-US': 'Open the time picker'},
  'closeTimePicker': {'fa-IR': 'بستن انتخابگر ساعت', 'en-US': 'Close the time picker'},
  'hour': {'fa-IR': 'ساعت', 'en-US': 'Hour'},
  'minute': {'fa-IR': 'دقیقه', 'en-US': 'Minute'},
  'pickATime': {'fa-IR': 'یک ساعت انتخاب کنید', 'en-US': 'Choose a time'},
  'reminderTime': {'fa-IR': 'ساعت یادآوری', 'en-US': 'Reminder time'},
  'reminderHint': {
    'fa-IR': 'یادآوری روی همهٔ دستگاه‌های شما اجرا می‌شود.',
    'en-US': 'The reminder fires on every one of your devices.',
  },
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'time-field-1': {
    'title': {'fa-IR': 'ورودی ساعت', 'en-US': 'Time field'},
    'description': {
      'fa-IR': 'دو ستون: ساعت و دقیقه، هرکدام با نام اعلام‌شدهٔ خودش. قالب ۱۲ یا ۲۴ ساعته از locale می‌آید.',
      'en-US': 'Two columns, hour and minute, each with its own announced name. 12- or 24-hour comes from the locale.',
    },
  },
  'time-field-2': {
    'title': {'fa-IR': 'گام پنج‌دقیقه‌ای', 'en-US': 'Five-minute step'},
    'description': {
      'fa-IR': 'minuteStep فاصلهٔ دقیقه‌های پیشنهادی است؛ use24Hour قالب را صریح می‌کند.',
      'en-US': 'minuteStep is how far apart the offered minutes are; use24Hour states the format outright.',
    },
  },
};

Widget timeFieldBasic(BuildContext context) => const _TimeFieldBasic();

class _TimeFieldBasic extends StatefulWidget {
  const _TimeFieldBasic();
  @override
  State<_TimeFieldBasic> createState() => _TimeFieldBasicState();
}

class _TimeFieldBasicState extends State<_TimeFieldBasic> {
  TimeOfDay? _time = const TimeOfDay(hour: 9, minute: 30);

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN time-field-1
    return LumoTimeField(
      label: t['appointmentTime'],
      openLabel: t['openTimePicker'],
      closeLabel: t['closeTimePicker'],
      hourLabel: t['hour'],
      minuteLabel: t['minute'],
      placeholder: t['pickATime'],
      value: _time,
      onChanged: (next) => setState(() => _time = next),
    );
    // END time-field-1
  }
}

Widget timeFieldFineGrained(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN time-field-2
  return LumoTimeField(
    label: t['reminderTime'],
    openLabel: t['openTimePicker'],
    closeLabel: t['closeTimePicker'],
    hourLabel: t['hour'],
    minuteLabel: t['minute'],
    minuteStep: 5,
    use24Hour: true,
    value: const TimeOfDay(hour: 18, minute: 45),
    description: t['reminderHint'],
  );
  // END time-field-2
}
