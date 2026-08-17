import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {double width = 360, double height = 400}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: Scaffold(body: Center(child: SizedBox(width: width, height: height, child: child))),
      ),
    );

/// Three columns of 160 px = 480 px of table in a 360 px box: it must scroll.
List<LumoTableColumn> columns(String locale) => [
      LumoTableColumn(id: 'client', header: locale == 'fa-IR' ? 'مشتری' : 'Client', width: 160),
      LumoTableColumn(id: 'zone', header: locale == 'fa-IR' ? 'منطقه' : 'Zone', width: 160),
      LumoTableColumn(id: 'amount', header: locale == 'fa-IR' ? 'مبلغ' : 'Amount', width: 160, isNumeric: true),
    ];

final faRows = [
  LumoTableRowData(id: 'r1', cells: [const LumoTableCell('خانم موسوی'), const LumoTableCell('سعادت‌آباد'), LumoTableCell(formatNumber(1200000, 'fa-IR'))]),
  LumoTableRowData(id: 'r2', cells: [const LumoTableCell('آقای صالحی'), const LumoTableCell('شهرک غرب'), LumoTableCell(formatNumber(380000, 'fa-IR'))]),
];

void main() {
  testWidgets('Table: named table role, column headers and cells; the caption is its own node; every announced string once', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoTable(
      label: 'تراکنش‌های اخیر',
      caption: 'مبالغ به تومان است.',
      columns: columns('fa-IR'),
      rows: faRows,
    )));

    final table = tester.getSemantics(find.bySemanticsLabel('تراکنش‌های اخیر')).getSemanticsData();
    expect(table.role, SemanticsRole.table);
    expect(table.label, 'تراکنش‌های اخیر');
    // The name is on the table node and nowhere else — the scroller around it
    // is deliberately anonymous.
    expect(find.bySemanticsLabel('تراکنش‌های اخیر'), findsOneWidget);

    expect(tester.getSemantics(find.bySemanticsLabel('مشتری')).getSemanticsData().role, SemanticsRole.columnHeader);
    expect(tester.getSemantics(find.bySemanticsLabel('مبلغ')).getSemanticsData().role, SemanticsRole.columnHeader);
    expect(tester.getSemantics(find.bySemanticsLabel('خانم موسوی')).getSemanticsData().role, SemanticsRole.cell);
    expect(tester.getSemantics(find.bySemanticsLabel(formatNumber(1200000, 'fa-IR'))).getSemanticsData().role, SemanticsRole.cell);

    // The caption reads as its own node, once.
    expect(find.text('مبالغ به تومان است.'), findsOneWidget);
    expect(find.bySemanticsLabel('مبالغ به تومان است.'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Table: a numeric column is an LTR island inside an RTL table; a word column is not', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoTable(label: 'تراکنش‌های اخیر', columns: columns('fa-IR'), rows: faRows)));
    // The table itself reads right-to-left…
    expect(Directionality.of(tester.element(find.text('خانم موسوی'))), TextDirection.rtl);
    expect(Directionality.of(tester.element(find.text('مشتری'))), TextDirection.rtl);
    // …and the money cell is its own left-to-right run, digits still Persian.
    final amount = find.text(formatNumber(1200000, 'fa-IR'));
    expect(Directionality.of(tester.element(amount)), TextDirection.ltr);
    expect(tester.widget<Text>(amount).data, '۱٬۲۰۰٬۰۰۰');
    // The HEADER of a numeric column is a word and stays in the paragraph's direction.
    expect(Directionality.of(tester.element(find.text('مبلغ'))), TextDirection.rtl);
  });

  testWidgets('Table: RTL geometry — the first column sits at the reading start (right under fa-IR, left under en-US)', (tester) async {
    for (final (locale, firstAtRight) in [('fa-IR', true), ('en-US', false)]) {
      await tester.pumpWidget(app(locale, LumoTable(
        label: locale == 'fa-IR' ? 'تراکنش‌های اخیر' : 'Recent transactions',
        columns: columns(locale),
        rows: locale == 'fa-IR'
            ? faRows
            : [
                LumoTableRowData(id: 'r1', cells: [const LumoTableCell('Mousavi'), const LumoTableCell('Saadatabad'), LumoTableCell(formatNumber(1200000, 'en-US'))]),
              ],
      )));
      final box = tester.getRect(find.byType(LumoTable));
      final first = tester.getCenter(find.text(locale == 'fa-IR' ? 'مشتری' : 'Client'));
      final last = tester.getCenter(find.text(locale == 'fa-IR' ? 'مبلغ' : 'Amount'));
      if (firstAtRight) {
        expect(first.dx > box.center.dx, isTrue, reason: 'the first column starts at the RIGHT under fa-IR');
        expect(last.dx < first.dx, isTrue, reason: 'later columns run leftwards under fa-IR');
      } else {
        expect(first.dx < box.center.dx, isTrue, reason: 'the first column starts at the LEFT under en-US');
        expect(last.dx > first.dx, isTrue, reason: 'later columns run rightwards under en-US');
      }
    }
  });

  testWidgets('Table: 480 px of columns in a 360 px box scrolls inside the table and never widens or moves the page', (tester) async {
    final page = ScrollController();
    final inner = ScrollController();
    await tester.pumpWidget(app('fa-IR', ListView(
      controller: page,
      children: [
        const SizedBox(height: 40),
        LumoTable(label: 'تراکنش‌های اخیر', columns: columns('fa-IR'), rows: faRows, controller: inner),
        const SizedBox(height: 900),
      ],
    )));
    // The table is exactly as wide as the box it was given — not 480.
    expect(tester.getSize(find.byType(LumoTable)).width, 360);
    expect(page.offset, 0);
    expect(inner.offset, 0);

    // An inline drag on the table moves the TABLE and leaves the page alone.
    // +120 and not −120: under fa-IR the scroller's axis is `AxisDirection.left`
    // (Flutter derives it from `Directionality`), so the offset grows when the
    // content is dragged towards the right — the later columns live off to the
    // left. Nothing in `table.dart` had to be told this.
    await tester.drag(find.text('مشتری'), const Offset(120, 0));
    await tester.pumpAndSettle();
    expect(inner.offset, greaterThan(0), reason: 'the table scrolled inside its own container');
    expect(page.offset, 0, reason: 'the page did not move');
    expect(tester.takeException(), isNull);
    page.dispose();
    inner.dispose();
  });

  testWidgets('Table: a pinned first column is drawn twice and announced once, and sits at the reading start', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoTable(
      label: 'تراکنش‌های اخیر',
      columns: columns('fa-IR'),
      rows: faRows,
      pinFirstColumn: true,
    )));
    // Two painted copies…
    expect(find.text('خانم موسوی'), findsNWidgets(2));
    // …one announced node: the frozen copy is `ExcludeSemantics`.
    expect(find.bySemanticsLabel('خانم موسوی'), findsOneWidget);
    // The frozen copy is at the inline start = right under fa-IR.
    final box = tester.getRect(find.byType(LumoTable));
    expect(tester.getCenter(find.text('خانم موسوی').last).dx > box.center.dx, isTrue);
    // The two copies sit on the same line: pinning only works because every
    // data row is exactly `rowHeight` tall, whatever is in the other columns.
    final scrolled = tester.getRect(find.text('خانم موسوی').first);
    final frozen = tester.getRect(find.text('خانم موسوی').last);
    expect(frozen.top, scrolled.top);
    expect(frozen.height, scrolled.height);
    semantics.dispose();
  });

  testWidgets('Table: collapseBelow stacks rows into cards — no header row, each cell named by its column and valued by its datum', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoTable(
      label: 'تراکنش‌های اخیر',
      columns: columns('fa-IR'),
      rows: faRows,
      collapseBelow: 400,
    ), width: 320));

    final table = tester.getSemantics(find.bySemanticsLabel('تراکنش‌های اخیر')).getSemanticsData();
    expect(table.role, SemanticsRole.table, reason: 'collapsing changes the layout, not the data');
    // No header ROW: the column name is drawn once per row instead.
    expect(find.text('مشتری'), findsNWidgets(2));

    final cell = tester.getSemantics(find.text('خانم موسوی')).getSemanticsData();
    expect(cell.role, SemanticsRole.cell);
    expect(cell.label, 'مشتری');
    expect(cell.value, 'خانم موسوی');
    // The numeric island survives the collapse.
    expect(Directionality.of(tester.element(find.text(formatNumber(1200000, 'fa-IR')))), TextDirection.ltr);
    // Above the threshold the same table is a grid again.
    await tester.pumpWidget(app('fa-IR', LumoTable(
      label: 'تراکنش‌های اخیر',
      columns: columns('fa-IR'),
      rows: faRows,
      collapseBelow: 400,
    ), width: 420));
    expect(find.text('مشتری'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Table: empty body shows the caller\'s message; a drawn cell announces its value, not its widget; malformed rows are refused', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoTable(
      label: 'تراکنش‌های اخیر',
      columns: columns('fa-IR'),
      rows: const [],
      emptyLabel: 'تراکنشی ثبت نشده است.',
    )));
    expect(find.text('تراکنشی ثبت نشده است.'), findsOneWidget);

    await tester.pumpWidget(app('fa-IR', LumoTable(
      label: 'تراکنش‌های اخیر',
      columns: columns('fa-IR'),
      rows: [
        LumoTableRowData(id: 'r1', cells: [
          const LumoTableCell('خانم موسوی'),
          LumoTableCell.widget(value: 'پرداخت‌شده', child: const LumoBadge(label: 'پرداخت')),
          LumoTableCell(formatNumber(1200000, 'fa-IR')),
        ]),
      ],
    )));
    expect(tester.getSemantics(find.bySemanticsLabel('پرداخت‌شده')).getSemanticsData().role, SemanticsRole.cell);
    // The drawn badge is silent: the cell is heard once, as `پرداخت‌شده`.
    expect(find.bySemanticsLabel('پرداخت'), findsNothing);
    semantics.dispose();
  });

  testWidgets('Table: a row with the wrong number of cells is an assertion, not a silent misalignment', (tester) async {
    await tester.pumpWidget(app('fa-IR', LumoTable(
      label: 'تراکنش‌های اخیر',
      columns: columns('fa-IR'),
      rows: [LumoTableRowData(id: 'r1', cells: const [LumoTableCell('خانم موسوی')])],
    )));
    expect(tester.takeException(), isAssertionError);
  });
}
