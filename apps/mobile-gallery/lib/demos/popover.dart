// Demos for the `popover` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'popover-1': popoverBasic,
  'popover-2': popoverWithClose,
};

const copy = <String, Map<String, String>>{
  'postcodeHelp': {'fa-IR': 'راهنمای کد پستی', 'en-US': 'About the postcode'},
  'postcodeBody': {
    'fa-IR': 'کد پستی ده رقمی است و روی قبض‌های خدماتی نوشته شده.',
    'en-US': 'The postcode is ten digits and appears on your utility bills.',
  },
  'quickFilters': {'fa-IR': 'فیلترهای سریع', 'en-US': 'Quick filters'},
  'closeQuickFilters': {'fa-IR': 'بستن فیلترهای سریع', 'en-US': 'Close the quick filters'},
  'filters': {'fa-IR': 'فیلترها', 'en-US': 'Filters'},
  'status': {'fa-IR': 'وضعیت', 'en-US': 'Status'},
  'inStock': {'fa-IR': 'موجود', 'en-US': 'In stock'},
  'discounted': {'fa-IR': 'تخفیف‌دار', 'en-US': 'Discounted'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'popover-1': {
    'title': {'fa-IR': 'پاپ‌اور', 'en-US': 'Popover'},
    'description': {
      'fa-IR': 'محتوایی که به یک نقطه لنگر می‌اندازد. جای آن روی محور خواندن سنجیده می‌شود، نه چپ و راست.',
      'en-US': 'Content anchored to a point. Its placement is measured along the reading axis, never left and right.',
    },
  },
  'popover-2': {
    'title': {'fa-IR': 'با دکمهٔ بستن', 'en-US': 'With a close button'},
    'description': {
      'fa-IR': 'showClose بدون closeLabel رد می‌شود — یک ✕ نام نیست.',
      'en-US': 'showClose without closeLabel is refused — an ✕ is not a name.',
    },
  },
};

Widget popoverBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN popover-1
  return LumoPopoverTrigger(
    label: t['postcodeHelp'],
    trigger: (open) => LumoIconButton(
      label: t['postcodeHelp'],
      onPressed: open,
      child: const Icon(Icons.info_outline),
    ),
    content: (context) => SizedBox(
      width: 220,
      child: Text(t['postcodeBody']),
    ),
  );
  // END popover-1
}

Widget popoverWithClose(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN popover-2
  return LumoPopoverTrigger(
    label: t['quickFilters'],
    showClose: true,
    closeLabel: t['closeQuickFilters'],
    placement: LumoPlacement.bottomEnd,
    trigger: (open) => LumoButton(
      onPressed: open,
      variant: LumoButtonVariant.outline,
      child: Text(t['filters']),
    ),
    content: (context) => SizedBox(
      width: 240,
      child: LumoCheckboxGroup(
        label: t['status'],
        children: [
          LumoCheckbox(label: t['inStock'], defaultSelected: true),
          LumoCheckbox(label: t['discounted']),
        ],
      ),
    ),
  );
  // END popover-2
}
