// Demos for the `tooltip` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'tooltip-1': tooltipBasic,
  'tooltip-2': tooltipPlacement,
};

const copy = <String, Map<String, String>>{
  'reportRefresh': {
    'fa-IR': 'این گزارش هر شب ساعت دو بامداد به‌روز می‌شود.',
    'en-US': 'This report refreshes every night at two in the morning.',
  },
  'reportInfo': {'fa-IR': 'اطلاعات گزارش', 'en-US': 'Report information'},
  'opensAbove': {'fa-IR': 'بالا باز می‌شود', 'en-US': 'Opens above'},
  'above': {'fa-IR': 'بالا', 'en-US': 'Above'},
  'opensBelow': {
    'fa-IR': 'پایین باز می‌شود، با نیم‌ثانیه درنگ',
    'en-US': 'Opens below, after half a second',
  },
  'below': {'fa-IR': 'پایین', 'en-US': 'Below'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'tooltip-1': {
    'title': {'fa-IR': 'راهنمای ابزار', 'en-US': 'Tooltip'},
    'description': {
      'fa-IR': 'یک توضیح کوتاه روی نگه‌داشتن انگشت. راهنمای ابزار جای نام اعلام‌شده را نمی‌گیرد؛ دکمه همچنان label خودش را دارد.',
      'en-US': 'A short note on a long press. A tooltip never replaces the announced name; the button still carries its own label.',
    },
  },
  'tooltip-2': {
    'title': {'fa-IR': 'جایگاه و تأخیر', 'en-US': 'Placement and delay'},
    'description': {
      'fa-IR': 'placement بالا یا پایین است — نه چپ و راست، که در راست‌به‌چپ معنایشان جابه‌جا می‌شود.',
      'en-US': 'placement is top or bottom — never left or right, whose meaning swaps under RTL.',
    },
  },
};

Widget tooltipBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN tooltip-1
  return LumoTooltip(
    message: t['reportRefresh'],
    child: LumoIconButton(
      label: t['reportInfo'],
      onPressed: () {},
      child: const Icon(Icons.info_outline),
    ),
  );
  // END tooltip-1
}

Widget tooltipPlacement(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN tooltip-2
  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    spacing: 12,
    children: [
      LumoTooltip(
        message: t['opensAbove'],
        child: LumoButton(
          onPressed: () {},
          variant: LumoButtonVariant.outline,
          child: Text(t['above']),
        ),
      ),
      LumoTooltip(
        message: t['opensBelow'],
        placement: LumoTooltipPlacement.bottom,
        delay: const Duration(milliseconds: 500),
        child: LumoButton(
          onPressed: () {},
          variant: LumoButtonVariant.outline,
          child: Text(t['below']),
        ),
      ),
    ],
  );
  // END tooltip-2
}
