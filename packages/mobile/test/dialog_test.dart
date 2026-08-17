// Dialog was the one overlay family with no semantics-tree test, and it had a
// defect because of that: the route's name existed TWICE in the tree (a
// `Semantics(label:)` wrapper above a visible `Text(label)`), so a reader heard
// the title, then heard it again. This file is why that cannot come back.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

/// Every node in the tree whose label contains [text].
int _nodesLabelled(WidgetTester tester, String text) {
  var count = 0;
  void walk(SemanticsNode node) {
    if (node.label.contains(text)) count++;
    node.visitChildren((child) {
      walk(child);
      return true;
    });
  }

  // The semantics owner hangs off the binding's own pipeline owner; the
  // `rootPipelineOwner` replacement owns no semantics tree in a widget test.
  // ignore: deprecated_member_use
  walk(tester.binding.pipelineOwner.semanticsOwner!.rootSemanticsNode!);
  return count;
}

void main() {
  testWidgets('fa-IR: opens from its trigger, names the route ONCE, ✕ named by closeLabel at the inline end, closes', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app(
      'fa-IR',
      Builder(
        builder: (context) => LumoDialogTrigger(
          label: 'حذف پروژه',
          closeLabel: 'بستن',
          description: 'این کار برگشت‌پذیر نیست.',
          trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
          actions: (ctx) => [LumoButton(variant: LumoButtonVariant.outline, onPressed: () => Navigator.of(ctx).pop(), child: const Text('انصراف'))],
        ),
      ),
    ));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();

    expect(find.text('حذف پروژه'), findsOneWidget);
    expect(find.text('این کار برگشت‌پذیر نیست.'), findsOneWidget);
    // The title is in the tree exactly once — the defect this file exists for.
    expect(_nodesLabelled(tester, 'حذف پروژه'), 1, reason: 'the dialog name must be announced once, not once per wrapper');

    // The ✕ is named by closeLabel and sits at the inline end (left under fa-IR).
    final close = find.descendant(of: find.byType(Dialog), matching: find.bySemanticsLabel('بستن'));
    expect(close, findsOneWidget);
    final card = tester.getRect(find.byType(Dialog));
    expect(tester.getCenter(close).dx < card.center.dx, isTrue, reason: 'the ✕ sits at the inline end = left under fa-IR');

    // The route inherits the scope's direction, which routes forget by default.
    expect(Directionality.of(tester.element(find.text('حذف پروژه'))), TextDirection.rtl);

    await tester.tap(find.text('انصراف'));
    await tester.pumpAndSettle();
    expect(find.text('حذف پروژه'), findsNothing);
    semantics.dispose();
  });

  testWidgets('en-US: the ✕ sits at the inline end (right), and the imperative form returns its result', (tester) async {
    final semantics = tester.ensureSemantics();
    String? answer;
    await tester.pumpWidget(app(
      'en-US',
      Builder(
        builder: (context) => LumoButton(
          onPressed: () async {
            answer = await showLumoDialog<String>(
              context,
              label: 'Delete project',
              closeLabel: 'Close',
              description: 'This cannot be undone.',
              actions: (ctx) => [LumoButton(onPressed: () => Navigator.of(ctx).pop('deleted'), child: const Text('Delete'))],
            );
          },
          child: const Text('Open'),
        ),
      ),
    ));
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    final close = find.descendant(of: find.byType(Dialog), matching: find.bySemanticsLabel('Close'));
    final card = tester.getRect(find.byType(Dialog));
    expect(tester.getCenter(close).dx > card.center.dx, isTrue, reason: 'the ✕ sits at the inline end = right under en-US');
    expect(_nodesLabelled(tester, 'Delete project'), 1);

    await tester.tap(find.text('Delete'));
    await tester.pumpAndSettle();
    expect(answer, 'deleted', reason: 'the imperative form hands the caller the action it took');
    semantics.dispose();
  });

  testWidgets('the ✕ closes it, and the dialog carries no English platform name', (tester) async {
    await tester.pumpWidget(app(
      'fa-IR',
      Builder(
        builder: (context) => LumoDialogTrigger(
          label: 'حذف پروژه',
          closeLabel: 'بستن',
          trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
          actions: (ctx) => const [],
        ),
      ),
    ));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    // Material would name its own barrier «Dismiss» and its route «Dialog».
    expect(find.bySemanticsLabel(RegExp('Dismiss')), findsNothing);
    expect(find.bySemanticsLabel('Dialog'), findsNothing);

    await tester.tap(find.descendant(of: find.byType(Dialog), matching: find.bySemanticsLabel('بستن')));
    await tester.pumpAndSettle();
    expect(find.text('حذف پروژه'), findsNothing);
  });

  /// One frame after the press: the animated route is mid-fade, the
  /// reduce-motion route is already there. `motion` is the only difference.
  Future<double> fadeAfterOneFrame(WidgetTester tester, {required bool disableAnimations}) async {
    await tester.pumpWidget(MediaQuery(
      data: MediaQueryData(disableAnimations: disableAnimations),
      child: app(
        'fa-IR',
        Builder(
          builder: (context) => LumoDialogTrigger(
            label: 'حذف پروژه',
            closeLabel: 'بستن',
            trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
            actions: (ctx) => [LumoButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('تایید'))],
          ),
        ),
      ),
    ));
    await tester.tap(find.text('باز کردن'));
    await tester.pump();
    return tester.widget<FadeTransition>(find.ancestor(of: find.byType(Dialog), matching: find.byType(FadeTransition)).first).opacity.value;
  }

  testWidgets('Dialog: with motion the card is still fading one frame in — the control the assertion below needs', (tester) async {
    expect(await fadeAfterOneFrame(tester, disableAnimations: false), lessThan(1.0));
    await tester.pumpAndSettle();
  });

  testWidgets('Dialog: «reduce motion» collapses the transition to Duration.zero — the card is fully there on the FIRST frame', (tester) async {
    expect(await fadeAfterOneFrame(tester, disableAnimations: true), 1.0, reason: 'MediaQuery.disableAnimationsOf must collapse the duration to zero');
    expect(find.text('حذف پروژه'), findsOneWidget);
    await tester.pumpAndSettle();
  });

  testWidgets('Dialog at 320dp: two real Persian verbs stack instead of overflowing the card', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(app(
      'fa-IR',
      Builder(
        builder: (context) => LumoDialogTrigger(
          label: 'حذف پروژه از فضای کاری تیم محصول',
          closeLabel: 'بستن',
          description: 'این کار برگشت‌پذیر نیست.',
          trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
          actions: (ctx) => [
            LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: const Text('انصراف و بازگشت')),
            LumoButton(onPressed: () {}, child: const Text('حذف برای همیشه')),
          ],
        ),
      ),
    ));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    // A `Row` here overflowed by 278px; the `OverflowBar` puts the verbs on two lines.
    expect(tester.takeException(), isNull, reason: 'a RenderFlex overflow at 320dp is a real bug, not a debug banner');
    expect(find.text('انصراف و بازگشت'), findsOneWidget);
    expect(find.text('حذف برای همیشه'), findsOneWidget);
    final cancel = tester.getRect(find.text('انصراف و بازگشت'));
    final confirm = tester.getRect(find.text('حذف برای همیشه'));
    expect(cancel.top, isNot(confirm.top), reason: 'they no longer fit on one line, so they are on two');
    // Both stay inside the card.
    final card = tester.getRect(find.byType(Dialog));
    expect(card.contains(cancel.centerLeft), isTrue);
    expect(card.contains(confirm.centerRight), isTrue);
  });

  testWidgets('Dialog: the ✕ presents a 44×44 target — a tap at its edge, clear of the 16px glyph, still closes', (tester) async {
    await tester.pumpWidget(app(
      'fa-IR',
      Builder(
        builder: (context) => LumoDialogTrigger(
          label: 'حذف پروژه',
          closeLabel: 'بستن',
          trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
          actions: (ctx) => [LumoButton(onPressed: () {}, child: const Text('تایید'))],
        ),
      ),
    ));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();

    // The ring itself is `LumoIconButton`'s (one place, not four); this asserts
    // the dialog COMPOSES it — that the header does not clip or shrink it.
    final close = find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن');
    final target = tester.getRect(close);
    expect(target.width, greaterThanOrEqualTo(44));
    expect(target.height, greaterThanOrEqualTo(44));
    final card = tester.getRect(find.byType(Dialog));
    expect(card.contains(target.topLeft) && card.contains(target.bottomRight), isTrue, reason: 'the enlarged target must not overflow the card');
    await tester.tapAt(Offset(target.center.dx, target.bottom - 3));
    await tester.pumpAndSettle();
    expect(find.text('حذف پروژه'), findsNothing, reason: 'a tap at the target edge, clear of the glyph, must close the dialog');
  });
}
