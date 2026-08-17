// Demos for the `combobox` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'combobox-1': comboboxBasic,
  'combobox-2': comboboxCustomValue,
};

const copy = <String, Map<String, String>>{
  'favouriteFruit': {'fa-IR': 'میوهٔ دلخواه', 'en-US': 'Favourite fruit'},
  'typeItsName': {'fa-IR': 'نامش را بنویسید', 'en-US': 'Type its name'},
  'suggestions': {'fa-IR': 'پیشنهادها', 'en-US': 'Suggestions'},
  'noFruitFound': {
    'fa-IR': 'میوه‌ای با این نام پیدا نشد.',
    'en-US': 'No fruit by that name was found.',
  },
  'clearChoice': {'fa-IR': 'پاک‌کردن انتخاب', 'en-US': 'Clear the choice'},
  'apple': {'fa-IR': 'سیب', 'en-US': 'Apple'},
  'orange': {'fa-IR': 'پرتقال', 'en-US': 'Orange'},
  'grape': {'fa-IR': 'انگور', 'en-US': 'Grape'},
  'city': {'fa-IR': 'شهر', 'en-US': 'City'},
  'cityName': {'fa-IR': 'نام شهر', 'en-US': 'City name'},
  'suggestedCities': {'fa-IR': 'شهرهای پیشنهادی', 'en-US': 'Suggested cities'},
  'cityNotListed': {
    'fa-IR': 'شهری با این نام در فهرست نیست؛ می‌توانید همان را ثبت کنید.',
    'en-US': 'No city by that name is listed; you may keep what you typed.',
  },
  'clearCity': {'fa-IR': 'پاک‌کردن شهر', 'en-US': 'Clear the city'},
  'pickOrTypeCity': {
    'fa-IR': 'یک شهر انتخاب یا وارد کنید.',
    'en-US': 'Choose or type a city.',
  },
  'tehran': {'fa-IR': 'تهران', 'en-US': 'Tehran'},
  'mashhad': {'fa-IR': 'مشهد', 'en-US': 'Mashhad'},
  'tabriz': {'fa-IR': 'تبریز', 'en-US': 'Tabriz'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'combobox-1': {
    'title': {'fa-IR': 'جعبهٔ ترکیبی', 'en-US': 'Combobox'},
    'description': {
      'fa-IR': 'تایپ می‌کنید، فهرست کوتاه می‌شود. جست‌وجو با lumoFoldForSearch انجام می‌شود تا «ي» و «ی» یکی شمرده شوند.',
      'en-US': 'You type, the list narrows. The match runs through lumoFoldForSearch so «ي» and «ی» count as one letter.',
    },
  },
  'combobox-2': {
    'title': {'fa-IR': 'مقدار دلخواه و خطا', 'en-US': 'Custom value and error'},
    'description': {
      'fa-IR': 'allowsCustomValue اجازه می‌دهد چیزی خارج از فهرست ثبت شود.',
      'en-US': 'allowsCustomValue lets a value outside the list be committed.',
    },
  },
};

Widget comboboxBasic(BuildContext context) => const _ComboboxBasic();

class _ComboboxBasic extends StatefulWidget {
  const _ComboboxBasic();
  @override
  State<_ComboboxBasic> createState() => _ComboboxBasicState();
}

class _ComboboxBasicState extends State<_ComboboxBasic> {
  String? _fruit = 'orange';

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN combobox-1
    return LumoCombobox(
      label: t['favouriteFruit'],
      placeholder: t['typeItsName'],
      suggestionsLabel: t['suggestions'],
      emptyLabel: t['noFruitFound'],
      clearLabel: t['clearChoice'],
      value: _fruit,
      onChanged: (next) => setState(() => _fruit = next),
      options: [
        LumoComboboxOption(id: 'apple', label: t['apple']),
        LumoComboboxOption(id: 'orange', label: t['orange']),
        LumoComboboxOption(id: 'grape', label: t['grape']),
      ],
    );
    // END combobox-1
  }
}

Widget comboboxCustomValue(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN combobox-2
  return LumoCombobox(
    label: t['city'],
    placeholder: t['cityName'],
    suggestionsLabel: t['suggestedCities'],
    emptyLabel: t['cityNotListed'],
    clearLabel: t['clearCity'],
    allowsCustomValue: true,
    errorMessage: t['pickOrTypeCity'],
    options: [
      LumoComboboxOption(id: 'thr', label: t['tehran']),
      LumoComboboxOption(id: 'mhd', label: t['mashhad']),
      LumoComboboxOption(id: 'tbz', label: t['tabriz']),
    ],
  );
  // END combobox-2
}
