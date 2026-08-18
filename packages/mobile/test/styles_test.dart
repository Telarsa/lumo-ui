// The customisation surface's own guards. Three things must stay true, and not
// one of them shows in a screenshot:
//
//  1. NO STYLES = THE OLD LOOK. Every resolution reads `style.x ?? <the literal
//     that was already there>`, so an empty `LumoStyles` must render what the
//     library rendered before the surface existed. Measured, not assumed.
//  2. A STYLE CANNOT MOVE SEMANTICS. A maximally hostile style — every field set
//     to something absurd — must leave the semantics tree identical. The
//     generator enforces "appearance only" by TYPE; this enforces it by OUTCOME,
//     which is the half a type system cannot promise.
//  3. A FLOOR IS A FLOOR. `minTapTarget` and `minHeight` can only GROW a target.
//     A consumer asking for 8 px still gets LumoTouch.floor — the number the device run in
//     docs/evidence/mobile-device.md exists to defend.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(Widget child, {LumoStyles styles = const LumoStyles()}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light, styles: styles),
      home: LumoScope(locale: 'fa-IR', brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

/// Every semantics node, flattened to the facts a reader is actually given.
/// Geometry is deliberately absent: a style is ALLOWED to move pixels.
List<String> tree(WidgetTester tester) {
  final out = <String>[];
  void visit(SemanticsNode node) {
    final d = node.getSemanticsData();
    out.add('${d.label}|${d.hint}|${d.value}'
        '|button=${d.flagsCollection.isButton}|header=${d.flagsCollection.isHeader}'
        '|selected=${d.flagsCollection.isSelected}|enabled=${d.flagsCollection.isEnabled}'
        '|hasEnabled=${d.flagsCollection.hasEnabledState}|tap=${d.hasAction(SemanticsAction.tap)}');
    node.visitChildren((child) {
      visit(child);
      return true;
    });
  }

  visit(tester.getSemantics(find.byType(MaterialApp)));
  return out;
}

/// Absurd on purpose. If any of it could reach a name, a role, a state or the
/// reading order, the comparison in test 2 fails.
const hostile = LumoStyles(
  button: LumoButtonStyle(
    height: {LumoButtonSize.md: 96},
    inlinePadding: {LumoButtonSize.md: 40},
    fontSize: {LumoButtonSize.md: 28},
    fontWeight: FontWeight.w900,
    borderRadius: BorderRadius.all(Radius.circular(LumoRadius.full)),
    background: {LumoButtonVariant.solid: Color(0xFF00FF00)},
    foreground: {LumoButtonVariant.solid: Color(0xFFFF00FF)},
    borderWidth: 6,
    disabledOpacity: 0.1,
    minTapTarget: 8,
  ),
  card: LumoCardStyle(
    padding: EdgeInsetsDirectional.all(2),
    pressedBackground: Color(0xFF123456),
    borderColour: Color(0xFF654321),
    titleTextStyle: TextStyle(fontSize: 40),
    headerGap: 0,
    footerGap: 0,
  ),
  item: LumoItemStyle(
    gap: {LumoItemSize.md: 0},
    inlinePadding: {LumoItemSize.md: 0},
    blockPadding: {LumoItemSize.md: 0},
    minHeight: 8,
    titleTextStyle: TextStyle(fontSize: 30),
    chevronColour: Color(0xFF00FFFF),
    chevronSize: 40,
    dividerThickness: 9,
    disabledOpacity: 0.2,
  ),
);

Widget subject() => Column(mainAxisSize: MainAxisSize.min, children: [
      LumoButton(onPressed: () {}, child: const Text('ذخیره')),
      LumoIconButton(label: 'بستن', onPressed: () {}, child: const Icon(Icons.close)),
      LumoCard(
        label: 'باز کردن پرونده',
        onTap: () {},
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const LumoCardHeader(title: 'پروژه', description: 'توضیح'),
          const Text('بدنه'),
          LumoCardFooter(children: [LumoButton(onPressed: () {}, child: const Text('ثبت'))]),
        ]),
      ),
      LumoItem(title: 'ردیف', description: 'توضیح ردیف', onTap: () {}, hasDivider: true),
      const LumoItemGroup(label: 'بخش', children: [LumoItem(title: 'یک'), LumoItem(title: 'دو')]),
    ]);

void main() {
  testWidgets('no styles = the geometry that was hard-coded, and an EMPTY LumoStyles is the same thing', (tester) async {
    for (final styles in [null, const LumoStyles()]) {
      await tester.pumpWidget(styles == null
          ? app(const SizedBox(width: 360, child: Column(mainAxisSize: MainAxisSize.min, children: [LumoButton(child: Text('اندازه'))])))
          : app(const SizedBox(width: 360, child: Column(mainAxisSize: MainAxisSize.min, children: [LumoButton(child: Text('اندازه'))])), styles: styles));
      // The DRAWN box is still the token step; the widget's own box is floored
      // at the touch minimum by `MaterialTapTargetSize.padded`. Both are the
      // library's current look, with or without an empty LumoStyles.
      expect(tester.getSize(find.byType(LumoButton)).height, LumoTouch.floor,
          reason: 'the md target is the touch floor, with or without an empty LumoStyles');
      expect(tester.getSize(find.ancestor(of: find.text('اندازه'), matching: find.byType(Material)).first).height,
          LumoControl.md,
          reason: 'and the DRAWN button is still 36 — the shared scale did not move');
    }

    await tester.pumpWidget(app(Center(child: LumoIconButton(label: 'بستن', onPressed: () {}, child: const Icon(Icons.close)))));
    expect(tester.getSize(find.byType(LumoIconButton)), const Size(LumoTouch.floor, LumoTouch.floor));
    expect(tester.getSize(find.byType(LumoButton)), const Size(LumoControl.md, LumoControl.md));

    await tester.pumpWidget(app(const LumoItem(title: 'ردیف')));
    expect(tester.getSize(find.byType(LumoItem)).height, greaterThanOrEqualTo(LumoTouch.floor));
  });

  testWidgets('a hostile style moves pixels and NOT the semantics tree', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app(subject()));
    final before = tree(tester);

    await tester.pumpWidget(app(subject(), styles: hostile));
    final after = tree(tester);

    expect(after, before,
        reason: 'a style object carries APPEARANCE ONLY. If this ever differs, a field that can '
            'reach a name, a role, a state or the reading order got into styles.dart — and the '
            'allow-list in scripts/build-mobile-styles.mjs let it through.');
    semantics.dispose();
  });

  testWidgets('a floor is a floor: minTapTarget and minHeight can only grow a target', (tester) async {
    await tester.pumpWidget(app(Center(child: LumoIconButton(label: 'بستن', onPressed: () {}, child: const Icon(Icons.close))), styles: hostile));
    expect(tester.getSize(find.byType(LumoIconButton)), const Size(LumoTouch.floor, LumoTouch.floor),
        reason: 'the style asked for 8; the platform touch floor is not a consumer knob');

    await tester.pumpWidget(app(const LumoItem(title: 'ردیف'), styles: hostile));
    expect(tester.getSize(find.byType(LumoItem)).height, greaterThanOrEqualTo(LumoTouch.floor));

  });

  // Its own test: three pumpWidget calls in one body reuse the element tree,
  // and the reused LumoIconButton kept the previous theme's target.
  testWidgets('a floor may be RAISED by a style — minTapTarget only ever grows the target', (tester) async {
    await tester.pumpWidget(app(
      Center(child: LumoIconButton(label: 'بستن', onPressed: () {}, child: const Icon(Icons.close))),
      styles: const LumoStyles(button: LumoButtonStyle(minTapTarget: 64)),
    ));
    expect(tester.getSize(find.byType(LumoIconButton)), const Size(64, 64), reason: 'upward it opens freely');
  });


  test('merge: the call site wins per field, and per-step tables combine key by key', () {
    const theme = LumoButtonStyle(borderWidth: 3, height: {LumoButtonSize.lg: 60}, background: {LumoButtonVariant.solid: Color(0xFF111111)});
    const site = LumoButtonStyle(borderWidth: 5, height: {LumoButtonSize.sm: 20});
    final merged = theme.merge(site);

    expect(merged.borderWidth, 5, reason: 'the call site wins');
    expect(merged.background, {LumoButtonVariant.solid: const Color(0xFF111111)}, reason: 'a field the call site left null keeps the theme s');
    expect(merged.height, {LumoButtonSize.lg: 60.0, LumoButtonSize.sm: 20.0},
        reason: 'tables merge KEY BY KEY — a theme moving lg and a call site moving sm both take effect');
    expect(theme.merge(null), theme, reason: 'merging nothing changes nothing');
  });

  test('lerp: the ends are the ends, and LumoStyles interpolates its families', () {
    const a = LumoStyles(button: LumoButtonStyle(borderWidth: 0, disabledOpacity: 0));
    const b = LumoStyles(button: LumoButtonStyle(borderWidth: 10, disabledOpacity: 1));
    expect(a.lerp(b, 0), a);
    expect(a.lerp(b, 1), b);
    expect(a.lerp(b, 0.5).button.borderWidth, 5);
    expect(a.lerp(null, 0.5), a, reason: 'nothing to interpolate towards');
  });

  testWidgets('LumoStyles.of never asserts: outside a Theme it is the library s own', (tester) async {
    late LumoStyles seen;
    await tester.pumpWidget(Directionality(
      textDirection: TextDirection.rtl,
      child: Builder(builder: (context) {
        seen = LumoStyles.of(context);
        return const SizedBox.shrink();
      }),
    ));
    expect(seen, const LumoStyles());
  });
}
