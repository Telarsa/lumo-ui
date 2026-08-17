// Demos for the `button` slug.
//
// Every file here follows one shape, because `scripts/build-mobile-demos.mjs`
// reads it: `demos` registers the builders, `demoMeta` carries each demo's
// localized title and description, `copy` carries the localized strings the
// demo RENDERS, and the Dart a reader should copy sits between `// BEGIN <id>`
// and `// END <id>` — with every `t['key']` replaced by that locale's literal.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'button-1': buttonSolid,
  'button-2': buttonVariants,
  'button-3': buttonIcon,
};

const copy = <String, Map<String, String>>{
  'save': {'fa-IR': 'ذخیرهٔ تغییرات', 'en-US': 'Save changes'},
  'submit': {'fa-IR': 'ثبت', 'en-US': 'Submit'},
  'preview': {'fa-IR': 'پیش‌نمایش', 'en-US': 'Preview'},
  'cancel': {'fa-IR': 'انصراف', 'en-US': 'Cancel'},
  'delete': {'fa-IR': 'حذف', 'en-US': 'Delete'},
  'editNote': {'fa-IR': 'ویرایش یادداشت', 'en-US': 'Edit note'},
  'small': {'fa-IR': 'کوچک', 'en-US': 'Small'},
  'large': {'fa-IR': 'بزرگ', 'en-US': 'Large'},
  'disabled': {'fa-IR': 'ازکارافتاده', 'en-US': 'Disabled'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'button-1': {
    'title': {'fa-IR': 'دکمهٔ ساده', 'en-US': 'Plain button'},
    'description': {
      'fa-IR': 'کنش اصلی صفحه: یک برچسب و یک onPressed.',
      'en-US': 'The primary action: a label and an onPressed.',
    },
  },
  'button-2': {
    'title': {'fa-IR': 'گونه‌ها', 'en-US': 'Variants'},
    'description': {
      'fa-IR': 'solid برای کنش اصلی، outline و ghost برای کنش‌های کناری، critical برای کنش ویرانگر.',
      'en-US': 'solid for the primary action, outline and ghost beside it, critical for the destructive one.',
    },
  },
  'button-3': {
    'title': {'fa-IR': 'دکمهٔ نمادی و اندازه‌ها', 'en-US': 'Icon button and sizes'},
    'description': {
      'fa-IR': 'LumoIconButton نامش را از label می‌گیرد؛ نماد تنها دیده می‌شود، خوانده نمی‌شود.',
      'en-US': 'LumoIconButton takes its name from label; the glyph is seen, never announced.',
    },
  },
};

Widget buttonSolid(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN button-1
  return LumoButton(
    onPressed: () {},
    child: Text(t['save']),
  );
  // END button-1
}

Widget buttonVariants(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN button-2
  return Wrap(
    spacing: 8,
    runSpacing: 8,
    children: [
      LumoButton(onPressed: () {}, child: Text(t['submit'])),
      LumoButton(
        onPressed: () {},
        variant: LumoButtonVariant.outline,
        child: Text(t['preview']),
      ),
      LumoButton(
        onPressed: () {},
        variant: LumoButtonVariant.ghost,
        child: Text(t['cancel']),
      ),
      LumoButton(
        onPressed: () {},
        variant: LumoButtonVariant.critical,
        child: Text(t['delete']),
      ),
    ],
  );
  // END button-2
}

Widget buttonIcon(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN button-3
  return Wrap(
    spacing: 8,
    runSpacing: 8,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: [
      LumoIconButton(
        label: t['editNote'],
        onPressed: () {},
        child: const Icon(Icons.edit_outlined),
      ),
      LumoButton(
        onPressed: () {},
        size: LumoButtonSize.sm,
        child: Text(t['small']),
      ),
      LumoButton(
        onPressed: () {},
        size: LumoButtonSize.lg,
        child: Text(t['large']),
      ),
      LumoButton(
        isDisabled: true,
        child: Text(t['disabled']),
      ),
    ],
  );
  // END button-3
}
