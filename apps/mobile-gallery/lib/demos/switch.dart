// Demos for the `switch` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'switch-1': switchBasic,
  'switch-2': switchStates,
};

const copy = <String, Map<String, String>>{
  'smsAlerts': {'fa-IR': 'اعلان‌های پیامکی', 'en-US': 'Text message alerts'},
  'autoSync': {'fa-IR': 'هم‌رسانی خودکار', 'en-US': 'Automatic sync'},
  'autoSyncHint': {
    'fa-IR': 'هر تغییر بلافاصله روی همهٔ دستگاه‌ها می‌رود.',
    'en-US': 'Every change reaches all your devices at once.',
  },
  'betaMode': {'fa-IR': 'حالت آزمایشی', 'en-US': 'Beta mode'},
  'notForAccount': {
    'fa-IR': 'برای این حساب در دسترس نیست.',
    'en-US': 'Not available for this account.',
  },
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'switch-1': {
    'title': {'fa-IR': 'کلید ساده', 'en-US': 'Plain switch'},
    'description': {
      'fa-IR': 'یک تنظیم که بی‌درنگ اعمال می‌شود. برچسب دیده می‌شود و همان نامِ اعلام‌شده است.',
      'en-US': 'A setting that applies at once. The label is visible and is the announced name.',
    },
  },
  'switch-2': {
    'title': {'fa-IR': 'توضیح، اندازه و ازکارافتاده', 'en-US': 'Description, size and disabled'},
    'description': {
      'fa-IR': 'description به‌عنوان hint خوانده می‌شود؛ اندازهٔ lg برای ردیف‌های اصلی تنظیمات.',
      'en-US': 'description is read as the hint; the lg size suits a settings row.',
    },
  },
};

Widget switchBasic(BuildContext context) => const _SwitchBasic();

class _SwitchBasic extends StatefulWidget {
  const _SwitchBasic();
  @override
  State<_SwitchBasic> createState() => _SwitchBasicState();
}

class _SwitchBasicState extends State<_SwitchBasic> {
  bool _on = true;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN switch-1
    return LumoSwitch(
      label: t['smsAlerts'],
      isSelected: _on,
      onChanged: (next) => setState(() => _on = next),
    );
    // END switch-1
  }
}

Widget switchStates(BuildContext context) => const _SwitchStates();

class _SwitchStates extends StatefulWidget {
  const _SwitchStates();
  @override
  State<_SwitchStates> createState() => _SwitchStatesState();
}

class _SwitchStatesState extends State<_SwitchStates> {
  bool _sync = true;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN switch-2
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 12,
      children: [
        LumoSwitch(
          label: t['autoSync'],
          description: t['autoSyncHint'],
          size: LumoSwitchSize.lg,
          isSelected: _sync,
          onChanged: (next) => setState(() => _sync = next),
        ),
        LumoSwitch(
          label: t['betaMode'],
          description: t['notForAccount'],
          isDisabled: true,
        ),
      ],
    );
    // END switch-2
  }
}
