// Demos for the `tags-input` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'tags-input-1': tagsInputBasic,
};

const copy = <String, Map<String, String>>{
  'skills': {'fa-IR': 'مهارت‌ها', 'en-US': 'Skills'},
  'addTag': {'fa-IR': 'افزودن برچسب', 'en-US': 'Add tag'},
  'removePrefix': {'fa-IR': 'حذف', 'en-US': 'Remove'},
  'placeholder': {'fa-IR': 'بنویسید و اینتر بزنید', 'en-US': 'Type and press enter'},
  'hint': {'fa-IR': 'حداکثر پنج مهارت.', 'en-US': 'Up to five skills.'},
  'flutter': {'fa-IR': 'فلاتر', 'en-US': 'Flutter'},
  'design': {'fa-IR': 'طراحی', 'en-US': 'Design'},
  'duplicate': {'fa-IR': 'این برچسب از پیش هست.', 'en-US': 'That tag is already there.'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'tags-input-1': {
    'title': {'fa-IR': 'ورودی برچسب', 'en-US': 'Tags input'},
    'description': {
      'fa-IR':
          'هر برچسب دکمهٔ حذف خودش را دارد و نامش شامل خودِ برچسب است — «حذف فلاتر»، نه فقط «حذف».',
      'en-US':
          'Every tag carries its own remove button, named with the tag itself — “Remove Flutter”, never just “Remove”.',
    },
  },
};

class _TagsInput extends StatefulWidget {
  const _TagsInput();
  @override
  State<_TagsInput> createState() => _TagsInputState();
}

class _TagsInputState extends State<_TagsInput> {
  late List<String> _values = const [];

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    if (_values.isEmpty) _values = [t['flutter'], t['design']];
    // BEGIN tags-input-1
    return LumoTagsInput(
      label: t['skills'],
      addLabel: t['addTag'],
      removeLabel: (tag) => '${t['removePrefix']} $tag',
      placeholder: t['placeholder'],
      description: t['hint'],
      duplicateMessage: t['duplicate'],
      maxTags: 5,
      values: _values,
      onChanged: (next) => setState(() => _values = next),
    );
    // END tags-input-1
  }
}

Widget tagsInputBasic(BuildContext context) => const _TagsInput();
