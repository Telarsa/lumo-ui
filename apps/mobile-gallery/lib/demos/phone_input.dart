// Demos for the `phone-input` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'phone-input-1': phoneInputBasic,
  'phone-input-2': phoneInputInvalid,
};

const copy = <String, Map<String, String>>{
  'mobileNumber': {'fa-IR': 'شمارهٔ همراه', 'en-US': 'Mobile number'},
  'country': {'fa-IR': 'کشور', 'en-US': 'Country'},
  'closeCountries': {'fa-IR': 'بستن فهرست کشورها', 'en-US': 'Close the country list'},
  'searchCountries': {'fa-IR': 'جست‌وجو در کشورها', 'en-US': 'Search the countries'},
  'codeSentHere': {
    'fa-IR': 'کد تأیید به همین شماره پیامک می‌شود.',
    'en-US': 'The verification code is texted to this number.',
  },
  'emergencyNumber': {'fa-IR': 'شمارهٔ تماس ضروری', 'en-US': 'Emergency contact number'},
  'incompleteNumber': {'fa-IR': 'این شماره کامل نیست.', 'en-US': 'That number is incomplete.'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'phone-input-1': {
    'title': {'fa-IR': 'ورودی شمارهٔ تلفن', 'en-US': 'Phone input'},
    'description': {
      // «E.164» removed from the Persian: a demo description is now rendered as
      // the Mobile page's opening PROSE, and a bare Latin identifier in Persian
      // prose needs a `data-lumo-latn` island — which a manifest string cannot
      // carry. `no-latin-digits` caught it. The English keeps the standard's
      // name, where it is not a foreign run.
      'fa-IR': 'کشور و شماره یک ورودی‌اند. مقدار بیرونی همیشه قالب استاندارد بین‌المللی دارد — مثلاً ‎+۹۸۹۱۲۳۴۵۶۷۸۹ — هرچه روی صفحه نوشته شده باشد.',
      'en-US': 'The country and the number are one field. The value out is always E.164, whatever is on screen.',
    },
  },
  'phone-input-2': {
    'title': {'fa-IR': 'کشور دیگر و خطا', 'en-US': 'Another country, and an error'},
    'description': {
      'fa-IR': 'defaultCountry کشور آغازین را می‌گوید؛ برگهٔ کشورها جست‌وجوپذیر است و searchLabel نامش را می‌دهد.',
      'en-US': 'defaultCountry states the starting country; the country sheet is searchable and searchLabel names its box.',
    },
  },
};

Widget phoneInputBasic(BuildContext context) => const _PhoneInputBasic();

class _PhoneInputBasic extends StatefulWidget {
  const _PhoneInputBasic();
  @override
  State<_PhoneInputBasic> createState() => _PhoneInputBasicState();
}

class _PhoneInputBasicState extends State<_PhoneInputBasic> {
  String _phone = '+989121234567';

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN phone-input-1
    return LumoPhoneInput(
      label: t['mobileNumber'],
      countryLabel: t['country'],
      closeLabel: t['closeCountries'],
      searchLabel: t['searchCountries'],
      description: t['codeSentHere'],
      value: _phone,
      onChanged: (next) => setState(() => _phone = next),
    );
    // END phone-input-1
  }
}

Widget phoneInputInvalid(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN phone-input-2
  return LumoPhoneInput(
    label: t['emergencyNumber'],
    countryLabel: t['country'],
    closeLabel: t['closeCountries'],
    searchLabel: t['searchCountries'],
    defaultCountry: 'DE',
    errorMessage: t['incompleteNumber'],
  );
  // END phone-input-2
}
