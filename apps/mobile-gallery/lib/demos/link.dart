// Demos for the `link` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'link-1': linkInline,
  'link-2': linkStandalone,
};

const copy = <String, Map<String, String>>{
  'byContinuing': {'fa-IR': 'با ادامه، ', 'en-US': 'By continuing you accept the '},
  'termsOfUse': {'fa-IR': 'شرایط استفاده', 'en-US': 'terms of use'},
  'youAccept': {'fa-IR': ' را می‌پذیرید.', 'en-US': '.'},
  'returnsGuide': {'fa-IR': 'راهنمای کامل بازگشت کالا', 'en-US': 'The full returns guide'},
  'serviceStatus': {'fa-IR': 'وضعیت سرویس‌ها', 'en-US': 'Service status'},
  'opensNewTab': {'fa-IR': 'در برگهٔ جدید باز می‌شود', 'en-US': 'Opens in a new tab'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'link-1': {
    'title': {'fa-IR': 'پیوند درون‌متنی', 'en-US': 'Inline link'},
    'description': {
      'fa-IR': 'در میان متن: هم رنگ و هم زیرخط — رنگ به‌تنهایی پیوند را از متن جدا نمی‌کند.',
      'en-US': 'In a run of text: coloured AND underlined — colour alone does not distinguish a link.',
    },
  },
  'link-2': {
    'title': {'fa-IR': 'مستقل و بیرونی', 'en-US': 'Standalone and external'},
    'description': {
      'fa-IR': 'isExternal بدون externalLabel رد می‌شود: بازشدن در برگهٔ تازه باید گفته شود، نه فقط با یک نماد.',
      'en-US': 'isExternal without externalLabel is refused: opening in a new tab must be said, not merely drawn.',
    },
  },
};

Widget linkInline(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN link-1
  return Wrap(
    crossAxisAlignment: WrapCrossAlignment.center,
    children: [
      Text(t['byContinuing']),
      LumoLink(label: t['termsOfUse'], onTap: () {}),
      Text(t['youAccept']),
    ],
  );
  // END link-1
}

Widget linkStandalone(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN link-2
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    spacing: 8,
    children: [
      LumoLink(
        label: t['returnsGuide'],
        variant: LumoLinkVariant.standalone,
        icon: const Icon(Icons.menu_book_outlined),
        onTap: () {},
      ),
      LumoLink(
        label: t['serviceStatus'],
        variant: LumoLinkVariant.standalone,
        isExternal: true,
        externalLabel: t['opensNewTab'],
        onTap: () {},
      ),
    ],
  );
  // END link-2
}
