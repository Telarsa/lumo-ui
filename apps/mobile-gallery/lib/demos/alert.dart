// Demos for the `alert` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'alert-1': alertBasic,
  'alert-2': alertTones,
  'alert-3': alertDismissible,
};

const copy = <String, Map<String, String>>{
  'updateTitle': {'fa-IR': 'نسخهٔ تازه در دسترس است', 'en-US': 'A new version is available'},
  'updateBody': {
    'fa-IR': 'برای دریافت تغییرات برنامه را ببندید و دوباره باز کنید.',
    'en-US': 'Close the app and open it again to pick up the changes.',
  },
  'paidTitle': {'fa-IR': 'پرداخت انجام شد', 'en-US': 'Payment went through'},
  'paidBody': {
    'fa-IR': 'رسید به ایمیل شما فرستاده شد.',
    'en-US': 'The receipt has been emailed to you.',
  },
  'expiringTitle': {'fa-IR': 'اعتبار حساب رو به پایان است', 'en-US': 'Your credit is running out'},
  'expiringBody': {
    'fa-IR': 'کمتر از سه روز تا پایان اشتراک مانده.',
    'en-US': 'Fewer than three days of the subscription remain.',
  },
  'renew': {'fa-IR': 'تمدید', 'en-US': 'Renew'},
  'failedTitle': {'fa-IR': 'ارسال ناموفق بود', 'en-US': 'Sending failed'},
  'failedBody': {'fa-IR': 'اتصال شبکه قطع شد.', 'en-US': 'The network connection dropped.'},
  'draftTitle': {'fa-IR': 'پیش‌نویس ذخیره شد', 'en-US': 'Draft saved'},
  'draftBody': {
    'fa-IR': 'می‌توانید بعداً از بخش پیش‌نویس‌ها ادامه دهید.',
    'en-US': 'You can pick it up later from the drafts section.',
  },
  'dismissDraft': {
    'fa-IR': 'بستن پیام ذخیرهٔ پیش‌نویس',
    'en-US': 'Dismiss the draft-saved message',
  },
  'dismissed': {'fa-IR': 'پیام بسته شد.', 'en-US': 'The message was dismissed.'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'alert-1': {
    'title': {'fa-IR': 'هشدار ساده', 'en-US': 'Plain alert'},
    'description': {
      'fa-IR': 'یک خبر که در جریان صفحه می‌ماند و کار را قطع نمی‌کند. آهنگ و گونه صریح نوشته شده‌اند، چون همان‌ها پیش‌فرض‌اند.',
      'en-US': 'A notice that stays in the flow of the page and interrupts nothing. The tone and variant are spelled out because they are the defaults.',
    },
  },
  'alert-2': {
    'title': {'fa-IR': 'آهنگ و کنش', 'en-US': 'Tone and actions'},
    'description': {
      'fa-IR': 'آهنگ رنگ را می‌گذارد، متن معنا را — رنگ به‌تنهایی حامل خبر نیست.',
      'en-US': 'The tone sets the colour, the text carries the meaning — colour alone never carries the news.',
    },
  },
  'alert-3': {
    'title': {'fa-IR': 'بستنی و زنده', 'en-US': 'Dismissible and live'},
    'description': {
      'fa-IR': 'onDismiss بدون dismissLabel رد می‌شود؛ isLive هشدار را به یک ناحیهٔ زنده تبدیل می‌کند.',
      'en-US': 'onDismiss without dismissLabel is refused; isLive makes the alert a live region.',
    },
  },
};

Widget alertBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN alert-1
  return LumoAlert(
    title: t['updateTitle'],
    description: t['updateBody'],
    tone: LumoAlertTone.neutral,
    variant: LumoAlertVariant.subtle,
    icon: const Icon(Icons.system_update_alt_outlined),
  );
  // END alert-1
}

Widget alertTones(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN alert-2
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 12,
    children: [
      LumoAlert(
        title: t['paidTitle'],
        description: t['paidBody'],
        tone: LumoAlertTone.positive,
      ),
      LumoAlert(
        title: t['expiringTitle'],
        description: t['expiringBody'],
        tone: LumoAlertTone.caution,
        actions: [
          LumoButton(
            onPressed: () {},
            size: LumoButtonSize.sm,
            child: Text(t['renew']),
          ),
        ],
      ),
      LumoAlert(
        title: t['failedTitle'],
        description: t['failedBody'],
        tone: LumoAlertTone.critical,
        variant: LumoAlertVariant.outline,
      ),
    ],
  );
  // END alert-2
}

Widget alertDismissible(BuildContext context) => const _AlertDismissible();

class _AlertDismissible extends StatefulWidget {
  const _AlertDismissible();
  @override
  State<_AlertDismissible> createState() => _AlertDismissibleState();
}

class _AlertDismissibleState extends State<_AlertDismissible> {
  bool _shown = true;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN alert-3
    return _shown
        ? LumoAlert(
            title: t['draftTitle'],
            description: t['draftBody'],
            tone: LumoAlertTone.neutral,
            isLive: true,
            onDismiss: () => setState(() => _shown = false),
            dismissLabel: t['dismissDraft'],
          )
        : Text(t['dismissed']);
    // END alert-3
  }
}
