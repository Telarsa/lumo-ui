// Demos for the `button-group` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'button-group-1': buttonGroupJoined,
  'button-group-2': buttonGroupVertical,
};

const copy = <String, Map<String, String>>{
  'viewOptions': {'fa-IR': 'گزینه‌های نما', 'en-US': 'View options'},
  'day': {'fa-IR': 'روز', 'en-US': 'Day'},
  'week': {'fa-IR': 'هفته', 'en-US': 'Week'},
  'month': {'fa-IR': 'ماه', 'en-US': 'Month'},
  'rowActions': {'fa-IR': 'کنش‌های ردیف', 'en-US': 'Row actions'},
  'edit': {'fa-IR': 'ویرایش', 'en-US': 'Edit'},
  'duplicate': {'fa-IR': 'تکثیر', 'en-US': 'Duplicate'},
  'delete': {'fa-IR': 'حذف', 'en-US': 'Delete'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'button-group-1': {
    'title': {'fa-IR': 'دکمه‌های به‌هم‌پیوسته', 'en-US': 'Joined buttons'},
    'description': {
      'fa-IR': 'گروه یک نام دارد تا خواننده بداند این دکمه‌ها با هم یک انتخاب‌اند.',
      'en-US': 'The group carries a name, so a reader knows these buttons are one choice.',
    },
  },
  'button-group-2': {
    'title': {'fa-IR': 'ایستاده', 'en-US': 'Vertical'},
    'description': {
      'fa-IR': 'همان گروه روی محور عمودی؛ گوشه‌ها بالا و پایین گرد می‌شوند، نه چپ و راست.',
      'en-US': 'The same group on the vertical axis; the corners round at the ends, not at left and right.',
    },
  },
};

Widget buttonGroupJoined(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN button-group-1
  return LumoButtonGroup(
    label: t['viewOptions'],
    children: [
      LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: Text(t['day'])),
      LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: Text(t['week'])),
      LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: Text(t['month'])),
    ],
  );
  // END button-group-1
}

Widget buttonGroupVertical(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN button-group-2
  return LumoButtonGroup(
    label: t['rowActions'],
    orientation: LumoButtonGroupOrientation.vertical,
    children: [
      LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: Text(t['edit'])),
      LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: Text(t['duplicate'])),
      LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: Text(t['delete'])),
    ],
  );
  // END button-group-2
}
