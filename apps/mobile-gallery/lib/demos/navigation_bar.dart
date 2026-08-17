// Demos for the `navigation-bar` slug.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'navigation-bar-1': navigationBarBasic,
};

const copy = <String, Map<String, String>>{
  'mainNav': {'fa-IR': 'ناوبری اصلی', 'en-US': 'Main navigation'},
  'home': {'fa-IR': 'خانه', 'en-US': 'Home'},
  'search': {'fa-IR': 'جست‌وجو', 'en-US': 'Search'},
  'orders': {'fa-IR': 'سفارش‌ها', 'en-US': 'Orders'},
  'profile': {'fa-IR': 'نمایه', 'en-US': 'Profile'},
  'three': {'fa-IR': '۳', 'en-US': '3'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'navigation-bar-1': {
    'title': {'fa-IR': 'نوار ناوبری', 'en-US': 'Navigation bar'},
    'description': {
      'fa-IR':
          'مقصدهای اصلی برنامه. ترتیب از راست شروع می‌شود، و نشان روی «سفارش‌ها» عددش را با رقم محلی می‌گوید.',
      'en-US':
          'The app’s top destinations. The order starts at the reading edge, and the badge on Orders carries local digits.',
    },
  },
};

class _NavBar extends StatefulWidget {
  const _NavBar();
  @override
  State<_NavBar> createState() => _NavBarState();
}

class _NavBarState extends State<_NavBar> {
  String _tab = 'home';

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN navigation-bar-1
    return LumoNavigationBar(
      label: t['mainNav'],
      value: _tab,
      onChanged: (next) => setState(() => _tab = next),
      items: [
        LumoNavigationItem(
          id: 'home',
          label: t['home'],
          icon: const Icon(Icons.home_outlined),
          selectedIcon: const Icon(Icons.home),
        ),
        LumoNavigationItem(
          id: 'search',
          label: t['search'],
          icon: const Icon(Icons.search),
        ),
        LumoNavigationItem(
          id: 'orders',
          label: t['orders'],
          icon: const Icon(Icons.receipt_long_outlined),
          badge: t['three'],
        ),
        LumoNavigationItem(
          id: 'profile',
          label: t['profile'],
          icon: const Icon(Icons.person_outline),
        ),
      ],
    );
    // END navigation-bar-1
  }
}

Widget navigationBarBasic(BuildContext context) => const _NavBar();
