// Demos for the `badge` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'badge-1': badgeTones,
  'badge-2': badgeVariants,
};

const copy = <String, Map<String, String>>{
  'draft': {'fa-IR': 'پیش‌نویس', 'en-US': 'Draft'},
  'pending': {'fa-IR': 'در انتظار', 'en-US': 'Pending'},
  'approved': {'fa-IR': 'تأییدشده', 'en-US': 'Approved'},
  'rejected': {'fa-IR': 'ردشده', 'en-US': 'Rejected'},
  'new': {'fa-IR': 'تازه', 'en-US': 'New'},
  'published': {'fa-IR': 'منتشرشده', 'en-US': 'Published'},
  'archived': {'fa-IR': 'بایگانی', 'en-US': 'Archived'},
  'online': {'fa-IR': 'برخط', 'en-US': 'Online'},
  'running': {'fa-IR': 'در حال اجرا', 'en-US': 'Running'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'badge-1': {
    'title': {'fa-IR': 'آهنگ‌ها', 'en-US': 'Tones'},
    'description': {
      'fa-IR': 'یک وضعیت، در یک کلمه. رنگ تنها حامل معنا نیست — متن همیشه هست.',
      'en-US': 'One status, in one word. Colour is never the only carrier — the text always is.',
    },
  },
  'badge-2': {
    'title': {'fa-IR': 'گونه، نماد و نقطه', 'en-US': 'Variant, icon and dot'},
    'description': {
      'fa-IR': 'LumoBadge.dot نقطهٔ رنگی را کنار برچسب می‌گذارد؛ برچسب همچنان اجباری است.',
      'en-US': 'LumoBadge.dot puts a coloured dot beside the label; the label stays required.',
    },
  },
};

Widget badgeTones(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN badge-1
  return Wrap(
    spacing: 8,
    runSpacing: 8,
    children: [
      LumoBadge(label: t['draft']),
      LumoBadge(label: t['pending'], tone: LumoBadgeTone.caution),
      LumoBadge(label: t['approved'], tone: LumoBadgeTone.positive),
      LumoBadge(label: t['rejected'], tone: LumoBadgeTone.critical),
      LumoBadge(label: t['new'], tone: LumoBadgeTone.accent),
    ],
  );
  // END badge-1
}

Widget badgeVariants(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN badge-2
  return Wrap(
    spacing: 8,
    runSpacing: 8,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: [
      LumoBadge(
        label: t['published'],
        tone: LumoBadgeTone.positive,
        variant: LumoBadgeVariant.solid,
      ),
      LumoBadge(
        label: t['archived'],
        variant: LumoBadgeVariant.outline,
        icon: const Icon(Icons.inventory_2_outlined),
      ),
      LumoBadge(label: t['online'], size: LumoBadgeSize.sm),
      LumoBadge.dot(label: t['running'], tone: LumoBadgeTone.accent),
    ],
  );
  // END badge-2
}
