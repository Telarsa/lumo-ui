// Demos for the `timeline` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'timeline-1': timelineBasic,
  'timeline-2': timelineHorizontal,
};

const copy = <String, Map<String, String>>{
  'orderTracking': {'fa-IR': 'پیگیری سفارش', 'en-US': 'Order tracking'},
  'done': {'fa-IR': 'انجام‌شده', 'en-US': 'Done'},
  'inProgress': {'fa-IR': 'در حال انجام', 'en-US': 'In progress'},
  'upcoming': {'fa-IR': 'پیشِ‌رو', 'en-US': 'Still to come'},
  'placed': {'fa-IR': 'ثبت سفارش', 'en-US': 'Order placed'},
  'placedBody': {'fa-IR': 'پرداخت تأیید شد.', 'en-US': 'The payment cleared.'},
  'placedDate': {'fa-IR': '۲۴ مرداد', 'en-US': '15 August'},
  'packing': {'fa-IR': 'بسته‌بندی', 'en-US': 'Packing'},
  'packingDate': {'fa-IR': '۲۵ مرداد', 'en-US': '16 August'},
  'handover': {'fa-IR': 'تحویل به پست', 'en-US': 'Handed to the post'},
  'reviewSteps': {'fa-IR': 'مراحل بررسی درخواست', 'en-US': 'How your request is reviewed'},
  'received': {'fa-IR': 'دریافت', 'en-US': 'Received'},
  'review': {'fa-IR': 'بررسی', 'en-US': 'Review'},
  'outcome': {'fa-IR': 'نتیجه', 'en-US': 'Outcome'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'timeline-1': {
    'title': {'fa-IR': 'خط زمان', 'en-US': 'Timeline'},
    'description': {
      'fa-IR': 'رویدادها به ترتیب. سه نامِ وضعیت اجباری‌اند: انجام‌شده، جاری و پیشِ‌رو — رنگِ نقطه به‌تنهایی نمی‌گوید.',
      'en-US': 'Events in order. The three state names are required: done, current, upcoming — a coloured dot does not say it.',
    },
  },
  'timeline-2': {
    'title': {'fa-IR': 'افقی', 'en-US': 'Horizontal'},
    'description': {
      'fa-IR': 'چیدمان افقی روی محور خواندن پیش می‌رود: در فارسی از راست به چپ.',
      'en-US': 'The horizontal layout runs along the reading axis: right to left in Persian.',
    },
  },
};

Widget timelineBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN timeline-1
  return LumoTimeline(
    label: t['orderTracking'],
    doneLabel: t['done'],
    currentLabel: t['inProgress'],
    upcomingLabel: t['upcoming'],
    items: [
      LumoTimelineItem(
        title: t['placed'],
        description: t['placedBody'],
        meta: t['placedDate'],
      ),
      LumoTimelineItem(
        title: t['packing'],
        meta: t['packingDate'],
        state: LumoTimelineState.current,
      ),
      LumoTimelineItem(
        title: t['handover'],
        state: LumoTimelineState.upcoming,
      ),
    ],
  );
  // END timeline-1
}

Widget timelineHorizontal(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN timeline-2
  return LumoTimeline(
    label: t['reviewSteps'],
    orientation: LumoTimelineOrientation.horizontal,
    doneLabel: t['done'],
    currentLabel: t['inProgress'],
    upcomingLabel: t['upcoming'],
    items: [
      LumoTimelineItem(title: t['received']),
      LumoTimelineItem(title: t['review'], state: LumoTimelineState.current),
      LumoTimelineItem(title: t['outcome'], state: LumoTimelineState.upcoming),
    ],
  );
  // END timeline-2
}
