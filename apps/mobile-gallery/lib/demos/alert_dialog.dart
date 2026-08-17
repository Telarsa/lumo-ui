// Demos for the `alert-dialog` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'alert-dialog-1': alertDialogBasic,
  'alert-dialog-2': alertDialogDestructive,
};

const copy = <String, Map<String, String>>{
  'publishQuestion': {'fa-IR': 'انتشار این نسخه؟', 'en-US': 'Publish this version?'},
  'publishBody': {
    'fa-IR': 'پس از انتشار همهٔ اعضای تیم آن را می‌بینند.',
    'en-US': 'Once published, everyone on the team sees it.',
  },
  'publishConfirm': {'fa-IR': 'منتشر کن', 'en-US': 'Publish it'},
  'notNow': {'fa-IR': 'فعلاً نه', 'en-US': 'Not now'},
  'publish': {'fa-IR': 'انتشار', 'en-US': 'Publish'},
  'deleteQuestion': {'fa-IR': 'حذف این پروژه؟', 'en-US': 'Delete this project?'},
  'deleteBody': {
    'fa-IR': 'همهٔ فایل‌ها و تاریخچه پاک می‌شوند. این کار برگشت‌پذیر نیست.',
    'en-US': 'Every file and all of the history go. This cannot be undone.',
  },
  'deleteProject': {'fa-IR': 'حذف پروژه', 'en-US': 'Delete the project'},
  'cancel': {'fa-IR': 'انصراف', 'en-US': 'Cancel'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'alert-dialog-1': {
    'title': {'fa-IR': 'گفت‌وگوی هشدار', 'en-US': 'Alert dialog'},
    'description': {
      'fa-IR': 'کار را قطع می‌کند تا تصمیمی گرفته شود و دقیقاً دو راه بیرون‌رفت می‌گذارد: ✕ ندارد و closeLabel نمی‌گیرد.',
      'en-US': 'It interrupts to force a decision and leaves exactly two ways out: no ✕, and it takes no closeLabel.',
    },
  },
  'alert-dialog-2': {
    'title': {'fa-IR': 'ویرانگر', 'en-US': 'Destructive'},
    'description': {
      'fa-IR': 'isDestructive فعلِ تأیید را به رنگ خطر می‌برد؛ هر دو فعل اجباری‌اند، چون همان‌ها راه‌های خروج‌اند.',
      'en-US': 'isDestructive paints the confirming verb critical; both verbs are required, because they are the ways out.',
    },
  },
};

Widget alertDialogBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN alert-dialog-1
  return LumoAlertDialogTrigger(
    label: t['publishQuestion'],
    description: t['publishBody'],
    confirmLabel: t['publishConfirm'],
    cancelLabel: t['notNow'],
    onConfirm: () {},
    trigger: (ask) => LumoButton(
      onPressed: ask,
      child: Text(t['publish']),
    ),
  );
  // END alert-dialog-1
}

Widget alertDialogDestructive(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN alert-dialog-2
  return LumoAlertDialogTrigger(
    label: t['deleteQuestion'],
    description: t['deleteBody'],
    confirmLabel: t['deleteProject'],
    cancelLabel: t['cancel'],
    isDestructive: true,
    onConfirm: () {},
    trigger: (ask) => LumoButton(
      onPressed: ask,
      variant: LumoButtonVariant.critical,
      child: Text(t['deleteProject']),
    ),
  );
  // END alert-dialog-2
}
