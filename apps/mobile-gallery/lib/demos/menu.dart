// Demos for the `menu` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'menu-1': menuBasic,
  'menu-2': menuSections,
};

const copy = <String, Map<String, String>>{
  'documentActions': {'fa-IR': 'کنش‌های سند', 'en-US': 'Document actions'},
  'edit': {'fa-IR': 'ویرایش', 'en-US': 'Edit'},
  'duplicate': {'fa-IR': 'رونوشت', 'en-US': 'Duplicate'},
  'delete': {'fa-IR': 'حذف', 'en-US': 'Delete'},
  'listView': {'fa-IR': 'نمای فهرست', 'en-US': 'List view'},
  'view': {'fa-IR': 'نما', 'en-US': 'View'},
  'layout': {'fa-IR': 'چیدمان', 'en-US': 'Layout'},
  'compact': {'fa-IR': 'نمای فشرده', 'en-US': 'Compact view'},
  'showImages': {'fa-IR': 'نمایش تصاویر', 'en-US': 'Show images'},
  'resetView': {'fa-IR': 'بازنشانی نما', 'en-US': 'Reset the view'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'menu-1': {
    'title': {'fa-IR': 'منو', 'en-US': 'Menu'},
    'description': {
      'fa-IR': 'کنش‌های یک شیء، پشت یک دکمه. label نام خود منوست؛ هر مورد نام خودش را دارد.',
      'en-US': 'One object’s actions, behind one button. label names the menu; every item names itself.',
    },
  },
  'menu-2': {
    'title': {'fa-IR': 'بخش‌ها و مورد چک‌دار', 'en-US': 'Sections and checkbox items'},
    'description': {
      'fa-IR': 'LumoMenuSection موردها را گروه می‌کند و LumoMenuCheckboxItem وضعیت انتخاب را اعلام می‌کند.',
      'en-US': 'LumoMenuSection groups the items and LumoMenuCheckboxItem announces its selected state.',
    },
  },
};

Widget menuBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN menu-1
  return LumoMenuTrigger(
    label: t['documentActions'],
    trigger: (open) => LumoIconButton(
      label: t['documentActions'],
      onPressed: open,
      child: const Icon(Icons.more_vert),
    ),
    items: [
      LumoMenuItem(
        label: t['edit'],
        icon: const Icon(Icons.edit_outlined),
        onSelected: () {},
      ),
      LumoMenuItem(
        label: t['duplicate'],
        icon: const Icon(Icons.copy_outlined),
        onSelected: () {},
      ),
      const LumoMenuSeparator(),
      LumoMenuItem(
        label: t['delete'],
        icon: const Icon(Icons.delete_outline),
        isDestructive: true,
        onSelected: () {},
      ),
    ],
  );
  // END menu-1
}

Widget menuSections(BuildContext context) => const _MenuSections();

class _MenuSections extends StatefulWidget {
  const _MenuSections();
  @override
  State<_MenuSections> createState() => _MenuSectionsState();
}

class _MenuSectionsState extends State<_MenuSections> {
  bool _compact = true;

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN menu-2
    return LumoMenuTrigger(
      label: t['listView'],
      placement: LumoPlacement.bottomEnd,
      trigger: (open) => LumoButton(
        onPressed: open,
        variant: LumoButtonVariant.outline,
        child: Text(t['view']),
      ),
      items: [
        LumoMenuSection(
          label: t['layout'],
          items: [
            LumoMenuCheckboxItem(
              label: t['compact'],
              isSelected: _compact,
              onChanged: (next) => setState(() => _compact = next),
            ),
            LumoMenuCheckboxItem(label: t['showImages'], isSelected: false),
          ],
        ),
        const LumoMenuSeparator(),
        LumoMenuItem(label: t['resetView'], onSelected: () {}),
      ],
    );
    // END menu-2
  }
}
