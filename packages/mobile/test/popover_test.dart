// Popover: the semantics tree (route named by `label`, ✕ named by closeLabel)
// and the GEOMETRY (start-aligned to the trigger, ✕ at the inline end) under
// fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {AlignmentGeometry alignment = Alignment.center}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: alignment, child: child))),
    );

Finder closeButton(String label) => find.byWidgetPredicate((w) => w is LumoIconButton && w.label == label);
/// The popover's own surface: the nearest Material above its content.
Finder surfaceOf(Finder content) => find.ancestor(of: content, matching: find.byType(Material)).first;

void main() {
  testWidgets('Popover fa-IR: opens from the trigger, the route is named ONCE by label, ✕ named by closeLabel at the inline end (left), start-aligned to the trigger (right edges meet), RTL inside, closes on ✕', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <bool>[];
    await tester.pumpWidget(app('fa-IR', LumoPopoverTrigger(
      label: 'گزینه‌های اشتراک‌گذاری',
      showClose: true,
      closeLabel: 'بستن',
      onOpenChange: changes.add,
      trigger: (open) => LumoButton(onPressed: open, child: const Text('اشتراک‌گذاری')),
      content: (ctx) => const Text('پیوند را کپی کنید'),
    )));
    expect(find.text('پیوند را کپی کنید'), findsNothing);
    await tester.tap(find.text('اشتراک‌گذاری'));
    await tester.pumpAndSettle();
    expect(changes, [true]);
    expect(find.text('پیوند را کپی کنید'), findsOneWidget);
    // The name exists once, and it names the route.
    expect(find.bySemanticsLabel('گزینه‌های اشتراک‌گذاری'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('گزینه‌های اشتراک‌گذاری')), containsSemantics(label: 'گزینه‌های اشتراک‌گذاری', namesRoute: true));
    // The ✕ inside the popover (the barrier is also named «بستن», correctly — the ✕ is the LumoIconButton).
    expect(closeButton('بستن'), findsOneWidget);
    expect(tester.getSemantics(closeButton('بستن')), containsSemantics(label: 'بستن', isButton: true));
    final content = find.text('پیوند را کپی کنید');
    final surface = tester.getRect(surfaceOf(content));
    final trigger = tester.getRect(find.text('اشتراک‌گذاری'));
    expect(tester.getCenter(closeButton('بستن')).dx < surface.center.dx, isTrue, reason: 'the ✕ sits at the inline end = left under fa-IR');
    // `bottomStart` mirrored: the popover's RIGHT edge meets the trigger's RIGHT edge; it sits below.
    final button = tester.getRect(find.ancestor(of: find.text('اشتراک‌گذاری'), matching: find.byType(LumoButton)));
    expect((surface.right - button.right).abs(), lessThan(1), reason: 'start-aligned under RTL = right edges meet');
    expect(surface.top, greaterThanOrEqualTo(trigger.bottom));
    // The trap: the route forgets direction unless the scope is re-provided.
    expect(Directionality.of(tester.element(content)), TextDirection.rtl);
    expect(LumoScope.of(tester.element(content)).locale, 'fa-IR');
    await tester.tap(closeButton('بستن'));
    await tester.pumpAndSettle();
    expect(find.text('پیوند را کپی کنید'), findsNothing);
    expect(changes, [true, false]);
    semantics.dispose();
  });

  testWidgets('Popover en-US: ✕ at the inline end (right), left edges meet, LTR inside; tap outside closes; no ✕ when showClose is false', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoPopoverTrigger(
        label: 'Share options',
        showClose: true,
        closeLabel: 'Close',
        trigger: (open) => LumoButton(onPressed: open, child: const Text('Share')),
        content: (ctx) => const Text('Copy the link'),
      ),
      LumoPopoverTrigger(
        label: 'Details',
        trigger: (open) => LumoButton(onPressed: open, child: const Text('Info')),
        content: (ctx) => const Text('Plain content'),
      ),
    ])));
    await tester.tap(find.text('Share'));
    await tester.pumpAndSettle();
    final content = find.text('Copy the link');
    final surface = tester.getRect(surfaceOf(content));
    final button = tester.getRect(find.ancestor(of: find.text('Share'), matching: find.byType(LumoButton)));
    expect(tester.getCenter(closeButton('Close')).dx > surface.center.dx, isTrue, reason: 'the ✕ sits at the inline end = right under en-US');
    expect((surface.left - button.left).abs(), lessThan(1), reason: 'start-aligned under LTR = left edges meet');
    expect(Directionality.of(tester.element(content)), TextDirection.ltr);
    // Tap outside (top corner, on the transparent barrier) closes.
    await tester.tapAt(const Offset(5, 5));
    await tester.pumpAndSettle();
    expect(find.text('Copy the link'), findsNothing);
    // Without showClose there is no ✕ and no closeLabel to require.
    await tester.tap(find.text('Info'));
    await tester.pumpAndSettle();
    expect(find.text('Plain content'), findsOneWidget);
    expect(find.byType(LumoIconButton), findsNothing);
    expect(find.bySemanticsLabel('Details'), findsOneWidget);
    await tester.tapAt(const Offset(5, 5));
    await tester.pumpAndSettle();
    expect(find.text('Plain content'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Popover: flips above when the room below is short; the imperative twin anchors to a render box; showClose without closeLabel is asserted', (tester) async {
    final key = GlobalKey();
    await tester.pumpWidget(app('fa-IR', Builder(builder: (context) => LumoButton(key: key, onPressed: () => showLumoPopover<void>(context, anchor: key.currentContext!.findRenderObject()! as RenderBox, label: 'راهنما', content: (ctx) => const SizedBox(height: 120, child: Text('متن راهنما'))), child: const Text('باز کردن'))), alignment: Alignment.bottomCenter));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    final surface = tester.getRect(surfaceOf(find.text('متن راهنما')));
    final trigger = tester.getRect(find.byKey(key));
    expect(surface.bottom, lessThanOrEqualTo(trigger.top), reason: 'no room below the trigger at the bottom of the screen: the popover flips above');
    await tester.tapAt(const Offset(5, 5));
    await tester.pumpAndSettle();
    expect(() => LumoPopoverTrigger(label: 'x', showClose: true, trigger: (open) => const SizedBox(), content: (ctx) => const SizedBox()), throwsAssertionError);
  });

  /// One frame after the press: the animated surface is still fading, the
  /// reduce-motion one has arrived.
  Future<double> fadeAfterOneFrame(WidgetTester tester, {required bool disableAnimations}) async {
    await tester.pumpWidget(MediaQuery(
      data: MediaQueryData(disableAnimations: disableAnimations),
      child: app('fa-IR', LumoPopoverTrigger(
        label: 'گزینه‌های اشتراک‌گذاری',
        showClose: true,
        closeLabel: 'بستن',
        trigger: (open) => LumoButton(onPressed: open, child: const Text('اشتراک‌گذاری')),
        content: (ctx) => const Text('پیوند را کپی کنید'),
      )),
    ));
    await tester.tap(find.text('اشتراک‌گذاری'));
    await tester.pump();
    return tester.widget<FadeTransition>(find.ancestor(of: find.text('پیوند را کپی کنید'), matching: find.byType(FadeTransition)).first).opacity.value;
  }

  testWidgets('Popover: with motion the surface is still fading one frame in — the control the assertion below needs', (tester) async {
    expect(await fadeAfterOneFrame(tester, disableAnimations: false), lessThan(1.0));
    await tester.pumpAndSettle();
  });

  testWidgets('Popover: «reduce motion» collapses the transition to Duration.zero — the surface is fully there on the FIRST frame', (tester) async {
    // The route reads its duration from a getter above any MediaQuery of its
    // own: the flag has to be read at the TRIGGER and carried onto the route.
    expect(await fadeAfterOneFrame(tester, disableAnimations: true), 1.0, reason: 'MediaQuery.disableAnimationsOf must collapse the duration to zero');
    expect(find.text('پیوند را کپی کنید'), findsOneWidget);
    await tester.pumpAndSettle();
  });

  testWidgets('Popover: the ✕ presents a 44×44 target inside the surface — a tap at its edge, clear of the glyph, closes', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoPopoverTrigger(
      label: 'گزینه‌های اشتراک‌گذاری',
      showClose: true,
      closeLabel: 'بستن',
      trigger: (open) => LumoButton(onPressed: open, child: const Text('اشتراک‌گذاری')),
      content: (ctx) => const Text('پیوند را کپی کنید'),
    )));
    await tester.tap(find.text('اشتراک‌گذاری'));
    await tester.pumpAndSettle();
    final target = tester.getRect(closeButton('بستن'));
    expect(target.width, greaterThanOrEqualTo(44));
    expect(target.height, greaterThanOrEqualTo(44));
    final surface = tester.getRect(surfaceOf(find.text('پیوند را کپی کنید')));
    expect(surface.contains(target.topLeft) && surface.contains(target.bottomRight), isTrue, reason: 'the enlarged target must not overhang the surface');
    await tester.tapAt(Offset(target.center.dx, target.bottom - 3));
    await tester.pumpAndSettle();
    expect(find.text('پیوند را کپی کنید'), findsNothing, reason: 'a tap at the target edge must close the popover');
  });

  testWidgets('Popover: the surface takes LumoShadow.overlay — the elevation token, whose DARK ramp is not the light one (a hand-picked `c.scrim` painted almost nothing on a dark page)', (tester) async {
    expect(LumoShadow.overlay(Brightness.light).first.color, isNot(LumoShadow.overlay(Brightness.dark).first.color), reason: 'the token holds a separate dark ramp — the assertion below is worth making');

    for (final b in Brightness.values) {
      await tester.pumpWidget(MaterialApp(
        theme: lumoThemeData(brightness: b),
        home: LumoScope(locale: 'fa-IR', brightness: b, child: Scaffold(body: Center(child: LumoPopoverTrigger(
          label: 'گزینه‌ها',
          trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
          content: (ctx) => const Text('محتوا'),
        )))),
      ));
      await tester.tap(find.text('باز کردن'));
      await tester.pumpAndSettle();
      final box = tester.widget<DecoratedBox>(find.ancestor(of: find.text('محتوا'), matching: find.byType(DecoratedBox)).first);
      expect((box.decoration as BoxDecoration).boxShadow, LumoShadow.overlay(b), reason: 'the popover surface must take the elevation token for its own scheme');
      await tester.tapAt(const Offset(5, 5));
      await tester.pumpAndSettle();
    }
  });
}
