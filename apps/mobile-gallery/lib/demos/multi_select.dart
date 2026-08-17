// Demos for the `multi-select` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'multi-select-1': multiSelectBasic,
  'multi-select-2': multiSelectSearchable,
};

const copy = <String, Map<String, String>>{
  'workDays': {'fa-IR': 'روزهای کاری', 'en-US': 'Working days'},
  'pickDays': {'fa-IR': 'روزها را انتخاب کنید', 'en-US': 'Choose your days'},
  'closeDays': {'fa-IR': 'بستن فهرست روزها', 'en-US': 'Close the day list'},
  'confirm': {'fa-IR': 'تأیید', 'en-US': 'Confirm'},
  'clearAll': {'fa-IR': 'پاک‌کردن همه', 'en-US': 'Clear all'},
  'daysSelected': {'fa-IR': 'روز انتخاب شده', 'en-US': 'days selected'},
  'remove': {'fa-IR': 'حذف', 'en-US': 'Remove'},
  'saturday': {'fa-IR': 'شنبه', 'en-US': 'Saturday'},
  'sunday': {'fa-IR': 'یکشنبه', 'en-US': 'Sunday'},
  'monday': {'fa-IR': 'دوشنبه', 'en-US': 'Monday'},
  'tuesday': {'fa-IR': 'سه‌شنبه', 'en-US': 'Tuesday'},
  'skills': {'fa-IR': 'مهارت‌ها', 'en-US': 'Skills'},
  'pickSkills': {'fa-IR': 'مهارت‌ها را انتخاب کنید', 'en-US': 'Choose your skills'},
  'closeSkills': {'fa-IR': 'بستن فهرست مهارت‌ها', 'en-US': 'Close the skill list'},
  'skillsSelected': {'fa-IR': 'مهارت انتخاب شده', 'en-US': 'skills selected'},
  'searchSkills': {'fa-IR': 'جست‌وجو در مهارت‌ها', 'en-US': 'Search the skills'},
  'noSkillFound': {
    'fa-IR': 'مهارتی با این نام پیدا نشد.',
    'en-US': 'No skill by that name was found.',
  },
  'flutter': {'fa-IR': 'فلاتر', 'en-US': 'Flutter'},
  'dart': {'fa-IR': 'دارت', 'en-US': 'Dart'},
  'react': {'fa-IR': 'ری‌اکت', 'en-US': 'React'},
  'a11y': {'fa-IR': 'دسترس‌پذیری', 'en-US': 'Accessibility'},
  'rtl': {'fa-IR': 'راست‌به‌چپ', 'en-US': 'Right to left'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'multi-select-1': {
    'title': {'fa-IR': 'انتخاب چندگانه', 'en-US': 'Multi-select'},
    'description': {
      'fa-IR': 'هر نامی که خوانده می‌شود یک پارامتر اجباری است: بستن، تأیید، پاک‌کردن همه، شمارش و حذف هر مورد.',
      'en-US': 'Every announced name is a required parameter: close, confirm, clear all, the count, and each chip’s remove.',
    },
  },
  'multi-select-2': {
    'title': {'fa-IR': 'جست‌وجوپذیر', 'en-US': 'Searchable'},
    'description': {
      'fa-IR': 'isSearchable بدون searchLabel و emptyLabel رد می‌شود — جعبهٔ جست‌وجو باید نام داشته باشد و «چیزی پیدا نشد» باید گفته شود.',
      'en-US': 'isSearchable without searchLabel and emptyLabel is refused — the search box needs a name and «nothing matched» needs words.',
    },
  },
};

Widget multiSelectBasic(BuildContext context) => const _MultiSelectBasic();

class _MultiSelectBasic extends StatefulWidget {
  const _MultiSelectBasic();
  @override
  State<_MultiSelectBasic> createState() => _MultiSelectBasicState();
}

class _MultiSelectBasicState extends State<_MultiSelectBasic> {
  List<String> _days = ['sat', 'mon'];

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN multi-select-1
    return LumoMultiSelect(
      label: t['workDays'],
      placeholder: t['pickDays'],
      closeLabel: t['closeDays'],
      confirmLabel: t['confirm'],
      clearAllLabel: t['clearAll'],
      countLabel: (count) => '$count ${t['daysSelected']}',
      removeLabel: (day) => '${t['remove']} $day',
      values: _days,
      onChanged: (next) => setState(() => _days = next),
      options: [
        LumoMultiSelectOption(id: 'sat', label: t['saturday']),
        LumoMultiSelectOption(id: 'sun', label: t['sunday']),
        LumoMultiSelectOption(id: 'mon', label: t['monday']),
        LumoMultiSelectOption(id: 'tue', label: t['tuesday']),
      ],
    );
    // END multi-select-1
  }
}

Widget multiSelectSearchable(BuildContext context) =>
    const _MultiSelectSearchable();

class _MultiSelectSearchable extends StatefulWidget {
  const _MultiSelectSearchable();
  @override
  State<_MultiSelectSearchable> createState() => _MultiSelectSearchableState();
}

class _MultiSelectSearchableState extends State<_MultiSelectSearchable> {
  List<String> _skills = ['flutter'];

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN multi-select-2
    return LumoMultiSelect(
      label: t['skills'],
      placeholder: t['pickSkills'],
      closeLabel: t['closeSkills'],
      confirmLabel: t['confirm'],
      clearAllLabel: t['clearAll'],
      countLabel: (count) => '$count ${t['skillsSelected']}',
      removeLabel: (skill) => '${t['remove']} $skill',
      isSearchable: true,
      searchLabel: t['searchSkills'],
      emptyLabel: t['noSkillFound'],
      maxChips: 2,
      values: _skills,
      onChanged: (next) => setState(() => _skills = next),
      options: [
        LumoMultiSelectOption(id: 'flutter', label: t['flutter']),
        LumoMultiSelectOption(id: 'dart', label: t['dart']),
        LumoMultiSelectOption(id: 'react', label: t['react']),
        LumoMultiSelectOption(id: 'a11y', label: t['a11y']),
        LumoMultiSelectOption(id: 'rtl', label: t['rtl']),
      ],
    );
    // END multi-select-2
  }
}
