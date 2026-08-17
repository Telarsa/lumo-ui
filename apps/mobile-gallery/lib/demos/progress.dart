// Demos for the `progress` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'progress-1': progressBasic,
  'progress-2': progressIndeterminate,
  'progress-3': progressTones,
};

const copy = <String, Map<String, String>>{
  'uploading': {'fa-IR': 'بارگذاری فایل', 'en-US': 'Uploading the file'},
  'sixtyTwoPercent': {'fa-IR': '۶۲ درصد', 'en-US': '62 percent'},
  'syncing': {'fa-IR': 'در حال همگام‌سازی', 'en-US': 'Syncing'},
  'loading': {'fa-IR': 'در حال بارگذاری', 'en-US': 'Loading'},
  'storageUsed': {'fa-IR': 'فضای مصرف‌شده', 'en-US': 'Storage used'},
  'eightyEightPercent': {'fa-IR': '۸۸ درصد', 'en-US': '88 percent'},
  'projectProgress': {'fa-IR': 'پیشرفت پروژه', 'en-US': 'Project progress'},
  'thirtyFivePercent': {'fa-IR': '۳۵ درصد', 'en-US': '35 percent'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'progress-1': {
    'title': {'fa-IR': 'نوار پیشرفت', 'en-US': 'Progress bar'},
    'description': {
      'fa-IR': 'value کسری میان صفر و یک است؛ valueLabel همان را به کلمه می‌گوید.',
      'en-US': 'value is a fraction between zero and one; valueLabel says it in words.',
    },
  },
  'progress-2': {
    'title': {'fa-IR': 'نامعین و چرخنده', 'en-US': 'Indeterminate and spinner'},
    'description': {
      'fa-IR': 'value برابر null یعنی «نمی‌دانیم چقدر مانده»؛ LumoSpinner همان خبر است در فضای تنگ.',
      'en-US': 'A null value means «we do not know how much is left»; LumoSpinner is the same news in a tight space.',
    },
  },
  'progress-3': {
    'title': {'fa-IR': 'آهنگ و اندازه', 'en-US': 'Tone and size'},
    'description': {
      'fa-IR': 'نوار از سرِ خواندن پر می‌شود — در فارسی از راست.',
      'en-US': 'The bar fills from the reading start — from the right, in Persian.',
    },
  },
};

Widget progressBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN progress-1
  return LumoProgress(
    label: t['uploading'],
    value: 0.62,
    valueLabel: t['sixtyTwoPercent'],
    showValue: true,
  );
  // END progress-1
}

Widget progressIndeterminate(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN progress-2
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 16,
    children: [
      LumoProgress(label: t['syncing'], value: null),
      Center(child: LumoSpinner(label: t['loading'], showLabel: true)),
    ],
  );
  // END progress-2
}

Widget progressTones(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN progress-3
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 16,
    children: [
      LumoProgress(
        label: t['storageUsed'],
        value: 0.88,
        valueLabel: t['eightyEightPercent'],
        showValue: true,
        tone: LumoProgressTone.caution,
        size: LumoProgressSize.lg,
      ),
      LumoProgress(
        label: t['projectProgress'],
        value: 0.35,
        valueLabel: t['thirtyFivePercent'],
        tone: LumoProgressTone.positive,
        size: LumoProgressSize.sm,
      ),
    ],
  );
  // END progress-3
}
