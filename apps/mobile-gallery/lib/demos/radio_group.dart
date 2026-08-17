// Demos for the `radio-group` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'radio-group-1': radioGroupBasic,
  'radio-group-2': radioGroupHorizontal,
};

const copy = <String, Map<String, String>>{
  'shipping': {'fa-IR': 'روش ارسال', 'en-US': 'Shipping method'},
  'shippingHint': {
    'fa-IR': 'هزینه در گام بعد محاسبه می‌شود.',
    'en-US': 'The cost is worked out at the next step.',
  },
  'standard': {'fa-IR': 'پست عادی', 'en-US': 'Standard post'},
  'standardHint': {'fa-IR': 'سه تا پنج روز کاری', 'en-US': 'Three to five working days'},
  'express': {'fa-IR': 'پیشتاز', 'en-US': 'Express'},
  'expressHint': {'fa-IR': 'یک روز کاری', 'en-US': 'One working day'},
  'pickup': {'fa-IR': 'تحویل حضوری', 'en-US': 'Collect in person'},
  'size': {'fa-IR': 'اندازه', 'en-US': 'Size'},
  'pickSize': {'fa-IR': 'یک اندازه انتخاب کنید.', 'en-US': 'Choose a size.'},
  'small': {'fa-IR': 'کوچک', 'en-US': 'Small'},
  'medium': {'fa-IR': 'متوسط', 'en-US': 'Medium'},
  'large': {'fa-IR': 'بزرگ', 'en-US': 'Large'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'radio-group-1': {
    'title': {'fa-IR': 'گروه رادیویی', 'en-US': 'Radio group'},
    'description': {
      'fa-IR': 'دقیقاً یکی از چند گزینه. هر گزینه می‌تواند توضیح خودش را داشته باشد.',
      'en-US': 'Exactly one of several. Each option may carry its own description.',
    },
  },
  'radio-group-2': {
    'title': {'fa-IR': 'افقی و نادرست', 'en-US': 'Horizontal and invalid'},
    'description': {
      'fa-IR': 'چیدمان افقی برای گزینه‌های کوتاه؛ errorMessage گروه را نادرست می‌کند.',
      'en-US': 'The horizontal layout suits short options; errorMessage marks the group invalid.',
    },
  },
};

Widget radioGroupBasic(BuildContext context) => const _RadioGroupBasic();

class _RadioGroupBasic extends StatefulWidget {
  const _RadioGroupBasic();
  @override
  State<_RadioGroupBasic> createState() => _RadioGroupBasicState();
}

class _RadioGroupBasicState extends State<_RadioGroupBasic> {
  String _plan = 'standard';

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN radio-group-1
    return LumoRadioGroup(
      label: t['shipping'],
      description: t['shippingHint'],
      value: _plan,
      onChanged: (next) => setState(() => _plan = next),
      children: [
        LumoRadio(
          value: 'standard',
          label: t['standard'],
          description: t['standardHint'],
        ),
        LumoRadio(
          value: 'express',
          label: t['express'],
          description: t['expressHint'],
        ),
        LumoRadio(
          value: 'pickup',
          label: t['pickup'],
          isDisabled: true,
        ),
      ],
    );
    // END radio-group-1
  }
}

Widget radioGroupHorizontal(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN radio-group-2
  return LumoRadioGroup(
    label: t['size'],
    orientation: LumoRadioOrientation.horizontal,
    errorMessage: t['pickSize'],
    children: [
      LumoRadio(value: 'sm', label: t['small']),
      LumoRadio(value: 'md', label: t['medium']),
      LumoRadio(value: 'lg', label: t['large']),
    ],
  );
  // END radio-group-2
}
