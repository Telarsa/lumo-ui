// Demos for the `toast` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'toast-1': toastBasic,
  'toast-2': toastWithAction,
};

const copy = <String, Map<String, String>>{
  'saved': {'fa-IR': 'تغییرات ذخیره شد.', 'en-US': 'Your changes were saved.'},
  'closeMessage': {'fa-IR': 'بستن پیام', 'en-US': 'Close the message'},
  'save': {'fa-IR': 'ذخیره', 'en-US': 'Save'},
  'archived': {'fa-IR': 'پیام به بایگانی رفت.', 'en-US': 'The message went to the archive.'},
  'undo': {'fa-IR': 'برگرداندن', 'en-US': 'Undo'},
  'archive': {'fa-IR': 'بایگانی', 'en-US': 'Archive'},
  'sendFailed': {'fa-IR': 'ارسال ناموفق بود.', 'en-US': 'Sending failed.'},
  'send': {'fa-IR': 'ارسال', 'en-US': 'Send'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'toast-1': {
    'title': {'fa-IR': 'نان تُست', 'en-US': 'Toast'},
    'description': {
      'fa-IR': 'یک خبر گذرا در ناحیه‌ای زنده، در سرِ پایین صفحه. بیشتر از سه‌تا هم‌زمان نمی‌ماند.',
      'en-US': 'A passing notice in a live region, at the bottom of the reading axis. Never more than three at once.',
    },
  },
  'toast-2': {
    'title': {'fa-IR': 'با کنش و آهنگ', 'en-US': 'With an action and a tone'},
    'description': {
      'fa-IR': 'actionLabel نام کنش است و اجباری می‌شود وقتی onAction هست؛ closeLabel همیشه اجباری است.',
      'en-US': 'actionLabel names the action and is required once onAction exists; closeLabel is always required.',
    },
  },
};

Widget toastBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN toast-1
  return LumoButton(
    onPressed: () => showLumoToast(
      context,
      message: t['saved'],
      closeLabel: t['closeMessage'],
    ),
    child: Text(t['save']),
  );
  // END toast-1
}

Widget toastWithAction(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN toast-2
  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    spacing: 8,
    children: [
      LumoButton(
        onPressed: () => showLumoToast(
          context,
          message: t['archived'],
          closeLabel: t['closeMessage'],
          actionLabel: t['undo'],
          onAction: () {},
        ),
        variant: LumoButtonVariant.outline,
        child: Text(t['archive']),
      ),
      LumoButton(
        onPressed: () => showLumoToast(
          context,
          message: t['sendFailed'],
          closeLabel: t['closeMessage'],
          tone: LumoToastTone.critical,
          duration: const Duration(seconds: 6),
        ),
        variant: LumoButtonVariant.critical,
        child: Text(t['send']),
      ),
    ],
  );
  // END toast-2
}
