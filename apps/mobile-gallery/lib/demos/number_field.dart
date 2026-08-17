// Demos for the `number-field` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'number-field-1': numberFieldBasic,
  'number-field-2': numberFieldBounded,
};

const copy = <String, Map<String, String>>{
  'quantity': {'fa-IR': 'تعداد', 'en-US': 'Quantity'},
  'oneMore': {'fa-IR': 'یکی بیشتر', 'en-US': 'One more'},
  'oneFewer': {'fa-IR': 'یکی کمتر', 'en-US': 'One fewer'},
  'nights': {'fa-IR': 'مدت اقامت (شب)', 'en-US': 'Length of stay (nights)'},
  'oneNightMore': {'fa-IR': 'یک شب بیشتر', 'en-US': 'One night more'},
  'oneNightFewer': {'fa-IR': 'یک شب کمتر', 'en-US': 'One night fewer'},
  'nightsRange': {'fa-IR': 'بین ۱ تا ۱۴ شب.', 'en-US': 'Between one and fourteen nights.'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'number-field-1': {
    'title': {'fa-IR': 'ورودی عددی', 'en-US': 'Number field'},
    'description': {
      'fa-IR': 'دو دکمهٔ کم و زیاد، هر دو با نام اعلام‌شدهٔ اجباری. عدد با ارقام محلی نوشته می‌شود.',
      'en-US': 'A step down and a step up, both with a required announced name. The number renders in the locale’s numerals.',
    },
  },
  'number-field-2': {
    'title': {'fa-IR': 'کران‌دار و با گام', 'en-US': 'Bounded, with a step'},
    'description': {
      'fa-IR': 'min و max دکمه‌ها را در دو سر بازه ازکار می‌اندازند؛ step اندازهٔ هر پرش است.',
      'en-US': 'min and max disable the steppers at each end; step is how far one press moves.',
    },
  },
};

Widget numberFieldBasic(BuildContext context) => const _NumberFieldBasic();

class _NumberFieldBasic extends StatefulWidget {
  const _NumberFieldBasic();
  @override
  State<_NumberFieldBasic> createState() => _NumberFieldBasicState();
}

class _NumberFieldBasicState extends State<_NumberFieldBasic> {
  num? _count = 3;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN number-field-1
    return LumoNumberField(
      label: t['quantity'],
      incrementLabel: t['oneMore'],
      decrementLabel: t['oneFewer'],
      value: _count,
      onChanged: (next) => setState(() => _count = next),
    );
    // END number-field-1
  }
}

Widget numberFieldBounded(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN number-field-2
  return LumoNumberField(
    label: t['nights'],
    incrementLabel: t['oneNightMore'],
    decrementLabel: t['oneNightFewer'],
    defaultValue: 2,
    min: 1,
    max: 14,
    step: 1,
    description: t['nightsRange'],
  );
  // END number-field-2
}
