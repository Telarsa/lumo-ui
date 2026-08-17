// Demos for the `input-group` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'input-group-1': inputGroupSuffix,
  'input-group-2': inputGroupButton,
};

const copy = <String, Map<String, String>>{
  'amount': {'fa-IR': 'مبلغ', 'en-US': 'Amount'},
  'toman': {'fa-IR': 'تومان', 'en-US': 'IRT'},
  'amountHint': {'fa-IR': 'کارمزد جداگانه حساب می‌شود.', 'en-US': 'The fee is charged separately.'},
  'pageUrl': {'fa-IR': 'نشانی صفحه', 'en-US': 'Page address'},
  'copyUrl': {'fa-IR': 'رونوشت نشانی', 'en-US': 'Copy the address'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'input-group-1': {
    'title': {'fa-IR': 'واحد چسبیده به ورودی', 'en-US': 'A unit joined to the field'},
    'description': {
      'fa-IR':
          'واحد داخل همان کادر می‌نشیند، نه کنارش. isNumeric رقم‌ها را در متن راست‌به‌چپ، چپ‌به‌راست نگه می‌دارد.',
      'en-US':
          'The unit sits inside the one border, not beside it. isNumeric keeps the digits LTR inside RTL text.',
    },
  },
  'input-group-2': {
    'title': {'fa-IR': 'دکمه در انتهای ورودی', 'en-US': 'A button at the field’s end'},
    'description': {
      'fa-IR': 'دکمه نام خودش را دارد؛ نماد نام نیست. انتها از زبان می‌آید، نه از چپ و راست.',
      'en-US': 'The button carries its own name — an icon is not one. “End” comes from the language.',
    },
  },
};

Widget inputGroupSuffix(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN input-group-1
  return LumoInputGroup(
    label: t['amount'],
    isNumeric: true,
    description: t['amountHint'],
    trailing: Text(t['toman']),
  );
  // END input-group-1
}

Widget inputGroupButton(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN input-group-2
  return LumoInputGroup(
    label: t['pageUrl'],
    trailing: LumoInputGroupButton(
      label: t['copyUrl'],
      onPressed: () {},
      child: const Icon(Icons.copy_outlined),
    ),
  );
  // END input-group-2
}
