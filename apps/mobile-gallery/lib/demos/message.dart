// Demos for the `message` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'message-1': messageBasic,
  'message-2': messageGroup,
};

const copy = <String, Map<String, String>>{
  'support': {'fa-IR': 'پشتیبانی', 'en-US': 'Support'},
  'shipsToday': {
    'fa-IR': 'سلام! سفارشتان امروز ارسال می‌شود.',
    'en-US': 'Hello! Your order goes out today.',
  },
  'time1012': {'fa-IR': '۱۰:۱۲', 'en-US': '10:12'},
  'trackingPlease': {
    'fa-IR': 'ممنون. کد رهگیری را می‌فرستید؟',
    'en-US': 'Thanks. Could you send the tracking number?',
  },
  'time1013': {'fa-IR': '۱۰:۱۳', 'en-US': '10:13'},
  'read': {'fa-IR': 'خوانده شد', 'en-US': 'Read'},
  'dateLabel': {'fa-IR': 'دوشنبه ۲۶ مرداد', 'en-US': 'Monday 17 August'},
  'encrypted': {
    'fa-IR': 'گفت‌وگو رمزنگاری‌شده است.',
    'en-US': 'This conversation is encrypted.',
  },
  'mina': {'fa-IR': 'مینا', 'en-US': 'Mina'},
  'minaFull': {'fa-IR': 'مینا رستمی', 'en-US': 'Mina Rostami'},
  'sentFile': {
    'fa-IR': 'فایل را فرستادم، ببین درست است؟',
    'en-US': 'I sent the file — could you check it?',
  },
  'time0940': {'fa-IR': '۰۹:۴۰', 'en-US': '09:40'},
  'lookingNow': {'fa-IR': 'الان نگاه می‌کنم.', 'en-US': 'Looking at it now.'},
  'time0941': {'fa-IR': '۰۹:۴۱', 'en-US': '09:41'},
  'sending': {'fa-IR': 'در حال ارسال', 'en-US': 'Sending'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'message-1': {
    'title': {'fa-IR': 'حباب پیام', 'en-US': 'Message bubble'},
    'description': {
      'fa-IR': 'side می‌گوید پیام از کدام سو آمده؛ حباب به سرِ خواندن یا پایانش می‌چسبد، نه به چپ و راست.',
      'en-US': 'side states which way the message came; the bubble clings to the reading start or end, not to left or right.',
    },
  },
  'message-2': {
    'title': {'fa-IR': 'گروه یک روز', 'en-US': 'One day’s group'},
    'description': {
      'fa-IR': 'LumoMessageGroup تاریخ را عنوان می‌کند؛ statusLabel وضعیت را به کلمه می‌گوید، نه با تیک.',
      'en-US': 'LumoMessageGroup heads the day; statusLabel says the state in words, not with a tick.',
    },
  },
};

Widget messageBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN message-1
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 8,
    children: [
      LumoMessage(
        side: LumoMessageSide.incoming,
        senderLabel: t['support'],
        text: t['shipsToday'],
        timeLabel: t['time1012'],
      ),
      LumoMessage(
        side: LumoMessageSide.outgoing,
        text: t['trackingPlease'],
        timeLabel: t['time1013'],
        status: LumoMessageStatus.read,
        statusLabel: t['read'],
      ),
    ],
  );
  // END message-1
}

Widget messageGroup(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN message-2
  return LumoMessageGroup(
    dateLabel: t['dateLabel'],
    children: [
      LumoMessage(
        side: LumoMessageSide.incoming,
        isSystem: true,
        text: t['encrypted'],
      ),
      LumoMessage(
        side: LumoMessageSide.incoming,
        senderLabel: t['mina'],
        avatar: LumoAvatar(label: t['minaFull'], size: LumoAvatarSize.sm),
        text: t['sentFile'],
        timeLabel: t['time0940'],
      ),
      LumoMessage(
        side: LumoMessageSide.outgoing,
        text: t['lookingNow'],
        timeLabel: t['time0941'],
        status: LumoMessageStatus.sending,
        statusLabel: t['sending'],
      ),
    ],
  );
  // END message-2
}
