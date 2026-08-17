// Demos for the `app-bar` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'app-bar-1': appBarBasic,
  'app-bar-2': appBarSubtitle,
};

const copy = <String, Map<String, String>>{
  'orderDetails': {'fa-IR': 'جزئیات سفارش', 'en-US': 'Order details'},
  'back': {'fa-IR': 'بازگشت', 'en-US': 'Back'},
  'share': {'fa-IR': 'هم‌رسانی', 'en-US': 'Share'},
  'more': {'fa-IR': 'بیشتر', 'en-US': 'More'},
  'inbox': {'fa-IR': 'صندوق ورودی', 'en-US': 'Inbox'},
  'unread': {'fa-IR': '۱۲ خوانده‌نشده', 'en-US': '12 unread'},
  'search': {'fa-IR': 'جست‌وجو', 'en-US': 'Search'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'app-bar-1': {
    'title': {'fa-IR': 'سربرگ صفحه', 'en-US': 'Page header'},
    'description': {
      'fa-IR': 'عنوان، بازگشت و کنش‌ها. جهت بازگشت از زبان می‌آید — پیکان در فارسی برعکس می‌شود.',
      'en-US': 'A title, a back affordance and actions. The back arrow mirrors with the language.',
    },
  },
  'app-bar-2': {
    'title': {'fa-IR': 'با زیرعنوان', 'en-US': 'With a subtitle'},
    'description': {
      'fa-IR': 'زیرعنوان یک سطر است و شمارش در آن با رقم محلی نوشته می‌شود.',
      'en-US': 'The subtitle is one line, and a count inside it carries local digits.',
    },
  },
};

Widget appBarBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN app-bar-1
  return LumoAppBar(
    title: t['orderDetails'],
    backLabel: t['back'],
    onBack: () {},
    actions: [
      LumoIconButton(
        label: t['share'],
        onPressed: () {},
        child: const Icon(Icons.ios_share),
      ),
      LumoIconButton(
        label: t['more'],
        onPressed: () {},
        child: const Icon(Icons.more_vert),
      ),
    ],
  );
  // END app-bar-1
}

Widget appBarSubtitle(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN app-bar-2
  return LumoAppBar(
    title: t['inbox'],
    subtitle: t['unread'],
    actions: [
      LumoIconButton(
        label: t['search'],
        onPressed: () {},
        child: const Icon(Icons.search),
      ),
    ],
  );
  // END app-bar-2
}
