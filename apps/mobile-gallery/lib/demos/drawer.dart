// Demos for the `drawer` slug — the web's Drawer, which on mobile is a bottom
// sheet: `LumoSheetTrigger`.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'drawer-1': drawerBasic,
  'drawer-2': drawerNonDismissible,
};

const copy = <String, Map<String, String>>{
  'sortResults': {'fa-IR': 'مرتب‌سازی نتایج', 'en-US': 'Sort the results'},
  'closeSort': {'fa-IR': 'بستن برگهٔ مرتب‌سازی', 'en-US': 'Close the sort sheet'},
  'sortHint': {
    'fa-IR': 'ترتیب نمایش محصول‌ها را انتخاب کنید.',
    'en-US': 'Choose the order the products appear in.',
  },
  'sort': {'fa-IR': 'مرتب‌سازی', 'en-US': 'Sort'},
  'order': {'fa-IR': 'ترتیب', 'en-US': 'Order'},
  'newest': {'fa-IR': 'تازه‌ترین', 'en-US': 'Newest'},
  'cheapest': {'fa-IR': 'ارزان‌ترین', 'en-US': 'Cheapest'},
  'bestSelling': {'fa-IR': 'پرفروش‌ترین', 'en-US': 'Best selling'},
  'verifyNumber': {'fa-IR': 'تأیید شمارهٔ همراه', 'en-US': 'Verify your mobile number'},
  'closeVerify': {'fa-IR': 'بستن برگهٔ تأیید', 'en-US': 'Close the verification sheet'},
  'verify': {'fa-IR': 'تأیید شماره', 'en-US': 'Verify the number'},
  'smsCode': {'fa-IR': 'کد پیامک‌شده', 'en-US': 'The texted code'},
  'digit': {'fa-IR': 'رقم', 'en-US': 'Digit'},
  'of': {'fa-IR': 'از', 'en-US': 'of'},
  'confirm': {'fa-IR': 'تأیید', 'en-US': 'Confirm'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'drawer-1': {
    'title': {'fa-IR': 'برگهٔ پایینی', 'en-US': 'Bottom sheet'},
    'description': {
      'fa-IR': 'مسیر از آنِ Lumo است، نه showModalBottomSheet متریال — که مسیر و پرده‌اش را به انگلیسی می‌نامد.',
      'en-US': 'The route is Lumo’s, not Material’s showModalBottomSheet — which names its route and barrier in English.',
    },
  },
  'drawer-2': {
    'title': {'fa-IR': 'بدون بستن با ضربه', 'en-US': 'Not dismissible by tap'},
    'description': {
      'fa-IR': 'isDismissible: false ضربه روی پرده را بی‌اثر می‌کند؛ closeLabel همچنان راه بیرون‌رفت را نام می‌برد.',
      'en-US': 'isDismissible: false makes a tap on the barrier inert; closeLabel still names the way out.',
    },
  },
};

Widget drawerBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN drawer-1
  return LumoSheetTrigger(
    label: t['sortResults'],
    closeLabel: t['closeSort'],
    description: t['sortHint'],
    trigger: (open) => LumoButton(
      onPressed: open,
      variant: LumoButtonVariant.outline,
      child: Text(t['sort']),
    ),
    body: (context) => LumoRadioGroup(
      label: t['order'],
      defaultValue: 'newest',
      children: [
        LumoRadio(value: 'newest', label: t['newest']),
        LumoRadio(value: 'cheapest', label: t['cheapest']),
        LumoRadio(value: 'popular', label: t['bestSelling']),
      ],
    ),
  );
  // END drawer-1
}

Widget drawerNonDismissible(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN drawer-2
  return LumoSheetTrigger(
    label: t['verifyNumber'],
    closeLabel: t['closeVerify'],
    isDismissible: false,
    trigger: (open) => LumoButton(
      onPressed: open,
      child: Text(t['verify']),
    ),
    body: (context) => LumoOtpField(
      label: t['smsCode'],
      cellLabel: (index, length) => '${t['digit']} ${index + 1} ${t['of']} $length',
    ),
    actions: (context) => [
      LumoButton(
        onPressed: () => Navigator.of(context).pop(),
        child: Text(t['confirm']),
      ),
    ],
  );
  // END drawer-2
}
