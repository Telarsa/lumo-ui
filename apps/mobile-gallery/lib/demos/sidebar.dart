// Demos for the `sidebar` slug — the mobile side of the web's app sidebar is a
// navigation DRAWER: the same groups, items and badges, arriving from the
// inline edge because a phone has no room to keep them on screen.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../src/demo_copy.dart';

const demos = <String, WidgetBuilder>{
  'sidebar-1': sidebarDrawer,
};

const copy = <String, Map<String, String>>{
  'mainMenu': {'fa-IR': 'منوی اصلی', 'en-US': 'Main menu'},
  'close': {'fa-IR': 'بستن منو', 'en-US': 'Close the menu'},
  'workspace': {'fa-IR': 'فضای کاری', 'en-US': 'Workspace'},
  'dashboard': {'fa-IR': 'داشبورد', 'en-US': 'Dashboard'},
  'orders': {'fa-IR': 'سفارش‌ها', 'en-US': 'Orders'},
  'customers': {'fa-IR': 'مشتریان', 'en-US': 'Customers'},
  'account': {'fa-IR': 'حساب', 'en-US': 'Account'},
  'settings': {'fa-IR': 'تنظیمات', 'en-US': 'Settings'},
  'signOut': {'fa-IR': 'خروج', 'en-US': 'Sign out'},
  'twelve': {'fa-IR': '۱۲', 'en-US': '12'},
};

const demoMeta = <String, Map<String, Map<String, String>>>{
  'sidebar-1': {
    'title': {'fa-IR': 'کشوی ناوبری', 'en-US': 'Navigation drawer'},
    'description': {
      'fa-IR':
          'بخش‌ها عنوان دارند و هر بخش نامش را می‌گوید، پس خواننده می‌داند کجای فهرست است. نشانِ «سفارش‌ها» رقم محلی دارد.',
      'en-US':
          'Sections carry titles and each one announces its own, so a reader knows where in the list they are. The Orders badge carries local digits.',
    },
  },
};

class _Sidebar extends StatefulWidget {
  const _Sidebar();
  @override
  State<_Sidebar> createState() => _SidebarState();
}

class _SidebarState extends State<_Sidebar> {
  String _current = 'dashboard';

  @override
  Widget build(BuildContext context) {
    final t = LumoDemoCopy(copy, LumoScope.of(context).locale);
    // BEGIN sidebar-1
    // A drawer is a full-height panel: give it a height, or it has none to take
    // inside a scrolling page.
    return SizedBox(
      height: 420,
      child: LumoNavigationDrawer(
        label: t['mainMenu'],
        closeLabel: t['close'],
        value: _current,
        onChanged: (next) => setState(() => _current = next),
        sections: [
          LumoNavigationSection(
            label: t['workspace'],
            items: [
              LumoNavigationItem(id: 'dashboard', label: t['dashboard'], icon: const Icon(Icons.dashboard_outlined)),
              LumoNavigationItem(
                id: 'orders',
                label: t['orders'],
                icon: const Icon(Icons.receipt_long_outlined),
                badge: t['twelve'],
              ),
              LumoNavigationItem(id: 'customers', label: t['customers'], icon: const Icon(Icons.group_outlined)),
            ],
          ),
          LumoNavigationSection(
            label: t['account'],
            items: [
              LumoNavigationItem(id: 'settings', label: t['settings'], icon: const Icon(Icons.settings_outlined)),
              LumoNavigationItem(id: 'signOut', label: t['signOut'], icon: const Icon(Icons.logout)),
            ],
            ),
          ],
      ),
    );
    // END sidebar-1
  }
}

Widget sidebarDrawer(BuildContext context) => const _Sidebar();
