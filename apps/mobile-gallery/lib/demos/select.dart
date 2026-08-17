// Demos for the `select` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'select-1': selectBasic,
  'select-2': selectInvalid,
};

const copy = <String, Map<String, String>>{
  'province': {'fa-IR': 'استان', 'en-US': 'Province'},
  'pickProvince': {'fa-IR': 'یک استان انتخاب کنید', 'en-US': 'Choose a province'},
  'closeProvinces': {'fa-IR': 'بستن فهرست استان‌ها', 'en-US': 'Close the province list'},
  'citiesLoad': {
    'fa-IR': 'شهرها پس از انتخاب استان بارگذاری می‌شوند.',
    'en-US': 'Cities load once a province is chosen.',
  },
  'tehran': {'fa-IR': 'تهران', 'en-US': 'Tehran'},
  'isfahan': {'fa-IR': 'اصفهان', 'en-US': 'Isfahan'},
  'fars': {'fa-IR': 'فارس', 'en-US': 'Fars'},
  'payMethod': {'fa-IR': 'روش پرداخت', 'en-US': 'Payment method'},
  'choose': {'fa-IR': 'انتخاب کنید', 'en-US': 'Choose one'},
  'closePayMethods': {'fa-IR': 'بستن فهرست روش‌های پرداخت', 'en-US': 'Close the payment method list'},
  'pickPayMethod': {'fa-IR': 'یک روش پرداخت انتخاب کنید.', 'en-US': 'Choose a payment method.'},
  'card': {'fa-IR': 'کارت بانکی', 'en-US': 'Bank card'},
  'wallet': {'fa-IR': 'کیف پول', 'en-US': 'Wallet'},
  'cashOnDelivery': {'fa-IR': 'پرداخت در محل', 'en-US': 'Cash on delivery'},
  'currency': {'fa-IR': 'ارز', 'en-US': 'Currency'},
  'rial': {'fa-IR': 'ریال', 'en-US': 'Rial'},
  'closeCurrencies': {'fa-IR': 'بستن فهرست ارزها', 'en-US': 'Close the currency list'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'select-1': {
    'title': {'fa-IR': 'انتخابگر', 'en-US': 'Select'},
    'description': {
      'fa-IR': 'یک گزینه از فهرستی بسته. closeLabel نام دکمهٔ بستن برگهٔ گزینه‌هاست و اجباری است.',
      'en-US': 'One option from a closed list. closeLabel names the option sheet’s close control and is required.',
    },
  },
  'select-2': {
    'title': {'fa-IR': 'خطا و ازکارافتاده', 'en-US': 'Error and disabled'},
    'description': {
      'fa-IR': 'گزینهٔ ازکارافتاده در فهرست می‌ماند و انتخاب نمی‌شود — پنهان‌کردنش پاسخ نیست.',
      'en-US': 'A disabled option stays in the list and cannot be picked — hiding it is not the answer.',
    },
  },
};

Widget selectBasic(BuildContext context) => const _SelectBasic();

class _SelectBasic extends StatefulWidget {
  const _SelectBasic();
  @override
  State<_SelectBasic> createState() => _SelectBasicState();
}

class _SelectBasicState extends State<_SelectBasic> {
  String? _province = 'isf';

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN select-1
    return LumoSelect(
      label: t['province'],
      placeholder: t['pickProvince'],
      closeLabel: t['closeProvinces'],
      description: t['citiesLoad'],
      value: _province,
      onChanged: (next) => setState(() => _province = next),
      options: [
        LumoSelectOption(id: 'thr', label: t['tehran']),
        LumoSelectOption(id: 'isf', label: t['isfahan']),
        LumoSelectOption(id: 'fas', label: t['fars']),
      ],
    );
    // END select-1
  }
}

Widget selectInvalid(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN select-2
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 16,
    children: [
      LumoSelect(
        label: t['payMethod'],
        placeholder: t['choose'],
        closeLabel: t['closePayMethods'],
        errorMessage: t['pickPayMethod'],
        options: [
          LumoSelectOption(id: 'card', label: t['card']),
          LumoSelectOption(id: 'wallet', label: t['wallet']),
          LumoSelectOption(id: 'cod', label: t['cashOnDelivery'], isDisabled: true),
        ],
      ),
      LumoSelect(
        label: t['currency'],
        placeholder: t['rial'],
        closeLabel: t['closeCurrencies'],
        isDisabled: true,
        options: [LumoSelectOption(id: 'irr', label: t['rial'])],
      ),
    ],
  );
  // END select-2
}
