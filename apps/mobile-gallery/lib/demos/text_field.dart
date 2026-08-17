// Demos for the `text-field` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'text-field-1': textFieldBasic,
  'text-field-2': textFieldInvalid,
  'text-field-3': textFieldNumeric,
};

const copy = <String, Map<String, String>>{
  'fullName': {'fa-IR': 'نام و نام خانوادگی', 'en-US': 'Full name'},
  'fullNamePlaceholder': {'fa-IR': 'مثلاً کامیاب نظری', 'en-US': 'e.g. Kamyab Nazari'},
  'fullNameHint': {
    'fa-IR': 'همان‌طور که در کارت ملی آمده است.',
    'en-US': 'Exactly as it appears on your ID.',
  },
  'emailAddress': {'fa-IR': 'نشانی ایمیل', 'en-US': 'Email address'},
  'emailInvalid': {'fa-IR': 'این نشانی معتبر نیست.', 'en-US': 'That address is not valid.'},
  'username': {'fa-IR': 'شناسهٔ کاربری', 'en-US': 'Username'},
  'usernameHint': {
    'fa-IR': 'پس از ساخت حساب تغییر نمی‌کند.',
    'en-US': 'It cannot be changed after the account is made.',
  },
  'cardNumber': {'fa-IR': 'شمارهٔ کارت', 'en-US': 'Card number'},
  'password': {'fa-IR': 'رمز عبور', 'en-US': 'Password'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'text-field-1': {
    'title': {'fa-IR': 'ورودی متن', 'en-US': 'Text field'},
    'description': {
      'fa-IR': 'برچسب اجباری است و بالای ورودی می‌نشیند؛ placeholder جایگزین برچسب نیست.',
      'en-US': 'The label is required and sits above the field; a placeholder is not a label.',
    },
  },
  'text-field-2': {
    'title': {'fa-IR': 'اجباری، خطا و فقط‌خواندنی', 'en-US': 'Required, error and read-only'},
    'description': {
      'fa-IR': 'errorMessage خودش ورودی را نادرست می‌کند و به‌عنوان توضیح خوانده می‌شود.',
      'en-US': 'errorMessage marks the field invalid on its own and is announced as its description.',
    },
  },
  'text-field-3': {
    'title': {'fa-IR': 'عددی و با پیشوند', 'en-US': 'Numeric and with a prefix'},
    'description': {
      'fa-IR': 'isNumeric رقم‌ها را چپ‌به‌راست نگه می‌دارد، حتی وقتی صفحه راست‌به‌چپ است.',
      'en-US': 'isNumeric keeps the digits left-to-right even on a right-to-left page.',
    },
  },
};

Widget textFieldBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN text-field-1
  return LumoTextField(
    label: t['fullName'],
    placeholder: t['fullNamePlaceholder'],
    description: t['fullNameHint'],
    onChanged: (String value) {},
    isRequired: false,
    isDisabled: false,
  );
  // END text-field-1
}

Widget textFieldInvalid(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN text-field-2
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 16,
    children: [
      LumoTextField(
        label: t['emailAddress'],
        isRequired: true,
        errorMessage: t['emailInvalid'],
      ),
      LumoTextField(
        label: t['username'],
        isReadOnly: true,
        description: t['usernameHint'],
      ),
    ],
  );
  // END text-field-2
}

Widget textFieldNumeric(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN text-field-3
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 16,
    children: [
      LumoTextField(
        label: t['cardNumber'],
        isNumeric: true,
        placeholder: '6219 8610 0000 0000',
      ),
      LumoTextField(
        label: t['password'],
        obscureText: true,
        prefix: const Icon(Icons.lock_outline),
      ),
    ],
  );
  // END text-field-3
}
