// Demos for the `tabs` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'tabs-1': tabsBasic,
  'tabs-2': tabsPill,
};

const copy = <String, Map<String, String>>{
  'orderSections': {'fa-IR': 'بخش‌های سفارش', 'en-US': 'Order sections'},
  'items': {'fa-IR': 'اقلام', 'en-US': 'Items'},
  'shipping': {'fa-IR': 'ارسال', 'en-US': 'Shipping'},
  'payment': {'fa-IR': 'پرداخت', 'en-US': 'Payment'},
  'itemsBody': {'fa-IR': 'سه قلم در این سفارش هست.', 'en-US': 'Three items in this order.'},
  'shippingBody': {'fa-IR': 'ارسال با پست پیشتاز.', 'en-US': 'Sent by express post.'},
  'paymentBody': {'fa-IR': 'پرداخت‌شده با کارت بانکی.', 'en-US': 'Paid by bank card.'},
  'inbox': {'fa-IR': 'صندوق پیام', 'en-US': 'Inbox'},
  'all': {'fa-IR': 'همه', 'en-US': 'All'},
  'unread': {'fa-IR': 'خوانده‌نشده', 'en-US': 'Unread'},
  'unreadCount': {'fa-IR': '۴', 'en-US': '4'},
  'archive': {'fa-IR': 'بایگانی', 'en-US': 'Archive'},
  'activeTab': {'fa-IR': 'زبانهٔ فعال:', 'en-US': 'Active tab:'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'tabs-1': {
    'title': {'fa-IR': 'زبانه‌ها', 'en-US': 'Tabs'},
    'description': {
      'fa-IR': 'label نام مجموعهٔ زبانه‌هاست و خوانده می‌شود؛ views پیکرهٔ هر زبانه را می‌سازد.',
      'en-US': 'label names the tab set and is announced; views builds each tab’s panel.',
    },
  },
  'tabs-2': {
    'title': {'fa-IR': 'گونهٔ قرصی، با نماد و نشان', 'en-US': 'Pill variant, with icons and badges'},
    'description': {
      'fa-IR': 'isScrollable ردیف را در صفحهٔ باریک می‌لغزاند؛ نخستین زبانه در سرِ خواندن می‌نشیند — در فارسی، راست.',
      'en-US': 'isScrollable slides the row on a narrow screen; the first tab sits at the reading start — right, in Persian.',
    },
  },
};

Widget tabsBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN tabs-1
  return LumoTabs(
    label: t['orderSections'],
    defaultValue: 'items',
    tabs: [
      LumoTab(id: 'items', label: t['items']),
      LumoTab(id: 'shipping', label: t['shipping']),
      LumoTab(id: 'payment', label: t['payment']),
    ],
    views: {
      'items': (context) => Text(t['itemsBody']),
      'shipping': (context) => Text(t['shippingBody']),
      'payment': (context) => Text(t['paymentBody']),
    },
  );
  // END tabs-1
}

Widget tabsPill(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN tabs-2
  return LumoTabs(
    label: t['inbox'],
    defaultValue: 'unread',
    variant: LumoTabsVariant.pill,
    isScrollable: true,
    tabs: [
      LumoTab(id: 'all', label: t['all'], icon: const Icon(Icons.inbox_outlined)),
      LumoTab(id: 'unread', label: t['unread'], badge: t['unreadCount']),
      LumoTab(id: 'archive', label: t['archive'], isDisabled: true),
    ],
    builder: (context, selectedId) => Text('${t['activeTab']} $selectedId'),
  );
  // END tabs-2
}
