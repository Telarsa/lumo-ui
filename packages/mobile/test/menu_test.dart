// Menu: the semantics tree (route named by `label`, items are buttons, checkbox
// items carry the checked state, sections start with a header) and the
// GEOMETRY (start-aligned to the trigger) under fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

/// The menu's own surface: the nearest Material above an item.
Finder surfaceOf(Finder content) => find.ancestor(of: content, matching: find.byType(Material)).first;

void main() {
  testWidgets('Menu fa-IR: opens from the trigger, named ONCE by label (names the route), items are buttons, a section has a header, a checkbox item is checked and updates while open, RTL inside, right edges meet, selecting closes then fires', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <bool>[];
    final selected = <String>[];
    var showColumn = false;
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(builder: (context, setState) => LumoMenuTrigger(
      label: 'گزینه‌های ردیف',
      onOpenChange: changes.add,
      trigger: (open) => LumoIconButton(label: 'بیشتر', onPressed: open, child: const Icon(Icons.more_horiz)),
      items: [
        LumoMenuItem(label: 'ویرایش', icon: const Icon(Icons.edit), onSelected: () => selected.add('edit')),
        const LumoMenuItem(label: 'کپی', isDisabled: true),
        const LumoMenuSeparator(),
        LumoMenuSection(label: 'نمایش', items: [
          LumoMenuCheckboxItem(label: 'ستون وضعیت', isSelected: showColumn, onChanged: (v) => setState(() => showColumn = v)),
        ]),
        const LumoMenuSeparator(),
        LumoMenuItem(label: 'حذف', isDestructive: true, onSelected: () => selected.add('delete')),
      ],
    ))));
    expect(find.text('ویرایش'), findsNothing);
    await tester.tap(find.byType(LumoIconButton));
    await tester.pumpAndSettle();
    expect(changes, [true]);
    // The menu's name exists once and names the route.
    expect(find.bySemanticsLabel('گزینه‌های ردیف'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('گزینه‌های ردیف')), containsSemantics(label: 'گزینه‌های ردیف', namesRoute: true));
    // Items: buttons named by their labels, once each; disabled announced.
    for (final l in ['ویرایش', 'کپی', 'حذف', 'ستون وضعیت']) {
      expect(find.text(l), findsOneWidget, reason: l);
    }
    expect(tester.getSemantics(find.text('ویرایش')), containsSemantics(label: 'ویرایش', isButton: true, isEnabled: true, hasTapAction: true));
    expect(tester.getSemantics(find.text('کپی')), containsSemantics(label: 'کپی', isButton: true, hasEnabledState: true, isEnabled: false));
    expect(tester.getSemantics(find.text('نمایش')), containsSemantics(label: 'نمایش', isHeader: true));
    expect(tester.getSemantics(find.text('ستون وضعیت')), containsSemantics(label: 'ستون وضعیت', hasCheckedState: true, isChecked: false, hasTapAction: true));
    // Direction inside the route: the trap.
    expect(Directionality.of(tester.element(find.text('ویرایش'))), TextDirection.rtl);
    // `bottomStart` mirrored: the menu's RIGHT edge meets the trigger's RIGHT edge; the icon slot is at the reading start (right of the label).
    final surface = tester.getRect(surfaceOf(find.text('ویرایش')));
    final trigger = tester.getRect(find.byType(LumoIconButton));
    expect((surface.right - trigger.right).abs(), lessThan(1), reason: 'start-aligned under RTL = right edges meet');
    expect(surface.top, greaterThanOrEqualTo(trigger.bottom));
    expect(tester.getCenter(find.byIcon(Icons.edit)).dx > tester.getCenter(find.text('ویرایش')).dx, isTrue, reason: 'the leading icon is at the inline start = right under fa-IR');
    // Ticking a checkbox item keeps the menu open and the open menu re-reads the caller's state.
    await tester.tap(find.text('ستون وضعیت'));
    await tester.pumpAndSettle();
    expect(showColumn, isTrue);
    expect(find.text('ویرایش'), findsOneWidget, reason: 'the menu stays open after a tick');
    expect(tester.getSemantics(find.text('ستون وضعیت')), containsSemantics(label: 'ستون وضعیت', hasCheckedState: true, isChecked: true));
    expect(find.byIcon(Icons.check), findsOneWidget);
    // A disabled item does nothing.
    await tester.tap(find.text('کپی'));
    await tester.pumpAndSettle();
    expect(find.text('ویرایش'), findsOneWidget);
    // Selecting an item closes the menu, then fires.
    await tester.tap(find.text('حذف'));
    await tester.pumpAndSettle();
    expect(find.text('ویرایش'), findsNothing);
    expect(selected, ['delete']);
    expect(changes, [true, false]);
    semantics.dispose();
  });

  testWidgets('Menu en-US: left edges meet, icon at the inline start (left), LTR inside; tap outside closes; a disabled trigger does not open', (tester) async {
    final semantics = tester.ensureSemantics();
    var disabled = false;
    await tester.pumpWidget(app('en-US', StatefulBuilder(builder: (context, setState) => Column(mainAxisSize: MainAxisSize.min, children: [
      LumoMenuTrigger(
        label: 'Row options',
        isDisabled: disabled,
        trigger: (open) => LumoButton(onPressed: open, isDisabled: open == null, child: const Text('More')),
        items: [LumoMenuItem(label: 'Edit', icon: const Icon(Icons.edit), onSelected: () {}), const LumoMenuSeparator(), const LumoMenuItem(label: 'Delete', isDestructive: true)],
      ),
      LumoButton(onPressed: () => setState(() => disabled = true), child: const Text('Lock')),
    ]))));
    await tester.tap(find.text('More'));
    await tester.pumpAndSettle();
    expect(find.text('Edit'), findsOneWidget);
    expect(find.bySemanticsLabel('Row options'), findsOneWidget);
    final surface = tester.getRect(surfaceOf(find.text('Edit')));
    final trigger = tester.getRect(find.ancestor(of: find.text('More'), matching: find.byType(LumoButton)));
    expect((surface.left - trigger.left).abs(), lessThan(1), reason: 'start-aligned under LTR = left edges meet');
    expect(surface.width, greaterThanOrEqualTo(192), reason: 'a menu is at least 12rem wide');
    expect(tester.getCenter(find.byIcon(Icons.edit)).dx < tester.getCenter(find.text('Edit')).dx, isTrue, reason: 'the leading icon is at the inline start = left under en-US');
    expect(Directionality.of(tester.element(find.text('Edit'))), TextDirection.ltr);
    // Tap outside (top corner, on the transparent barrier) closes.
    await tester.tapAt(const Offset(5, 5));
    await tester.pumpAndSettle();
    expect(find.text('Edit'), findsNothing);
    await tester.tap(find.text('Lock'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('More'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('Edit'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Menu: `bottomEnd` mirrors too (left edges meet under fa-IR)', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoMenuTrigger(
      label: 'گزینه‌ها',
      placement: LumoPlacement.bottomEnd,
      trigger: (open) => LumoButton(onPressed: open, child: const Text('بیشتر')),
      items: const [LumoMenuItem(label: 'ویرایش')],
    )));
    await tester.tap(find.text('بیشتر'));
    await tester.pumpAndSettle();
    final surface = tester.getRect(surfaceOf(find.text('ویرایش')));
    final trigger = tester.getRect(find.byType(LumoButton));
    expect((surface.left - trigger.left).abs(), lessThan(1), reason: 'end-aligned under RTL = left edges meet');
    await tester.tapAt(const Offset(5, 5));
    await tester.pumpAndSettle();
  });

  testWidgets('Menu: every row is at least 44 logical px tall — a thumb in a list of eight, not a mouse', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoMenuTrigger(
      label: 'گزینه‌های ردیف',
      trigger: (open) => LumoIconButton(label: 'بیشتر', onPressed: open, child: const Icon(Icons.more_horiz)),
      items: const [
        LumoMenuItem(label: 'ویرایش', icon: Icon(Icons.edit)),
        LumoMenuCheckboxItem(label: 'نمایش ستون', isSelected: true),
        LumoMenuSeparator(),
        LumoMenuSection(label: 'خطرناک', items: [LumoMenuItem(label: 'حذف', isDestructive: true)]),
      ],
    )));
    await tester.tap(find.byType(LumoIconButton));
    await tester.pumpAndSettle();
    // The web's `menuItemVariants` sets no min-height (`px-2 py-1.5` ≈ 32px);
    // the mobile floor is `LumoControl.lg`, as `item.dart` already says.
    for (final label in ['ویرایش', 'نمایش ستون', 'حذف']) {
      final row = tester.getSize(find.ancestor(of: find.text(label), matching: find.byType(InkWell)).first);
      expect(row.height, greaterThanOrEqualTo(44), reason: '«$label» is a thumb target in a list of them');
    }
  });

  testWidgets('Menu: the checked tick is the ACCENT role, not the label colour — the web menuCheckboxIndicatorVariants is text-accent', (tester) async {
    final c = lightColours(LumoBrand.achromatic);
    await tester.pumpWidget(app('fa-IR', LumoMenuTrigger(
      label: 'ستون‌ها',
      trigger: (open) => LumoIconButton(label: 'بیشتر', onPressed: open, child: const Icon(Icons.more_horiz)),
      items: const [
        LumoMenuCheckboxItem(label: 'نمایش ستون', isSelected: true),
        LumoMenuCheckboxItem(label: 'ستون پنهان', isSelected: false),
      ],
    )));
    await tester.tap(find.byType(LumoIconButton));
    await tester.pumpAndSettle();
    final tick = tester.widget<Icon>(find.byIcon(Icons.check));
    expect(tick.color, c.accent, reason: 'reading the indicator as foreground made tick and label the same colour in both schemes');
    expect(find.byIcon(Icons.check), findsOneWidget, reason: 'the unticked row keeps the empty gutter, no glyph');
  });

  testWidgets('Menu: press feedback is the THEME\'s one decision — pressFeedback: none leaves the row with no highlight of its own', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light, pressFeedback: LumoPressFeedback.none),
      home: LumoScope(
        locale: 'fa-IR',
        brightness: Brightness.light,
        child: Scaffold(body: Center(child: LumoMenuTrigger(
          label: 'گزینه‌ها',
          trigger: (open) => LumoIconButton(label: 'بیشتر', onPressed: open, child: const Icon(Icons.more_horiz)),
          items: const [LumoMenuItem(label: 'ویرایش')],
        ))),
      ),
    ));
    await tester.tap(find.byType(LumoIconButton));
    await tester.pumpAndSettle();
    // Naming `hoverColor`/`highlightColor` on the row made
    // `LumoPressFeedback.none` a lie for menu rows alone (contract rule 8).
    final ink = tester.widget<InkWell>(find.ancestor(of: find.text('ویرایش'), matching: find.byType(InkWell)).first);
    expect(ink.highlightColor, isNull, reason: 'the row must not name its own press colour');
    expect(ink.hoverColor, isNull);
    expect(ink.splashColor, isNull);
  });
}
