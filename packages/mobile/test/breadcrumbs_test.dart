// Semantics-tree tests for LumoBreadcrumbs: the trail named by `label`, crumbs
// as links, the LAST crumb as the current page (never a link), the separator
// chevron mirroring under RTL, and the middle crumbs collapsing behind a named
// button. The defect this pins: the Khroos ServiceAreaScreen's hand-rolled
// trail with a hard-coded `chevron-left`, which points the wrong way in en-US.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

void main() {
  testWidgets('Breadcrumbs: the trail is named by `label` (announced, not drawn); a crumb with onTap is a LINK, not a button', (tester) async {
    final semantics = tester.ensureSemantics();
    var home = 0;
    await tester.pumpWidget(app('fa-IR', LumoBreadcrumbs(
      label: 'مسیر صفحه',
      items: [
        LumoCrumb(label: 'خانه', onTap: () => home++),
        const LumoCrumb(label: 'تعمیرات'),
        const LumoCrumb(label: 'سعادت‌آباد'),
      ],
    )));
    expect(find.bySemanticsLabel('مسیر صفحه'), findsOneWidget);
    expect(find.text('مسیر صفحه'), findsNothing);
    final link = tester.getSemantics(find.bySemanticsLabel('خانه')).getSemanticsData();
    expect(link.flagsCollection.isLink, isTrue);
    expect(link.flagsCollection.isButton, isFalse);
    expect(link.hasAction(SemanticsAction.tap), isTrue);
    await tester.tap(find.text('خانه'));
    expect(home, 1);
    // Each crumb's name appears exactly once.
    expect(find.bySemanticsLabel('خانه'), findsOneWidget);
    expect(find.text('خانه'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Breadcrumbs: the LAST crumb is the current page — never a link, no tap, even when given an onTap; currentLabel is appended to its name', (tester) async {
    final semantics = tester.ensureSemantics();
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', LumoBreadcrumbs(
      label: 'مسیر صفحه',
      currentLabel: 'صفحهٔ فعلی',
      items: [
        LumoCrumb(label: 'خانه', onTap: () {}),
        LumoCrumb(label: 'سعادت‌آباد', onTap: () => taps++),
      ],
    )));
    final current = tester.getSemantics(find.bySemanticsLabel('سعادت‌آباد صفحهٔ فعلی')).getSemanticsData();
    expect(current.flagsCollection.isLink, isFalse);
    expect(current.flagsCollection.isButton, isFalse);
    expect(current.hasAction(SemanticsAction.tap), isFalse);
    await tester.tap(find.text('سعادت‌آباد'), warnIfMissed: false);
    expect(taps, 0);
    // The word appears in the announced name and nowhere on screen.
    expect(find.text('صفحهٔ فعلی'), findsNothing);
    expect(find.bySemanticsLabel('سعادت‌آباد صفحهٔ فعلی'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Breadcrumbs: the separator chevron flips with the direction (matchTextDirection), and the trail reads start→end in both', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final first = rtl ? 'خانه' : 'Home';
      final last = rtl ? 'سعادت‌آباد' : 'Saadatabad';
      await tester.pumpWidget(app(locale, LumoBreadcrumbs(
        key: ValueKey(locale),
        label: rtl ? 'مسیر صفحه' : 'Page path',
        items: [LumoCrumb(label: first, onTap: () {}), LumoCrumb(label: last)],
      )));
      // ONE separator between two crumbs, and it is the direction-matching glyph.
      expect(find.byIcon(Icons.chevron_right), findsOneWidget);
      expect(tester.widget<Icon>(find.byIcon(Icons.chevron_right)).icon!.matchTextDirection, isTrue);
      final firstX = tester.getCenter(find.text(first)).dx;
      final lastX = tester.getCenter(find.text(last)).dx;
      expect(rtl ? firstX > lastX : firstX < lastX, isTrue, reason: '$locale: the first crumb sits at the reading start');
    }
  });

  testWidgets('Breadcrumbs: the middle crumbs collapse behind a NAMED button, which expands the trail in place', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoBreadcrumbs(
      label: 'مسیر صفحه',
      maxVisible: 2,
      overflowLabel: 'خرده‌های میانی',
      items: [
        LumoCrumb(label: 'خانه'),
        LumoCrumb(label: 'تهران'),
        LumoCrumb(label: 'تعمیرات'),
        LumoCrumb(label: 'سعادت‌آباد'),
      ],
    )));
    expect(find.text('تهران'), findsNothing);
    expect(find.text('تعمیرات'), findsNothing);
    expect(find.text('خانه'), findsOneWidget);
    expect(find.text('سعادت‌آباد'), findsOneWidget);
    final button = tester.getSemantics(find.bySemanticsLabel('خرده‌های میانی')).getSemanticsData();
    expect(button.flagsCollection.isButton, isTrue);
    expect(button.hasAction(SemanticsAction.tap), isTrue);
    // The «…» is punctuation; the name is the announced string, once.
    expect(find.bySemanticsLabel('خرده‌های میانی'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('خرده‌های میانی'));
    await tester.pump();
    expect(find.text('تهران'), findsOneWidget);
    expect(find.text('تعمیرات'), findsOneWidget);
    expect(find.bySemanticsLabel('خرده‌های میانی'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Breadcrumbs: a trail that fits does not collapse; maxVisible without an overflowLabel is refused at construction', (tester) async {
    await tester.pumpWidget(app('en-US', const LumoBreadcrumbs(
      label: 'Page path',
      maxVisible: 3,
      overflowLabel: 'Hidden steps',
      items: [LumoCrumb(label: 'Home'), LumoCrumb(label: 'Repairs'), LumoCrumb(label: 'Saadatabad')],
    )));
    expect(find.text('Repairs'), findsOneWidget);
    expect(find.bySemanticsLabel('Hidden steps'), findsNothing);
    expect(() => LumoBreadcrumbs(label: 'x', maxVisible: 2, items: const [LumoCrumb(label: 'a')]), throwsAssertionError);
    expect(() => LumoBreadcrumbs(label: 'x', maxVisible: 1, overflowLabel: 'y', items: const [LumoCrumb(label: 'a')]), throwsAssertionError);
  });
}
