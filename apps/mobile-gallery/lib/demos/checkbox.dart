// Demos for the `checkbox` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'checkbox-1': checkboxBasic,
  'checkbox-2': checkboxGroup,
  'checkbox-3': checkboxMixed,
};

const copy = <String, Map<String, String>>{
  'acceptTerms': {'fa-IR': 'شرایط استفاده را می‌پذیرم', 'en-US': 'I accept the terms of use'},
  'acceptTermsHint': {
    'fa-IR': 'پیش از ثبت‌نام یک بار بخوانیدش.',
    'en-US': 'Give it one read before signing up.',
  },
  'notifyBy': {'fa-IR': 'راه‌های آگاه‌سازی', 'en-US': 'How we notify you'},
  'notifyByHint': {'fa-IR': 'دست‌کم یکی را انتخاب کنید.', 'en-US': 'Pick at least one.'},
  'email': {'fa-IR': 'ایمیل', 'en-US': 'Email'},
  'sms': {'fa-IR': 'پیامک', 'en-US': 'Text message'},
  'inApp': {'fa-IR': 'اعلان درون‌برنامه‌ای', 'en-US': 'In-app notification'},
  'allPermissions': {'fa-IR': 'همهٔ دسترسی‌ها', 'en-US': 'All permissions'},
  'twoOfFour': {
    'fa-IR': 'دو مورد از چهار مورد انتخاب شده است.',
    'en-US': 'Two of the four are selected.',
  },
  'readPrivacy': {
    'fa-IR': 'قوانین حریم خصوصی را خوانده‌ام',
    'en-US': 'I have read the privacy policy',
  },
  'mustAccept': {
    'fa-IR': 'برای ادامه باید این را بپذیرید.',
    'en-US': 'You must accept this to continue.',
  },
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'checkbox-1': {
    'title': {'fa-IR': 'چک‌باکس ساده', 'en-US': 'Plain checkbox'},
    'description': {
      'fa-IR': 'یک انتخاب دوحالته با برچسب دیدنی و توضیح.',
      'en-US': 'One two-state choice with a visible label and a description.',
    },
  },
  'checkbox-2': {
    'title': {'fa-IR': 'گروه', 'en-US': 'Group'},
    'description': {
      'fa-IR': 'LumoCheckboxGroup نام گروه را می‌گیرد و ازکارافتادگی و نادرستی را به فرزندانش می‌دهد.',
      'en-US': 'LumoCheckboxGroup names the group and passes disabled and invalid down to its children.',
    },
  },
  'checkbox-3': {
    'title': {'fa-IR': 'حالت میانی و خطا', 'en-US': 'Indeterminate and error'},
    'description': {
      'fa-IR': 'حالت میانی برای «بعضی انتخاب شده‌اند»؛ errorMessage خودش جعبه را نادرست می‌کند.',
      'en-US': 'The mixed state means «some are selected»; errorMessage marks the box invalid on its own.',
    },
  },
};

Widget checkboxBasic(BuildContext context) => const _CheckboxBasic();

class _CheckboxBasic extends StatefulWidget {
  const _CheckboxBasic();
  @override
  State<_CheckboxBasic> createState() => _CheckboxBasicState();
}

class _CheckboxBasicState extends State<_CheckboxBasic> {
  bool _accepted = false;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN checkbox-1
    return LumoCheckbox(
      label: t['acceptTerms'],
      description: t['acceptTermsHint'],
      isSelected: _accepted,
      onChanged: (next) => setState(() => _accepted = next),
    );
    // END checkbox-1
  }
}

Widget checkboxGroup(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN checkbox-2
  return LumoCheckboxGroup(
    label: t['notifyBy'],
    description: t['notifyByHint'],
    children: [
      LumoCheckbox(label: t['email'], defaultSelected: true),
      LumoCheckbox(label: t['sms']),
      LumoCheckbox(label: t['inApp'], isDisabled: true),
    ],
  );
  // END checkbox-2
}

Widget checkboxMixed(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN checkbox-3
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 12,
    children: [
      LumoCheckbox(
        label: t['allPermissions'],
        description: t['twoOfFour'],
        isIndeterminate: true,
      ),
      LumoCheckbox(
        label: t['readPrivacy'],
        errorMessage: t['mustAccept'],
      ),
    ],
  );
  // END checkbox-3
}
