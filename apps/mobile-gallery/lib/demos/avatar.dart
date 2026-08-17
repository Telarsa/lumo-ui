// Demos for the `avatar` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'avatar-1': avatarBasic,
  'avatar-2': avatarSizes,
  'avatar-3': avatarStatus,
};

const copy = <String, Map<String, String>>{
  'kamyab': {'fa-IR': 'کامیاب نظری', 'en-US': 'Kamyab Nazari'},
  'sara': {'fa-IR': 'سارا احمدی', 'en-US': 'Sara Ahmadi'},
  'ada': {'fa-IR': 'آدا لاولیس', 'en-US': 'Ada Lovelace'},
  'mina': {'fa-IR': 'مینا رستمی', 'en-US': 'Mina Rostami'},
  'reza': {'fa-IR': 'رضا کریمی', 'en-US': 'Reza Karimi'},
  'negar': {'fa-IR': 'نگار موسوی', 'en-US': 'Negar Mousavi'},
  'hossein': {'fa-IR': 'حسین فراهانی', 'en-US': 'Hossein Farahani'},
  'online': {'fa-IR': 'برخط', 'en-US': 'Online'},
  'busy': {'fa-IR': 'مشغول', 'en-US': 'Busy'},
  'offline': {'fa-IR': 'برون‌خط', 'en-US': 'Offline'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'avatar-1': {
    'title': {'fa-IR': 'آواتار', 'en-US': 'Avatar'},
    'description': {
      'fa-IR': 'label نام کامل است و هم حروف آغازین را می‌سازد و هم آنچه خوانده می‌شود.',
      'en-US': 'label is the full name: it makes the initials and it is what gets announced.',
    },
  },
  'avatar-2': {
    'title': {'fa-IR': 'اندازه و شکل', 'en-US': 'Size and shape'},
    'description': {
      'fa-IR': 'چهار اندازه و دو شکل. حروف آغازین با lumoInitials از خود نام درمی‌آید.',
      'en-US': 'Four sizes and two shapes. The initials come from the name itself, via lumoInitials.',
    },
  },
  'avatar-3': {
    'title': {'fa-IR': 'با وضعیت', 'en-US': 'With a status'},
    'description': {
      'fa-IR': 'نقطهٔ وضعیت بدون statusLabel رد می‌شود: یک نقطهٔ سبز به‌تنهایی «برخط» نمی‌گوید.',
      'en-US': 'A status dot without statusLabel is refused: a green dot alone does not say «online».',
    },
  },
};

Widget avatarBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN avatar-1
  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    spacing: 12,
    children: [
      LumoAvatar(label: t['kamyab']),
      LumoAvatar(label: t['sara']),
      LumoAvatar(label: t['ada']),
    ],
  );
  // END avatar-1
}

Widget avatarSizes(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN avatar-2
  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    crossAxisAlignment: CrossAxisAlignment.center,
    spacing: 12,
    children: [
      LumoAvatar(label: t['mina'], size: LumoAvatarSize.sm),
      LumoAvatar(label: t['mina'], size: LumoAvatarSize.md),
      LumoAvatar(
        label: t['mina'],
        size: LumoAvatarSize.lg,
        shape: LumoAvatarShape.rounded,
      ),
      LumoAvatar(label: t['mina'], size: LumoAvatarSize.xl),
    ],
  );
  // END avatar-2
}

Widget avatarStatus(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN avatar-3
  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    spacing: 12,
    children: [
      LumoAvatar(
        label: t['reza'],
        size: LumoAvatarSize.lg,
        status: LumoAvatarStatus.online,
        statusLabel: t['online'],
      ),
      LumoAvatar(
        label: t['negar'],
        size: LumoAvatarSize.lg,
        status: LumoAvatarStatus.busy,
        statusLabel: t['busy'],
      ),
      LumoAvatar(
        label: t['hossein'],
        size: LumoAvatarSize.lg,
        status: LumoAvatarStatus.offline,
        statusLabel: t['offline'],
      ),
    ],
  );
  // END avatar-3
}
