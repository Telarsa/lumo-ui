// Demos for the `breadcrumbs` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'breadcrumbs-1': breadcrumbsBasic,
  'breadcrumbs-2': breadcrumbsCollapsed,
};

const copy = <String, Map<String, String>>{
  'pagePath': {'fa-IR': 'مسیر صفحه', 'en-US': 'Page path'},
  'currentPage': {'fa-IR': 'صفحهٔ کنونی', 'en-US': 'Current page'},
  'home': {'fa-IR': 'خانه', 'en-US': 'Home'},
  'shop': {'fa-IR': 'فروشگاه', 'en-US': 'Shop'},
  'trainers': {'fa-IR': 'کفش ورزشی', 'en-US': 'Trainers'},
  'filePath': {'fa-IR': 'مسیر پرونده', 'en-US': 'File path'},
  'showFullPath': {'fa-IR': 'نمایش مسیر کامل', 'en-US': 'Show the full path'},
  'projects': {'fa-IR': 'پروژه‌ها', 'en-US': 'Projects'},
  'lumo': {'fa-IR': 'لومو', 'en-US': 'Lumo'},
  'docs': {'fa-IR': 'مستندات', 'en-US': 'Documentation'},
  'breadcrumbs': {'fa-IR': 'خرده‌نان', 'en-US': 'Breadcrumbs'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'breadcrumbs-1': {
    'title': {'fa-IR': 'خرده‌نان', 'en-US': 'Breadcrumbs'},
    'description': {
      'fa-IR': 'راهِ آمده. جداکننده روی محور خواندن می‌چرخد؛ آخرین مورد جای کنونی است و پیوند نیست.',
      'en-US': 'The path taken. The separator turns with the reading axis; the last crumb is here, and is not a link.',
    },
  },
  'breadcrumbs-2': {
    'title': {'fa-IR': 'جمع‌شده', 'en-US': 'Collapsed'},
    'description': {
      'fa-IR': 'maxVisible میانه را پشت یک دکمه جمع می‌کند و overflowLabel نام آن دکمه است.',
      'en-US': 'maxVisible folds the middle behind one button, and overflowLabel is that button’s name.',
    },
  },
};

Widget breadcrumbsBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN breadcrumbs-1
  return LumoBreadcrumbs(
    label: t['pagePath'],
    currentLabel: t['currentPage'],
    items: [
      LumoCrumb(label: t['home'], onTap: () {}),
      LumoCrumb(label: t['shop'], onTap: () {}),
      LumoCrumb(label: t['trainers']),
    ],
  );
  // END breadcrumbs-1
}

Widget breadcrumbsCollapsed(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN breadcrumbs-2
  return LumoBreadcrumbs(
    label: t['filePath'],
    maxVisible: 3,
    overflowLabel: t['showFullPath'],
    currentLabel: t['currentPage'],
    items: [
      LumoCrumb(label: t['home'], onTap: () {}),
      LumoCrumb(label: t['projects'], onTap: () {}),
      LumoCrumb(label: t['lumo'], onTap: () {}),
      LumoCrumb(label: t['docs'], onTap: () {}),
      LumoCrumb(label: t['breadcrumbs']),
    ],
  );
  // END breadcrumbs-2
}
