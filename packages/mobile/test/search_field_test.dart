import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 320, child: child)))),
    );

void main() {
  testWidgets('Search under fa-IR: one text field named by label; glyph at the start (right); ✕ only when filled, at the inline end (left), named by clearLabel', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <String>[];
    String? submitted;
    var cleared = 0;
    await tester.pumpWidget(app('fa-IR', LumoSearchField(label: 'جستجو', clearLabel: 'پاک کردن جستجو', placeholder: 'نام پروژه…', onChanged: changes.add, onSubmitted: (v) => submitted = v, onClear: () => cleared++)));
    expect(Directionality.of(tester.element(find.byType(TextField))), TextDirection.rtl);
    expect(find.text('جستجو'), findsOneWidget);
    expect(find.text('نام پروژه…'), findsOneWidget);
    // One node: the name first; while empty the placeholder follows it (Material's hint semantics merge in).
    final empty = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(empty.label, startsWith('جستجو'));
    expect(empty.label, contains('نام پروژه…'));
    expect(empty.flagsCollection.isTextField && empty.flagsCollection.isEnabled, isTrue);
    expect(empty.hasAction(SemanticsAction.tap) && empty.hasAction(SemanticsAction.focus), isTrue);
    // Empty: no ✕ at all.
    expect(find.bySemanticsLabel('پاک کردن جستجو'), findsNothing);
    final field = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(find.byIcon(Icons.search)).dx > field.center.dx, isTrue, reason: 'the glyph sits at the inline start = right under fa-IR');
    // Type: the ✕ appears, once, at the inline end = LEFT under fa-IR.
    await tester.enterText(find.byType(TextField), 'لومو');
    await tester.pump();
    expect(changes.last, 'لومو');
    final clear = find.bySemanticsLabel('پاک کردن جستجو');
    expect(clear, findsOneWidget);
    expect(tester.getSemantics(clear), matchesSemantics(label: 'پاک کردن جستجو', isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, isFocusable: true, hasFocusAction: true));
    expect(tester.getCenter(clear).dx < field.center.dx, isTrue, reason: 'the ✕ sits at the inline end = left under fa-IR');
    // The search key submits.
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pump();
    expect(submitted, 'لومو');
    // ✕ clears: empty again, onChanged(''), onClear, ✕ gone.
    await tester.tap(clear);
    await tester.pump();
    expect(changes.last, '');
    expect(cleared, 1);
    expect(find.bySemanticsLabel('پاک کردن جستجو'), findsNothing);
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, '');
    semantics.dispose();
  });

  testWidgets('Search under en-US: glyph at the left, ✕ at the right; showLabel false keeps the name; controlled value; disabled', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoSearchField(label: 'Search', clearLabel: 'Clear search', showLabel: false, value: 'lumo')));
    expect(find.text('Search'), findsNothing, reason: 'showLabel: false hides the visible row');
    expect(tester.getSemantics(find.byType(TextField)), matchesSemantics(label: 'Search', isTextField: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, hasFocusAction: true));
    final field = tester.getRect(find.byType(TextField));
    expect(tester.getCenter(find.byIcon(Icons.search)).dx < field.center.dx, isTrue, reason: 'start = left under en-US');
    final clear = find.bySemanticsLabel('Clear search');
    expect(clear, findsOneWidget);
    expect(tester.getCenter(clear).dx > field.center.dx, isTrue, reason: 'end = right under en-US');
    // The value is shown; the ✕ named exactly once.
    expect(find.text('lumo'), findsOneWidget);
    await tester.pumpWidget(app('en-US', const LumoSearchField(label: 'Search', clearLabel: 'Clear search', value: 'lumo', isDisabled: true, errorMessage: 'خطا')));
    expect(tester.getSemantics(find.byType(TextField)), matchesSemantics(label: 'Search', hint: 'خطا', isTextField: true, hasEnabledState: true, isEnabled: false, isReadOnly: true));
    expect(find.text('خطا'), findsOneWidget);
    semantics.dispose();
  });
}
