// Demos for the `dialog` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'dialog-1': dialogBasic,
  'dialog-2': dialogWithBody,
};

const copy = <String, Map<String, String>>{
  'aboutReport': {'fa-IR': 'دربارهٔ این گزارش', 'en-US': 'About this report'},
  'closeDialog': {'fa-IR': 'بستن گفت‌وگو', 'en-US': 'Close the dialog'},
  'reportRefresh': {
    'fa-IR': 'گزارش هر شب ساعت دو بامداد به‌روز می‌شود.',
    'en-US': 'The report refreshes every night at two in the morning.',
  },
  'gotIt': {'fa-IR': 'فهمیدم', 'en-US': 'Got it'},
  'inviteTeammate': {'fa-IR': 'دعوت هم‌تیمی', 'en-US': 'Invite a teammate'},
  'closeInvite': {'fa-IR': 'بستن گفت‌وگوی دعوت', 'en-US': 'Close the invite dialog'},
  'inviteHint': {
    'fa-IR': 'نشانی ایمیل او را بنویسید؛ دعوت‌نامه بی‌درنگ فرستاده می‌شود.',
    'en-US': 'Type their email address; the invitation goes out at once.',
  },
  'emailAddress': {'fa-IR': 'نشانی ایمیل', 'en-US': 'Email address'},
  'cancel': {'fa-IR': 'انصراف', 'en-US': 'Cancel'},
  'sendInvite': {'fa-IR': 'فرستادن دعوت', 'en-US': 'Send the invitation'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'dialog-1': {
    'title': {'fa-IR': 'گفت‌وگو', 'en-US': 'Dialog'},
    'description': {
      'fa-IR': 'مسیر خودش را می‌سازد، نه showDialog متریال — که مسیر و پردهٔ خود را به انگلیسی «Dialog» و «Dismiss» می‌نامد.',
      'en-US': 'It builds its own route, not Material’s showDialog — which names its route and barrier «Dialog» and «Dismiss», in English.',
    },
  },
  'dialog-2': {
    'title': {'fa-IR': 'با پیکره', 'en-US': 'With a body'},
    'description': {
      'fa-IR': 'body هر ویجتی می‌گیرد؛ actions دکمه‌های پایین را می‌سازد و راه بستن همیشه هست.',
      'en-US': 'body takes any widget; actions builds the buttons at the foot, and a way out is always there.',
    },
  },
};

Widget dialogBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN dialog-1
  return LumoDialogTrigger(
    label: t['aboutReport'],
    closeLabel: t['closeDialog'],
    description: t['reportRefresh'],
    trigger: (open) => LumoButton(
      onPressed: open,
      variant: LumoButtonVariant.outline,
      child: Text(t['aboutReport']),
    ),
    actions: (context) => [
      LumoButton(
        onPressed: () => Navigator.of(context).pop(),
        child: Text(t['gotIt']),
      ),
    ],
  );
  // END dialog-1
}

Widget dialogWithBody(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN dialog-2
  return LumoDialogTrigger(
    label: t['inviteTeammate'],
    closeLabel: t['closeInvite'],
    description: t['inviteHint'],
    trigger: (open) => LumoButton(
      onPressed: open,
      child: Text(t['inviteTeammate']),
    ),
    body: LumoTextField(
      label: t['emailAddress'],
      placeholder: 'name@example.com',
      isRequired: true,
    ),
    actions: (context) => [
      LumoButton(
        onPressed: () => Navigator.of(context).pop(),
        variant: LumoButtonVariant.ghost,
        child: Text(t['cancel']),
      ),
      LumoButton(
        onPressed: () => Navigator.of(context).pop(),
        child: Text(t['sendInvite']),
      ),
    ],
  );
  // END dialog-2
}
