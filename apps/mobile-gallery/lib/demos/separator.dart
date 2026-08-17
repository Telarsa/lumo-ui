// Demos for the `separator` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'separator-1': separatorBasic,
  'separator-2': separatorLabelled,
};

const copy = <String, Map<String, String>>{
  'paidOn': {'fa-IR': 'پرداخت‌شده در ۲۶ مرداد ۱۴۰۵', 'en-US': 'Paid on 17 August 2026'},
  'sentBy': {'fa-IR': 'ارسال با پست پیشتاز', 'en-US': 'Sent by express post'},
  'orWith': {'fa-IR': 'یا با این روش‌ها', 'en-US': 'Or use one of these'},
  'signInEmail': {'fa-IR': 'ورود با ایمیل', 'en-US': 'Sign in with email'},
  'signInSms': {'fa-IR': 'ورود با پیامک', 'en-US': 'Sign in by text'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'separator-1': {
    'title': {'fa-IR': 'جداکننده', 'en-US': 'Separator'},
    'description': {
      'fa-IR': 'یک خط میان دو دسته. بدون label تزیینی است و در درخت دسترس‌پذیری چیزی نمی‌گوید.',
      'en-US': 'A rule between two groups. Without a label it is decorative and says nothing in the accessibility tree.',
    },
  },
  'separator-2': {
    'title': {'fa-IR': 'برچسب‌دار و عمودی', 'en-US': 'Labelled and vertical'},
    'description': {
      'fa-IR': 'label جداکننده را به یک مرز نام‌دار تبدیل می‌کند؛ حالت عمودی برای جداکردن دو ستون است.',
      'en-US': 'label turns the rule into a named boundary; the vertical form separates two columns.',
    },
  },
};

Widget separatorBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN separator-1
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 12,
    children: [
      Text(t['paidOn']),
      const LumoSeparator(),
      Text(t['sentBy']),
    ],
  );
  // END separator-1
}

Widget separatorLabelled(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN separator-2
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 12,
    children: [
      LumoSeparator(label: t['orWith']),
      SizedBox(
        height: 40,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          spacing: 12,
          children: [
            Text(t['signInEmail']),
            const LumoSeparator(orientation: LumoSeparatorOrientation.vertical),
            Text(t['signInSms']),
          ],
        ),
      ),
    ],
  );
  // END separator-2
}
