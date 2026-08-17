// Demos for the `item` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'item-1': itemBasic,
  'item-2': itemRich,
  'item-3': itemGroup,
};

const copy = <String, Map<String, String>>{
  'privacy': {'fa-IR': 'حریم خصوصی', 'en-US': 'Privacy'},
  'privacyBody': {
    'fa-IR': 'چه کسی می‌تواند نمایهٔ شما را ببیند.',
    'en-US': 'Who is able to see your profile.',
  },
  'bankCard': {'fa-IR': 'کارت بانک ملت', 'en-US': 'Mellat Bank card'},
  'bankCardBody': {'fa-IR': 'با چهار رقم آخر ۷۷۲۱', 'en-US': 'Ending in 7721'},
  'default': {'fa-IR': 'پیش‌فرض', 'en-US': 'Default'},
  'accountSettings': {'fa-IR': 'تنظیمات حساب', 'en-US': 'Account settings'},
  'profile': {'fa-IR': 'نمایه', 'en-US': 'Profile'},
  'notifications': {'fa-IR': 'اعلان‌ها', 'en-US': 'Notifications'},
  'deleteAccount': {'fa-IR': 'حذف حساب', 'en-US': 'Delete the account'},
  'notForAccount': {
    'fa-IR': 'برای این حساب در دسترس نیست.',
    'en-US': 'Not available for this account.',
  },
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'item-1': {
    'title': {'fa-IR': 'ردیف', 'en-US': 'Item'},
    'description': {
      'fa-IR': 'یک ردیف فهرست. بدون onTap متن است؛ با onTap یک دکمه با نامی که از title می‌آید.',
      'en-US': 'One list row. Without onTap it is text; with onTap it is a button named by its title.',
    },
  },
  'item-2': {
    'title': {'fa-IR': 'با نماد و انتخاب', 'en-US': 'With a glyph and a selection'},
    'description': {
      'fa-IR': 'leading و trailing در سرِ خواندن و پایانش می‌نشینند و با جهت می‌چرخند.',
      'en-US': 'leading and trailing sit at the reading start and end, and turn with the direction.',
    },
  },
  'item-3': {
    'title': {'fa-IR': 'گروه ردیف‌ها', 'en-US': 'Item group'},
    'description': {
      'fa-IR': 'LumoItemGroup نام فهرست را می‌گیرد؛ ردیف outlined قاب خودش را دارد، پس زیرش خط نمی‌خورد.',
      'en-US': 'LumoItemGroup names the list; an outlined row draws its own frame, so no divider goes under it.',
    },
  },
};

Widget itemBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN item-1
  return LumoItem(
    title: t['privacy'],
    description: t['privacyBody'],
    onTap: () {},
    variant: LumoItemVariant.plain,
    size: LumoItemSize.md,
    hasDivider: false,
  );
  // END item-1
}

Widget itemRich(BuildContext context) => const _ItemRich();

class _ItemRich extends StatefulWidget {
  const _ItemRich();
  @override
  State<_ItemRich> createState() => _ItemRichState();
}

class _ItemRichState extends State<_ItemRich> {
  bool _picked = true;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN item-2
    return LumoItem(
      title: t['bankCard'],
      description: t['bankCardBody'],
      variant: LumoItemVariant.outlined,
      leading: const Icon(Icons.credit_card),
      trailing: LumoBadge(label: t['default']),
      isSelected: _picked,
      onTap: () => setState(() => _picked = !_picked),
    );
    // END item-2
  }
}

Widget itemGroup(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN item-3
  return LumoItemGroup(
    label: t['accountSettings'],
    hasDividers: true,
    children: [
      LumoItem(
        title: t['profile'],
        leading: const Icon(Icons.person_outline),
        onTap: () {},
      ),
      LumoItem(
        title: t['notifications'],
        leading: const Icon(Icons.notifications_none),
        onTap: () {},
      ),
      LumoItem(
        title: t['deleteAccount'],
        description: t['notForAccount'],
        leading: const Icon(Icons.delete_outline),
        isDisabled: true,
      ),
    ],
  );
  // END item-3
}
