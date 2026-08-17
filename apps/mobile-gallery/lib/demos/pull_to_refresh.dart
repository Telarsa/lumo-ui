// Demos for the `pull-to-refresh` slug — a MOBILE-ONLY family: the web library
// has no counterpart, because the gesture only exists on a touch screen.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'pull-to-refresh-1': pullToRefreshBasic,
};

const copy = <String, Map<String, String>>{
  'refreshing': {'fa-IR': 'در حال تازه‌سازی', 'en-US': 'Refreshing'},
  'pull': {'fa-IR': 'برای تازه‌سازی بکشید', 'en-US': 'Pull to refresh'},
  'release': {'fa-IR': 'رها کنید تا تازه شود', 'en-US': 'Release to refresh'},
  'order1': {'fa-IR': 'سفارش ۱۴۰۵۰۳۲۱ — ارسال‌شده', 'en-US': 'Order 14050321 — sent'},
  'order2': {'fa-IR': 'سفارش ۱۴۰۵۰۳۱۹ — بسته‌بندی', 'en-US': 'Order 14050319 — packing'},
  'order3': {'fa-IR': 'سفارش ۱۴۰۵۰۳۱۲ — تحویل‌شده', 'en-US': 'Order 14050312 — delivered'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'pull-to-refresh-1': {
    'title': {'fa-IR': 'کشیدن برای تازه‌سازی', 'en-US': 'Pull to refresh'},
    'description': {
      'fa-IR':
          'هر سه حالتِ ژست گفته می‌شود: کشیدن، رهاکردن، و تازه‌سازی. یک چرخندهٔ بی‌کلام برای کسی که نمی‌بیندش هیچ خبری ندارد.',
      'en-US':
          'All three states of the gesture are announced: pulling, release, refreshing. A silent spinner carries no news to a reader who cannot see it.',
    },
  },
};

Widget pullToRefreshBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN pull-to-refresh-1
  return SizedBox(
    height: 260,
    child: LumoPullToRefresh(
      refreshLabel: t['refreshing'],
      pullLabel: t['pull'],
      releaseLabel: t['release'],
      onRefresh: () async {},
      child: ListView(
        children: [
          LumoItem(title: t['order1']),
          LumoItem(title: t['order2']),
          LumoItem(title: t['order3']),
        ],
      ),
    ),
  );
  // END pull-to-refresh-1
}
