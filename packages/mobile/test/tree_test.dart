// Semantics-tree tests for LumoTree / LumoTreeSelect: the tree named by
// `label`, every row a node carrying its expanded state, its level and its
// position-in-set (in the reader's digits), a DIRECTIONAL expand marker, the
// indent growing from the reading start, selection in each mode, and the field
// form opening its sheet.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {bool disableAnimations = false}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: MediaQuery(
          data: MediaQueryData(disableAnimations: disableAnimations),
          child: Scaffold(body: Center(child: SizedBox(width: 360, child: child))),
        ),
      ),
    );

/// The Khroos coverage hierarchy: استان › شهرستان › شهر/بخش › محله.
const faNodes = [
  LumoTreeNode(
    id: 'thr',
    label: 'تهران',
    children: [
      LumoTreeNode(
        id: 'thr-c1',
        label: 'شهرستان تهران',
        children: [
          LumoTreeNode(id: 'thr-c1-p1', label: 'سعادت‌آباد'),
          LumoTreeNode(id: 'thr-c1-p2', label: 'پونک'),
        ],
      ),
      LumoTreeNode(id: 'thr-c2', label: 'شهرستان ری'),
    ],
  ),
  LumoTreeNode(id: 'esf', label: 'اصفهان', isDisabled: true),
];

const enNodes = [
  LumoTreeNode(
    id: 'thr',
    label: 'Tehran',
    children: [LumoTreeNode(id: 'thr-c1', label: 'Tehran county')],
  ),
  LumoTreeNode(id: 'esf', label: 'Isfahan'),
];

String itemLabel(LumoTreeItemPosition p) => '${p.label}، سطح ${p.level}، ${p.position} از ${p.setSize}';
String itemLabelEn(LumoTreeItemPosition p) => '${p.label}, level ${p.level}, ${p.position} of ${p.setSize}';

void main() {
  testWidgets('Tree: the tree is named by label; each row announces its LEVEL and POSITION-IN-SET in the reader\'s digits, and its expanded state', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoTree(
      label: 'محدودهٔ جغرافیایی',
      nodes: faNodes,
      defaultExpandedIds: const {'thr'},
      itemLabel: itemLabel,
      expandLabel: (n) => 'باز کردن $n',
      collapseLabel: (n) => 'بستن $n',
    )));
    await tester.pumpAndSettle();

    expect(tester.getSemantics(find.byType(LumoTree)).getSemanticsData().label, 'محدودهٔ جغرافیایی');
    expect(find.text('محدودهٔ جغرافیایی'), findsNothing, reason: 'the tree\'s name is announced, not drawn');

    // Persian digits, level and position — not «level 1, 1 of 2» in Latin.
    final root = tester.getSemantics(find.bySemanticsLabel('تهران، سطح ۱، ۱ از ۲')).getSemanticsData();
    expect(root.flagsCollection.hasExpandedState, isTrue);
    expect(root.flagsCollection.isExpanded, isTrue);
    expect(root.flagsCollection.isButton, isTrue);
    expect(root.hasAction(SemanticsAction.tap), isTrue);

    // A child of the open branch is level 2, and its own set is the branch's.
    expect(find.bySemanticsLabel('شهرستان تهران، سطح ۲، ۱ از ۲'), findsOneWidget);
    expect(find.bySemanticsLabel('شهرستان ری، سطح ۲، ۲ از ۲'), findsOneWidget);
    // The grandchildren are NOT built while their branch is closed.
    expect(find.bySemanticsLabel('سعادت‌آباد، سطح ۳، ۱ از ۲'), findsNothing);

    // A LEAF announces no expanded state at all — a collapsed leaf would be a lie.
    final leaf = tester.getSemantics(find.bySemanticsLabel('شهرستان ری، سطح ۲، ۲ از ۲')).getSemanticsData();
    expect(leaf.flagsCollection.hasExpandedState, isFalse);

    // Disabled row: no tap, not enabled.
    final disabled = tester.getSemantics(find.bySemanticsLabel('اصفهان، سطح ۱، ۲ از ۲')).getSemanticsData();
    expect(disabled.flagsCollection.isEnabled, isFalse);
    expect(disabled.hasAction(SemanticsAction.tap), isFalse);

    // The row's name is announced ONCE; the drawn label is excluded.
    expect(find.bySemanticsLabel('تهران، سطح ۱، ۱ از ۲'), findsOneWidget);
    expect(find.text('تهران'), findsOneWidget);
    expect(find.bySemanticsLabel('تهران'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Tree: the expand marker is its own NAMED node, and expanding/collapsing is reported', (tester) async {
    final semantics = tester.ensureSemantics();
    Set<String>? reported;
    await tester.pumpWidget(app('fa-IR', LumoTree(
      label: 'محدودهٔ جغرافیایی',
      nodes: faNodes,
      itemLabel: itemLabel,
      expandLabel: (n) => 'باز کردن $n',
      collapseLabel: (n) => 'بستن $n',
      onExpandedChanged: (v) => reported = v,
    )));
    await tester.pumpAndSettle();

    // Closed: the marker offers to OPEN, named after its own branch.
    expect(find.bySemanticsLabel('باز کردن تهران'), findsOneWidget);
    expect(find.bySemanticsLabel('بستن تهران'), findsNothing);
    expect(tester.getSemantics(find.bySemanticsLabel('تهران، سطح ۱، ۱ از ۲')).getSemanticsData().flagsCollection.isExpanded, isFalse);
    // A leaf has no marker.
    expect(find.bySemanticsLabel('باز کردن اصفهان'), findsNothing);

    await tester.tap(find.bySemanticsLabel('باز کردن تهران'));
    await tester.pumpAndSettle();
    expect(reported, {'thr'});
    expect(find.bySemanticsLabel('بستن تهران'), findsOneWidget, reason: 'the verb follows the state');
    expect(tester.getSemantics(find.bySemanticsLabel('تهران، سطح ۱، ۱ از ۲')).getSemanticsData().flagsCollection.isExpanded, isTrue);
    expect(find.bySemanticsLabel('شهرستان تهران، سطح ۲، ۱ از ۲'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('بستن تهران'));
    await tester.pumpAndSettle();
    expect(reported, isEmpty);
    expect(find.bySemanticsLabel('شهرستان تهران، سطح ۲، ۱ از ۲'), findsNothing, reason: 'a collapsed branch is out of the tree AND out of the semantics tree');
    semantics.dispose();
  });

  testWidgets('Tree: the chevron TURN is directional (anticlockwise under fa-IR, clockwise under en-US) and the indent grows from the reading start', (tester) async {
    // The value the widget computes, stated once and asserted here.
    expect(lumoTreeChevronTurns(TextDirection.rtl), -0.25);
    expect(lumoTreeChevronTurns(TextDirection.ltr), 0.25);

    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      await tester.pumpWidget(app(locale, LumoTree(
        key: ValueKey(locale),
        label: rtl ? 'محدودهٔ جغرافیایی' : 'Coverage',
        nodes: rtl ? faNodes : enNodes,
        defaultExpandedIds: const {'thr'},
        itemLabel: rtl ? itemLabel : itemLabelEn,
        expandLabel: (n) => rtl ? 'باز کردن $n' : 'Expand $n',
        collapseLabel: (n) => rtl ? 'بستن $n' : 'Collapse $n',
      )));
      await tester.pumpAndSettle();

      final turn = tester.widget<AnimatedRotation>(find.byType(AnimatedRotation).first);
      expect(turn.turns, rtl ? -0.25 : 0.25, reason: '$locale: the OPEN marker turns the way the direction demands — the mirrored glyph would otherwise point up');
      // `Icons.chevron_right` carries matchTextDirection: the CLOSED glyph is mirrored for free.
      expect(find.byIcon(Icons.chevron_right), findsWidgets);
      expect(Icons.chevron_right.matchTextDirection, isTrue);

      // The indent: a nested row starts further along the READING axis.
      final rootRow = tester.getRect(find.bySemanticsLabel(rtl ? 'تهران، سطح ۱، ۱ از ۲' : 'Tehran, level 1, 1 of 2'));
      final childText = tester.getRect(find.text(rtl ? 'شهرستان تهران' : 'Tehran county'));
      final rootText = tester.getRect(find.text(rtl ? 'تهران' : 'Tehran'));
      expect(rtl ? childText.right < rootText.right : childText.left > rootText.left, isTrue,
          reason: '$locale: the outline steps toward the reading end — right-to-left under fa-IR');
      expect(rtl ? rootText.right > rootRow.center.dx : rootText.left < rootRow.center.dx, isTrue,
          reason: '$locale: a level-1 row starts at the reading start');
    }
  });

  testWidgets('Tree: single and multiple selection announce the selected state; checkbox mode cascades and announces MIXED', (tester) async {
    final semantics = tester.ensureSemantics();
    Set<String>? chosen;

    // single: a tap selects, tapping again clears.
    await tester.pumpWidget(app('fa-IR', LumoTree(
      label: 'محدوده',
      nodes: faNodes,
      defaultExpandedIds: const {'thr'},
      selectionMode: LumoTreeSelectionMode.single,
      itemLabel: itemLabel,
      expandLabel: (n) => 'باز کردن $n',
      collapseLabel: (n) => 'بستن $n',
      onSelectionChanged: (v) => chosen = v,
    )));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(find.bySemanticsLabel('شهرستان ری، سطح ۲، ۲ از ۲')).getSemanticsData().flagsCollection.hasSelectedState, isTrue);
    await tester.tap(find.bySemanticsLabel('شهرستان ری، سطح ۲، ۲ از ۲'));
    await tester.pumpAndSettle();
    expect(chosen, {'thr-c2'});
    expect(tester.getSemantics(find.bySemanticsLabel('شهرستان ری، سطح ۲، ۲ از ۲')).getSemanticsData().flagsCollection.isSelected, isTrue);
    // A tap on a BRANCH selects rather than expands when the tree selects.
    await tester.tap(find.bySemanticsLabel('تهران، سطح ۱، ۱ از ۲'));
    await tester.pumpAndSettle();
    expect(chosen, {'thr'}, reason: 'single replaces');

    // checkbox: a branch carries its subtree, and a partly-chosen branch is MIXED.
    await tester.pumpWidget(app('fa-IR', LumoTree(
      key: const ValueKey('cb'),
      label: 'محدوده',
      nodes: faNodes,
      defaultExpandedIds: const {'thr', 'thr-c1'},
      selectionMode: LumoTreeSelectionMode.checkbox,
      defaultSelectedIds: const {'thr-c1-p1'},
      itemLabel: itemLabel,
      expandLabel: (n) => 'باز کردن $n',
      collapseLabel: (n) => 'بستن $n',
      onSelectionChanged: (v) => chosen = v,
    )));
    await tester.pumpAndSettle();
    final branch = tester.getSemantics(find.bySemanticsLabel('شهرستان تهران، سطح ۲، ۱ از ۲')).getSemanticsData();
    expect(branch.flagsCollection.hasCheckedState, isTrue);
    expect(branch.flagsCollection.isCheckStateMixed, isTrue, reason: 'one of two leaves is chosen');
    expect(branch.flagsCollection.isChecked, isFalse);
    expect(tester.getSemantics(find.bySemanticsLabel('سعادت‌آباد، سطح ۳، ۱ از ۲')).getSemanticsData().flagsCollection.isChecked, isTrue);
    expect(tester.getSemantics(find.bySemanticsLabel('پونک، سطح ۳، ۲ از ۲')).getSemanticsData().flagsCollection.isChecked, isFalse);

    await tester.tap(find.bySemanticsLabel('شهرستان تهران، سطح ۲، ۱ از ۲'));
    await tester.pumpAndSettle();
    expect(chosen, containsAll(<String>['thr-c1', 'thr-c1-p1', 'thr-c1-p2']), reason: 'a branch carries its whole subtree');
    expect(lumoTreeSelectionState(faNodes.first.children.first, chosen!), LumoTreeCheckState.checked);
    expect(lumoTreeSelectionState(faNodes.first.children.first, const {'thr-c1-p1'}), LumoTreeCheckState.mixed);
    expect(lumoTreeSelectionState(faNodes.first.children.first, const <String>{}), LumoTreeCheckState.unchecked);
    semantics.dispose();
  });

  testWidgets('Tree: with no selection, a tap on a LEAF activates it and on a branch opens it; controlled expansion stays where the parent says', (tester) async {
    final semantics = tester.ensureSemantics();
    String? activated;
    Set<String>? asked;
    await tester.pumpWidget(app('fa-IR', LumoTree(
      label: 'محدوده',
      nodes: faNodes,
      expandedIds: const {'thr'},
      itemLabel: itemLabel,
      expandLabel: (n) => 'باز کردن $n',
      collapseLabel: (n) => 'بستن $n',
      onExpandedChanged: (v) => asked = v,
      onActivate: (id) => activated = id,
    )));
    await tester.pumpAndSettle();

    await tester.tap(find.bySemanticsLabel('شهرستان ری، سطح ۲، ۲ از ۲'));
    expect(activated, 'thr-c2');

    // Controlled: the widget asked, the parent did not move it.
    await tester.tap(find.bySemanticsLabel('بستن تهران'));
    await tester.pumpAndSettle();
    expect(asked, isEmpty);
    expect(tester.getSemantics(find.bySemanticsLabel('تهران، سطح ۱، ۱ از ۲')).getSemanticsData().flagsCollection.isExpanded, isTrue);

    // The empty tree announces emptyLabel as its value and draws it once.
    await tester.pumpWidget(app('fa-IR', LumoTree(
      key: const ValueKey('empty'),
      label: 'محدوده',
      nodes: const [],
      emptyLabel: 'محدوده‌ای تعریف نشده است.',
      itemLabel: itemLabel,
      expandLabel: (n) => 'باز کردن $n',
      collapseLabel: (n) => 'بستن $n',
    )));
    expect(tester.getSemantics(find.byType(LumoTree)).getSemanticsData().value, 'محدوده‌ای تعریف نشده است.');
    expect(find.text('محدوده‌ای تعریف نشده است.'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Tree: under reduce motion the marker is turned without an animation', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoTree(
      label: 'محدوده',
      nodes: faNodes,
      defaultExpandedIds: const {'thr'},
      itemLabel: itemLabel,
      expandLabel: (n) => 'باز کردن $n',
      collapseLabel: (n) => 'بستن $n',
    ), disableAnimations: true));
    expect(find.byType(AnimatedRotation), findsNothing, reason: 'no animated wrapper is built at all under «reduce motion»');
    expect(find.byType(Transform), findsWidgets);
    expect(find.bySemanticsLabel('بستن تهران'), findsOneWidget);
  });

  testWidgets('TreeSelect: the field is named and valued by its selection; the sheet carries the tree and its own close/confirm names', (tester) async {
    final semantics = tester.ensureSemantics();
    List<String> values = const ['thr-c1-p1'];
    await tester.pumpWidget(app('fa-IR', StatefulBuilder(
      builder: (context, setState) => LumoTreeSelect(
        label: 'محدودهٔ جغرافیایی',
        treeLabel: 'درخت محدوده',
        nodes: faNodes,
        mode: LumoTreeSelectMode.checkbox,
        values: values,
        onChanged: (v) => setState(() => values = v),
        placeholder: 'انتخاب کنید',
        defaultExpandedIds: const {'thr', 'thr-c1'},
        itemLabel: itemLabel,
        expandLabel: (n) => 'باز کردن $n',
        collapseLabel: (n) => 'بستن $n',
        closeLabel: 'بستن',
        confirmLabel: 'تأیید',
      ),
    )));
    await tester.pumpAndSettle();

    // The trigger: named ONCE, valued by what is chosen.
    final trigger = tester.getSemantics(find.bySemanticsLabel('محدودهٔ جغرافیایی')).getSemanticsData();
    expect(trigger.flagsCollection.isButton, isTrue);
    expect(trigger.value, 'سعادت‌آباد');
    expect(find.bySemanticsLabel('محدودهٔ جغرافیایی'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel('محدودهٔ جغرافیایی').first);
    await tester.pumpAndSettle();

    // The sheet's own required names, and the tree inside it.
    // `showLumoSheet` names BOTH the ✕ and the dismissible scrim with closeLabel.
    expect(find.bySemanticsLabel('بستن'), findsWidgets);
    expect(find.text('تأیید'), findsOneWidget);
    expect(find.bySemanticsLabel('درخت محدوده'), findsOneWidget, reason: 'the tree inside the sheet has its own name, not the field\'s');
    expect(find.bySemanticsLabel('سعادت‌آباد، سطح ۳، ۱ از ۲'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('سعادت‌آباد، سطح ۳، ۱ از ۲')).getSemanticsData().flagsCollection.isChecked, isTrue);

    await tester.tap(find.bySemanticsLabel('پونک، سطح ۳، ۲ از ۲'));
    await tester.pumpAndSettle();
    expect(values, containsAll(<String>['thr-c1-p1', 'thr-c1-p2']));

    // Confirm is a dismissal — the selection was applied as it happened.
    await tester.tap(find.text('تأیید'));
    await tester.pumpAndSettle();
    expect(find.text('تأیید'), findsNothing);
    expect(tester.getSemantics(find.bySemanticsLabel('محدودهٔ جغرافیایی')).getSemanticsData().value, 'سعادت‌آباد، پونک');
    expect(find.bySemanticsLabel('محدودهٔ جغرافیایی'), findsOneWidget, reason: 'the sheet is gone; the field\'s name is back to being announced once');
    semantics.dispose();
  });

  testWidgets('TreeSelect: single mode closes the sheet on a pick; a disabled field does not open; en-US reads the same tree', (tester) async {
    final semantics = tester.ensureSemantics();
    List<String> values = const [];
    await tester.pumpWidget(app('en-US', StatefulBuilder(
      builder: (context, setState) => LumoTreeSelect(
        label: 'Coverage',
        treeLabel: 'Coverage tree',
        nodes: enNodes,
        values: values,
        onChanged: (v) => setState(() => values = v),
        placeholder: 'Choose',
        itemLabel: itemLabelEn,
        expandLabel: (n) => 'Expand $n',
        collapseLabel: (n) => 'Collapse $n',
        closeLabel: 'Close',
        confirmLabel: 'Done',
      ),
    )));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(find.bySemanticsLabel('Coverage')).getSemanticsData().value, 'Choose');

    await tester.tap(find.bySemanticsLabel('Coverage').first);
    await tester.pumpAndSettle();
    await tester.tap(find.bySemanticsLabel('Isfahan, level 1, 2 of 2'));
    await tester.pumpAndSettle();
    expect(values, ['esf']);
    expect(find.text('Done'), findsNothing, reason: 'a single pick is a pick, not a session');
    expect(tester.getSemantics(find.bySemanticsLabel('Coverage')).getSemanticsData().value, 'Isfahan');

    await tester.pumpWidget(app('en-US', LumoTreeSelect(
      key: const ValueKey('disabled'),
      label: 'Coverage',
      treeLabel: 'Coverage tree',
      nodes: enNodes,
      values: const [],
      isDisabled: true,
      placeholder: 'Choose',
      itemLabel: itemLabelEn,
      expandLabel: (n) => 'Expand $n',
      collapseLabel: (n) => 'Collapse $n',
      closeLabel: 'Close',
      confirmLabel: 'Done',
    )));
    await tester.pumpAndSettle();
    final disabled = tester.getSemantics(find.bySemanticsLabel('Coverage')).getSemanticsData();
    expect(disabled.flagsCollection.isEnabled, isFalse);
    expect(disabled.hasAction(SemanticsAction.tap), isFalse);
    semantics.dispose();
  });
}
