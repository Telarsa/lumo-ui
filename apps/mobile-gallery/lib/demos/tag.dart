// Demos for the `tag` slug — the web's Tag / Tag group, which in Flutter is
// `LumoChip` and `LumoTagGroup`.
//
// The two removable demos hold their labels in state rather than looking them
// up per build, because the marked source has to resolve to LITERALS for the
// docs snippet — `t[someVariable]` cannot. Resolving the copy once per locale
// in `didChangeDependencies` keeps the plumbing outside the marked region,
// where it belongs.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'tag-1': tagPlain,
  'tag-2': tagSelectable,
  'tag-3': tagGroup,
};

const copy = <String, Map<String, String>>{
  'design': {'fa-IR': 'طراحی', 'en-US': 'Design'},
  'a11y': {'fa-IR': 'دسترس‌پذیری', 'en-US': 'Accessibility'},
  'rtl': {'fa-IR': 'راست‌به‌چپ', 'en-US': 'Right to left'},
  'inStock': {'fa-IR': 'موجود', 'en-US': 'In stock'},
  'freeShipping': {'fa-IR': 'ارسال رایگان', 'en-US': 'Free shipping'},
  'discounted': {'fa-IR': 'تخفیف‌دار', 'en-US': 'Discounted'},
  'remove': {'fa-IR': 'حذف', 'en-US': 'Remove'},
  'chosenCities': {'fa-IR': 'شهرهای انتخاب‌شده', 'en-US': 'Chosen cities'},
  'tehran': {'fa-IR': 'تهران', 'en-US': 'Tehran'},
  'isfahan': {'fa-IR': 'اصفهان', 'en-US': 'Isfahan'},
  'shiraz': {'fa-IR': 'شیراز', 'en-US': 'Shiraz'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'tag-1': {
    'title': {'fa-IR': 'برچسب ساده', 'en-US': 'Plain tag'},
    'description': {
      'fa-IR': 'یک کلیدواژه یا مقدار انتخاب‌شده. بدون onChanged یک متن است، نه یک کنترل.',
      'en-US': 'A keyword or a chosen value. Without onChanged it is text, not a control.',
    },
  },
  'tag-2': {
    'title': {'fa-IR': 'انتخاب‌پذیر و حذف‌شدنی', 'en-US': 'Selectable and removable'},
    'description': {
      'fa-IR': 'onChanged برچسب را به یک کلید تبدیل می‌کند؛ onRemove بدون removeLabel رد می‌شود — ✕ یک نام نیست.',
      'en-US': 'onChanged turns the tag into a toggle; onRemove without removeLabel is refused — an ✕ is not a name.',
    },
  },
  'tag-3': {
    'title': {'fa-IR': 'گروه برچسب', 'en-US': 'Tag group'},
    'description': {
      'fa-IR': 'removeLabel از متن هر برچسب نام کنترل حذف را می‌سازد.',
      'en-US': 'removeLabel builds each remove control’s name from that tag’s own text.',
    },
  },
};

Widget tagPlain(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN tag-1
  return Wrap(
    spacing: 8,
    runSpacing: 8,
    children: [
      LumoChip(label: t['design']),
      LumoChip(label: t['a11y'], icon: const Icon(Icons.accessibility_new)),
      LumoChip(label: t['rtl'], size: LumoChipSize.sm),
    ],
  );
  // END tag-1
}

Widget tagSelectable(BuildContext context) => const _TagSelectable();

class _TagSelectable extends StatefulWidget {
  const _TagSelectable();
  @override
  State<_TagSelectable> createState() => _TagSelectableState();
}

class _TagSelectableState extends State<_TagSelectable> {
  String? _builtFor;
  List<String> _filters = const [];
  Set<String> _selected = const {};

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final locale = LumoScope.of(context).locale;
    if (locale == _builtFor) return;
    _builtFor = locale;
    final t = LumoDemoCopy(copy, locale);
    _filters = [t['inStock'], t['freeShipping'], t['discounted']];
    _selected = {t['inStock']};
  }

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN tag-2
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final filter in _filters)
          LumoChip(
            label: filter,
            isSelected: _selected.contains(filter),
            onChanged: (on) => setState(
              () => on ? _selected.add(filter) : _selected.remove(filter),
            ),
            onRemove: () => setState(() => _filters.remove(filter)),
            removeLabel: '${t['remove']} $filter',
          ),
      ],
    );
    // END tag-2
  }
}

Widget tagGroup(BuildContext context) => const _TagGroup();

class _TagGroup extends StatefulWidget {
  const _TagGroup();
  @override
  State<_TagGroup> createState() => _TagGroupState();
}

class _TagGroupState extends State<_TagGroup> {
  String? _builtFor;
  List<LumoTagItem> _cities = const [];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final locale = LumoScope.of(context).locale;
    if (locale == _builtFor) return;
    _builtFor = locale;
    final t = LumoDemoCopy(copy, locale);
    _cities = [
      LumoTagItem(id: 'thr', textValue: t['tehran']),
      LumoTagItem(id: 'isf', textValue: t['isfahan']),
      LumoTagItem(id: 'shz', textValue: t['shiraz']),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN tag-3
    return LumoTagGroup(
      label: t['chosenCities'],
      items: _cities,
      onRemove: (id) => setState(() => _cities.removeWhere((c) => c.id == id)),
      removeLabel: (textValue) => '${t['remove']} $textValue',
    );
    // END tag-3
  }
}
