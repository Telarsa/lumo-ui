import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
  theme: lumoThemeData(brightness: Brightness.light),
  home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
);

BoxDecoration addonOf(WidgetTester tester, String text) =>
    tester.widget<Container>(find.ancestor(of: find.text(text), matching: find.byType(Container)).first).decoration! as BoxDecoration;

void main() {
  testWidgets('InputGroup: ONE text field named by label; the addon at the reading START is on the RIGHT under fa-IR and rounds its START corners', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoInputGroup(
      label: 'مبلغ سفارش',
      description: 'مبلغ را به تومان بنویسید',
      isNumeric: true,
      leading: Text('تومان'),
      trailing: Icon(Icons.calculate_outlined),
    )));
    expect(Directionality.of(tester.element(find.byType(LumoInputGroup))), TextDirection.rtl);

    // One text-field node, named by the label, described by the description.
    final field = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    // Trailing newline: the merged node carries the field's (empty) value after its name.
    expect(field.label.trim(), 'مبلغ سفارش');
    // The addons are NOT swallowed into that name — the unit is its own node.
    expect(find.bySemanticsLabel('تومان'), findsOneWidget);
    expect(field.hint, 'مبلغ را به تومان بنویسید');
    expect(field.flagsCollection.isTextField, isTrue);
    // The visible label and the visible description are excluded, so neither is heard twice.
    expect(find.bySemanticsLabel('مبلغ سفارش'), findsOneWidget);
    expect(find.text('مبلغ را به تومان بنویسید'), findsOneWidget);
    expect(find.bySemanticsLabel('مبلغ را به تومان بنویسید'), findsNothing);

    // Geometry: the START addon is at the RIGHT under fa-IR, the END addon at the LEFT.
    final box = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(find.text('تومان')).dx > box.center.dx, isTrue, reason: 'the leading addon is at the reading start = right under fa-IR');
    expect(tester.getCenter(find.byIcon(Icons.calculate_outlined)).dx < box.center.dx, isTrue);

    // THE CORNER TRAP: the start addon rounds the RIGHT pair under fa-IR and squares the seam.
    final leading = addonOf(tester, 'تومان').borderRadius!.resolve(TextDirection.rtl);
    expect(leading.topRight, const Radius.circular(LumoRadius.md - 1));
    expect(leading.bottomRight, const Radius.circular(LumoRadius.md - 1));
    expect(leading.topLeft, Radius.zero);
    // …and the same declaration is the LEFT pair under en-US.
    expect(addonOf(tester, 'تومان').borderRadius!.resolve(TextDirection.ltr).topLeft, const Radius.circular(LumoRadius.md - 1));

    // Digits read left-to-right inside an RTL form.
    expect(tester.widget<TextField>(find.byType(TextField)).textDirection, TextDirection.ltr);
    semantics.dispose();
  });

  testWidgets('InputGroup: the addon at the reading START is on the LEFT under en-US; a trailing button keeps its own name and fires; typing reports', (tester) async {
    final semantics = tester.ensureSemantics();
    var copies = 0;
    String? typed;
    await tester.pumpWidget(app('en-US', LumoInputGroup(
      label: 'Page address',
      leading: const Icon(Icons.link),
      onChanged: (v) => typed = v,
      trailing: LumoInputGroupButton(label: 'Copy address', onPressed: () => copies++, child: const Icon(Icons.copy)),
    )));
    final box = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(find.byIcon(Icons.link)).dx < box.center.dx, isTrue, reason: 'the leading addon is at the reading start = left under en-US');
    expect(tester.getCenter(find.bySemanticsLabel('Copy address')).dx > box.center.dx, isTrue);
    // The control inside the addon carries its own name and its own press.
    expect(find.bySemanticsLabel('Copy address'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('Copy address'));
    expect(copies, 1);

    await tester.enterText(find.byType(TextField), 'lumo.ir');
    expect(typed, 'lumo.ir');
    semantics.dispose();
  });

  testWidgets('InputGroup: an errorMessage marks it invalid and paints the critical border; focus paints the focus ring; the message is announced once', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoInputGroup(label: 'کد تخفیف', errorMessage: 'کد نامعتبر است', trailing: Text('٪'))));
    final c = LumoScope.of(tester.element(find.byType(LumoInputGroup))).colours;
    // The outer box is the FIRST Container inside the group; the addons are deeper.
    BoxDecoration boxDeco() => tester.widget<Container>(find.descendant(of: find.byType(LumoInputGroup), matching: find.byType(Container)).first).decoration! as BoxDecoration;
    expect(boxDeco().border!.top.color, c.critical);
    // The message is the field's hint; the visible copy is excluded, so it is heard once.
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().hint, 'کد نامعتبر است');
    expect(find.text('کد نامعتبر است'), findsOneWidget);
    expect(find.bySemanticsLabel('کد نامعتبر است'), findsNothing);

    // A valid field takes the focus ring when the field is focused.
    await tester.pumpWidget(app('fa-IR', const LumoInputGroup(label: 'کد تخفیف', trailing: Text('٪'))));
    expect(boxDeco().border!.top.color, c.borderControl);
    await tester.tap(find.byType(TextField));
    await tester.pumpAndSettle();
    expect(boxDeco().border!.top.color, c.focus);
    expect(boxDeco().border!.top.width, LumoFocus.width);
    semantics.dispose();
  });
}
