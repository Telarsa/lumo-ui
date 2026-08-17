// Alert dialog: a decision with exactly two ways out. The proof is the
// semantics tree of the ROUTE — the name once, no ✕, no English platform
// string, focus on the safe verb — under fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

void main() {
  testWidgets('AlertDialog fa-IR: named ONCE (names the route, a header), no ✕, the scrim does not dismiss, cancel returns false; the confirm verb sits at the reading end (left)', (tester) async {
    final semantics = tester.ensureSemantics();
    final opens = <bool>[];
    var confirmed = 0;
    var cancelled = 0;
    await tester.pumpWidget(app('fa-IR', LumoAlertDialogTrigger(
      label: 'حذف آگهی؟',
      description: 'این آگهی برای همیشه حذف می‌شود و بازگشتی ندارد.',
      confirmLabel: 'حذف',
      cancelLabel: 'انصراف',
      isDestructive: true,
      onOpenChange: opens.add,
      onConfirm: () => confirmed++,
      onCancel: () => cancelled++,
      // The trigger's own text differs from the confirm verb, so the geometry assertions below name one button each.
      trigger: (ask) => LumoButton(onPressed: ask, child: const Text('حذف آگهی')),
    )));
    expect(find.text('حذف آگهی؟'), findsNothing);
    await tester.tap(find.text('حذف آگهی'));
    await tester.pumpAndSettle();
    expect(opens, [true]);
    // The name is in the tree exactly once, on the node that names the route and is the header.
    expect(find.bySemanticsLabel('حذف آگهی؟'), findsOneWidget);
    expect(tester.getSemantics(find.text('حذف آگهی؟')), containsSemantics(label: 'حذف آگهی؟', isHeader: true, namesRoute: true));
    expect(find.text('این آگهی برای همیشه حذف می‌شود و بازگشتی ندارد.'), findsOneWidget);
    // NO ✕: the web has none either — an alert dialog forces a choice.
    expect(find.byType(LumoIconButton), findsNothing);
    expect(find.byIcon(Icons.close), findsNothing);
    // No Material English on the route.
    expect(find.bySemanticsLabel('Dialog'), findsNothing);
    expect(find.bySemanticsLabel(RegExp('Dismiss')), findsNothing);
    // The route re-provides the scope: direction and locale survive.
    expect(Directionality.of(tester.element(find.text('انصراف'))), TextDirection.rtl);
    expect(LumoScope.of(tester.element(find.text('انصراف'))).locale, 'fa-IR');
    // Cancel first in source order, confirm at the READING end = left under fa-IR.
    expect(tester.getCenter(find.widgetWithText(LumoButton, 'حذف')).dx < tester.getCenter(find.widgetWithText(LumoButton, 'انصراف')).dx, isTrue);
    // Focus is on the declining verb: nothing destructive is one blind «enter» away.
    final focused = FocusManager.instance.primaryFocus!.context!;
    expect(find.descendant(of: find.byWidget(focused.widget), matching: find.text('انصراف')), findsOneWidget);
    // The scrim does not dismiss it.
    await tester.tapAt(const Offset(10, 10));
    await tester.pumpAndSettle();
    expect(find.text('حذف آگهی؟'), findsOneWidget);
    await tester.tap(find.text('انصراف'));
    await tester.pumpAndSettle();
    expect(opens, [true, false]);
    expect(cancelled, 1);
    expect(confirmed, 0);
    expect(find.text('حذف آگهی؟'), findsNothing);
    semantics.dispose();
  });

  testWidgets('AlertDialog: the confirm verb resolves the future; destructive paints it critical, otherwise solid', (tester) async {
    late Future<bool> answer;
    await tester.pumpWidget(app('fa-IR', Builder(builder: (context) => LumoButton(
          onPressed: () => answer = showLumoAlertDialog(context, label: 'انصراف از سفارش؟', description: 'مبلغ تا ۷۲ ساعت برمی‌گردد.', confirmLabel: 'لغو سفارش', cancelLabel: 'بازگشت', isDestructive: true),
          child: const Text('باز کردن'),
        ))));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    final c = LumoScope.of(tester.element(find.text('لغو سفارش'))).colours;
    expect(tester.widget<LumoButton>(find.widgetWithText(LumoButton, 'لغو سفارش')).variant, LumoButtonVariant.critical);
    expect(tester.widget<LumoButton>(find.widgetWithText(LumoButton, 'بازگشت')).variant, LumoButtonVariant.outline);
    // The critical variant's fill is the scope's token, not a hard-coded red.
    final fill = tester.widget<FilledButton>(find.descendant(of: find.widgetWithText(LumoButton, 'لغو سفارش'), matching: find.byType(FilledButton)))
        .style!
        .backgroundColor!
        .resolve(<WidgetState>{});
    expect(fill, c.critical);
    await tester.tap(find.text('لغو سفارش'));
    await tester.pumpAndSettle();
    expect(await answer, isTrue);
    // Not destructive: the confirming verb is the solid button.
    await tester.pumpWidget(app('fa-IR', Builder(builder: (context) => LumoButton(
          onPressed: () => answer = showLumoAlertDialog(context, label: 'ارسال درخواست؟', description: 'درخواست برای کارشناس فرستاده می‌شود.', confirmLabel: 'ارسال', cancelLabel: 'بازگشت'),
          child: const Text('باز کردن'),
        ))));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    expect(tester.widget<LumoButton>(find.widgetWithText(LumoButton, 'ارسال')).variant, LumoButtonVariant.solid);
    // A system back gesture is not an answer: the future resolves false.
    Navigator.of(tester.element(find.text('ارسال'))).pop();
    await tester.pumpAndSettle();
    expect(await answer, isFalse);
  });

  testWidgets('AlertDialog en-US: the confirm verb sits at the reading end (right); a disabled trigger asks nothing', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoAlertDialogTrigger(
        label: 'Delete listing?',
        description: 'This cannot be undone.',
        confirmLabel: 'Delete',
        cancelLabel: 'Keep it',
        isDestructive: true,
        trigger: (ask) => LumoButton(onPressed: ask, child: const Text('Open')),
      ),
      LumoAlertDialogTrigger(
        label: 'Never asked',
        description: 'Never shown.',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
        isDisabled: true,
        trigger: (ask) => LumoButton(onPressed: ask, isDisabled: ask == null, child: const Text('Locked')),
      ),
    ])));
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(Directionality.of(tester.element(find.text('Keep it'))), TextDirection.ltr);
    expect(tester.getCenter(find.widgetWithText(LumoButton, 'Delete')).dx > tester.getCenter(find.widgetWithText(LumoButton, 'Keep it')).dx, isTrue, reason: 'confirm at the reading end = right under en-US');
    await tester.tap(find.text('Keep it'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Locked'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('Never asked'), findsNothing);
    semantics.dispose();
  });

  /// One frame after the press: the animated route is mid-fade, the
  /// reduce-motion route is already there. `disableAnimations` is the only difference.
  Future<double> fadeAfterOneFrame(WidgetTester tester, {required bool disableAnimations}) async {
    await tester.pumpWidget(MediaQuery(
      data: MediaQueryData(disableAnimations: disableAnimations),
      child: app('fa-IR', LumoAlertDialogTrigger(
        label: 'حذف آگهی؟',
        description: 'این آگهی برای همیشه حذف می‌شود.',
        confirmLabel: 'حذف',
        cancelLabel: 'انصراف',
        trigger: (ask) => LumoButton(onPressed: ask, child: const Text('حذف آگهی')),
      )),
    ));
    await tester.tap(find.text('حذف آگهی'));
    await tester.pump();
    return tester.widget<FadeTransition>(find.ancestor(of: find.text('حذف آگهی؟'), matching: find.byType(FadeTransition)).first).opacity.value;
  }

  testWidgets('AlertDialog: with motion the card is still fading one frame in — the control the assertion below needs', (tester) async {
    expect(await fadeAfterOneFrame(tester, disableAnimations: false), lessThan(1.0));
    await tester.pumpAndSettle();
  });

  testWidgets('AlertDialog: «reduce motion» collapses the transition to Duration.zero — the question is fully there on the FIRST frame', (tester) async {
    expect(await fadeAfterOneFrame(tester, disableAnimations: true), 1.0, reason: 'MediaQuery.disableAnimationsOf must collapse the duration to zero');
    expect(find.text('حذف آگهی؟'), findsOneWidget);
    expect(find.text('حذف'), findsOneWidget);
    await tester.pumpAndSettle();
  });

  testWidgets('AlertDialog at 320dp: two real Persian verbs stack (confirm above cancel, the web footer\'s flex-col-reverse) instead of overflowing', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(app('fa-IR', LumoAlertDialogTrigger(
      label: 'حذف پروژه؟',
      description: 'این کار برگشت‌پذیر نیست.',
      confirmLabel: 'حذف برای همیشه',
      cancelLabel: 'انصراف و بازگشت',
      trigger: (ask) => LumoButton(onPressed: ask, child: const Text('حذف')),
    )));
    await tester.tap(find.text('حذف'));
    await tester.pumpAndSettle();
    // A `Row` here overflowed by 246px.
    expect(tester.takeException(), isNull, reason: 'a RenderFlex overflow at 320dp is a real bug, not a debug banner');
    final confirm = tester.getRect(find.text('حذف برای همیشه'));
    final cancel = tester.getRect(find.text('انصراف و بازگشت'));
    expect(cancel.top, isNot(confirm.top), reason: 'they no longer fit on one line, so they are on two');
    expect(confirm.top, lessThan(cancel.top), reason: 'flex-col-reverse: the confirming verb stays nearest the thumb, cancel below it');
    final card = tester.getRect(find.byType(Material).first);
    expect(card.contains(confirm.center) && card.contains(cancel.center), isTrue);
  });
}
