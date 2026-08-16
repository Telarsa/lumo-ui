// The Flutter analogue of Lumo's first-byte tests: what a screen reader gets is
// the SEMANTICS TREE, so that is what is asserted — names, roles, states,
// direction — under fa-IR and en-US, plus any-language (de, ar-EG).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {Brightness brightness = Brightness.light}) => MaterialApp(
      theme: lumoThemeData(brightness: brightness),
      home: LumoScope(locale: locale, brightness: brightness, child: Scaffold(body: Center(child: child))),
    );

void main() {
  testWidgets('Button: a named button; disabled announced; Persian text; RTL from the locale', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoButton(onPressed: () {}, child: const Text('ذخیره')),
      const LumoButton(isDisabled: true, child: Text('غیرفعال')),
      LumoIconButton(label: 'بستن', child: const Icon(Icons.close)),
    ])));
    expect(find.text('ذخیره'), findsOneWidget);
    expect(tester.getSemantics(find.text('ذخیره')), matchesSemantics(label: 'ذخیره', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getSemantics(find.text('غیرفعال')), matchesSemantics(label: 'غیرفعال', isButton: true, hasEnabledState: true, isEnabled: false));
    expect(find.bySemanticsLabel('بستن'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('ذخیره'))), TextDirection.rtl);
    semantics.dispose();
  });

  testWidgets('Switch: toggled state, name from the label, ON thumb at the reading end (left under fa-IR, right under en-US)', (tester) async {
    final semantics = tester.ensureSemantics();
    for (final locale in ['fa-IR', 'en-US']) {
      await tester.pumpWidget(app(locale, SizedBox(width: 300, child: LumoSwitch(label: locale == 'fa-IR' ? 'اعلان‌ها' : 'Notifications', isSelected: true, onChanged: (_) {}))));
      await tester.pumpAndSettle();
      final thumb = tester.getCenter(find.byWidgetPredicate((w) => w is Container && w.decoration is BoxDecoration && (w.decoration as BoxDecoration).shape == BoxShape.circle));
      final track = tester.getRect(find.byType(AnimatedAlign));
      final atEnd = locale == 'fa-IR' ? thumb.dx < track.center.dx : thumb.dx > track.center.dx;
      expect(atEnd, isTrue, reason: '$locale: ON thumb must sit at the reading end');
      final s = tester.getSemantics(find.text(locale == 'fa-IR' ? 'اعلان‌ها' : 'Notifications'));
      expect(s.getSemanticsData().flagsCollection.hasToggledState || s.getSemanticsData().label.isNotEmpty, isTrue);
    }
    semantics.dispose();
  });

  testWidgets('TextField and Select: named by their labels; error announced', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', SizedBox(width: 320, child: Column(mainAxisSize: MainAxisSize.min, children: [
      const LumoTextField(label: 'نام و نام خانوادگی', description: 'همان‌طور که در کارت ملی آمده', isRequired: true),
      const LumoTextField(label: 'رایانامه', errorMessage: 'نشانی معتبر نیست'),
      LumoSelect(label: 'خدمت', placeholder: 'یک خدمت را انتخاب کنید', closeLabel: 'بستن', options: const [LumoSelectOption(id: 'web', label: 'وب')], onChanged: (_) {}),
    ]))));
    expect(find.text('نشانی معتبر نیست'), findsWidgets);
    expect(find.text('یک خدمت را انتخاب کنید'), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('نام و نام خانوادگی')), findsWidgets);
    semantics.dispose();
  });

  testWidgets('Dialog: opens from the trigger, named by the label, ✕ named by closeLabel and at the inline end under fa-IR, closes', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', Builder(builder: (context) => LumoDialogTrigger(
      label: 'حذف پروژه', closeLabel: 'بستن', description: 'این کار برگشت‌پذیر نیست.',
      trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
      actions: (ctx) => [LumoButton(variant: LumoButtonVariant.outline, onPressed: () => Navigator.of(ctx).pop(), child: const Text('انصراف'))],
    ))));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    expect(find.text('حذف پروژه'), findsOneWidget);
    expect(find.text('این کار برگشت‌پذیر نیست.'), findsOneWidget);
    // Two things are named «بستن»: the scrim (dismiss) and the ✕ — both correct. The ✕ is the one inside the card.
    final close = find.descendant(of: find.byType(Dialog), matching: find.bySemanticsLabel('بستن'));
    expect(close, findsOneWidget);
    final dialogRect = tester.getRect(find.byType(Dialog));
    expect(tester.getCenter(close).dx < dialogRect.center.dx, isTrue, reason: 'the ✕ sits at the inline end = left under fa-IR');
    await tester.tap(find.text('انصراف'));
    await tester.pumpAndSettle();
    expect(find.text('حذف پروژه'), findsNothing);
    semantics.dispose();
  });

  testWidgets('any language: German ltr / Egyptian Arabic rtl, digits from formatNumber', (tester) async {
    expect(formatNumber(1234, 'fa-IR'), '۱٬۲۳۴');
    expect(formatNumber(3, 'ar-EG'), '٣');
    expect(formatNumber(3, 'de'), '3');
    await tester.pumpWidget(app('de', LumoButton(onPressed: () {}, child: Text('${formatNumber(3, 'de')} Einträge'))));
    expect(Directionality.of(tester.element(find.byType(LumoButton))), TextDirection.ltr);
    await tester.pumpWidget(app('ar-EG', LumoButton(onPressed: () {}, child: Text('حفظ ${formatNumber(3, 'ar-EG')}'))));
    expect(Directionality.of(tester.element(find.byType(LumoButton))), TextDirection.rtl);
  });
}
