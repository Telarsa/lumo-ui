import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {EdgeInsets padding = EdgeInsets.zero}) => MaterialApp(
  theme: lumoThemeData(brightness: Brightness.light),
  home: LumoScope(
    locale: locale,
    brightness: Brightness.light,
    child: MediaQuery(
      data: MediaQueryData(padding: padding),
      child: Scaffold(body: Center(child: SizedBox(width: 360, child: child))),
    ),
  ),
);

const items = [
  LumoNavigationItem(id: 'home', label: 'خانه', icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home)),
  LumoNavigationItem(id: 'orders', label: 'سفارش‌ها', icon: Icon(Icons.receipt_long), badge: '۳'),
  LumoNavigationItem(id: 'profile', label: 'پروفایل', icon: Icon(Icons.person_outline)),
];

Finder destOf(String label) => find.ancestor(of: find.text(label), matching: find.byType(InkWell)).first;

void main() {
  testWidgets('NavigationBar: navigation landmark named by label; each destination one selected button; the badge rides the NAME; first destination at the RIGHT under fa-IR', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoNavigationBar(label: 'ناوبری اصلی', items: items)));
    await tester.pumpAndSettle();
    expect(Directionality.of(tester.element(find.text('خانه'))), TextDirection.rtl);

    // The bar is ONE navigation landmark, named once.
    final bar = tester.getSemantics(find.bySemanticsLabel('ناوبری اصلی'));
    expect(bar.getSemanticsData().role, SemanticsRole.navigation);
    expect(find.bySemanticsLabel('ناوبری اصلی'), findsOneWidget);

    // The first destination is selected by default (no value, no defaultValue).
    final first = tester.getSemantics(destOf('خانه'));
    final data = first.getSemanticsData();
    expect(data.label, 'خانه');
    expect(data.flagsCollection.isButton, isTrue);
    expect(data.flagsCollection.isSelected, isTrue);
    expect(data.flagsCollection.isEnabled, isTrue);

    // The badge is folded INTO the name — never a second node with a bare number.
    expect(tester.getSemantics(destOf('سفارش‌ها')).getSemanticsData().label, 'سفارش‌ها (۳)');
    expect(find.bySemanticsLabel('سفارش‌ها (۳)'), findsOneWidget);
    expect(find.bySemanticsLabel('۳'), findsNothing);
    // The visible label is excluded, so the words exist exactly once in the tree.
    expect(find.bySemanticsLabel('خانه'), findsOneWidget);

    // Geometry: reading order. The first destination is at the RIGHT under fa-IR.
    final rect = tester.getRect(find.byType(LumoNavigationBar));
    expect(tester.getCenter(destOf('خانه')).dx > rect.center.dx, isTrue, reason: 'first destination at the right under fa-IR');
    expect(tester.getCenter(destOf('پروفایل')).dx < rect.center.dx, isTrue, reason: 'last destination at the left under fa-IR');
    // N EQUAL columns.
    expect(tester.getRect(destOf('خانه')).width, closeTo(tester.getRect(destOf('پروفایل')).width, 0.01));
    expect(tester.getRect(destOf('سفارش‌ها')).width, closeTo(rect.width / 3, 0.01));
    semantics.dispose();
  });

  testWidgets('NavigationBar: uncontrolled tap selects and reports; controlled value wins; the selected icon is the selectedIcon', (tester) async {
    final semantics = tester.ensureSemantics();
    String? changed;
    await tester.pumpWidget(app('fa-IR', LumoNavigationBar(label: 'ناوبری اصلی', items: items, onChanged: (id) => changed = id)));
    await tester.pumpAndSettle();
    // Selected destinations swap to their filled twin.
    expect(find.byIcon(Icons.home), findsOneWidget);
    expect(find.byIcon(Icons.home_outlined), findsNothing);

    await tester.tap(find.text('سفارش‌ها'));
    await tester.pumpAndSettle();
    expect(changed, 'orders');
    expect(tester.getSemantics(destOf('سفارش‌ها')).getSemanticsData().flagsCollection.isSelected, isTrue);
    expect(tester.getSemantics(destOf('خانه')).getSemanticsData().flagsCollection.isSelected, isFalse);
    expect(find.byIcon(Icons.home_outlined), findsOneWidget);

    // Controlled: the tap reports, the selection does not move until the parent says so.
    await tester.pumpWidget(app('fa-IR', LumoNavigationBar(label: 'ناوبری اصلی', items: items, value: 'profile', onChanged: (id) => changed = id)));
    await tester.pumpAndSettle();
    await tester.tap(find.text('خانه'));
    await tester.pumpAndSettle();
    expect(changed, 'home');
    expect(tester.getSemantics(destOf('پروفایل')).getSemanticsData().flagsCollection.isSelected, isTrue);
    expect(tester.getSemantics(destOf('خانه')).getSemanticsData().flagsCollection.isSelected, isFalse);
    semantics.dispose();
  });

  testWidgets('NavigationBar: first destination at the LEFT under en-US; disabled destination has no tap; safe area reserved at the bottom', (tester) async {
    final semantics = tester.ensureSemantics();
    const enItems = [
      LumoNavigationItem(id: 'home', label: 'Home', icon: Icon(Icons.home)),
      LumoNavigationItem(id: 'saved', label: 'Saved', icon: Icon(Icons.bookmark)),
      LumoNavigationItem(id: 'more', label: 'More', icon: Icon(Icons.more_horiz), isDisabled: true),
    ];
    await tester.pumpWidget(app('en-US', const LumoNavigationBar(label: 'Main navigation', items: enItems)));
    await tester.pumpAndSettle();
    expect(Directionality.of(tester.element(find.text('Home'))), TextDirection.ltr);
    final rect = tester.getRect(find.byType(LumoNavigationBar));
    expect(tester.getCenter(destOf('Home')).dx < rect.center.dx, isTrue, reason: 'first destination at the left under en-US');
    expect(tester.getCenter(destOf('More')).dx > rect.center.dx, isTrue);
    final disabled = tester.getSemantics(destOf('More')).getSemanticsData();
    expect(disabled.flagsCollection.isEnabled, isFalse);
    expect(tester.widget<InkWell>(destOf('More')).onTap, isNull);

    // The home indicator's inset is reserved, over and above the bar's own 8.
    final flat = tester.getRect(find.byType(LumoNavigationBar)).height;
    await tester.pumpWidget(app('en-US', const LumoNavigationBar(label: 'Main navigation', items: enItems), padding: const EdgeInsets.only(bottom: 34)));
    await tester.pumpAndSettle();
    expect(tester.getRect(find.byType(LumoNavigationBar)).height, closeTo(flat + 26, 0.01), reason: '34 of safe area replaces the 8 the bar reserves anyway');
    semantics.dispose();
  });

  testWidgets('NavigationBar: the pill indicator sits UNDER the icon; the mark indicator sits ABOVE it (Khroos KTabBar) and both take the accent', (tester) async {
    await tester.pumpWidget(app('fa-IR', const LumoNavigationBar(label: 'ناوبری اصلی', items: items)));
    await tester.pumpAndSettle();
    final c = LumoScope.of(tester.element(find.text('خانه'))).colours;
    Finder pillOf(String label) => find.descendant(of: destOf(label), matching: find.byType(AnimatedContainer)).first;
    expect((tester.widget<AnimatedContainer>(pillOf('خانه')).decoration as BoxDecoration).color, c.accent);
    expect((tester.widget<AnimatedContainer>(pillOf('پروفایل')).decoration as BoxDecoration).color, Colors.transparent);
    // Behind the icon: the pill's box contains the glyph.
    expect(tester.getRect(pillOf('خانه')).contains(tester.getCenter(find.byIcon(Icons.home))), isTrue);

    // The Khroos shape: a short bar across the TOP of the destination, above the icon.
    await tester.pumpWidget(app('fa-IR', const LumoNavigationBar(label: 'ناوبری اصلی', items: items, indicator: LumoNavigationBarIndicator.mark)));
    await tester.pumpAndSettle();
    final mark = tester.widget<AnimatedContainer>(pillOf('خانه'));
    expect((mark.decoration as BoxDecoration).color, c.accent);
    expect(tester.getRect(pillOf('خانه')).width, 22);
    expect(tester.getRect(pillOf('خانه')).height, 3);
    expect(tester.getRect(pillOf('خانه')).bottom <= tester.getRect(find.byIcon(Icons.home)).top, isTrue, reason: 'the mark is above the icon');
    // On the mark shape the glyph itself takes the accent (KTabBar colours the active icon, it does not fill behind it).
    expect(tester.widget<Icon>(find.byIcon(Icons.home)).color ?? IconTheme.of(tester.element(find.byIcon(Icons.home))).color, c.accent);
  });
}
