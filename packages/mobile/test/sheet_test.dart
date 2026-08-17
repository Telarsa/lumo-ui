// Sheet: what a screen reader gets is the SEMANTICS TREE — names, roles,
// direction — under fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

Finder closeButton(String label) => find.byWidgetPredicate((w) => w is LumoIconButton && w.label == label);

void main() {
  testWidgets('Sheet fa-IR: opens from the trigger, named ONCE by the label (header, names the route), ✕ named by closeLabel at the inline end (left), RTL inside, no English route name, closes on ✕', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <bool>[];
    await tester.pumpWidget(app('fa-IR', LumoSheetTrigger(
      label: 'فیلترها',
      closeLabel: 'بستن',
      description: 'نتایج را محدود کنید.',
      onOpenChange: changes.add,
      trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
      body: (ctx) => const Text('محتوای برگه'),
      actions: (ctx) => [LumoButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('اعمال'))],
    )));
    expect(find.text('فیلترها'), findsNothing);
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    expect(changes, [true]);
    expect(find.text('فیلترها'), findsOneWidget);
    expect(find.text('نتایج را محدود کنید.'), findsOneWidget);
    expect(find.text('محتوای برگه'), findsOneWidget);
    // The title is ONE node: header + names the route.
    expect(find.bySemanticsLabel('فیلترها'), findsOneWidget);
    expect(tester.getSemantics(find.text('فیلترها')), containsSemantics(label: 'فیلترها', isHeader: true, namesRoute: true));
    // No Material English: the route is not named «Dialog», the handle is silent.
    expect(find.bySemanticsLabel('Dialog'), findsNothing);
    expect(find.bySemanticsLabel(RegExp('Dismiss')), findsNothing);
    // The ✕: named, a button, at the inline END = left of the title under fa-IR.
    expect(closeButton('بستن'), findsOneWidget);
    expect(tester.getSemantics(closeButton('بستن')), containsSemantics(label: 'بستن', isButton: true));
    expect(tester.getCenter(closeButton('بستن')).dx < tester.getCenter(find.text('فیلترها')).dx, isTrue, reason: 'the ✕ sits at the inline end = left under fa-IR');
    // The trap: the route forgets direction unless the scope is re-provided.
    expect(Directionality.of(tester.element(find.text('محتوای برگه'))), TextDirection.rtl);
    expect(LumoScope.of(tester.element(find.text('محتوای برگه'))).locale, 'fa-IR');
    // The sheet sits at the bottom of the screen.
    final screen = tester.getSize(find.byType(MaterialApp));
    expect(tester.getRect(closeButton('بستن')).bottom, greaterThan(screen.height / 2));
    await tester.tap(closeButton('بستن'));
    await tester.pumpAndSettle();
    expect(find.text('فیلترها'), findsNothing);
    expect(changes, [true, false]);
    semantics.dispose();
  });

  testWidgets('Sheet en-US: ✕ at the inline end (right), LTR inside; closes on the scrim; isDismissible: false keeps it open', (tester) async {
    final semantics = tester.ensureSemantics();
    var dismissible = true;
    await tester.pumpWidget(app('en-US', StatefulBuilder(builder: (context, setState) => Column(mainAxisSize: MainAxisSize.min, children: [
      LumoSheetTrigger(
        label: 'Filters',
        closeLabel: 'Close',
        isDismissible: dismissible,
        trigger: (open) => LumoButton(onPressed: open, child: const Text('Open')),
        body: (ctx) => const Text('Sheet body'),
      ),
      LumoButton(onPressed: () => setState(() => dismissible = false), child: const Text('Lock')),
    ]))));
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(find.text('Filters'), findsOneWidget);
    expect(tester.getCenter(closeButton('Close')).dx > tester.getCenter(find.text('Filters')).dx, isTrue, reason: 'the ✕ sits at the inline end = right under en-US');
    expect(Directionality.of(tester.element(find.text('Sheet body'))), TextDirection.ltr);
    // Tap the scrim (top of the screen, above the sheet).
    await tester.tapAt(const Offset(20, 20));
    await tester.pumpAndSettle();
    expect(find.text('Filters'), findsNothing);
    // Not dismissible: the scrim does nothing, the ✕ still closes.
    await tester.tap(find.text('Lock'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    await tester.tapAt(const Offset(20, 20));
    await tester.pumpAndSettle();
    expect(find.text('Filters'), findsOneWidget);
    await tester.tap(closeButton('Close'));
    await tester.pumpAndSettle();
    expect(find.text('Filters'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Sheet: a long body scrolls inside; the sheet never exceeds 90% of the screen; a disabled trigger does not open', (tester) async {
    await tester.pumpWidget(app('fa-IR', Builder(builder: (context) => Column(mainAxisSize: MainAxisSize.min, children: [
      LumoButton(onPressed: () => showLumoSheet<void>(context, label: 'فهرست', closeLabel: 'بستن', body: (ctx) => Column(children: [for (var i = 0; i < 60; i++) Text('ردیف ${formatNumber(i + 1, 'fa-IR')}')])), child: const Text('باز کردن')),
      LumoSheetTrigger(label: 'غیرفعال', closeLabel: 'بستن', isDisabled: true, trigger: (open) => LumoButton(onPressed: open, isDisabled: open == null, child: const Text('قفل')), body: (ctx) => const SizedBox()),
    ]))));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    expect(find.text('ردیف ۱'), findsOneWidget);
    expect(find.byType(SingleChildScrollView), findsOneWidget);
    final screen = tester.getSize(find.byType(MaterialApp));
    final scroll = tester.getRect(find.byType(SingleChildScrollView));
    expect(scroll.height, lessThan(screen.height * 0.9));
    await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.text('ردیف ۶۰'), findsOneWidget);
    await tester.tap(closeButton('بستن'));
    await tester.pumpAndSettle();
    expect(find.text('فهرست'), findsNothing);
    await tester.tap(find.text('قفل'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('غیرفعال'), findsNothing);
  });

  /// One frame after the press: the animated sheet is still off the bottom
  /// edge, the reduce-motion sheet has already arrived.
  Future<Offset> slideAfterOneFrame(WidgetTester tester, {required bool disableAnimations}) async {
    await tester.pumpWidget(MediaQuery(
      data: MediaQueryData(disableAnimations: disableAnimations),
      child: app('fa-IR', LumoSheetTrigger(
        label: 'فیلترها',
        closeLabel: 'بستن',
        trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
        body: (ctx) => const Text('محتوای برگه'),
      )),
    ));
    await tester.tap(find.text('باز کردن'));
    await tester.pump();
    return tester.widget<SlideTransition>(find.ancestor(of: find.text('محتوای برگه'), matching: find.byType(SlideTransition)).first).position.value;
  }

  testWidgets('Sheet: with motion it is still travelling one frame in — the control the assertion below needs', (tester) async {
    expect((await slideAfterOneFrame(tester, disableAnimations: false)).dy, greaterThan(0), reason: 'still below the bottom edge');
    await tester.pumpAndSettle();
  });

  testWidgets('Sheet: «reduce motion» collapses the slide to Duration.zero — the sheet is at rest on the FIRST frame', (tester) async {
    expect(await slideAfterOneFrame(tester, disableAnimations: true), Offset.zero, reason: 'MediaQuery.disableAnimationsOf must collapse the duration to zero');
    expect(find.text('فیلترها'), findsOneWidget);
    expect(find.text('محتوای برگه'), findsOneWidget);
    await tester.pumpAndSettle();
  });

  testWidgets('Sheet at 320dp: two real Persian verbs stack instead of overflowing, and the ✕ target stays inside the sheet', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(app('fa-IR', LumoSheetTrigger(
      label: 'تنظیمات پیشرفتهٔ حساب کاربری',
      closeLabel: 'بستن',
      trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
      body: (ctx) => const Text('محتوا'),
      actions: (ctx) => [
        LumoButton(variant: LumoButtonVariant.outline, onPressed: () {}, child: const Text('انصراف و بازگشت')),
        LumoButton(onPressed: () {}, child: const Text('ذخیرهٔ تغییرات')),
      ],
    )));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    // A `Row` here overflowed by 184px.
    expect(tester.takeException(), isNull, reason: 'a RenderFlex overflow at 320dp is a real bug, not a debug banner');
    final cancel = tester.getRect(find.text('انصراف و بازگشت'));
    final save = tester.getRect(find.text('ذخیرهٔ تغییرات'));
    expect(cancel.top, isNot(save.top), reason: 'they no longer fit on one line, so they are on two');

    // The long title wraps rather than being cut, and the ✕ target keeps its
    // 44 square inside the sheet beside it.
    final target = tester.getRect(closeButton('بستن'));
    expect(target.width, greaterThanOrEqualTo(44));
    expect(target.height, greaterThanOrEqualTo(44));
    final sheet = tester.getRect(find.ancestor(of: find.text('محتوا'), matching: find.byType(Material)).first);
    expect(sheet.contains(target.topLeft) && sheet.contains(target.bottomRight), isTrue, reason: 'the enlarged target must not overhang the sheet');
    await tester.tapAt(Offset(target.center.dx, target.bottom - 3));
    await tester.pumpAndSettle();
    expect(find.text('محتوا'), findsNothing, reason: 'a tap at the target edge, clear of the glyph, must close the sheet');
  });
}
