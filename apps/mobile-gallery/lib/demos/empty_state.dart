// Demos for the `empty-state` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'empty-state-1': emptyStateBasic,
  'empty-state-2': emptyStateWithActions,
};

const copy = <String, Map<String, String>>{
  'noOrders': {'fa-IR': 'هنوز سفارشی ندارید', 'en-US': 'No orders yet'},
  'noOrdersBody': {
    'fa-IR': 'وقتی نخستین سفارشتان را ثبت کنید، اینجا نشان داده می‌شود.',
    'en-US': 'Your first order will appear here once you place it.',
  },
  'nothingFound': {'fa-IR': 'چیزی پیدا نشد', 'en-US': 'Nothing found'},
  'nothingFoundBody': {
    'fa-IR': 'هیچ محصولی با این فیلترها نیست. یکی از فیلترها را بردارید.',
    'en-US': 'No product matches these filters. Try removing one of them.',
  },
  'clearFilters': {'fa-IR': 'پاک‌کردن فیلترها', 'en-US': 'Clear the filters'},
  'showAll': {'fa-IR': 'نمایش همهٔ محصولات', 'en-US': 'Show every product'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'empty-state-1': {
    'title': {'fa-IR': 'حالت خالی', 'en-US': 'Empty state'},
    'description': {
      'fa-IR': 'جای خالی را با یک جمله پر می‌کند، نه با سکوت. نماد و اندازه صریح نوشته شده‌اند، چون همان‌ها پیش‌فرض‌اند.',
      'en-US': 'It fills the hole with a sentence rather than with silence. The icon and size are spelled out because they are the defaults.',
    },
  },
  'empty-state-2': {
    'title': {'fa-IR': 'با کنش', 'en-US': 'With actions'},
    'description': {
      'fa-IR': 'نماد تزیینی است و خوانده نمی‌شود؛ راه بیرون‌رفت همان دکمه است.',
      'en-US': 'The icon is decorative and never announced; the way out is the button.',
    },
  },
};

Widget emptyStateBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN empty-state-1
  return LumoEmptyState(
    title: t['noOrders'],
    description: t['noOrdersBody'],
    icon: const Icon(Icons.receipt_long_outlined),
    size: LumoEmptyStateSize.md,
  );
  // END empty-state-1
}

Widget emptyStateWithActions(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN empty-state-2
  return LumoEmptyState(
    title: t['nothingFound'],
    description: t['nothingFoundBody'],
    icon: const Icon(Icons.search_off_outlined),
    size: LumoEmptyStateSize.lg,
    actions: [
      LumoButton(onPressed: () {}, child: Text(t['clearFilters'])),
      LumoButton(
        onPressed: () {},
        variant: LumoButtonVariant.ghost,
        child: Text(t['showAll']),
      ),
    ],
  );
  // END empty-state-2
}
