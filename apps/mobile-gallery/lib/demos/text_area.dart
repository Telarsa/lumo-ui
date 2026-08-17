// Demos for the `text-area` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'text-area-1': textAreaBasic,
  'text-area-2': textAreaCounted,
};

const copy = <String, Map<String, String>>{
  'orderNote': {'fa-IR': 'توضیح سفارش', 'en-US': 'Order note'},
  'orderNotePlaceholder': {
    'fa-IR': 'اگر نکته‌ای هست بنویسید…',
    'en-US': 'Anything we should know…',
  },
  'optional': {'fa-IR': 'اختیاری است.', 'en-US': 'Optional.'},
  'aboutMe': {'fa-IR': 'دربارهٔ من', 'en-US': 'About me'},
  'cannotBeEmpty': {
    'fa-IR': 'این بخش نمی‌تواند خالی بماند.',
    'en-US': 'This cannot be left empty.',
  },
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'text-area-1': {
    'title': {'fa-IR': 'ناحیهٔ متن', 'en-US': 'Text area'},
    'description': {
      'fa-IR': 'چند خط متن آزاد؛ minLines ارتفاع آغازین را می‌گوید.',
      'en-US': 'Several lines of free text; minLines states the starting height.',
    },
  },
  'text-area-2': {
    'title': {'fa-IR': 'با شمارنده و خطا', 'en-US': 'With a counter and an error'},
    'description': {
      'fa-IR': 'maxLength شمارنده را می‌آورد و رقم‌هایش با formatNumber محلی می‌شوند.',
      'en-US': 'maxLength brings the counter, and its digits go through formatNumber.',
    },
  },
};

Widget textAreaBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN text-area-1
  return LumoTextArea(
    label: t['orderNote'],
    placeholder: t['orderNotePlaceholder'],
    description: t['optional'],
    onChanged: (value) {},
  );
  // END text-area-1
}

Widget textAreaCounted(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN text-area-2
  return LumoTextArea(
    label: t['aboutMe'],
    minLines: 4,
    maxLength: 280,
    isRequired: true,
    errorMessage: t['cannotBeEmpty'],
  );
  // END text-area-2
}
