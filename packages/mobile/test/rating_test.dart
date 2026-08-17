import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

String fa(num n) => formatNumber(n, 'fa-IR');

void main() {
  testWidgets('Rating (read-only): one image node — name + value announced once; 4.5 fills four and a half; first star at the RIGHT under fa-IR', (tester) async {
    final semantics = tester.ensureSemantics();
    final valueLabel = '${fa(4.5)} از ${fa(5)}';
    await tester.pumpWidget(app('fa-IR', LumoRating(label: 'امتیاز', value: 4.5, valueLabel: valueLabel)));
    expect(Directionality.of(tester.element(find.byType(LumoRating))), TextDirection.rtl);
    expect(tester.getSemantics(find.byType(LumoRating)), matchesSemantics(label: 'امتیاز', value: valueLabel, isImage: true));
    expect(find.bySemanticsLabel('امتیاز'), findsOneWidget);
    // Ten glyphs: five outlines, five fills; the fills clipped from the reading start.
    final aligns = tester.widgetList<Align>(find.descendant(of: find.byType(LumoRating), matching: find.byType(Align))).toList();
    expect(aligns.map((a) => a.widthFactor), [1, 1, 1, 1, 0.5]);
    expect(aligns.first.alignment, AlignmentDirectional.centerStart);
    // The Row lays the first star at the right under fa-IR: the half star (position 5) is leftmost.
    final rects = find.byType(ClipRect).evaluate().map((e) => tester.getRect(find.byWidget(e.widget))).toList();
    expect(rects.first.center.dx > rects.last.center.dx, isTrue, reason: 'star 1 at the right, star 5 at the left');
    semantics.dispose();
  });

  testWidgets('Rating (interactive): a radio group named by label with the value once; stars named by starLabel; tap chooses; checked = chosen', (tester) async {
    final semantics = tester.ensureSemantics();
    double? chosen;
    await tester.pumpWidget(app('fa-IR', LumoRating(label: 'امتیاز شما', valueLabel: '${fa(3)} از ${fa(5)}', defaultValue: 3, starLabel: (n) => '${fa(n)} ستاره', onChanged: (v) => chosen = v)));
    final group = tester.getSemantics(find.byType(LumoRating));
    expect(group.getSemanticsData().role, SemanticsRole.radioGroup);
    expect(group, matchesSemantics(label: 'امتیاز شما', value: '۳ از ۵', hasEnabledState: true, isEnabled: true, children: [
      matchesSemantics(label: '۱ ستاره', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true),
      matchesSemantics(label: '۲ ستاره', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true),
      matchesSemantics(label: '۳ ستاره', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true),
      matchesSemantics(label: '۴ ستاره', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true),
      matchesSemantics(label: '۵ ستاره', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true),
    ]));
    expect(find.bySemanticsLabel('۳ از ۵'), findsNothing, reason: 'the value is a value, not a second label');
    // Stars in reading order: «۱ ستاره» at the right of «۵ ستاره» under fa-IR.
    expect(tester.getCenter(find.bySemanticsLabel('۱ ستاره')).dx > tester.getCenter(find.bySemanticsLabel('۵ ستاره')).dx, isTrue);
    await tester.tap(find.bySemanticsLabel('۵ ستاره'));
    await tester.pump();
    expect(chosen, 5);
    expect(tester.getSemantics(find.bySemanticsLabel('۵ ستاره')), matchesSemantics(label: '۵ ستاره', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.widgetList<Align>(find.byType(Align)).map((a) => a.widthFactor), [1, 1, 1, 1, 1]);
    semantics.dispose();
  });

  testWidgets('Rating: en-US first star at the LEFT; controlled value wins; disabled has no tap; interactive without starLabel is refused', (tester) async {
    final semantics = tester.ensureSemantics();
    double? chosen;
    await tester.pumpWidget(app('en-US', LumoRating(label: 'Your rating', valueLabel: '2 of 5', value: 2, starLabel: (n) => '$n stars', onChanged: (v) => chosen = v)));
    expect(tester.getCenter(find.bySemanticsLabel('1 stars')).dx < tester.getCenter(find.bySemanticsLabel('5 stars')).dx, isTrue);
    await tester.tap(find.bySemanticsLabel('4 stars'));
    await tester.pump();
    expect(chosen, 4);
    expect(tester.widgetList<Align>(find.byType(Align)).map((a) => a.widthFactor), [1, 1, 0, 0, 0], reason: 'controlled: the parent did not move the value');
    await tester.pumpWidget(app('en-US', LumoRating(label: 'Your rating', valueLabel: '2 of 5', value: 2, isDisabled: true, starLabel: (n) => '$n stars', onChanged: (_) {})));
    await tester.pump();
    // The TARGET is the 44 px touch cell; the star it PAINTS is still the web's
    // `size-5` glyph inside `p-0.5` — 20 of icon, 24 of box.
    expect(tester.getSize(find.bySemanticsLabel('4 stars')), const Size(44, 44), reason: 'a star is a touch target');
    expect(tester.getSize(find.byIcon(Icons.star_rounded).first), const Size(20, 20), reason: 'the glyph did not grow with the target');
    expect(tester.getSemantics(find.bySemanticsLabel('4 stars')), matchesSemantics(label: '4 stars', isInMutuallyExclusiveGroup: true, hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: false));
    expect(() => LumoRating(label: 'x', valueLabel: 'y', onChanged: (_) {}), throwsAssertionError);
    semantics.dispose();
  });

  testWidgets('Rating: cramped — the touch cell gives up its padding first, then the row scales; never a RenderFlex overflow', (tester) async {
    final semantics = tester.ensureSemantics();
    Widget narrow(double width, Widget child) => MaterialApp(
          theme: lumoThemeData(brightness: Brightness.light),
          home: LumoScope(locale: 'fa-IR', brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: width, child: child)))),
        );
    // Room for five 44s: the cell is the full touch floor.
    await tester.pumpWidget(narrow(320, LumoRating(label: 'امتیاز', valueLabel: '۴ از ۵', defaultValue: 4, starLabel: (n) => '${formatNumber(n, 'fa-IR')} ستاره', onChanged: (_) {})));
    expect(tester.takeException(), isNull);
    expect(tester.getSize(find.bySemanticsLabel('۴ ستاره')), const Size(44, 44));
    // Ten `lg` stars in 240 dp used to be «A RenderFlex overflowed by 40 pixels on the right».
    await tester.pumpWidget(narrow(240, LumoRating(label: 'امتیاز', valueLabel: '۴ از ۱۰', defaultValue: 4, max: 10, size: LumoRatingSize.lg, starLabel: (n) => '${formatNumber(n, 'fa-IR')} ستاره', onChanged: (_) {})));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'the row scales rather than overflowing');
    expect(tester.getSize(find.byType(LumoRating)).width, lessThanOrEqualTo(240));
    // Read-only is measured the same way and stays a single announced picture.
    await tester.pumpWidget(narrow(240, const LumoRating(label: 'امتیاز', valueLabel: '۴٫۵ از ۱۰', value: 4.5, max: 10, size: LumoRatingSize.lg)));
    expect(tester.takeException(), isNull);
    expect(find.bySemanticsLabel('امتیاز'), findsOneWidget);
    semantics.dispose();
  });
}
