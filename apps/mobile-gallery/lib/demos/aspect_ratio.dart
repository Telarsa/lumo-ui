// Demos for the `aspect-ratio` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'aspect-ratio-1': aspectRatioBasic,
};

const copy = <String, Map<String, String>>{
  'cover': {'fa-IR': 'جلد دوره', 'en-US': 'Course cover'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'aspect-ratio-1': {
    'title': {'fa-IR': 'نسبت ثابت', 'en-US': 'A fixed ratio'},
    'description': {
      'fa-IR': 'عرض کش می‌آید و نسبت نمی‌شکند. اینجا هیچ چیز جهت‌دار نیست — و همان نبودن، نکته است.',
      'en-US': 'The width flexes and the ratio holds. Nothing here is directional — and that absence is the point.',
    },
  },
};

Widget aspectRatioBasic(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  final c = LumoScope.of(context).colours;
  // BEGIN aspect-ratio-1
  return LumoAspectRatio(
    ratio: 16 / 9,
    child: DecoratedBox(
      decoration: BoxDecoration(
        color: c.surfaceSunken,
        borderRadius: BorderRadius.circular(LumoRadius.lg),
      ),
      child: Center(child: Text(t['cover'])),
    ),
  );
  // END aspect-ratio-1
}
