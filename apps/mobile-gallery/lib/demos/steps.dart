// Demos for the `steps` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'steps-1': stepsBasic,
  'steps-2': stepsVertical,
};

const copy = <String, Map<String, String>>{
  'signupSteps': {'fa-IR': 'مراحل ثبت‌نام', 'en-US': 'Sign-up steps'},
  'completed': {'fa-IR': 'انجام‌شده', 'en-US': 'Completed'},
  'currentStep': {'fa-IR': 'گام کنونی', 'en-US': 'Current step'},
  'upcoming': {'fa-IR': 'پیشِ‌رو', 'en-US': 'Still to come'},
  'account': {'fa-IR': 'حساب', 'en-US': 'Account'},
  'address': {'fa-IR': 'نشانی', 'en-US': 'Address'},
  'payment': {'fa-IR': 'پرداخت', 'en-US': 'Payment'},
  'idSteps': {'fa-IR': 'مراحل احراز هویت', 'en-US': 'Identity check steps'},
  'mobile': {'fa-IR': 'شمارهٔ همراه', 'en-US': 'Mobile number'},
  'mobileBody': {'fa-IR': 'با کد پیامکی تأیید شد.', 'en-US': 'Verified by texted code.'},
  'idCard': {'fa-IR': 'کارت ملی', 'en-US': 'ID card'},
  'idCardBody': {
    'fa-IR': 'تصویر پشت و رو بارگذاری شد.',
    'en-US': 'Both sides have been uploaded.',
  },
  'videoCheck': {'fa-IR': 'تأیید ویدیویی', 'en-US': 'Video check'},
  'videoCheckBody': {
    'fa-IR': 'یک ویدیوی ده‌ثانیه‌ای بگیرید.',
    'en-US': 'Record a ten-second video.',
  },
  'finalReview': {'fa-IR': 'بررسی نهایی', 'en-US': 'Final review'},
  'finalReviewBody': {'fa-IR': 'تا ۲۴ ساعت آینده.', 'en-US': 'Within the next day.'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'steps-1': {
    'title': {'fa-IR': 'گام‌ها', 'en-US': 'Steps'},
    'description': {
      'fa-IR': 'کجای یک کار چندمرحله‌ای هستیم. current از صفر شمرده می‌شود.',
      'en-US': 'Where we are in a multi-step task. current is counted from zero.',
    },
  },
  'steps-2': {
    'title': {'fa-IR': 'عمودی با توضیح', 'en-US': 'Vertical, with descriptions'},
    'description': {
      'fa-IR': 'سه نامِ وضعیت اجباری‌اند و همان‌ها به خواننده گفته می‌شوند؛ شمارهٔ گام تزیین است.',
      'en-US': 'The three state names are required and are what the reader hears; the step number is decoration.',
    },
  },
};

Widget stepsBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN steps-1
  return LumoSteps(
    label: t['signupSteps'],
    current: 1,
    completedLabel: t['completed'],
    currentLabel: t['currentStep'],
    upcomingLabel: t['upcoming'],
    steps: [
      LumoStep(title: t['account']),
      LumoStep(title: t['address']),
      LumoStep(title: t['payment']),
    ],
  );
  // END steps-1
}

Widget stepsVertical(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN steps-2
  return LumoSteps(
    label: t['idSteps'],
    current: 2,
    orientation: LumoStepsOrientation.vertical,
    completedLabel: t['completed'],
    currentLabel: t['currentStep'],
    upcomingLabel: t['upcoming'],
    steps: [
      LumoStep(title: t['mobile'], description: t['mobileBody']),
      LumoStep(title: t['idCard'], description: t['idCardBody']),
      LumoStep(title: t['videoCheck'], description: t['videoCheckBody']),
      LumoStep(title: t['finalReview'], description: t['finalReviewBody']),
    ],
  );
  // END steps-2
}
