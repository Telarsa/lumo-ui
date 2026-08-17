// Demos for the `skeleton` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

const demos = <String, WidgetBuilder>{
  'skeleton-1': skeletonBasic,
  'skeleton-2': skeletonCard,
};

// No `copy` table: a skeleton renders no words at all. That is the point of it,
// and the build gate is content with a file that has nothing to localize.

const demoMeta = <String, Map<String, Map<String, String>>>{
  'skeleton-1': {
    'title': {'fa-IR': 'اسکلت', 'en-US': 'Skeleton'},
    'description': {
      'fa-IR': 'شکلِ چیزی که هنوز نیامده. اسکلت هیچ نامی اعلام نمی‌کند — خبرِ «در حال بارگذاری» کار LumoProgress است.',
      'en-US': 'The shape of what has not arrived. A skeleton announces no name — «loading» is LumoProgress’s job.',
    },
  },
  'skeleton-2': {
    'title': {'fa-IR': 'اسکلت یک کارت', 'en-US': 'A card’s skeleton'},
    'description': {
      'fa-IR': 'LumoSkeletonText چند خط با طول‌های نابرابر می‌سازد، مثل متن واقعی.',
      'en-US': 'LumoSkeletonText makes several lines of uneven length, the way real text falls.',
    },
  },
};

Widget skeletonBasic(BuildContext context) {
  // BEGIN skeleton-1
  return const Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 12,
    children: [
      LumoSkeleton(height: 20, width: 160),
      LumoSkeleton(height: 120),
      LumoSkeletonText(lines: 2),
    ],
  );
  // END skeleton-1
}

Widget skeletonCard(BuildContext context) {
  // BEGIN skeleton-2
  return const LumoCard(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 12,
      children: [
        LumoSkeleton(width: 40, height: 40, shape: LumoSkeletonShape.circle),
        Expanded(child: LumoSkeletonText(lines: 3)),
      ],
    ),
  );
  // END skeleton-2
}
