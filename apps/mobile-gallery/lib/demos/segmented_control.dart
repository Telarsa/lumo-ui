// Demos for the `segmented-control` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'segmented-control-1': segmentedBasic,
  'segmented-control-2': segmentedIcons,
};

const copy = <String, Map<String, String>>{
  'reportRange': {'fa-IR': 'بازهٔ گزارش', 'en-US': 'Report range'},
  'day': {'fa-IR': 'روز', 'en-US': 'Day'},
  'week': {'fa-IR': 'هفته', 'en-US': 'Week'},
  'month': {'fa-IR': 'ماه', 'en-US': 'Month'},
  'listView': {'fa-IR': 'نمای فهرست', 'en-US': 'List view'},
  'list': {'fa-IR': 'فهرست', 'en-US': 'List'},
  'grid': {'fa-IR': 'شبکه', 'en-US': 'Grid'},
  'map': {'fa-IR': 'نقشه', 'en-US': 'Map'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'segmented-control-1': {
    'title': {'fa-IR': 'کنترل بخش‌بندی‌شده', 'en-US': 'Segmented control'},
    'description': {
      'fa-IR': 'دو تا چهار گزینهٔ ناسازگار، همه هم‌زمان دیده می‌شوند. label نام گروه است و خوانده می‌شود، نه کشیده.',
      'en-US': 'Two to four mutually exclusive options, all visible at once. label names the group: announced, not drawn.',
    },
  },
  'segmented-control-2': {
    'title': {'fa-IR': 'با نماد و اندازهٔ کوچک', 'en-US': 'With icons, small'},
    'description': {
      'fa-IR': 'نماد کنار برچسب می‌نشیند؛ iconOnly برچسب را از دید برمی‌دارد ولی نام اعلام‌شده را نگه می‌دارد.',
      'en-US': 'The icon sits beside the label; iconOnly hides the label but keeps the announced name.',
    },
  },
};

Widget segmentedBasic(BuildContext context) => const _SegmentedBasic();

class _SegmentedBasic extends StatefulWidget {
  const _SegmentedBasic();
  @override
  State<_SegmentedBasic> createState() => _SegmentedBasicState();
}

class _SegmentedBasicState extends State<_SegmentedBasic> {
  String _range = 'week';

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN segmented-control-1
    return LumoSegmentedControl(
      label: t['reportRange'],
      value: _range,
      onChanged: (next) => setState(() => _range = next),
      segments: [
        LumoSegment(id: 'day', label: t['day']),
        LumoSegment(id: 'week', label: t['week']),
        LumoSegment(id: 'month', label: t['month']),
      ],
    );
    // END segmented-control-1
  }
}

Widget segmentedIcons(BuildContext context) {
  final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
  // BEGIN segmented-control-2
  return LumoSegmentedControl(
    label: t['listView'],
    defaultValue: 'grid',
    size: LumoSegmentedControlSize.sm,
    segments: [
      LumoSegment(id: 'list', label: t['list'], icon: const Icon(Icons.view_list)),
      LumoSegment(id: 'grid', label: t['grid'], icon: const Icon(Icons.grid_view)),
      LumoSegment(
        id: 'map',
        label: t['map'],
        icon: const Icon(Icons.map_outlined),
        isDisabled: true,
      ),
    ],
  );
  // END segmented-control-2
}
