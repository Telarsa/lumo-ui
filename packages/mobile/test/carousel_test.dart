// Carousel: the INLINE axis is the whole point. Under fa-IR the first slide is
// on the right and «next» moves the deck leftward; under en-US it is the other
// way round — the same widget, no direction flag. Asserted with real positions.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {bool disableAnimations = false}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: MediaQuery(
        data: MediaQueryData(disableAnimations: disableAnimations),
        child: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
      ),
    );

String faSlide(int i, int count) => 'اسلاید ${formatNumber(i + 1, 'fa-IR')} از ${formatNumber(count, 'fa-IR')}';
String enSlide(int i, int count) => 'Slide ${formatNumber(i + 1, 'en-US')} of ${formatNumber(count, 'en-US')}';

List<Widget> faItems = const [Center(child: Text('یک')), Center(child: Text('دو')), Center(child: Text('سه'))];

void main() {
  testWidgets('Carousel fa-IR: the region and every slide are named; the NEXT slide lies to the LEFT of the current one', (tester) async {
    final semantics = tester.ensureSemantics();
    final seen = <int>[];
    await tester.pumpWidget(app('fa-IR', LumoCarousel(
      label: 'پیشنهادهای ویژه',
      previousLabel: 'اسلاید قبلی',
      nextLabel: 'اسلاید بعدی',
      slideLabel: faSlide,
      onIndexChanged: seen.add,
      items: faItems,
    )));
    expect(Directionality.of(tester.element(find.text('یک'))), TextDirection.rtl);
    expect(find.bySemanticsLabel('پیشنهادهای ویژه'), findsOneWidget);
    // The slide names the group in the deck; its dot carries the same name, and nothing else does.
    expect(find.descendant(of: find.byType(PageView), matching: find.bySemanticsLabel('اسلاید ۱ از ۳')), findsOneWidget);
    expect(find.bySemanticsLabel('اسلاید ۱ از ۳'), findsNWidgets(2));
    expect(find.text('یک'), findsOneWidget);
    expect(find.text('دو'), findsNothing);

    // Hold a drag open so both pages are laid out, and read where the next one is.
    final gesture = await tester.startGesture(tester.getCenter(find.byType(PageView)));
    // Under RTL the pager's axis is `AxisDirection.left`: dragging the deck
    // RIGHTWARD advances it, which is «forward» in a right-to-left script.
    await gesture.moveBy(const Offset(80, 0));
    await tester.pump();
    expect(find.text('دو'), findsOneWidget);
    expect(tester.getCenter(find.text('دو')).dx, lessThan(tester.getCenter(find.text('یک')).dx),
        reason: 'the NEXT slide comes from the left under fa-IR');
    await gesture.moveBy(const Offset(200, 0));
    await gesture.up();
    await tester.pumpAndSettle();
    expect(seen, [1]);
    expect(find.descendant(of: find.byType(PageView), matching: find.bySemanticsLabel('اسلاید ۲ از ۳')), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Carousel fa-IR: «previous» sits at the reading start = RIGHT, «next» at the reading end = LEFT; both named, both disabled at their bound', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoCarousel(
      label: 'پیشنهادهای ویژه',
      previousLabel: 'اسلاید قبلی',
      nextLabel: 'اسلاید بعدی',
      slideLabel: faSlide,
      items: faItems,
    )));
    final deck = tester.getRect(find.byType(PageView));
    expect(tester.getCenter(find.bySemanticsLabel('اسلاید قبلی')).dx, greaterThan(deck.center.dx),
        reason: 'previous = inline start = right under fa-IR');
    expect(tester.getCenter(find.bySemanticsLabel('اسلاید بعدی')).dx, lessThan(deck.center.dx),
        reason: 'next = inline end = left under fa-IR');
    // At slide 1 of 3 there is nothing before it.
    expect(tester.getSemantics(find.bySemanticsLabel('اسلاید قبلی')), containsSemantics(label: 'اسلاید قبلی', isButton: true, hasEnabledState: true, isEnabled: false));
    expect(tester.getSemantics(find.bySemanticsLabel('اسلاید بعدی')), containsSemantics(label: 'اسلاید بعدی', isButton: true, hasEnabledState: true, isEnabled: true));
    await tester.tap(find.bySemanticsLabel('اسلاید بعدی'));
    await tester.pumpAndSettle();
    expect(find.text('دو'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('اسلاید قبلی')), containsSemantics(isEnabled: true));
    semantics.dispose();
  });

  testWidgets('Carousel: dots are named, selected buttons that jump; the first dot is at the reading start', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoCarousel(
      label: 'پیشنهادهای ویژه',
      previousLabel: 'اسلاید قبلی',
      nextLabel: 'اسلاید بعدی',
      slideLabel: faSlide,
      items: faItems,
    )));
    // Two nodes carry «اسلاید ۱ از ۳»: the slide group and its dot. The dot is the button.
    final dot = find.descendant(of: find.byType(Row), matching: find.bySemanticsLabel('اسلاید ۳ از ۳'));
    expect(tester.getSemantics(dot), containsSemantics(label: 'اسلاید ۳ از ۳', isButton: true, isSelected: false));
    final firstDot = find.descendant(of: find.byType(Row), matching: find.bySemanticsLabel('اسلاید ۱ از ۳'));
    expect(tester.getCenter(firstDot).dx, greaterThan(tester.getCenter(dot).dx), reason: 'dot 1 at the reading start = right under fa-IR');
    await tester.tap(dot);
    await tester.pumpAndSettle();
    expect(find.text('سه'), findsOneWidget);
    expect(tester.getSemantics(find.descendant(of: find.byType(Row), matching: find.bySemanticsLabel('اسلاید ۳ از ۳'))), containsSemantics(isSelected: true));
    semantics.dispose();
  });

  testWidgets('Carousel en-US: the next slide lies to the RIGHT, «previous» at the LEFT — the mirror of fa-IR', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoCarousel(
      label: 'Featured offers',
      previousLabel: 'Previous slide',
      nextLabel: 'Next slide',
      slideLabel: enSlide,
      items: const [Center(child: Text('One')), Center(child: Text('Two')), Center(child: Text('Three'))],
    )));
    final deck = tester.getRect(find.byType(PageView));
    expect(tester.getCenter(find.bySemanticsLabel('Previous slide')).dx, lessThan(deck.center.dx));
    expect(tester.getCenter(find.bySemanticsLabel('Next slide')).dx, greaterThan(deck.center.dx));
    final gesture = await tester.startGesture(tester.getCenter(find.byType(PageView)));
    await gesture.moveBy(const Offset(-80, 0));
    await tester.pump();
    expect(tester.getCenter(find.text('Two')).dx, greaterThan(tester.getCenter(find.text('One')).dx),
        reason: 'the NEXT slide comes from the right under en-US');
    await gesture.up();
    await tester.pumpAndSettle();
    expect(find.descendant(of: find.byType(PageView), matching: find.bySemanticsLabel('Slide 1 of 3')), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Carousel: autoPlay advances on its own, and stops for good on the first interaction', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoCarousel(
      label: 'پیشنهادهای ویژه',
      previousLabel: 'اسلاید قبلی',
      nextLabel: 'اسلاید بعدی',
      slideLabel: faSlide,
      autoPlay: true,
      interval: const Duration(milliseconds: 400),
      items: faItems,
    )));
    expect(find.text('یک'), findsOneWidget);
    // Fixed pumps, not `pumpAndSettle`: a live periodic timer never settles.
    await tester.pump(const Duration(milliseconds: 450));
    for (var i = 0; i < 4; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(find.text('دو'), findsOneWidget);
    expect(find.text('یک'), findsNothing);
    // A tap on a dot is the reader taking over: the timer never fires again.
    await tester.tap(find.descendant(of: find.byType(Row), matching: find.bySemanticsLabel('اسلاید ۱ از ۳')));
    await tester.pumpAndSettle();
    expect(find.text('یک'), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 900));
    await tester.pumpAndSettle();
    expect(find.text('یک'), findsOneWidget, reason: 'auto-play stays stopped once the reader has steered');
  });

  testWidgets('Carousel: autoPlay never starts under disableAnimations — reduce-motion is the platform saying no', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoCarousel(
      label: 'پیشنهادهای ویژه',
      previousLabel: 'اسلاید قبلی',
      nextLabel: 'اسلاید بعدی',
      slideLabel: faSlide,
      autoPlay: true,
      interval: const Duration(milliseconds: 400),
      items: faItems,
    ), disableAnimations: true));
    expect(find.text('یک'), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.text('یک'), findsOneWidget);
    expect(find.text('دو'), findsNothing);
  });

  testWidgets('Carousel: the chevrons and the dots are buttons a READER can press — a tap action on the node, 44 px of target, the circle where it was', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoCarousel(label: 'پیشنهادها', items: faItems, previousLabel: 'قبلی', nextLabel: 'بعدی', slideLabel: faSlide)));
    await tester.pumpAndSettle();
    // The defect: `Semantics(button: true)` over a `GestureDetector(
    // excludeFromSemantics: true)` with no `onTap` on the NODE — the whole
    // carousel carried no SemanticsAction.tap at all.
    for (final name in ['بعدی', faSlide(1, 3)]) {
      final node = tester.getSemantics(find.bySemanticsLabel(name));
      expect(node.getSemanticsData().hasAction(SemanticsAction.tap), isTrue, reason: '$name must be pressable by a reader');
      final size = tester.getSize(find.bySemanticsLabel(name));
      expect(size.width, greaterThanOrEqualTo(44), reason: '$name is a tap target');
      expect(size.height, greaterThanOrEqualTo(44), reason: '$name is a tap target');
    }
    // The chevron circle still paints at `LumoControl.sm`, hard against the band's start.
    expect(tester.getSize(find.ancestor(of: find.byIcon(Icons.chevron_right), matching: find.byType(Container)).first), const Size(29, 29));
    // And the dot really moves the deck: the third slide is the one on screen.
    await tester.tap(find.bySemanticsLabel(faSlide(2, 3)));
    await tester.pumpAndSettle();
    expect(tester.getCenter(find.text('سه')).dx, closeTo(tester.getCenter(find.byType(LumoCarousel)).dx, 1));
    semantics.dispose();
  });

  testWidgets('Carousel: the dot that widens when its slide arrives collapses to Duration.zero under disableAnimations', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoCarousel(label: 'پیشنهادها', items: faItems, previousLabel: 'قبلی', nextLabel: 'بعدی', slideLabel: faSlide)));
    await tester.pumpAndSettle();
    expect(tester.widgetList<AnimatedContainer>(find.byType(AnimatedContainer)).map((a) => a.duration).toSet(), {const Duration(milliseconds: 150)});
    await tester.pumpWidget(app('fa-IR', LumoCarousel(label: 'پیشنهادها', items: faItems, previousLabel: 'قبلی', nextLabel: 'بعدی', slideLabel: faSlide), disableAnimations: true));
    await tester.pumpAndSettle();
    expect(tester.widgetList<AnimatedContainer>(find.byType(AnimatedContainer)).map((a) => a.duration).toSet(), {Duration.zero}, reason: 'reduce motion is the platform saying no');
  });
}
