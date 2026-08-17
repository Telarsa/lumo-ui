// Demos for the `input-otp` slug — the web's One-time code, which in Flutter
// is `LumoOtpField`.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'input-otp-1': otpBasic,
  'input-otp-2': otpError,
};

const copy = <String, Map<String, String>>{
  'smsCode': {'fa-IR': 'کد پیامک‌شده', 'en-US': 'The texted code'},
  'digit': {'fa-IR': 'رقم', 'en-US': 'Digit'},
  'of': {'fa-IR': 'از', 'en-US': 'of'},
  'sixDigitHint': {
    'fa-IR': 'کد شش‌رقمی به شمارهٔ شما پیامک شد.',
    'en-US': 'A six-digit code was texted to your number.',
  },
  'verificationCode': {'fa-IR': 'کد تأیید', 'en-US': 'Verification code'},
  'wrongCode': {'fa-IR': 'کد واردشده درست نیست.', 'en-US': 'That code is not right.'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'input-otp-1': {
    'title': {'fa-IR': 'کد یک‌بارمصرف', 'en-US': 'One-time code'},
    'description': {
      'fa-IR': 'یک ورودی واقعی پشت خانه‌های جدا. cellLabel نام هر خانه را از شماره‌اش می‌سازد.',
      'en-US': 'One real input behind separate cells. cellLabel builds each cell’s name from its position.',
    },
  },
  'input-otp-2': {
    'title': {'fa-IR': 'چهار رقمی با خطا', 'en-US': 'Four digits, with an error'},
    'description': {
      'fa-IR': 'رقم‌ها با ارقام محلی نمایش داده می‌شوند؛ errorMessage زیر ردیف می‌نشیند.',
      'en-US': 'The digits render in the locale’s own numerals; errorMessage sits under the row.',
    },
  },
};

Widget otpBasic(BuildContext context) => const _OtpBasic();

class _OtpBasic extends StatefulWidget {
  const _OtpBasic();
  @override
  State<_OtpBasic> createState() => _OtpBasicState();
}

class _OtpBasicState extends State<_OtpBasic> {
  String _code = '';

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN input-otp-1
    return LumoOtpField(
      label: t['smsCode'],
      cellLabel: (index, length) =>
          // Announced per cell — the number must be a Persian digit under fa.
          '${t['digit']} ${formatNumber(index + 1, t.locale)} ${t['of']} ${formatNumber(length, t.locale)}',
      description: t['sixDigitHint'],
      value: _code,
      onChanged: (next) => setState(() => _code = next),
      onCompleted: (code) {},
    );
    // END input-otp-1
  }
}

Widget otpError(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN input-otp-2
  return LumoOtpField(
    label: t['verificationCode'],
    cellLabel: (index, length) =>
        '${t['digit']} ${formatNumber(index + 1, t.locale)} ${t['of']} ${formatNumber(length, t.locale)}',
    length: 4,
    defaultValue: '12',
    errorMessage: t['wrongCode'],
  );
  // END input-otp-2
}
