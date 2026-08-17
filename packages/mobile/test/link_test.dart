// Semantics-tree tests for LumoLink: the `link` role (never a button), the
// name announced ONCE, an external link that SAYS it is external in the
// announced name (the web's `newTabLabel`, appended after the words), the icon
// at the reading end, and the disabled form.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

void main() {
  testWidgets('Link: announced as a LINK, not a button; the name is heard ONCE; onTap is the seam', (tester) async {
    final semantics = tester.ensureSemantics();
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', LumoLink(label: 'راهنمای کامل قیمت', onTap: () => taps++)));
    expect(
      tester.getSemantics(find.byType(LumoLink)),
      matchesSemantics(label: 'راهنمای کامل قیمت', isLink: true, hasEnabledState: true, isEnabled: true, hasTapAction: true),
    );
    expect(find.bySemanticsLabel('راهنمای کامل قیمت'), findsOneWidget);
    expect(find.text('راهنمای کامل قیمت'), findsOneWidget);
    await tester.tap(find.byType(LumoLink));
    expect(taps, 1);
    semantics.dispose();
  });

  testWidgets('Link: an EXTERNAL link says so in its announced name — the warning is appended after the words, and is never drawn', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoLink(
      label: 'قوانین خروس',
      onTap: () {},
      isExternal: true,
      externalLabel: 'در برگهٔ جدید باز می‌شود',
      icon: const Icon(Icons.open_in_new),
    )));
    expect(tester.getSemantics(find.byType(LumoLink)).getSemanticsData().label, 'قوانین خروس در برگهٔ جدید باز می‌شود');
    expect(find.bySemanticsLabel('قوانین خروس در برگهٔ جدید باز می‌شود'), findsOneWidget);
    // The warning is announced, not shown; the glyph is silent decoration.
    expect(find.text('در برگهٔ جدید باز می‌شود'), findsNothing);
    expect(find.bySemanticsLabel('در برگهٔ جدید باز می‌شود'), findsNothing);
    // `isExternal` without a label is refused at construction — there is no English default.
    expect(() => LumoLink(label: 'x', onTap: () {}, isExternal: true), throwsAssertionError);
    semantics.dispose();
  });

  testWidgets('Link: the icon follows the words at the reading END — left of the text under fa-IR, right under en-US', (tester) async {
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final label = rtl ? 'راهنمای ایمنی' : 'Safety guide';
      await tester.pumpWidget(app(locale, LumoLink(key: ValueKey(locale), label: label, onTap: () {}, icon: const Icon(Icons.arrow_forward))));
      final text = tester.getCenter(find.text(label)).dx;
      final icon = tester.getCenter(find.byIcon(Icons.arrow_forward)).dx;
      expect(rtl ? icon < text : icon > text, isTrue, reason: '$locale: the icon sits after the words, at the reading end');
    }
  });

  testWidgets('Link: disabled is still announced as a link (a nameless generic is worse) but has no tap; both variants take the accent from the scope', (tester) async {
    final semantics = tester.ensureSemantics();
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoLink(label: 'بایگانی', onTap: () => taps++, isDisabled: true),
      LumoLink(label: 'همهٔ نظرها', onTap: () {}, variant: LumoLinkVariant.standalone),
    ])));
    final off = tester.getSemantics(find.byType(LumoLink).first).getSemanticsData();
    expect(off.flagsCollection.isLink, isTrue);
    expect(off.flagsCollection.isEnabled, isFalse);
    expect(off.hasAction(SemanticsAction.tap), isFalse);
    await tester.tap(find.text('بایگانی'), warnIfMissed: false);
    expect(taps, 0);

    final c = LumoScope.of(tester.element(find.text('بایگانی'))).colours;
    expect(tester.widget<Text>(find.text('بایگانی')).style!.color, c.accent);
    // Underlined in prose (colour is not the sole carrier); not at rest when it stands alone.
    expect(tester.widget<Text>(find.text('بایگانی')).style!.decoration, TextDecoration.underline);
    expect(tester.widget<Text>(find.text('همهٔ نظرها')).style!.decoration, TextDecoration.none);
    semantics.dispose();
  });

  testWidgets('Link: en-US, a standalone link keeps a real touch target', (tester) async {
    await tester.pumpWidget(app('en-US', LumoLink(label: 'See all reviews', onTap: () {}, variant: LumoLinkVariant.standalone)));
    expect(tester.getRect(find.byType(LumoLink)).height >= 36, isTrue);
    expect(Directionality.of(tester.element(find.byType(LumoLink))), TextDirection.ltr);
  });
}
