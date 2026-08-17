// Demos for the `icon-tile` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'icon-tile-1': iconTileBasic,
  'icon-tile-2': iconTileTones,
};

const copy = <String, Map<String, String>>{
  'verifiedAccount': {'fa-IR': 'حساب تأییدشده', 'en-US': 'Verified account'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'icon-tile-1': {
    'title': {'fa-IR': 'کاشی نماد', 'en-US': 'Icon tile'},
    'description': {
      'fa-IR': 'یک نماد در قابی رنگی. پیش‌فرض تزیینی است و خوانده نمی‌شود؛ اگر معنایی دارد accessibilityLabel بدهید.',
      'en-US': 'One glyph in a coloured frame. Decorative by default and never announced; give it accessibilityLabel when it carries meaning.',
    },
  },
  'icon-tile-2': {
    'title': {'fa-IR': 'آهنگ، گونه و شکل', 'en-US': 'Tone, variant and shape'},
    'description': {
      'fa-IR': 'پنج آهنگ، دو گونه و دو شکل — همه از همان توکن‌هایی که تم وب از آن‌ها ساخته می‌شود.',
      'en-US': 'Five tones, two variants and two shapes — all from the tokens the web theme is built from.',
    },
  },
};

Widget iconTileBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN icon-tile-1
  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    spacing: 12,
    children: [
      const LumoIconTile(icon: Icon(Icons.bolt_outlined)),
      LumoIconTile(
        icon: const Icon(Icons.verified_outlined),
        accessibilityLabel: t['verifiedAccount'],
        tone: LumoIconTileTone.positive,
      ),
    ],
  );
  // END icon-tile-1
}

Widget iconTileTones(BuildContext context) {
  // BEGIN icon-tile-2
  return const Wrap(
    spacing: 12,
    runSpacing: 12,
    alignment: WrapAlignment.center,
    children: [
      LumoIconTile(
        icon: Icon(Icons.rocket_launch_outlined),
        tone: LumoIconTileTone.accent,
        variant: LumoIconTileVariant.solid,
        size: LumoIconTileSize.lg,
      ),
      LumoIconTile(
        icon: Icon(Icons.warning_amber_outlined),
        tone: LumoIconTileTone.caution,
        shape: LumoIconTileShape.circle,
      ),
      LumoIconTile(
        icon: Icon(Icons.delete_outline),
        tone: LumoIconTileTone.critical,
        size: LumoIconTileSize.sm,
      ),
    ],
  );
  // END icon-tile-2
}
