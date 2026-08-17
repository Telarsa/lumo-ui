// Demos for the `stack` slug — the mobile side of the web's layout primitives
// (`LumoStack` over flex, `LumoGrid` over grid).
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'stack-1': stackRow,
  'stack-2': stackGrid,
};

const copy = <String, Map<String, String>>{
  'save': {'fa-IR': 'ذخیره', 'en-US': 'Save'},
  'cancel': {'fa-IR': 'انصراف', 'en-US': 'Cancel'},
  'draft': {'fa-IR': 'پیش‌نویس', 'en-US': 'Draft'},
  'reports': {'fa-IR': 'گزارش‌ها', 'en-US': 'Reports'},
  'wallet': {'fa-IR': 'کیف پول', 'en-US': 'Wallet'},
  'settings': {'fa-IR': 'تنظیمات', 'en-US': 'Settings'},
  'support': {'fa-IR': 'پشتیبانی', 'en-US': 'Support'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'stack-1': {
    'title': {'fa-IR': 'ردیف منطقی', 'en-US': 'A logical row'},
    'description': {
      'fa-IR':
          'LumoStack یک ردیف است که با زبان می‌چرخد: در فارسی از راست شروع می‌شود، بی‌آنکه چیزی «چپ» یا «راست» نامیده شود.',
      'en-US':
          'LumoStack is a row that turns with the language: it starts at the right in Persian, and nothing in it is named “left” or “right”.',
    },
  },
  'stack-2': {
    'title': {'fa-IR': 'شبکه', 'en-US': 'Grid'},
    'description': {
      'fa-IR': 'LumoGrid ستون‌ها را می‌شمارد، نه پیکسل‌ها؛ فاصله‌ها از پله‌های LumoGap می‌آیند.',
      'en-US': 'LumoGrid counts columns, not pixels; the gaps come from the LumoGap steps.',
    },
  },
};

Widget stackRow(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN stack-1
  return LumoStack(
    direction: LumoStackDirection.row,
    gap: LumoGap.sm,
    // `align` defaults to `stretch`, which on a ROW means stretch on the
    // VERTICAL axis — unbounded inside a scroll view, and a layout assertion
    // rather than a wrong pixel. A row wants `center`.
    align: LumoAlign.center,
    // `wrap` lets the line break instead of overflowing. Three controls with
    // Persian labels do not fit a 360dp phone at their natural width, and a row
    // that cannot break is a row that runs off the edge.
    wrap: true,
    children: [
      LumoButton(onPressed: () {}, child: Text(t['save'])),
      LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: Text(t['cancel'])),
      LumoBadge(label: t['draft']),
    ],
  );
  // END stack-1
}

Widget stackGrid(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN stack-2
  return LumoGrid(
    columns: 2,
    gap: LumoGap.sm,
    children: [
      LumoIconTile(icon: const Icon(Icons.insert_chart_outlined), accessibilityLabel: t['reports']),
      LumoIconTile(icon: const Icon(Icons.account_balance_wallet_outlined), accessibilityLabel: t['wallet']),
      LumoIconTile(icon: const Icon(Icons.settings_outlined), accessibilityLabel: t['settings']),
      LumoIconTile(icon: const Icon(Icons.support_agent_outlined), accessibilityLabel: t['support']),
    ],
  );
  // END stack-2
}
