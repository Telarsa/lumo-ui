// Demos for the `toggle` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'toggle-1': toggleBasic,
  'toggle-2': toggleIconOnly,
  'toggle-3': toggleGroup,
};

const copy = <String, Map<String, String>>{
  'pinChat': {'fa-IR': 'سنجاق‌کردن گفت‌وگو', 'en-US': 'Pin the conversation'},
  'bold': {'fa-IR': 'درشت', 'en-US': 'Bold'},
  'italic': {'fa-IR': 'کج', 'en-US': 'Italic'},
  'underline': {'fa-IR': 'زیرخط‌دار', 'en-US': 'Underline'},
  'textAlignment': {'fa-IR': 'ترازبندی متن', 'en-US': 'Text alignment'},
  'alignStart': {'fa-IR': 'تراز به سرِ خط', 'en-US': 'Align to the line start'},
  'alignCenter': {'fa-IR': 'تراز وسط', 'en-US': 'Align to the centre'},
  'alignEnd': {'fa-IR': 'تراز به پایان خط', 'en-US': 'Align to the line end'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'toggle-1': {
    'title': {'fa-IR': 'کلید فشاری', 'en-US': 'Toggle'},
    'description': {
      'fa-IR': 'یک دکمه که فشرده می‌ماند. وضعیت فشرده اعلام می‌شود، نه فقط رنگ می‌شود.',
      'en-US': 'A button that stays pressed. The pressed state is announced, not merely coloured.',
    },
  },
  'toggle-2': {
    'title': {'fa-IR': 'فقط نماد', 'en-US': 'Icon only'},
    'description': {
      'fa-IR': 'iconOnly برچسب را از دید برمی‌دارد و نه از نامِ اعلام‌شده؛ بدون icon رد می‌شود.',
      'en-US': 'iconOnly hides the label from sight but not from the announced name; without an icon it is refused.',
    },
  },
  'toggle-3': {
    'title': {'fa-IR': 'گروه', 'en-US': 'Group'},
    'description': {
      'fa-IR': 'selectionMode می‌گوید یکی یا چندتا. disallowEmptySelection نمی‌گذارد هیچ‌کدام انتخاب نباشد.',
      'en-US': 'selectionMode states one or many. disallowEmptySelection refuses to leave nothing selected.',
    },
  },
};

Widget toggleBasic(BuildContext context) => const _ToggleBasic();

class _ToggleBasic extends StatefulWidget {
  const _ToggleBasic();
  @override
  State<_ToggleBasic> createState() => _ToggleBasicState();
}

class _ToggleBasicState extends State<_ToggleBasic> {
  bool _pinned = false;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN toggle-1
    return LumoToggle(
      label: t['pinChat'],
      icon: const Icon(Icons.push_pin_outlined),
      variant: LumoToggleVariant.outline,
      isSelected: _pinned,
      onChanged: (next) => setState(() => _pinned = next),
    );
    // END toggle-1
  }
}

Widget toggleIconOnly(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN toggle-2
  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    spacing: 8,
    children: [
      LumoToggle(
        label: t['bold'],
        icon: const Icon(Icons.format_bold),
        iconOnly: true,
        defaultSelected: true,
      ),
      LumoToggle(
        label: t['italic'],
        icon: const Icon(Icons.format_italic),
        iconOnly: true,
      ),
      LumoToggle(
        label: t['underline'],
        icon: const Icon(Icons.format_underlined),
        iconOnly: true,
        isDisabled: true,
      ),
    ],
  );
  // END toggle-2
}

Widget toggleGroup(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN toggle-3
  return LumoToggleGroup(
    label: t['textAlignment'],
    defaultValue: 'start',
    disallowEmptySelection: true,
    items: [
      LumoToggleItem(
        id: 'start',
        label: t['alignStart'],
        icon: const Icon(Icons.format_align_right),
        iconOnly: true,
      ),
      LumoToggleItem(
        id: 'center',
        label: t['alignCenter'],
        icon: const Icon(Icons.format_align_center),
        iconOnly: true,
      ),
      LumoToggleItem(
        id: 'end',
        label: t['alignEnd'],
        icon: const Icon(Icons.format_align_left),
        iconOnly: true,
      ),
    ],
  );
  // END toggle-3
}
