// Demos for the `disclosure` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'disclosure-1': disclosureBasic,
  'disclosure-2': disclosureAccordion,
};

const copy = <String, Map<String, String>>{
  'shippingCostQ': {
    'fa-IR': 'هزینهٔ ارسال چگونه حساب می‌شود؟',
    'en-US': 'How is the shipping cost worked out?',
  },
  'shippingCostA': {
    'fa-IR': 'بر پایهٔ وزن بسته و فاصلهٔ مقصد، در گام پرداخت نشان داده می‌شود.',
    'en-US': 'From the parcel’s weight and the distance, shown at the payment step.',
  },
  'returns': {'fa-IR': 'شرایط مرجوعی', 'en-US': 'Returns'},
  'returnsBody': {
    'fa-IR': 'تا هفت روز پس از تحویل، بدون پرسش.',
    'en-US': 'Up to seven days after delivery, no questions asked.',
  },
  'warranty': {'fa-IR': 'گارانتی', 'en-US': 'Warranty'},
  'warrantyBody': {
    'fa-IR': 'هجده ماه گارانتی شرکتی برای همهٔ کالاهای برقی.',
    'en-US': 'Eighteen months of manufacturer warranty on every electrical item.',
  },
  'invoice': {'fa-IR': 'فاکتور رسمی', 'en-US': 'Formal invoice'},
  'invoiceBody': {'fa-IR': 'در حال حاضر در دسترس نیست.', 'en-US': 'Not available at the moment.'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'disclosure-1': {
    'title': {'fa-IR': 'بازشو', 'en-US': 'Disclosure'},
    'description': {
      'fa-IR': 'یک عنوان که چیزی را باز و بسته می‌کند. وضعیت باز یا بسته اعلام می‌شود، نه فقط کشیده.',
      'en-US': 'One heading that opens and closes something. The open state is announced, not merely drawn.',
    },
  },
  'disclosure-2': {
    'title': {'fa-IR': 'آکاردئون', 'en-US': 'Accordion'},
    'description': {
      'fa-IR': 'چند بازشو با هم. allowsMultiple می‌گوید چند تا هم‌زمان باز بمانند.',
      'en-US': 'Several disclosures together. allowsMultiple states how many may stay open at once.',
    },
  },
};

Widget disclosureBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN disclosure-1
  return LumoDisclosure(
    title: t['shippingCostQ'],
    defaultOpen: true,
    isDisabled: false,
    onOpenChange: (bool isOpen) {},
    child: Padding(
      padding: const EdgeInsetsDirectional.only(top: 4, bottom: 4),
      child: Text(t['shippingCostA']),
    ),
  );
  // END disclosure-1
}

Widget disclosureAccordion(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN disclosure-2
  return LumoAccordion(
    allowsMultiple: true,
    defaultValue: const {'returns'},
    items: [
      LumoDisclosureItem(
        id: 'returns',
        title: t['returns'],
        child: Text(t['returnsBody']),
      ),
      LumoDisclosureItem(
        id: 'warranty',
        title: t['warranty'],
        child: Text(t['warrantyBody']),
      ),
      LumoDisclosureItem(
        id: 'invoice',
        title: t['invoice'],
        child: Text(t['invoiceBody']),
        isDisabled: true,
      ),
    ],
  );
  // END disclosure-2
}
