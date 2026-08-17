// Demos for the `description-list` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'description-list-1': descriptionListInline,
  'description-list-2': descriptionListStacked,
};

const copy = <String, Map<String, String>>{
  'orderDetails': {'fa-IR': 'مشخصات سفارش', 'en-US': 'Order details'},
  'orderNumberTerm': {'fa-IR': 'شمارهٔ سفارش', 'en-US': 'Order number'},
  'orderNumberValue': {'fa-IR': '۱۴۰۵۰۳۲۱', 'en-US': '14050321'},
  'placedOnTerm': {'fa-IR': 'تاریخ ثبت', 'en-US': 'Placed on'},
  'placedOnValue': {'fa-IR': '۲۶ مرداد ۱۴۰۵', 'en-US': '17 August 2026'},
  'amountTerm': {'fa-IR': 'مبلغ', 'en-US': 'Amount'},
  'amountValue': {'fa-IR': '۲٬۴۵۰٬۰۰۰ تومان', 'en-US': '2,450,000 toman'},
  'parcelDetails': {'fa-IR': 'مشخصات مرسوله', 'en-US': 'Parcel details'},
  'addressTerm': {'fa-IR': 'نشانی گیرنده', 'en-US': 'Delivery address'},
  'addressValue': {
    'fa-IR': 'تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۴',
    'en-US': 'Unit 4, No. 12, Valiasr Street, Tehran',
  },
  'statusTerm': {'fa-IR': 'وضعیت', 'en-US': 'Status'},
  'delivered': {'fa-IR': 'تحویل‌شده', 'en-US': 'Delivered'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'description-list-1': {
    'title': {'fa-IR': 'فهرست توصیفی', 'en-US': 'Description list'},
    'description': {
      'fa-IR': 'جفت‌های عنوان و مقدار. در حالت inline عنوان در سرِ خواندن و مقدار در پایانش می‌نشیند و خودش می‌چرخد.',
      'en-US': 'Term and value pairs. Inline, the term sits at the reading start and the value at its end — it mirrors on its own.',
    },
  },
  'description-list-2': {
    'title': {'fa-IR': 'روی‌هم و با ویجت', 'en-US': 'Stacked, with a widget value'},
    'description': {
      'fa-IR': 'LumoDescription.widget مقدار را به یک ویجت می‌سپارد؛ value همچنان متنی است که خوانده می‌شود.',
      'en-US': 'LumoDescription.widget hands the value to a widget; value stays the text that is announced.',
    },
  },
};

Widget descriptionListInline(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN description-list-1
  return LumoDescriptionList(
    label: t['orderDetails'],
    entries: [
      LumoDescription(term: t['orderNumberTerm'], value: t['orderNumberValue']),
      LumoDescription(term: t['placedOnTerm'], value: t['placedOnValue']),
      LumoDescription(term: t['amountTerm'], value: t['amountValue']),
    ],
  );
  // END description-list-1
}

Widget descriptionListStacked(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN description-list-2
  return LumoDescriptionList(
    label: t['parcelDetails'],
    orientation: LumoDescriptionListOrientation.stacked,
    size: LumoDescriptionListSize.sm,
    entries: [
      LumoDescription(
        term: t['addressTerm'],
        value: t['addressValue'],
      ),
      LumoDescription.widget(
        term: t['statusTerm'],
        value: t['delivered'],
        child: LumoBadge(label: t['delivered'], tone: LumoBadgeTone.positive),
      ),
    ],
  );
  // END description-list-2
}
