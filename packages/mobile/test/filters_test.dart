// Filters: the bar is a named region whose chips announce their own selected
// state, the count goes through `formatNumber` (۳, not 3) inside the caller's
// sentence, clear-all is named, and the sheet edits the same choices live.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

// 480 rather than a phone's 360: the bar is a HORIZONTAL scroller, and a
// Flutter `ListView` builds only what is on screen — a chip scrolled out of
// view is not in the tree to assert against. The width is the test's, not the
// widget's; the mirroring assertions below are what actually depend on it.
Widget app(String locale, Widget child, {double width = 480}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: width, child: child)))),
    );

const groups = [
  LumoFilterGroup(
    id: 'quality',
    label: 'کیفیت',
    options: [
      LumoFilterOption(id: 'rating', label: '۴+ امتیاز', isPinned: true),
      LumoFilterOption(id: 'fast', label: 'پاسخ سریع', isPinned: true),
      LumoFilterOption(id: 'verified', label: 'فقط تأییدشده'),
    ],
  ),
  LumoFilterGroup(
    id: 'sort',
    label: 'مرتب‌سازی',
    isMultiple: false,
    options: [
      LumoFilterOption(id: 'near', label: 'نزدیک‌ترین'),
      LumoFilterOption(id: 'top', label: 'بیشترین امتیاز'),
    ],
  ),
];

class Host extends StatefulWidget {
  const Host({super.key, required this.initial, required this.locale, this.extra});
  final Map<String, List<String>> initial;
  final String locale;
  final WidgetBuilder? extra;

  @override
  State<Host> createState() => HostState();
}

class HostState extends State<Host> {
  late Map<String, List<String>> values = {for (final e in widget.initial.entries) e.key: List<String>.of(e.value)};

  @override
  Widget build(BuildContext context) => LumoFilters(
        label: 'فیلترهای نتایج',
        groups: groups,
        values: values,
        editLabel: 'فیلترها',
        closeLabel: 'بستن',
        clearAllLabel: 'پاک کردن همه',
        applyLabel: 'نمایش نتایج',
        countLabel: (count) => '$count فیلتر',
        extra: widget.extra,
        onChanged: (next) => setState(() => values = next),
      );
}

void main() {
  testWidgets('Filters fa-IR: a named region; pinned chips are on the bar while OFF; toggling one adds the count and the named clear-all', (tester) async {
    final semantics = tester.ensureSemantics();
    final host = GlobalKey<HostState>();
    await tester.pumpWidget(app('fa-IR', Host(key: host, initial: const {}, locale: 'fa-IR')));

    // The bar names itself; the control that opens the sheet is named.
    expect(find.bySemanticsLabel('فیلترهای نتایج'), findsOneWidget);
    expect(find.text('فیلترها'), findsOneWidget);
    // Pinned options are visible before anything is chosen — a filter a reader
    // cannot see is a filter a reader will not use.
    expect(find.text('۴+ امتیاز'), findsOneWidget);
    expect(find.text('پاسخ سریع'), findsOneWidget);
    // Unpinned ones are not on the bar yet.
    expect(find.text('فقط تأییدشده'), findsNothing);
    // Nothing is on, so there is no count and nothing to clear.
    expect(find.text('۰ فیلتر'), findsNothing);
    expect(find.text('پاک کردن همه'), findsNothing);

    // A bar chip is a TOGGLE that announces its own state.
    expect(tester.getSemantics(find.bySemanticsLabel('۴+ امتیاز')), containsSemantics(label: '۴+ امتیاز', isButton: true, isSelected: false));
    await tester.tap(find.bySemanticsLabel('۴+ امتیاز'));
    await tester.pumpAndSettle();
    expect(host.currentState!.values['quality'], ['rating']);
    expect(tester.getSemantics(find.bySemanticsLabel('۴+ امتیاز')), containsSemantics(isSelected: true));
    // The count: through `formatNumber`, inside the caller's sentence.
    expect(find.text('۱ فیلتر'), findsOneWidget);
    expect(find.text('پاک کردن همه'), findsOneWidget);

    await tester.tap(find.text('پاک کردن همه'));
    await tester.pumpAndSettle();
    expect(host.currentState!.values['quality'], isEmpty);
    expect(find.textContaining('فیلتر').evaluate().where((e) => (e.widget as Text).data == '۱ فیلتر'), isEmpty);
    semantics.dispose();
  });

  testWidgets('Filters fa-IR: the sheet edits the same choices live — headers per group, an exclusive group replaces, and `extra` reaches the sheet', (tester) async {
    final semantics = tester.ensureSemantics();
    final host = GlobalKey<HostState>();
    await tester.pumpWidget(app('fa-IR', Host(
      key: host,
      initial: const {},
      locale: 'fa-IR',
      extra: (context) => const LumoSwitch(label: 'فقط دارای گارانتی'),
    ), width: 800));

    await tester.tap(find.text('فیلترها'));
    await tester.pumpAndSettle();
    // The route is the bar's name; each group is a header; `extra` is there.
    expect(find.text('کیفیت'), findsOneWidget);
    expect(tester.getSemantics(find.text('مرتب‌سازی')), containsSemantics(label: 'مرتب‌سازی', isHeader: true));
    expect(find.bySemanticsLabel('فقط دارای گارانتی'), findsOneWidget, reason: 'the Khroos filter sheet also holds controls that are not a set of options');

    // A multiple group accumulates. `.last` is the sheet's copy of a chip that
    // is also on the bar — the route is built above the bar.
    await tester.tap(find.bySemanticsLabel('فقط تأییدشده'));
    await tester.tap(find.bySemanticsLabel('پاسخ سریع').last);
    await tester.pumpAndSettle();
    expect(host.currentState!.values['quality'], ['verified', 'fast']);

    // An exclusive group replaces rather than accumulates.
    await tester.tap(find.bySemanticsLabel('نزدیک‌ترین'));
    await tester.pumpAndSettle();
    expect(host.currentState!.values['sort'], ['near']);
    await tester.tap(find.bySemanticsLabel('بیشترین امتیاز'));
    await tester.pumpAndSettle();
    expect(host.currentState!.values['sort'], ['top'], reason: 'a sort order holds exactly one choice');

    // The primary is a DISMISSAL: the choices already applied.
    await tester.tap(find.text('نمایش نتایج'));
    await tester.pumpAndSettle();
    expect(find.text('کیفیت'), findsNothing);
    expect(find.text('۳ فیلتر'), findsOneWidget);
    // A chosen unpinned option is now on the bar.
    expect(find.text('فقط تأییدشده'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Filters en-US: the same bar, Latin digits, mirrored — the edit control is the leftmost', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', Host(initial: const {'quality': ['rating']}, locale: 'en-US')));
    expect(find.text('1 فیلتر'), findsOneWidget, reason: 'the count is in the reader’s digits — en-US gets 1');
    final bar = tester.getRect(find.byType(LumoFilters));
    expect(tester.getCenter(find.text('فیلترها')).dx < bar.center.dx, isTrue, reason: 'the row starts at the reading start = the left under en-US');

    await tester.pumpWidget(app('fa-IR', Host(initial: const {'quality': ['rating']}, locale: 'fa-IR')));
    expect(find.text('۱ فیلتر'), findsOneWidget);
    expect(tester.getCenter(find.text('فیلترها')).dx > tester.getRect(find.byType(LumoFilters)).center.dx, isTrue, reason: 'mirrored: the right under fa-IR');
    semantics.dispose();
  });

  testWidgets('Filters: a bar with no groups is refused at build', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoFilters(
      label: 'x',
      groups: const [],
      values: const {},
      editLabel: 'a',
      closeLabel: 'b',
      clearAllLabel: 'c',
      applyLabel: 'd',
      countLabel: (n) => n,
    )));
    expect(tester.takeException(), isAssertionError);
  });
}
