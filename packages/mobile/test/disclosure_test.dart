// Disclosure / Accordion: the trigger's expanded STATE is the product — a
// button that says whether it is open, names itself once, and stops animating
// when the platform says «reduce motion».
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {bool disableAnimations = false}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: Builder(
          builder: (context) => MediaQuery(
            data: MediaQuery.of(context).copyWith(disableAnimations: disableAnimations),
            child: Scaffold(body: Center(child: SizedBox(width: 360, child: child))),
          ),
        ),
      ),
    );

const faq = [
  LumoDisclosureItem(id: 'price', title: 'هزینهٔ ارسال چقدر است؟', child: Text('برای سفارش‌های بالای پانصد هزار تومان رایگان است.')),
  LumoDisclosureItem(id: 'return', title: 'شرایط بازگشت کالا چیست؟', child: Text('تا هفت روز پس از تحویل.')),
  LumoDisclosureItem(id: 'support', title: 'پشتیبانی چه ساعتی پاسخ می‌دهد؟', child: Text('هر روز، هشت تا بیست.'), isDisabled: true),
];

void main() {
  testWidgets('Disclosure fa-IR: a button with hasExpandedState, closed by default, the title announced ONCE, the chevron at the inline end (left) and rotated when open', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <bool>[];
    await tester.pumpWidget(app('fa-IR', LumoDisclosure(
      title: 'هزینهٔ ارسال چقدر است؟',
      onOpenChange: changes.add,
      child: const Text('برای سفارش‌های بالای پانصد هزار تومان رایگان است.'),
    )));
    expect(Directionality.of(tester.element(find.text('هزینهٔ ارسال چقدر است؟'))), TextDirection.rtl);
    // The trigger is ONE node: a button that carries the expanded state.
    expect(tester.getSemantics(find.text('هزینهٔ ارسال چقدر است؟')), containsSemantics(label: 'هزینهٔ ارسال چقدر است؟', isButton: true, hasExpandedState: true, isExpanded: false, isEnabled: true));
    expect(find.bySemanticsLabel('هزینهٔ ارسال چقدر است؟'), findsOneWidget);
    // A closed panel is not built at all.
    expect(find.text('برای سفارش‌های بالای پانصد هزار تومان رایگان است.'), findsNothing);
    // The chevron: decoration, at the inline END = left under fa-IR.
    final row = tester.getRect(find.byType(LumoDisclosure));
    expect(tester.getCenter(find.byIcon(Icons.keyboard_arrow_down)).dx < row.center.dx, isTrue);
    expect(tester.widget<AnimatedRotation>(find.byType(AnimatedRotation)).turns, 0);
    await tester.tap(find.text('هزینهٔ ارسال چقدر است؟'));
    await tester.pumpAndSettle();
    expect(changes, [true]);
    expect(tester.getSemantics(find.text('هزینهٔ ارسال چقدر است؟')), containsSemantics(hasExpandedState: true, isExpanded: true));
    expect(find.text('برای سفارش‌های بالای پانصد هزار تومان رایگان است.'), findsOneWidget);
    // Half a turn on the block axis — nothing mirrors.
    expect(tester.widget<AnimatedRotation>(find.byType(AnimatedRotation)).turns, 0.5);
    await tester.tap(find.text('هزینهٔ ارسال چقدر است؟'));
    await tester.pumpAndSettle();
    expect(changes, [true, false]);
    expect(find.text('برای سفارش‌های بالای پانصد هزار تومان رایگان است.'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Disclosure: defaultOpen opens uncontrolled; a controlled isOpen does not move on its own; isDisabled announces disabled and does not open', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <bool>[];
    // A key per case: without one the State (and its open flag) would be reused across pumps.
    await tester.pumpWidget(app('fa-IR', const LumoDisclosure(key: ValueKey('default'), title: 'بازِ اول', defaultOpen: true, child: Text('بدنهٔ الف'))));
    expect(find.text('بدنهٔ الف'), findsOneWidget);
    // Controlled: the parameter is the truth, a tap only reports.
    await tester.pumpWidget(app('fa-IR', LumoDisclosure(key: const ValueKey('controlled'), title: 'کنترل‌شده', isOpen: false, onOpenChange: changes.add, child: const Text('بدنهٔ ب'))));
    await tester.tap(find.text('کنترل‌شده'));
    await tester.pumpAndSettle();
    expect(changes, [true]);
    expect(find.text('بدنهٔ ب'), findsNothing);
    // Disabled: announced, and inert.
    await tester.pumpWidget(app('fa-IR', LumoDisclosure(key: const ValueKey('disabled'), title: 'غیرفعال', isDisabled: true, onOpenChange: changes.add, child: const Text('بدنهٔ ج'))));
    expect(tester.getSemantics(find.text('غیرفعال')), containsSemantics(label: 'غیرفعال', isEnabled: false, hasExpandedState: true, isExpanded: false));
    await tester.tap(find.text('غیرفعال'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(changes, [true]);
    expect(find.text('بدنهٔ ج'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Accordion fa-IR: one open at a time by default, allowsMultiple keeps both, defaultValue starts open, a disabled item stays shut', (tester) async {
    final semantics = tester.ensureSemantics();
    var latest = <String>{};
    await tester.pumpWidget(app('fa-IR', LumoAccordion(items: faq, defaultValue: const {'price'}, onChanged: (v) => latest = v)));
    expect(find.text('برای سفارش‌های بالای پانصد هزار تومان رایگان است.'), findsOneWidget);
    expect(tester.getSemantics(find.text('هزینهٔ ارسال چقدر است؟')), containsSemantics(isButton: true, hasExpandedState: true, isExpanded: true));
    expect(tester.getSemantics(find.text('شرایط بازگشت کالا چیست؟')), containsSemantics(hasExpandedState: true, isExpanded: false));
    // Single-open: the second closes the first.
    await tester.tap(find.text('شرایط بازگشت کالا چیست؟'));
    await tester.pumpAndSettle();
    expect(latest, {'return'});
    expect(find.text('تا هفت روز پس از تحویل.'), findsOneWidget);
    expect(find.text('برای سفارش‌های بالای پانصد هزار تومان رایگان است.'), findsNothing);
    // The disabled section is announced disabled and does not open.
    expect(tester.getSemantics(find.text('پشتیبانی چه ساعتی پاسخ می‌دهد؟')), containsSemantics(isEnabled: false));
    await tester.tap(find.text('پشتیبانی چه ساعتی پاسخ می‌دهد؟'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('هر روز، هشت تا بیست.'), findsNothing);
    // allowsMultiple: both stay open, and every title is still in the tree once.
    // A new key: the previous accordion's State (and its open set) must not leak into this one.
    await tester.pumpWidget(app('fa-IR', LumoAccordion(key: const ValueKey('multi'), items: faq, allowsMultiple: true, defaultValue: const {'price'}, onChanged: (v) => latest = v)));
    await tester.tap(find.text('شرایط بازگشت کالا چیست؟'));
    await tester.pumpAndSettle();
    expect(latest, {'price', 'return'});
    expect(find.text('تا هفت روز پس از تحویل.'), findsOneWidget);
    expect(find.text('برای سفارش‌های بالای پانصد هزار تومان رایگان است.'), findsOneWidget);
    expect(find.bySemanticsLabel('شرایط بازگشت کالا چیست؟'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Accordion en-US: controlled value, the chevron at the right, the hairlines from the scope', (tester) async {
    final semantics = tester.ensureSemantics();
    var latest = <String>{};
    const items = [
      LumoDisclosureItem(id: 'a', title: 'Shipping', child: Text('Free over 500,000 tomans.')),
      LumoDisclosureItem(id: 'b', title: 'Returns', child: Text('Seven days.')),
    ];
    await tester.pumpWidget(app('en-US', LumoAccordion(items: items, value: const {'b'}, onChanged: (v) => latest = v)));
    expect(find.text('Seven days.'), findsOneWidget);
    expect(find.text('Free over 500,000 tomans.'), findsNothing);
    final box = tester.getRect(find.byType(LumoAccordion));
    expect(tester.getCenter(find.byIcon(Icons.keyboard_arrow_down).first).dx > box.center.dx, isTrue, reason: 'the chevron sits at the inline end = right under en-US');
    // Controlled: the tap reports, the widget does not move itself.
    await tester.tap(find.text('Shipping'));
    await tester.pumpAndSettle();
    expect(latest, {'a'});
    expect(find.text('Free over 500,000 tomans.'), findsNothing);
    final c = LumoScope.of(tester.element(find.text('Shipping'))).colours;
    final top = tester.widget<DecoratedBox>(find.descendant(of: find.byType(LumoAccordion), matching: find.byType(DecoratedBox)).first).decoration as BoxDecoration;
    expect(top.border, Border(top: BorderSide(color: c.border)));
    semantics.dispose();
  });

  testWidgets('Disclosure: «reduce motion» removes the animation — the chevron and the panel change with no duration', (tester) async {
    await tester.pumpWidget(app('fa-IR', const LumoDisclosure(title: 'بی‌حرکت', child: Text('بدنه')), disableAnimations: true));
    // No animated wrappers at all: nothing to run.
    expect(find.byType(AnimatedRotation), findsNothing);
    expect(find.byType(AnimatedSize), findsNothing);
    expect(tester.widget<RotatedBox>(find.byType(RotatedBox)).quarterTurns, 0);
    await tester.tap(find.text('بی‌حرکت'));
    // One frame, no settling: the panel is already there.
    await tester.pump();
    expect(find.text('بدنه'), findsOneWidget);
    expect(tester.widget<RotatedBox>(find.byType(RotatedBox)).quarterTurns, 2);
    // With motion allowed the panel animates instead.
    await tester.pumpWidget(app('fa-IR', const LumoDisclosure(title: 'متحرک', child: Text('بدنه'))));
    expect(tester.widget<AnimatedSize>(find.byType(AnimatedSize)).duration, const Duration(milliseconds: 200));
    expect(tester.widget<AnimatedRotation>(find.byType(AnimatedRotation)).duration, const Duration(milliseconds: 200));
  });
}
