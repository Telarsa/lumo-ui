import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

LumoOtpCellLabel cellLabel(String locale) => (i, n) => 'رقم ${formatNumber(i + 1, locale)} از ${formatNumber(n, locale)}';

Finder cell(int i) => find.byKey(ValueKey('lumo-otp-cell-$i'));

void main() {
  testWidgets('OTP under fa-IR: one text field named by label; cells left→right; Persian digits shown, ASCII reported', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <String>[];
    String? completed;
    await tester.pumpWidget(app('fa-IR', LumoOtpField(label: 'کد پیامک‌شده', cellLabel: cellLabel('fa-IR'), onChanged: changes.add, onCompleted: (v) => completed = v)));
    expect(Directionality.of(tester.element(find.text('کد پیامک‌شده'))), TextDirection.rtl);
    // The row is an LTR island: cell 0 is LEFT of cell 5 even under fa-IR.
    expect(tester.getCenter(cell(0)).dx < tester.getCenter(cell(5)).dx, isTrue, reason: 'a code reads left→right in every script');
    expect(Directionality.of(tester.element(cell(0))), TextDirection.ltr);
    // One text field, named by the label.
    final field = tester.getSemantics(find.byType(TextField));
    expect(field, matchesSemantics(label: 'کد پیامک‌شده', isTextField: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, hasFocusAction: true));
    // Every cell named by cellLabel, exactly once each.
    for (var i = 0; i < 6; i++) {
      expect(find.bySemanticsLabel('رقم ${formatNumber(i + 1, 'fa-IR')} از ۶'), findsOneWidget);
    }
    // ASCII typed (as autofill writes it): shown as Persian digits, reported as ASCII, completed once.
    await tester.enterText(find.byType(TextField), '123456');
    await tester.pump();
    for (final d in ['۱', '۲', '۳', '۴', '۵', '۶']) {
      expect(find.text(d), findsOneWidget);
    }
    expect(find.text('1'), findsNothing);
    expect(changes.last, '123456');
    expect(completed, '123456');
    // The field's own value is the localised string; the semantics value follows it.
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().value, '۱۲۳۴۵۶');
    semantics.dispose();
  });

  testWidgets('OTP: Persian digits typed (with noise) come back as ASCII, truncated to length; onCompleted fires once', (tester) async {
    var completions = 0;
    final changes = <String>[];
    await tester.pumpWidget(app('fa-IR', LumoOtpField(label: 'کد', length: 4, cellLabel: cellLabel('fa-IR'), onChanged: changes.add, onCompleted: (_) => completions++)));
    await tester.enterText(find.byType(TextField), 'کد شما: ۱۲');
    expect(changes.last, '12');
    expect(completions, 0);
    await tester.enterText(find.byType(TextField), '۱۲۳۴۵۶');
    expect(changes.last, '1234');
    expect(completions, 1);
    await tester.enterText(find.byType(TextField), '۱۲۳۴');
    expect(completions, 1, reason: 'already complete: no second onCompleted');
  });

  testWidgets('OTP under en-US: ASCII digits shown; controlled value; disabled and error announced', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoOtpField(label: 'Code', value: '42', cellLabel: (i, n) => 'Digit ${formatNumber(i + 1, 'en-US')} of ${formatNumber(n, 'en-US')}', errorMessage: 'کد نادرست است', isDisabled: true)));
    expect(find.text('4'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(tester.getCenter(cell(0)).dx < tester.getCenter(cell(5)).dx, isTrue);
    expect(find.text('کد نادرست است'), findsOneWidget);
    expect(tester.getSemantics(find.byType(TextField)), matchesSemantics(label: 'Code', hint: 'کد نادرست است', isTextField: true, hasEnabledState: true, isEnabled: false, isReadOnly: true));
    expect(find.bySemanticsLabel('Digit 1 of 6'), findsOneWidget);
    semantics.dispose();
  });
}
