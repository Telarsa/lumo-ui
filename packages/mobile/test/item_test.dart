// Semantics-tree tests for the item family: a row named ONCE by its title, a
// tappable row that is ONE button with its content still reachable under it,
// the leading slot at the reading START and the trailing slot at the reading
// END in both directions, a named section of rows, and the selectable list.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

void main() {
  testWidgets('Item: a static row is named by its title, announced ONCE; the description is a child node; no button, no tap', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoItem(
      title: 'اعلان‌ها',
      description: 'پیامک و اعلان درون‌برنامه‌ای',
      leading: Icon(Icons.notifications),
    )));
    final data = tester.getSemantics(find.byType(LumoItem)).getSemanticsData();
    expect(data.label, 'اعلان‌ها');
    expect(data.flagsCollection.isButton, isFalse);
    expect(data.hasAction(SemanticsAction.tap), isFalse);
    // No selection state at all: `isSelected` is null, so nothing is announced.
    expect(data.flagsCollection.hasSelectedState, isFalse);
    // Announced once, drawn once — the drawn copy is excluded.
    expect(find.bySemanticsLabel('اعلان‌ها'), findsOneWidget);
    expect(find.text('اعلان‌ها'), findsOneWidget);
    expect(find.bySemanticsLabel('پیامک و اعلان درون‌برنامه‌ای'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Item: leading at the reading START and trailing at the reading END — right/left under fa-IR, left/right under en-US', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      await tester.pumpWidget(app(locale, LumoItem(
        key: ValueKey(locale),
        title: rtl ? 'حساب کاربری' : 'Account',
        leading: const Icon(Icons.person),
        trailing: LumoIconButton(label: rtl ? 'گزینه‌ها' : 'Options', onPressed: () {}, child: const Icon(Icons.more_horiz)),
      )));
      final row = tester.getRect(find.byType(LumoItem));
      final leading = tester.getCenter(find.byIcon(Icons.person)).dx;
      final trailing = tester.getCenter(find.byIcon(Icons.more_horiz)).dx;
      expect(rtl ? leading > row.center.dx : leading < row.center.dx, isTrue, reason: '$locale: the leading slot sits at the reading start');
      expect(rtl ? trailing < row.center.dx : trailing > row.center.dx, isTrue, reason: '$locale: the trailing slot sits at the reading end');
      expect(Directionality.of(tester.element(find.byType(LumoItem))), rtl ? TextDirection.rtl : TextDirection.ltr);
    }
  });

  testWidgets('Item: tappable = ONE button named by the title; a nested named control stays its own node; tap fires; the auto chevron is decoration', (tester) async {
    final semantics = tester.ensureSemantics();
    var taps = 0;
    var options = 0;
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoItem(
        title: 'پروندهٔ من',
        description: 'آخرین تغییر: دیروز',
        onTap: () => taps++,
        trailing: LumoIconButton(label: 'گزینه‌ها', onPressed: () => options++, child: const Icon(Icons.more_horiz)),
      ),
      LumoItem(title: 'تنظیمات', onTap: () {}),
    ])));
    final data = tester.getSemantics(find.byType(LumoItem).first).getSemanticsData();
    expect(data.flagsCollection.isButton, isTrue);
    expect(data.flagsCollection.isEnabled, isTrue);
    expect(data.hasAction(SemanticsAction.tap), isTrue);
    expect(data.label, 'پروندهٔ من');
    expect(find.bySemanticsLabel('پروندهٔ من'), findsOneWidget);
    // The nested button keeps its own name under the row.
    expect(find.bySemanticsLabel('گزینه‌ها'), findsOneWidget);
    await tester.tap(find.text('آخرین تغییر: دیروز'));
    expect(taps, 1);
    await tester.tap(find.bySemanticsLabel('گزینه‌ها'));
    expect(options, 1);
    // The second row has no trailing, so the row draws the chevron itself; it is silent.
    expect(find.byIcon(Icons.chevron_right), findsOneWidget);
    expect(tester.getSemantics(find.byType(LumoItem).last).getSemanticsData().label, 'تنظیمات');
    semantics.dispose();
  });

  testWidgets('Item: the auto chevron carries matchTextDirection, so it points at the reading end in both directions', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoItem(title: 'تنظیمات', onTap: () {})));
    expect(tester.widget<Icon>(find.byIcon(Icons.chevron_right)).icon!.matchTextDirection, isTrue);
  });

  testWidgets('Item: disabled has no tap and is announced disabled; variants take their colours from the scope; outlined refuses a divider', (tester) async {
    final semantics = tester.ensureSemantics();
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoItem(title: 'بایگانی', isDisabled: true, onTap: () => taps++),
      const LumoItem(title: 'برجسته', variant: LumoItemVariant.muted),
      const LumoItem(title: 'قاب‌دار', variant: LumoItemVariant.outlined),
    ])));
    final disabled = tester.getSemantics(find.byType(LumoItem).first).getSemanticsData();
    expect(disabled.flagsCollection.isEnabled, isFalse);
    expect(disabled.hasAction(SemanticsAction.tap), isFalse);
    await tester.tap(find.text('بایگانی'), warnIfMissed: false);
    expect(taps, 0);

    final c = LumoScope.of(tester.element(find.text('برجسته'))).colours;
    BoxDecoration deco(String t) => tester.widget<Container>(find.ancestor(of: find.text(t), matching: find.byType(Container)).first).decoration! as BoxDecoration;
    expect(deco('برجسته').color, c.surfaceSunken);
    expect(deco('برجسته').border, isNull);
    expect(deco('قاب‌دار').color, c.surface);
    expect(deco('قاب‌دار').border, isNotNull);
    expect(() => LumoItem(title: 'x', variant: LumoItemVariant.outlined, hasDivider: true), throwsAssertionError);
    semantics.dispose();
  });

  testWidgets('ItemGroup: the label is drawn as a header and announced ONCE; dividers replace the gap', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoItemGroup(
      label: 'حساب',
      hasDividers: true,
      children: [LumoItem(title: 'نام'), LumoItem(title: 'ایمیل')],
    )));
    expect(tester.getSemantics(find.text('حساب')), matchesSemantics(label: 'حساب', isHeader: true));
    expect(find.bySemanticsLabel('حساب'), findsOneWidget);
    expect(find.bySemanticsLabel('نام'), findsOneWidget);
    expect(find.bySemanticsLabel('ایمیل'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('ListBox: a named list; every row announces its selected state; single selection replaces and clears', (tester) async {
    final semantics = tester.ensureSemantics();
    Set<String>? reported;
    await tester.pumpWidget(app('fa-IR', LumoListBox(
      label: 'پرونده‌ها',
      emptyLabel: 'هیچ پرونده‌ای نیست',
      defaultValue: const {'a'},
      onChanged: (v) => reported = v,
      items: const [
        LumoListBoxItem(id: 'a', title: 'پروندهٔ اول'),
        LumoListBoxItem(id: 'b', title: 'پروندهٔ دوم'),
        LumoListBoxItem(id: 'c', title: 'پروندهٔ سوم', isDisabled: true),
      ],
    )));
    expect(find.bySemanticsLabel('پرونده‌ها'), findsOneWidget);
    expect(find.text('پرونده‌ها'), findsNothing, reason: 'the list name is announced, not drawn');
    expect(tester.getSemantics(find.bySemanticsLabel('پروندهٔ اول')).getSemanticsData().flagsCollection.isSelected, isTrue);
    expect(tester.getSemantics(find.bySemanticsLabel('پروندهٔ دوم')).getSemanticsData().flagsCollection.isSelected, isFalse);
    expect(tester.getSemantics(find.bySemanticsLabel('پروندهٔ سوم')).getSemanticsData().flagsCollection.isEnabled, isFalse);

    await tester.tap(find.text('پروندهٔ دوم'));
    await tester.pump();
    expect(reported, {'b'});
    expect(tester.getSemantics(find.bySemanticsLabel('پروندهٔ دوم')).getSemanticsData().flagsCollection.isSelected, isTrue);
    expect(tester.getSemantics(find.bySemanticsLabel('پروندهٔ اول')).getSemanticsData().flagsCollection.isSelected, isFalse);
    // Single mode: tapping the selected row clears it, unless the list refuses to empty.
    await tester.tap(find.text('پروندهٔ دوم'));
    await tester.pump();
    expect(reported, <String>{});
    semantics.dispose();
  });

  testWidgets('ListBox: multiple accumulates; disallowEmptySelection keeps the last key; the check sits at the reading END', (tester) async {
    final semantics = tester.ensureSemantics();
    Set<String>? reported;
    await tester.pumpWidget(app('fa-IR', LumoListBox(
      label: 'برچسب‌ها',
      emptyLabel: 'برچسبی نیست',
      selectionMode: LumoListBoxSelectionMode.multiple,
      disallowEmptySelection: true,
      defaultValue: const {'x'},
      onChanged: (v) => reported = v,
      items: const [LumoListBoxItem(id: 'x', title: 'فوری'), LumoListBoxItem(id: 'y', title: 'مهم')],
    )));
    await tester.tap(find.text('مهم'));
    await tester.pump();
    expect(reported, {'x', 'y'});
    await tester.tap(find.text('مهم'));
    await tester.pump();
    expect(reported, {'x'});
    // The floor: the last key cannot be removed.
    await tester.tap(find.text('فوری'));
    await tester.pump();
    expect(reported, {'x'});

    final row = tester.getRect(find.bySemanticsLabel('فوری'));
    expect(tester.getCenter(find.byIcon(Icons.check).first).dx < row.center.dx, isTrue, reason: 'the check is at the inline end = left under fa-IR');
    semantics.dispose();
  });

  testWidgets('ListBox: empty says the required emptyLabel; en-US puts the check on the right', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoListBox(label: 'Files', emptyLabel: 'No files yet', items: [])));
    expect(find.text('No files yet'), findsOneWidget);
    expect(find.bySemanticsLabel('Files'), findsOneWidget);

    await tester.pumpWidget(app('en-US', const LumoListBox(
      label: 'Files',
      emptyLabel: 'No files yet',
      value: {'a'},
      items: [LumoListBoxItem(id: 'a', title: 'First file')],
    )));
    final row = tester.getRect(find.bySemanticsLabel('First file'));
    expect(tester.getCenter(find.byIcon(Icons.check)).dx > row.center.dx, isTrue, reason: 'inline end = right under en-US');
    // Controlled: the widget does not move it on its own.
    await tester.tap(find.text('First file'));
    await tester.pump();
    expect(tester.getSemantics(find.bySemanticsLabel('First file')).getSemanticsData().flagsCollection.isSelected, isTrue);
    semantics.dispose();
  });
}
