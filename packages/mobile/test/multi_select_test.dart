// MultiSelect: what a screen reader gets is the SEMANTICS TREE — names, roles,
// state, direction — under fa-IR and en-US, plus the geometry that mirrors.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {double width = 360}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: width, child: child)))),
    );

const options = [
  LumoMultiSelectOption(id: 'bargh', label: 'برق'),
  LumoMultiSelectOption(id: 'loole', label: 'لوله‌کشی'),
  LumoMultiSelectOption(id: 'naghashi', label: 'نقاشی'),
];

/// The field under fa-IR, controlled by the host's own state.
class Host extends StatefulWidget {
  const Host({super.key, this.values = const [], this.isSearchable = true, this.maxChips, this.isDisabled = false, this.errorMessage, this.onChanged});
  final List<String> values;
  final bool isSearchable;
  final int? maxChips;
  final bool isDisabled;
  final String? errorMessage;
  final ValueChanged<List<String>>? onChanged;

  @override
  State<Host> createState() => _HostState();
}

class _HostState extends State<Host> {
  late List<String> _values = widget.values;

  @override
  Widget build(BuildContext context) => LumoMultiSelect(
        label: 'مهارت‌ها',
        placeholder: 'انتخاب کنید',
        options: options,
        values: _values,
        onChanged: (v) {
          setState(() => _values = v);
          widget.onChanged?.call(v);
        },
        closeLabel: 'بستن',
        confirmLabel: 'تأیید',
        clearAllLabel: 'پاک کردن همه',
        countLabel: (n) => '$n مورد انتخاب شده',
        removeLabel: (l) => 'حذف $l',
        isSearchable: widget.isSearchable,
        searchLabel: widget.isSearchable ? 'جست‌وجوی مهارت' : null,
        emptyLabel: widget.isSearchable ? 'چیزی پیدا نشد' : null,
        description: 'هر چند مورد که می‌خواهید',
        errorMessage: widget.errorMessage,
        maxChips: widget.maxChips,
        isDisabled: widget.isDisabled,
      );
}

void main() {
  testWidgets('MultiSelect fa-IR: named ONCE, trigger announces the placeholder, sheet is Lumo\'s (no English route name), checkbox rows toggle, chips carry named remove buttons', (tester) async {
    final semantics = tester.ensureSemantics();
    final seen = <List<String>>[];
    await tester.pumpWidget(app('fa-IR', Host(onChanged: seen.add)));

    // Closed and empty: ONE node named «مهارت‌ها», a button, valued by the placeholder.
    expect(find.bySemanticsLabel('مهارت‌ها'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('مهارت‌ها')), containsSemantics(label: 'مهارت‌ها', value: 'انتخاب کنید', isButton: true, isEnabled: true, hint: 'هر چند مورد که می‌خواهید'));
    expect(Directionality.of(tester.element(find.text('مهارت‌ها'))), TextDirection.rtl);

    await tester.tap(find.text('انتخاب کنید'));
    await tester.pumpAndSettle();
    // Lumo's own sheet route — Material's would name itself in English.
    expect(find.bySemanticsLabel('Dialog'), findsNothing);
    expect(find.bySemanticsLabel(RegExp('Dismiss')), findsNothing);
    // The sheet's ✕ is Lumo's, named by closeLabel (a LumoIconButton merges name + role into ONE node).
    expect(find.byWidgetPredicate((w) => w is LumoIconButton && w.label == 'بستن'), findsOneWidget);
    // Nothing chosen yet: the footer says so, «پاک کردن همه» is present but dead.
    expect(find.text('۰ مورد انتخاب شده'), findsOneWidget);
    expect(find.bySemanticsLabel('پاک کردن همه'), findsOneWidget);

    // The options are checkbox rows, announced unchecked.
    expect(tester.getSemantics(find.bySemanticsLabel('برق')), containsSemantics(label: 'برق', hasCheckedState: true, isChecked: false));
    await tester.tap(find.text('برق'));
    await tester.pumpAndSettle();
    expect(seen.last, ['bargh']);
    expect(tester.getSemantics(find.bySemanticsLabel('برق')), containsSemantics(isChecked: true));
    // Twice, deliberately: the sheet's footer, and the trigger BEHIND it — the
    // count is the field's own summary, it does not wait for the sheet to close.
    expect(find.text('۱ مورد انتخاب شده'), findsNWidgets(2));

    // Confirm closes; the chip is under the trigger with a NAMED remove button.
    await tester.tap(find.text('تأیید'));
    await tester.pumpAndSettle();
    expect(find.text('۱ مورد انتخاب شده'), findsOneWidget); // now the trigger's own summary
    expect(tester.getSemantics(find.bySemanticsLabel('حذف برق')), containsSemantics(label: 'حذف برق', isButton: true));
    // The chip's own text is announced too — as the chip, not as a second copy of the field's name.
    expect(find.bySemanticsLabel('برق'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('حذف برق'));
    await tester.pumpAndSettle();
    expect(seen.last, isEmpty);
    expect(find.bySemanticsLabel('حذف برق'), findsNothing);
    semantics.dispose();
  });

  testWidgets('MultiSelect fa-IR: the search box filters (Arabic ك folds to Persian ک), the empty message is announced, clear-all empties, RTL geometry', (tester) async {
    final semantics = tester.ensureSemantics();
    final seen = <List<String>>[];
    await tester.pumpWidget(app('fa-IR', Host(values: const ['bargh', 'loole'], onChanged: seen.add)));

    // Two chips; the first sits at the reading START = right of the field's centre.
    final field = tester.getRect(find.byType(LumoMultiSelect));
    expect(tester.getCenter(find.bySemanticsLabel('حذف برق')).dx, greaterThan(field.center.dx));

    await tester.tap(find.text('۲ مورد انتخاب شده'));
    await tester.pumpAndSettle();
    // The footer count sits at the reading START of its row = the right, under fa-IR.
    final footer = tester.getRect(find.text('۲ مورد انتخاب شده').last);
    expect(footer.center.dx, greaterThan(tester.getCenter(find.text('تأیید')).dx));

    // The chips below still carry their own text, so the option list is the scope.
    Finder inList(String text) => find.descendant(of: find.byType(ListView), matching: find.text(text));
    await tester.enterText(find.byType(TextField), 'لوله');
    await tester.pumpAndSettle();
    expect(inList('لوله‌کشی'), findsOneWidget);
    expect(inList('برق'), findsNothing);

    // The fold: Arabic kaf ك in the query matches the Persian keheh ک in «لوله‌کشی».
    await tester.enterText(find.byType(TextField), 'لوله‌كشي');
    await tester.pumpAndSettle();
    expect(inList('لوله‌کشی'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'زززز');
    await tester.pumpAndSettle();
    expect(find.text('چیزی پیدا نشد'), findsOneWidget);

    await tester.tap(find.text('پاک کردن همه'));
    await tester.pumpAndSettle();
    expect(seen.last, isEmpty);
    expect(find.text('۰ مورد انتخاب شده'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('MultiSelect en-US: LTR geometry, Latin digits in the count, maxChips collapses the rest into a digits-only chip', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoMultiSelect(
      label: 'Skills',
      placeholder: 'Choose',
      options: const [
        LumoMultiSelectOption(id: 'a', label: 'Wiring'),
        LumoMultiSelectOption(id: 'b', label: 'Plumbing'),
        LumoMultiSelectOption(id: 'c', label: 'Painting'),
      ],
      values: const ['a', 'b', 'c'],
      onChanged: (_) {},
      closeLabel: 'Close',
      confirmLabel: 'Done',
      clearAllLabel: 'Clear all',
      countLabel: (n) => '$n selected',
      removeLabel: (l) => 'Remove $l',
      maxChips: 2,
    )));
    expect(Directionality.of(tester.element(find.text('Skills'))), TextDirection.ltr);
    expect(find.text('3 selected'), findsOneWidget);
    // Two chips, then a «+1» chip: digits only, no word in any language.
    expect(find.bySemanticsLabel('Remove Wiring'), findsOneWidget);
    expect(find.bySemanticsLabel('Remove Plumbing'), findsOneWidget);
    expect(find.bySemanticsLabel('Remove Painting'), findsNothing);
    expect(find.text('+1'), findsOneWidget);
    // The first chip sits at the reading START = left of the field's centre.
    final field = tester.getRect(find.byType(LumoMultiSelect));
    expect(tester.getCenter(find.bySemanticsLabel('Remove Wiring')).dx, lessThan(field.center.dx));
    semantics.dispose();
  });

  testWidgets('MultiSelect: invalid announces the error and takes the critical border; disabled does not open; a searchable field without its strings is refused', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const Host(errorMessage: 'دست‌کم یک مورد لازم است')));
    expect(find.text('دست‌کم یک مورد لازم است'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('مهارت‌ها')).getSemanticsData().hint, contains('دست‌کم یک مورد لازم است'));
    final c = LumoScope.of(tester.element(find.text('مهارت‌ها'))).colours;
    final box = tester.widget<Container>(find.ancestor(of: find.text('انتخاب کنید'), matching: find.byType(Container)).first);
    expect(((box.decoration! as BoxDecoration).border! as Border).top.color, c.critical);

    await tester.pumpWidget(app('fa-IR', const Host(isDisabled: true)));
    expect(tester.getSemantics(find.bySemanticsLabel('مهارت‌ها')), containsSemantics(isEnabled: false));
    await tester.tap(find.text('انتخاب کنید'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('تأیید'), findsNothing);

    // Searchable without a searchLabel/emptyLabel is refused at construction.
    expect(
      () => LumoMultiSelect(label: 'x', options: options, values: const [], closeLabel: 'a', confirmLabel: 'b', clearAllLabel: 'c', countLabel: (n) => n, removeLabel: (l) => l, isSearchable: true),
      throwsAssertionError,
    );
    expect(
      () => LumoMultiSelect(label: 'x', options: options, values: const [], closeLabel: 'a', confirmLabel: 'b', clearAllLabel: 'c', countLabel: (n) => n, removeLabel: (l) => l, maxChips: 0),
      throwsAssertionError,
    );
    semantics.dispose();
  });

  testWidgets('MultiSelect: the sheet footer SHEDS its row at 320 dp instead of overflowing', (tester) async {
    // Measured before the fix: `A RenderFlex overflowed by 36 pixels on the
    // right` with these labels at this width.
    await tester.pumpWidget(app('fa-IR', LumoMultiSelect(
      label: 'دسته‌بندی‌های محصول',
      closeLabel: 'بستن',
      confirmLabel: 'تأیید و بستن پنجره',
      clearAllLabel: 'پاک کردن همهٔ انتخاب‌ها',
      countLabel: (c) => '$c مورد انتخاب شده است',
      removeLabel: (l) => 'حذف $l',
      options: const [LumoMultiSelectOption(id: 'a', label: 'الف')],
      values: const ['a'],
    ), width: 320));
    await tester.tap(find.text('۱ مورد انتخاب شده است'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow');
    // Nothing was truncated to buy the fit: both button labels are whole.
    expect(find.text('پاک کردن همهٔ انتخاب‌ها'), findsOneWidget);
    expect(find.text('تأیید و بستن پنجره'), findsOneWidget);
    // And the count moved to a line of its own, above the actions.
    // `.last` is the FOOTER copy: the trigger paints the same sentence.
    expect(tester.getCenter(find.text('۱ مورد انتخاب شده است').last).dy, lessThan(tester.getCenter(find.text('تأیید و بستن پنجره')).dy));
  });

  testWidgets('MultiSelect: short labels still share one row; required and invalid are STATES', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', LumoMultiSelect(
      label: 'Tags',
      closeLabel: 'Close',
      confirmLabel: 'Done',
      clearAllLabel: 'Clear',
      countLabel: (c) => '$c selected',
      removeLabel: (l) => 'Remove $l',
      options: const [LumoMultiSelectOption(id: 'a', label: 'Alpha')],
      values: const ['a'],
      isRequired: true,
      errorMessage: 'Pick at least two',
    ), width: 360));
    expect(find.text('Tags *'), findsOneWidget);
    final trigger = find.bySemanticsLabel('Tags');
    final data = tester.getSemantics(trigger).getSemanticsData();
    expect(data.flagsCollection.isRequired, isTrue);
    expect(data.validationResult, SemanticsValidationResult.invalid);
    await tester.tap(trigger);
    await tester.pumpAndSettle();
    // One row: the count on the left of the actions, not above them.
    expect(tester.getCenter(find.text('1 selected').last).dy, closeTo(tester.getCenter(find.text('Done')).dy, 1));
    semantics.dispose();
  });

  testWidgets('MultiSelect: the value chip\'s remove ✕ inherits whatever LumoChip gives it', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoMultiSelect(
      label: 'برچسب‌ها',
      closeLabel: 'بستن',
      confirmLabel: 'تأیید',
      clearAllLabel: 'پاک',
      countLabel: (c) => '$c مورد',
      removeLabel: (l) => 'حذف $l',
      options: const [LumoMultiSelectOption(id: 'a', label: 'الف')],
      values: const ['a'],
    )));
    // The chip is `chip.dart`'s widget: this asserts the WIRING (a named remove
    // button per chosen value), not the chip's own geometry, which that family
    // owns and is where the ✕'s target is decided.
    expect(find.bySemanticsLabel('حذف الف'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('حذف الف')), containsSemantics(isButton: true, hasEnabledState: true, isEnabled: true));
    semantics.dispose();
  });
}
