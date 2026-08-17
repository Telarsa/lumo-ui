// Demos for the `card` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'card-1': cardBasic,
  'card-2': cardComposed,
  'card-3': cardPressable,
};

const copy = <String, Map<String, String>>{
  'orderNumber': {'fa-IR': 'سفارش ۱۴۰۵۰۳۲۱', 'en-US': 'Order 14050321'},
  'orderSummary': {
    'fa-IR': 'سه قلم • ارسال با پست پیشتاز',
    'en-US': 'Three items • sent by express post',
  },
  'proPlan': {'fa-IR': 'اشتراک حرفه‌ای', 'en-US': 'Professional plan'},
  'proPlanHint': {
    'fa-IR': 'ماهانه، با امکان لغو در هر زمان.',
    'en-US': 'Monthly, cancel whenever you like.',
  },
  'active': {'fa-IR': 'فعال', 'en-US': 'Active'},
  'nextRenewal': {
    'fa-IR': 'تمدید بعدی: ۲۶ شهریور ۱۴۰۵',
    'en-US': 'Next renewal: 17 September 2026',
  },
  'changePlan': {'fa-IR': 'تغییر طرح', 'en-US': 'Change plan'},
  'manage': {'fa-IR': 'مدیریت', 'en-US': 'Manage'},
  'salesReport': {'fa-IR': 'گزارش فروش مرداد', 'en-US': 'August sales report'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'card-1': {
    'title': {'fa-IR': 'کارت ساده', 'en-US': 'Plain card'},
    'description': {
      'fa-IR': 'یک قاب دور محتوایی که با هم معنا دارد. کارت خودش هیچ نقشی اعلام نمی‌کند.',
      'en-US': 'A frame around content that belongs together. The card itself announces no role.',
    },
  },
  'card-2': {
    'title': {'fa-IR': 'سر و پا', 'en-US': 'Header and footer'},
    'description': {
      'fa-IR': 'LumoCardHeader عنوان و توضیح و یک کنش می‌گیرد؛ LumoCardFooter کنش‌های پایانی را می‌چیند.',
      'en-US': 'LumoCardHeader takes a title, a description and one action; LumoCardFooter lays out the closing actions.',
    },
  },
  'card-3': {
    'title': {'fa-IR': 'کارت فشردنی', 'en-US': 'Pressable card'},
    'description': {
      'fa-IR': 'onTap کارت را به یک دکمه تبدیل می‌کند و آن‌گاه label اجباری است — نامی که خوانده می‌شود.',
      'en-US': 'onTap turns the card into a button, and then label is required — the name that is announced.',
    },
  },
};

Widget cardBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN card-1
  return LumoCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 8,
      children: [
        Text(t['orderNumber']),
        Text(t['orderSummary']),
      ],
    ),
  );
  // END card-1
}

Widget cardComposed(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN card-2
  return LumoCard(
    variant: LumoCardVariant.elevated,
    padding: EdgeInsets.zero,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LumoCardHeader(
          title: t['proPlan'],
          description: t['proPlanHint'],
          action: LumoBadge(label: t['active'], tone: LumoBadgeTone.positive),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(t['nextRenewal']),
        ),
        LumoCardFooter(
          children: [
            LumoButton(
              onPressed: () {},
              variant: LumoButtonVariant.ghost,
              child: Text(t['changePlan']),
            ),
            LumoButton(onPressed: () {}, child: Text(t['manage'])),
          ],
        ),
      ],
    ),
  );
  // END card-2
}

Widget cardPressable(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN card-3
  return LumoCard(
    label: t['salesReport'],
    variant: LumoCardVariant.sunken,
    onTap: () {},
    child: Row(
      spacing: 12,
      children: [
        const Icon(Icons.insert_chart_outlined),
        Expanded(child: Text(t['salesReport'])),
        const Icon(Icons.chevron_left),
      ],
    ),
  );
  // END card-3
}
