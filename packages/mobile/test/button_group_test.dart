import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
  theme: lumoThemeData(brightness: Brightness.light),
  home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: Align(child: child))))),
);

const r = Radius.circular(LumoRadius.md);

/// The outermost `ClipRRect` above a child IS its slot.
Finder slotOf(String text) => find.ancestor(of: find.text(text), matching: find.byType(ClipRRect)).last;

void main() {
  testWidgets('ButtonGroup: THE CORNERS MIRROR — the first slot rounds its START pair, which is the RIGHT pair under fa-IR and the LEFT pair under en-US', (tester) async {
    // The rule, stated on the API itself, in both directions.
    final first = LumoButtonGroup.slotRadius(index: 0, count: 3, orientation: LumoButtonGroupOrientation.horizontal);
    expect(first.resolve(TextDirection.rtl), const BorderRadius.only(topRight: r, bottomRight: r));
    expect(first.resolve(TextDirection.ltr), const BorderRadius.only(topLeft: r, bottomLeft: r));
    final last = LumoButtonGroup.slotRadius(index: 2, count: 3, orientation: LumoButtonGroupOrientation.horizontal);
    expect(last.resolve(TextDirection.rtl), const BorderRadius.only(topLeft: r, bottomLeft: r));
    expect(last.resolve(TextDirection.ltr), const BorderRadius.only(topRight: r, bottomRight: r));
    // Every seam is square, and a lone child keeps all four.
    expect(LumoButtonGroup.slotRadius(index: 1, count: 3, orientation: LumoButtonGroupOrientation.horizontal), BorderRadius.zero);
    expect(LumoButtonGroup.slotRadius(index: 0, count: 1, orientation: LumoButtonGroupOrientation.horizontal), const BorderRadius.all(r));

    // …and what the group actually renders wears it.
    await tester.pumpWidget(app('fa-IR', LumoButtonGroup(
      label: 'عملیات سند',
      children: [
        LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: const Text('رونوشت')),
        LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: const Text('ویرایش')),
        LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: const Text('حذف')),
      ],
    )));
    expect(tester.widget<ClipRRect>(slotOf('رونوشت')).borderRadius.resolve(TextDirection.rtl), const BorderRadius.only(topRight: r, bottomRight: r));
    expect(tester.widget<ClipRRect>(slotOf('ویرایش')).borderRadius, BorderRadius.zero);
    expect(tester.widget<ClipRRect>(slotOf('حذف')).borderRadius.resolve(TextDirection.rtl), const BorderRadius.only(topLeft: r, bottomLeft: r));

    // The first child is at the RIGHT under fa-IR, and the slots are flush.
    final group = tester.getRect(find.byType(LumoButtonGroup));
    expect(tester.getCenter(find.text('رونوشت')).dx > group.center.dx, isTrue);
    expect(tester.getCenter(find.text('حذف')).dx < group.center.dx, isTrue);
    expect(tester.getRect(slotOf('رونوشت')).left, closeTo(tester.getRect(slotOf('ویرایش')).right, 0.01), reason: 'no gap at the seam');
  });

  testWidgets('ButtonGroup: named group with the buttons as its own nodes; the first child is at the LEFT under en-US', (tester) async {
    final semantics = tester.ensureSemantics();
    var copies = 0;
    await tester.pumpWidget(app('en-US', LumoButtonGroup(
      label: 'Document actions',
      children: [
        LumoButton(variant: LumoButtonVariant.outline, onPressed: () => copies++, child: const Text('Copy')),
        LumoIconButton(label: 'Delete', variant: LumoButtonVariant.outline, onPressed: () {}, child: const Icon(Icons.delete_outline)),
      ],
    )));
    expect(find.bySemanticsLabel('Document actions'), findsOneWidget);
    expect(find.bySemanticsLabel('Delete'), findsOneWidget);
    expect(tester.widget<ClipRRect>(slotOf('Copy')).borderRadius.resolve(TextDirection.ltr), const BorderRadius.only(topLeft: r, bottomLeft: r));
    final group = tester.getRect(find.byType(LumoButtonGroup));
    expect(tester.getCenter(find.text('Copy')).dx < group.center.dx, isTrue);
    expect(tester.getCenter(find.bySemanticsLabel('Delete')).dx > group.center.dx, isTrue);
    await tester.tap(find.text('Copy'));
    expect(copies, 1);
    semantics.dispose();
  });

  testWidgets('ButtonGroup: a VERTICAL group ends on the block axis, which does NOT mirror; text and separator peers take the tokens', (tester) async {
    final top = LumoButtonGroup.slotRadius(index: 0, count: 2, orientation: LumoButtonGroupOrientation.vertical);
    // Top is top in every script: the same pair under both directions.
    expect(top.resolve(TextDirection.rtl), const BorderRadius.only(topLeft: r, topRight: r));
    expect(top.resolve(TextDirection.ltr), const BorderRadius.only(topLeft: r, topRight: r));

    await tester.pumpWidget(app('fa-IR', const LumoButtonGroup(
      label: 'مبلغ',
      children: [
        LumoButtonGroupText(child: Text('تومان')),
        LumoButtonGroupSeparator(),
        LumoButtonGroupText(child: Text('۱۲۰٬۰۰۰')),
      ],
    )));
    final c = LumoScope.of(tester.element(find.text('تومان'))).colours;
    final peer = tester.widget<Container>(find.ancestor(of: find.text('تومان'), matching: find.byType(Container)).first).decoration! as BoxDecoration;
    expect(peer.color, c.surfaceSunken);
    expect(tester.getRect(find.byType(LumoButtonGroupSeparator)).width, 1);
    // The unit sits at the reading start = the RIGHT under fa-IR.
    expect(tester.getCenter(find.text('تومان')).dx > tester.getCenter(find.text('۱۲۰٬۰۰۰')).dx, isTrue);
  });
}
