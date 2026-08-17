// Demos for the `toolbar` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'toolbar-1': toolbarBasic,
};

const copy = <String, Map<String, String>>{
  'formatting': {'fa-IR': 'قالب‌بندی متن', 'en-US': 'Text formatting'},
  'bold': {'fa-IR': 'سیاه', 'en-US': 'Bold'},
  'italic': {'fa-IR': 'کج', 'en-US': 'Italic'},
  'underline': {'fa-IR': 'زیرخط', 'en-US': 'Underline'},
  'bullets': {'fa-IR': 'فهرست نشانه‌دار', 'en-US': 'Bulleted list'},
  'link': {'fa-IR': 'پیوند', 'en-US': 'Link'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'toolbar-1': {
    'title': {'fa-IR': 'نوار ابزار', 'en-US': 'Toolbar'},
    'description': {
      'fa-IR': 'یک ردیف کنش با نامِ گروه. آنچه جا نشود می‌پیچد؛ هیچ کنشی پنهان نمی‌شود.',
      'en-US': 'One row of actions with a group name. What does not fit wraps; no action is hidden.',
    },
  },
};

Widget toolbarBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN toolbar-1
  return LumoToolbar(
    label: t['formatting'],
    overflow: LumoToolbarOverflow.wrap,
    children: [
      LumoIconButton(label: t['bold'], onPressed: () {}, child: const Icon(Icons.format_bold)),
      LumoIconButton(label: t['italic'], onPressed: () {}, child: const Icon(Icons.format_italic)),
      LumoIconButton(label: t['underline'], onPressed: () {}, child: const Icon(Icons.format_underlined)),
      const LumoToolbarSeparator(),
      LumoIconButton(label: t['bullets'], onPressed: () {}, child: const Icon(Icons.format_list_bulleted)),
      LumoIconButton(label: t['link'], onPressed: () {}, child: const Icon(Icons.link)),
    ],
  );
  // END toolbar-1
}
