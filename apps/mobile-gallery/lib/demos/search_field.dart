// Demos for the `search-field` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'search-field-1': searchFieldBasic,
  'search-field-2': searchFieldBare,
};

const copy = <String, Map<String, String>>{
  'searchProducts': {'fa-IR': 'جست‌وجو در محصولات', 'en-US': 'Search products'},
  'clearSearch': {'fa-IR': 'پاک‌کردن جست‌وجو', 'en-US': 'Clear the search'},
  'productOrBrand': {'fa-IR': 'نام محصول یا برند', 'en-US': 'Product or brand name'},
  'shoe': {'fa-IR': 'کفش', 'en-US': 'shoes'},
  'searchChats': {'fa-IR': 'جست‌وجو در گفت‌وگوها', 'en-US': 'Search conversations'},
  'search': {'fa-IR': 'جست‌وجو', 'en-US': 'Search'},
  'nameOrMessage': {'fa-IR': 'نام مخاطب یا متن پیام', 'en-US': 'A contact’s name or message text'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'search-field-1': {
    'title': {'fa-IR': 'جست‌وجو', 'en-US': 'Search'},
    'description': {
      'fa-IR': 'clearLabel اجباری است: دکمهٔ پاک‌کردن باید نامی داشته باشد که خوانده شود.',
      'en-US': 'clearLabel is required: the clear button must have a name that is announced.',
    },
  },
  'search-field-2': {
    'title': {'fa-IR': 'بدون برچسب دیدنی', 'en-US': 'Without a visible label'},
    'description': {
      'fa-IR': 'showLabel: false برچسب را از دید برمی‌دارد، نه از درخت دسترس‌پذیری.',
      'en-US': 'showLabel: false hides the label from sight, never from the accessibility tree.',
    },
  },
};

Widget searchFieldBasic(BuildContext context) => const _SearchFieldBasic();

class _SearchFieldBasic extends StatefulWidget {
  const _SearchFieldBasic();
  @override
  State<_SearchFieldBasic> createState() => _SearchFieldBasicState();
}

class _SearchFieldBasicState extends State<_SearchFieldBasic> {
  String? _query;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN search-field-1
    return LumoSearchField(
      label: t['searchProducts'],
      clearLabel: t['clearSearch'],
      placeholder: t['productOrBrand'],
      value: _query ?? t['shoe'],
      onChanged: (next) => setState(() => _query = next),
      onClear: () => setState(() => _query = ''),
    );
    // END search-field-1
  }
}

Widget searchFieldBare(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN search-field-2
  return LumoSearchField(
    label: t['searchChats'],
    clearLabel: t['clearSearch'],
    showLabel: false,
    placeholder: t['search'],
    description: t['nameOrMessage'],
  );
  // END search-field-2
}
