// Alert: an inline status message. What a screen reader gets is the SEMANTICS
// TREE — the title as a header, the description after it, the ✕ named, the live
// region only when the alert ARRIVES — under fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

BoxDecoration decorationOf(WidgetTester tester, String text) =>
    tester.widget<DecoratedBox>(find.ancestor(of: find.text(text), matching: find.byType(DecoratedBox)).first).decoration as BoxDecoration;

void main() {
  testWidgets('Alert fa-IR: title is a header announced once, description follows, icon at the reading start (right), ✕ named at the inline end (left), no live region by default', (tester) async {
    final semantics = tester.ensureSemantics();
    var dismissed = 0;
    await tester.pumpWidget(app('fa-IR', LumoAlert(
      title: 'پرداخت ناموفق بود',
      description: 'کارت شما رد شد. کارت دیگری را امتحان کنید.',
      tone: LumoAlertTone.critical,
      icon: const Icon(Icons.error_outline),
      dismissLabel: 'بستن',
      onDismiss: () => dismissed++,
      actions: [LumoButton(size: LumoButtonSize.sm, onPressed: () {}, child: const Text('تلاش دوباره'))],
    )));
    expect(Directionality.of(tester.element(find.text('پرداخت ناموفق بود'))), TextDirection.rtl);
    // The title: a header, and the string exists exactly once in the tree.
    expect(tester.getSemantics(find.text('پرداخت ناموفق بود')), containsSemantics(label: 'پرداخت ناموفق بود', isHeader: true, isLiveRegion: false));
    expect(find.bySemanticsLabel('پرداخت ناموفق بود'), findsOneWidget);
    expect(find.text('کارت شما رد شد. کارت دیگری را امتحان کنید.'), findsOneWidget);
    expect(tester.getSemantics(find.text('کارت شما رد شد. کارت دیگری را امتحان کنید.')), containsSemantics(isLiveRegion: false));
    // The ✕: named by dismissLabel, a button, at the inline END = left under fa-IR.
    expect(tester.getSemantics(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن')), containsSemantics(label: 'بستن', isButton: true));
    final box = tester.getRect(find.byType(LumoAlert));
    expect(tester.getCenter(find.bySemanticsLabel('بستن')).dx < box.center.dx, isTrue, reason: 'the ✕ sits at the inline end = left under fa-IR');
    expect(tester.getCenter(find.byIcon(Icons.error_outline)).dx > box.center.dx, isTrue, reason: 'the icon leads = right under fa-IR');
    // The icon is decoration: it announces nothing.
    expect(tester.getSemantics(find.byIcon(Icons.error_outline)).getSemanticsData().label, '');
    // The action is a real widget slot, not a label plus a handler.
    expect(find.text('تلاش دوباره'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('بستن'));
    expect(dismissed, 1);
    semantics.dispose();
  });

  testWidgets('Alert: isLive marks the title and the description as live regions — the announcement on arrival', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoAlert(title: 'کد تأیید ارسال شد', description: 'تا دو دقیقهٔ دیگر می‌رسد.', tone: LumoAlertTone.positive, isLive: true)));
    expect(tester.getSemantics(find.text('کد تأیید ارسال شد')), containsSemantics(label: 'کد تأیید ارسال شد', isHeader: true, isLiveRegion: true));
    expect(tester.getSemantics(find.text('تا دو دقیقهٔ دیگر می‌رسد.')), containsSemantics(isLiveRegion: true));
    semantics.dispose();
  });

  testWidgets('Alert en-US: geometry mirrors — icon at the left, ✕ at the right; the alert is not a button', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoAlert(
      title: 'Payment failed',
      description: 'Your card was declined.',
      tone: LumoAlertTone.critical,
      icon: const Icon(Icons.error_outline),
      dismissLabel: 'Dismiss the message',
      onDismiss: () {},
    )));
    final box = tester.getRect(find.byType(LumoAlert));
    expect(tester.getCenter(find.byIcon(Icons.error_outline)).dx < box.center.dx, isTrue, reason: 'the icon leads = left under en-US');
    expect(tester.getCenter(find.bySemanticsLabel('Dismiss the message')).dx > box.center.dx, isTrue, reason: 'the ✕ sits at the inline end = right under en-US');
    expect(tester.getSemantics(find.text('Payment failed')).getSemanticsData().flagsCollection.isButton, isFalse);
    semantics.dispose();
  });

  testWidgets('Alert: every tone and variant takes its colours from the scope; the leading edge is 4px on the INLINE start', (tester) async {
    await tester.pumpWidget(app('fa-IR', const Column(mainAxisSize: MainAxisSize.min, children: [
      LumoAlert(title: 'خنثی', tone: LumoAlertTone.neutral),
      LumoAlert(title: 'تأکید'),
      LumoAlert(title: 'هشدار', tone: LumoAlertTone.caution),
      LumoAlert(title: 'موفق', tone: LumoAlertTone.positive, variant: LumoAlertVariant.outline),
    ])));
    final c = LumoScope.of(tester.element(find.text('خنثی'))).colours;
    // Neutral subtle: the sunken fill behind the plain hairline.
    final neutral = decorationOf(tester, 'خنثی');
    expect(neutral.color, c.surfaceSunken);
    expect(neutral.border, Border.all(color: c.border));
    // Accent is the default tone, as on the web: the token at /10 behind /25.
    final accent = decorationOf(tester, 'تأکید');
    expect(accent.color, c.accent.withValues(alpha: 0.10));
    expect(accent.border, Border.all(color: c.accent.withValues(alpha: 0.25)));
    expect(accent.borderRadius, BorderRadius.circular(LumoRadius.md));
    expect(decorationOf(tester, 'هشدار').color, c.caution.withValues(alpha: 0.10));
    // Outline: no fill, the tone on the edge.
    final outline = decorationOf(tester, 'موفق');
    expect(outline.color, Colors.transparent);
    expect(outline.border, Border.all(color: c.positive));
    // The 4px leading stripe: the tone at full strength, one per alert, and
    // under fa-IR it is the RIGHT-hand edge of its alert.
    final stripes = tester.widgetList<Container>(find.byWidgetPredicate((w) => w is Container && w.constraints?.maxWidth == 4)).toList();
    expect(stripes.length, 4);
    expect(stripes[0].color, c.borderStrong);
    expect(stripes[1].color, c.accent);
    expect(stripes[3].color, c.positive);
    final stripe = tester.getRect(find.byWidgetPredicate((w) => w is Container && w.constraints?.maxWidth == 4).first);
    final alert = tester.getRect(find.byType(LumoAlert).first);
    expect(stripe.right, closeTo(alert.right - 1, 0.5), reason: 'the leading edge is the right-hand one under fa-IR');
  });

  testWidgets('Alert: the ✕ has a 44x44 HIT AREA around a 29x29 drawing, taps in the overhang count, and growing it does not resize the alert', (tester) async {
    final semantics = tester.ensureSemantics();
    var dismissed = 0;
    // The same alert twice, once with the ✕ and once without: the ✕'s target
    // overhangs into the alert's own padding, so neither size may differ.
    await tester.pumpWidget(app('fa-IR', const LumoAlert(title: 'الف')));
    final bare = tester.getSize(find.byType(LumoAlert));
    await tester.pumpWidget(app('fa-IR', LumoAlert(title: 'الف', dismissLabel: 'بستن', onDismiss: () => dismissed++)));
    expect(tester.getSize(find.byType(LumoAlert)), bare, reason: 'a 44px target must not inflate the alert');

    // The DRAWN box — the button that actually paints — is still the web's
    // `h-control-sm w-control-sm`. (No `actions` here, so this is the ✕'s.)
    final drawn = tester.getRect(find.byType(LumoButton));
    expect(drawn.size, const Size(LumoControl.sm, LumoControl.sm));
    // …and it is still exactly where the 16px content padding put it.
    final alert = tester.getRect(find.byType(LumoAlert));
    expect(drawn.top - alert.top, closeTo(17, 0.01), reason: '1px border + 16px padding');
    expect(drawn.left - alert.left, closeTo(17, 0.01), reason: 'inline end = LEFT under fa-IR');

    // The HIT AREA — and the node explore-by-touch lands on — is 44x44, centred.
    final target = tester.getRect(find.bySemanticsLabel('بستن'));
    expect(target.size, const Size(44, 44));
    expect(target.center, within(distance: 0.01, from: drawn.center));
    expect(tester.getSemantics(find.bySemanticsLabel('بستن')), containsSemantics(label: 'بستن', isButton: true, hasTapAction: true));
    // Announced exactly once: the drawn button beneath is silent.
    expect(find.bySemanticsLabel('بستن'), findsOneWidget);

    // A tap in the transparent overhang — outside the drawing — dismisses.
    expect(drawn.contains(target.topLeft + const Offset(3, 3)), isFalse);
    await tester.tapAt(target.topLeft + const Offset(3, 3));
    expect(dismissed, 1, reason: 'the overhang is live, and fires exactly once');
    // …and so does a tap on the drawing itself, still exactly once.
    await tester.tapAt(drawn.center);
    expect(dismissed, 2);
    semantics.dispose();
  });

  testWidgets('Alert en-US: the ✕ target mirrors to the right-hand padding and stays inside the frame', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoAlert(title: 'A', dismissLabel: 'Dismiss', onDismiss: () {})));
    final alert = tester.getRect(find.byType(LumoAlert));
    final drawn = tester.getRect(find.byType(LumoButton));
    expect(drawn.size, const Size(LumoControl.sm, LumoControl.sm));
    expect(alert.right - drawn.right, closeTo(17, 0.01), reason: 'inline end = RIGHT under en-US');
    final target = tester.getRect(find.bySemanticsLabel('Dismiss'));
    expect(target.size, const Size(44, 44));
    // The overhang lands in the alert's own whitespace, never outside it.
    expect(alert.contains(target.topLeft), isTrue);
    expect(alert.contains(target.bottomRight - const Offset(0.1, 0.1)), isTrue);
    semantics.dispose();
  });

  testWidgets('Alert at 320 dp: long Persian title, description and a ✕ — no overflow, nothing truncated', (tester) async {
    const long = 'گزارش عملکرد سه‌ماههٔ چهارم شرکت';
    await tester.pumpWidget(MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: 'fa-IR',
        brightness: Brightness.light,
        child: Scaffold(body: Center(child: SizedBox(width: 320, child: LumoAlert(
          title: long,
          description: long,
          icon: const Icon(Icons.error_outline),
          dismissLabel: 'بستن',
          onDismiss: () {},
          actions: [LumoButton(size: LumoButtonSize.sm, onPressed: () {}, child: const Text('تلاش دوباره'))],
        )))),
      ),
    ));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'a RenderFlex overflow at 320 dp is a real bug');
    // The words are all there: the alert GREW instead of eating them.
    expect(find.text(long), findsNWidgets(2));
    expect(tester.getSize(find.byType(LumoAlert)).height, greaterThan(80));
  });

  testWidgets('Alert: a dismissible alert without a name is refused at construction, and so is a name without a control', (tester) async {
    // Built through a function so the expressions cannot be const-folded — a
    // const constructor's assert fires at COMPILE time, which is not a test.
    String name() => 'بستن';
    expect(() => LumoAlert(title: 'الف', onDismiss: () {}), throwsAssertionError);
    expect(() => LumoAlert(title: 'الف', dismissLabel: name()), throwsAssertionError);
  });
}
