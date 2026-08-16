// Toast: the message is a LIVE REGION announced once, ✕ named by closeLabel at
// the inline end, the stack sits at the bottom-END corner (bottom-left under
// fa-IR), auto-dismiss after the duration, nothing blocks the page beneath.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

Finder closeButton(String label) => find.byWidgetPredicate((w) => w is LumoIconButton && w.label == label);
/// The toast's own surface: the nearest Material above its message.
Finder surfaceOf(Finder content) => find.ancestor(of: content, matching: find.byType(Material)).first;

void main() {
  testWidgets('Toast fa-IR: shown from a press, the message is a live region ONCE, ✕ named by closeLabel at the inline end (left), stack at the bottom-LEFT corner, RTL inside, gone after the duration', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', Builder(builder: (context) => LumoButton(onPressed: () => showLumoToast(context, message: 'ذخیره شد', closeLabel: 'بستن', tone: LumoToastTone.positive), child: const Text('ذخیره')))));
    await tester.tap(find.text('ذخیره'));
    await tester.pump();
    expect(find.text('ذخیره شد'), findsOneWidget);
    expect(find.bySemanticsLabel('ذخیره شد'), findsOneWidget);
    expect(tester.getSemantics(find.text('ذخیره شد')), containsSemantics(label: 'ذخیره شد', isLiveRegion: true));
    expect(closeButton('بستن'), findsOneWidget);
    expect(tester.getSemantics(closeButton('بستن')), containsSemantics(label: 'بستن', isButton: true));
    expect(tester.getCenter(closeButton('بستن')).dx < tester.getCenter(find.text('ذخیره شد')).dx, isTrue, reason: 'the ✕ sits at the inline end = left under fa-IR');
    // The stack anchors to the bottom-END = bottom-LEFT under fa-IR.
    final screen = tester.getSize(find.byType(MaterialApp));
    final surface = tester.getRect(surfaceOf(find.text('ذخیره شد')));
    expect(surface.left, closeTo(16, 1), reason: 'bottom-end = the left edge under fa-IR');
    expect(surface.bottom, closeTo(screen.height - 16, 1));
    expect(surface.width, lessThanOrEqualTo(384));
    // The trap: the overlay entry is above the scope — direction must be re-provided.
    expect(Directionality.of(tester.element(find.text('ذخیره شد'))), TextDirection.rtl);
    // Auto-dismiss after the (default 4s) duration.
    await tester.pump(const Duration(seconds: 3));
    expect(find.text('ذخیره شد'), findsOneWidget);
    await tester.pump(const Duration(seconds: 1, milliseconds: 100));
    await tester.pump();
    expect(find.text('ذخیره شد'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Toast en-US: ✕ at the inline end (right), stack at the bottom-RIGHT corner; the page beneath stays tappable; newest nearest the edge; ✕ closes one; the action fires and closes', (tester) async {
    final semantics = tester.ensureSemantics();
    var undone = 0, n = 0;
    await tester.pumpWidget(app('en-US', Builder(builder: (context) => LumoButton(
      onPressed: () {
        n++;
        showLumoToast(context, message: 'Saved $n', closeLabel: 'Close', duration: const Duration(seconds: 2), actionLabel: n == 2 ? 'Undo' : null, onAction: n == 2 ? () => undone++ : null);
      },
      child: const Text('Save'),
    ))));
    await tester.tap(find.text('Save'));
    await tester.pump();
    expect(find.text('Saved 1'), findsOneWidget);
    final screen = tester.getSize(find.byType(MaterialApp));
    final first = tester.getRect(surfaceOf(find.text('Saved 1')));
    expect(first.right, closeTo(screen.width - 16, 1), reason: 'bottom-end = the right edge under en-US');
    expect(tester.getCenter(closeButton('Close')).dx > tester.getCenter(find.text('Saved 1')).dx, isTrue, reason: 'the ✕ sits at the inline end = right under en-US');
    expect(Directionality.of(tester.element(find.text('Saved 1'))), TextDirection.ltr);
    // The overlay entry does not swallow taps: the page's button still works → a second toast.
    await tester.tap(find.text('Save'));
    await tester.pump();
    expect(find.text('Saved 1'), findsOneWidget);
    expect(find.text('Saved 2'), findsOneWidget);
    expect(closeButton('Close'), findsNWidgets(2));
    // Newest nearest the bottom edge; the older one above it.
    expect(tester.getCenter(find.text('Saved 2')).dy, greaterThan(tester.getCenter(find.text('Saved 1')).dy));
    // Undo: fires the action and closes that toast.
    await tester.tap(find.text('Undo'));
    await tester.pump();
    expect(undone, 1);
    expect(find.text('Saved 2'), findsNothing);
    expect(find.text('Saved 1'), findsOneWidget);
    // ✕ closes the remaining one.
    await tester.tap(closeButton('Close'));
    await tester.pump();
    expect(find.text('Saved 1'), findsNothing);
    expect(find.byType(LumoIconButton), findsNothing);
    semantics.dispose();
  });

  testWidgets('Toast: at most three visible (the oldest closes), Duration.zero stays until closed, the handle closes early', (tester) async {
    LumoToastHandle? handle;
    await tester.pumpWidget(app('fa-IR', Builder(builder: (context) => LumoButton(
      onPressed: () => handle = showLumoToast(context, message: 'پیام ${formatNumber(++_n, 'fa-IR')}', closeLabel: 'بستن', duration: Duration.zero, tone: LumoToastTone.critical),
      child: const Text('نمایش'),
    ))));
    for (var i = 0; i < 4; i++) {
      await tester.tap(find.text('نمایش'));
      await tester.pump();
    }
    expect(find.text('پیام ۱'), findsNothing, reason: 'the oldest beyond three is closed');
    for (final m in ['پیام ۲', 'پیام ۳', 'پیام ۴']) {
      expect(find.text(m), findsOneWidget);
    }
    // No timer: still there after a long wait.
    await tester.pump(const Duration(minutes: 1));
    expect(find.text('پیام ۴'), findsOneWidget);
    handle!.close();
    await tester.pump();
    expect(find.text('پیام ۴'), findsNothing);
    expect(handle!.isClosed, isTrue);
    // Closing the rest empties the overlay entry.
    await tester.tap(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن').first);
    await tester.pump();
    await tester.tap(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن').first);
    await tester.pump();
    expect(find.byType(LumoIconButton), findsNothing);
  });
}

int _n = 0;
