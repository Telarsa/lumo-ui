import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget Function(BuildContext) body) => MaterialApp(
  theme: lumoThemeData(brightness: Brightness.light),
  home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Builder(builder: body))),
);

const sections = [
  LumoNavigationSection(label: 'کارها', items: [
    LumoNavigationItem(id: 'home', label: 'خانه', icon: Icon(Icons.home)),
    LumoNavigationItem(id: 'orders', label: 'سفارش‌ها', icon: Icon(Icons.receipt_long), badge: '۳'),
  ]),
  LumoNavigationSection(items: [LumoNavigationItem(id: 'settings', label: 'تنظیمات', icon: Icon(Icons.settings))]),
];

void main() {
  testWidgets('NavigationDrawer: enters from the reading START (the RIGHT edge under fa-IR); only its inline-END corners are round; the title names the route and is a header', (tester) async {
    final semantics = tester.ensureSemantics();
    late BuildContext ctx;
    await tester.pumpWidget(app('fa-IR', (context) {
      ctx = context;
      return const SizedBox.expand();
    }));
    unawaitedDrawer(ctx, value: 'orders');
    await tester.pumpAndSettle();

    final screen = tester.getRect(find.byType(MaterialApp));
    final panel = tester.getRect(find.byType(LumoNavigationDrawer));
    expect(panel.right, closeTo(screen.right, 0.01), reason: 'the drawer is attached to the RIGHT edge under fa-IR');
    expect(panel.left > screen.left, isTrue);
    expect(panel.width, 300);

    // The corner rounding mirrors: round AWAY from the edge it is attached to.
    final shape = tester.widget<Material>(find.descendant(of: find.byType(LumoNavigationDrawer), matching: find.byType(Material)).first).shape! as RoundedRectangleBorder;
    final radius = shape.borderRadius.resolve(TextDirection.rtl);
    expect(radius.topLeft, const Radius.circular(LumoRadius.lg));
    expect(radius.bottomLeft, const Radius.circular(LumoRadius.lg));
    expect(radius.topRight, Radius.zero);
    expect(radius.bottomRight, Radius.zero);

    // One node names the route AND is the heading; the words exist once.
    final title = tester.getSemantics(find.text('ناوبری برنامه')).getSemanticsData();
    expect(title.flagsCollection.namesRoute, isTrue);
    expect(title.flagsCollection.isHeader, isTrue);
    expect(find.bySemanticsLabel('ناوبری برنامه'), findsOneWidget);
    // The section heading is a header; the unlabelled section draws none.
    expect(tester.getSemantics(find.text('کارها')).getSemanticsData().flagsCollection.isHeader, isTrue);

    // The current destination is announced selected; the badge rides the NAME.
    Finder rowOf(String label) => find.ancestor(of: find.text(label), matching: find.byType(InkWell)).first;
    expect(tester.getSemantics(rowOf('سفارش‌ها')).getSemanticsData().label, 'سفارش‌ها (۳)');
    expect(tester.getSemantics(rowOf('سفارش‌ها')).getSemanticsData().flagsCollection.isSelected, isTrue);
    expect(tester.getSemantics(rowOf('خانه')).getSemanticsData().flagsCollection.isSelected, isFalse);
    expect(find.bySemanticsLabel('۳'), findsNothing);
    semantics.dispose();
  });

  testWidgets('NavigationDrawer: enters from the LEFT under en-US and rounds its RIGHT corners', (tester) async {
    final semantics = tester.ensureSemantics();
    late BuildContext ctx;
    await tester.pumpWidget(app('en-US', (context) {
      ctx = context;
      return const SizedBox.expand();
    }));
    showLumoNavigationDrawer<void>(
      ctx,
      label: 'App navigation',
      closeLabel: 'Close navigation',
      sections: const [
        LumoNavigationSection(items: [LumoNavigationItem(id: 'home', label: 'Home', icon: Icon(Icons.home))]),
      ],
    );
    await tester.pumpAndSettle();
    final screen = tester.getRect(find.byType(MaterialApp));
    final panel = tester.getRect(find.byType(LumoNavigationDrawer));
    expect(panel.left, closeTo(screen.left, 0.01), reason: 'the drawer is attached to the LEFT edge under en-US');
    expect(panel.right < screen.right, isTrue);
    final shape = tester.widget<Material>(find.descendant(of: find.byType(LumoNavigationDrawer), matching: find.byType(Material)).first).shape! as RoundedRectangleBorder;
    final radius = shape.borderRadius.resolve(TextDirection.ltr);
    expect(radius.topRight, const Radius.circular(LumoRadius.lg));
    expect(radius.topLeft, Radius.zero);
    semantics.dispose();
  });

  testWidgets('NavigationDrawer: the ✕ closes it; choosing a destination closes then reports; the scrim is named by closeLabel', (tester) async {
    final semantics = tester.ensureSemantics();
    late BuildContext ctx;
    String? chosen;
    await tester.pumpWidget(app('fa-IR', (context) {
      ctx = context;
      return const SizedBox.expand();
    }));
    unawaitedDrawer(ctx, value: 'home', onChanged: (id) => chosen = id);
    await tester.pumpAndSettle();

    // The dismissible barrier carries a name, so the dismiss gesture is not silent.
    final route = ModalRoute.of(tester.element(find.byType(LumoNavigationDrawer)))!;
    expect(route.barrierLabel, 'بستن ناوبری');
    // The scrim and the ✕ deliberately share one name: both are the same
    // gesture, and neither may be a silent node (the rule `sheet.dart` sets).
    expect(find.bySemanticsLabel('بستن ناوبری'), findsNWidgets(2));

    await tester.tap(find.text('تنظیمات'));
    await tester.pumpAndSettle();
    expect(chosen, 'settings');
    expect(find.byType(LumoNavigationDrawer), findsNothing, reason: 'choosing a destination closes the drawer first');

    unawaitedDrawer(ctx, value: 'home');
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.close));
    await tester.pumpAndSettle();
    expect(find.byType(LumoNavigationDrawer), findsNothing);
    semantics.dispose();
  });
}

void unawaitedDrawer(BuildContext context, {String? value, ValueChanged<String>? onChanged}) {
  showLumoNavigationDrawer<void>(
    context,
    label: 'ناوبری برنامه',
    closeLabel: 'بستن ناوبری',
    sections: sections,
    value: value,
    onChanged: onChanged,
  );
}
