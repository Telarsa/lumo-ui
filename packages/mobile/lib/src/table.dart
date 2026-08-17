import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'scope.dart';
import 'tokens.g.dart';

/// Where a column's content sits in its cell. The web spells this with
/// `text-start` on the table root and a class per exception
/// (`table.variants.ts` line 17: "`text-align` inherits; `text-left` in one
/// cell is the classic defect"); on Flutter it is a value, so the defect is
/// unspellable — there is no `left`.
enum LumoTableAlign { start, end, center }

/// One column — the web `Column`.
class LumoTableColumn {
  const LumoTableColumn({
    required this.id,
    required this.header,
    this.align,
    this.isNumeric = false,
    this.width = 120,
  });

  /// Stable identity. Not announced.
  final String id;

  /// The column's announced and drawn name, e.g. «مبلغ». REQUIRED — a table
  /// whose columns have no names is a grid of unattributed strings.
  final String header;

  /// Defaults to [LumoTableAlign.end] for a numeric column (a money column
  /// reads down its last digit) and [LumoTableAlign.start] otherwise.
  final LumoTableAlign? align;

  /// Marks the column an **LTR island**: its cells are wrapped in their own
  /// `Directionality.ltr` so «۱٬۲۰۰٬۰۰۰−» cannot be re-ordered by the
  /// paragraph direction around it. The digits stay the reader's (they arrive
  /// already formatted); only their RUN is laid out left-to-right, which is
  /// what the Unicode bidi algorithm wants for a number and what the Khroos
  /// app wrote by hand at every money site.
  final bool isNumeric;

  /// The column's width in logical pixels. Widths are absolute, not flexible:
  /// a phone table scrolls, and a flexible column would collapse to nothing
  /// rather than scroll. When the sum FITS the viewport the columns are grown
  /// proportionally to fill it, so a two-column table has no dead gap.
  final double width;
}

/// One cell's content — the same two-arm shape as `LumoDescription`.
class LumoTableCell {
  /// A value that is already the string it should be read as: pre-formatted
  /// through `formatNumber(n, locale)` / `formatLumoDate`, never a raw number.
  const LumoTableCell(this.value) : child = null;

  /// A drawn value (a badge, a chip). [value] is what is ANNOUNCED, [child] is
  /// what is SHOWN and is excluded from semantics, so the cell is heard once.
  const LumoTableCell.widget({required this.value, required Widget this.child});

  final String value;
  final Widget? child;
}

/// One row — the web `Row`.
class LumoTableRowData {
  const LumoTableRowData({required this.id, required this.cells});

  /// Stable identity. Not announced.
  final String id;

  /// One entry per column, in column order.
  final List<LumoTableCell> cells;
}

/// A data table that works on a phone — the web `Table` family
/// (`TableHeader`/`Column`/`TableBody`/`Row`/`Cell`) folded into ONE widget,
/// because a phone table is configured once, not composed per call site.
///
/// The API shape is the web's; the mobile PATTERN is the point:
///
///  - **The table scrolls, the page does not.** A wide table lives in its own
///    horizontal scroller, clipped (`ClipRect`) and with clamping physics, so
///    the inline drag is consumed here. A page holding this widget never moves sideways, which is
///    the failure every naive Flutter table has: a `Row` wider than the screen
///    either overflows with a yellow stripe or drags the whole page.
///  - **The first column can be pinned** ([pinFirstColumn]). It is pinned by
///    DRAWING it twice: once in the scrolled table, where it holds the layout
///    and owns the semantics, and once as a silent overlay at the inline START
///    (`PositionedDirectional(start: 0)` — so it is on the RIGHT in Persian,
///    with no direction flag). The overlay is `ExcludeSemantics` +
///    `IgnorePointer`, so the reader hears each cell once and a drag that
///    begins over the frozen column still scrolls the table. This is why rows
///    have a fixed [rowHeight]: two copies of a column can only line up if the
///    row's height does not depend on which columns are in it.
///  - **Numeric columns are LTR islands** — see [LumoTableColumn.isNumeric].
///  - **A narrow viewport can collapse the grid** ([collapseBelow]). forui and
///    shadcn_flutter both leave this to the app; it is opt-in here, off by
///    default, because collapsing silently would change what a caller's
///    screenshots show. Below the given width each row becomes a card of
///    header/value lines. The `table` / `row` / `cell` roles SURVIVE the
///    collapse — it is the same data — but there is no header row, so each
///    cell takes its column's name as its NAME and the datum as its VALUE,
///    which is the pairing `LumoDescriptionList` makes and invents no
///    punctuation to make it.
///
/// **Semantics.** `label` is REQUIRED and names the table; `caption` is drawn
/// under it and read as its own node, the web's `<caption>`. The roles are
/// Flutter's own (`SemanticsRole.table` / `row` / `columnHeader` / `cell`), and
/// they come with assertions: a `row` must be a direct child of a `table` and a
/// `cell` a direct child of a `row`. That is why the table role sits INSIDE the
/// scroller rather than around it — the `Scrollable`'s node would otherwise be
/// a child of the table and the framework would throw.
///
/// **Not carried from the web.** Sorting, resizing, pinning by column id, row
/// selection, grouping, pagination and the whole TanStack `useLumoTable` layer:
/// they are a desktop data grid, and `data-grid.tsx` is where they live. This
/// widget is `table.tsx`'s presentational half.
class LumoTable extends StatelessWidget {
  const LumoTable({
    super.key,
    required this.label,
    required this.columns,
    required this.rows,
    this.caption,
    this.emptyLabel,
    this.pinFirstColumn = false,
    this.collapseBelow,
    this.rowHeight = 44,
    this.headerHeight = 40,
    this.controller,
  });

  /// Announced name of the table, e.g. «تراکنش‌های اخیر». REQUIRED.
  final String label;

  final List<LumoTableColumn> columns;
  final List<LumoTableRowData> rows;

  /// Drawn under the table and read as its own node — the web's `<caption>`.
  final String? caption;

  /// Shown and announced instead of an empty body. Optional; with no string an
  /// empty table draws only its header, which is the honest default when the
  /// caller has an empty state of their own above it.
  final String? emptyLabel;

  /// Freeze the first column against the inline start while the rest scrolls.
  final bool pinFirstColumn;

  /// Below this viewport width, stack each row into a card of header/value
  /// lines instead of a grid. Opt-in; `null` never collapses.
  final double? collapseBelow;

  /// Every data row is exactly this tall. See the docblock: pinning depends on
  /// it, and a phone table with reflowing row heights cannot be scanned.
  final double rowHeight;

  final double headerHeight;

  /// The horizontal scroller's controller, when the caller wants to drive it.
  final ScrollController? controller;

  @override
  Widget build(BuildContext context) {
    assert(columns.isNotEmpty, 'A table needs at least one column.');
    assert(
      rows.every((r) => r.cells.length == columns.length),
      'Every row needs exactly one cell per column.',
    );
    final c = LumoScope.of(context).colours;

    return LayoutBuilder(builder: (context, constraints) {
      final available = constraints.maxWidth;
      final collapse = collapseBelow != null && available.isFinite && available < collapseBelow!;

      final body = collapse
          ? _Stacked(columns: columns, rows: rows, label: label, emptyLabel: emptyLabel)
          : _Grid(
              label: label,
              columns: columns,
              rows: rows,
              emptyLabel: emptyLabel,
              pinFirstColumn: pinFirstColumn,
              rowHeight: rowHeight,
              headerHeight: headerHeight,
              controller: controller,
              available: available,
            );

      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          body,
          if (caption != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(caption!, style: TextStyle(fontSize: 12, color: c.fgMuted, height: 1.5)),
            ),
        ],
      );
    });
  }
}

/// The grid form: a header row and one row per datum, inside a horizontal
/// scroller, with an optional frozen first column.
class _Grid extends StatefulWidget {
  const _Grid({
    required this.label,
    required this.columns,
    required this.rows,
    required this.emptyLabel,
    required this.pinFirstColumn,
    required this.rowHeight,
    required this.headerHeight,
    required this.controller,
    required this.available,
  });

  final String label;
  final List<LumoTableColumn> columns;
  final List<LumoTableRowData> rows;
  final String? emptyLabel;
  final bool pinFirstColumn;
  final double rowHeight;
  final double headerHeight;
  final ScrollController? controller;
  final double available;

  @override
  State<_Grid> createState() => _GridState();
}

class _GridState extends State<_Grid> {
  ScrollController? _own;
  // `RawScrollbar` with a visible thumb demands a controller, and so does the
  // frozen column, which has to follow the scroller's offset.
  ScrollController get _controller => widget.controller ?? (_own ??= ScrollController());

  @override
  void dispose() {
    _own?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final columns = widget.columns;
    final rows = widget.rows;
    final label = widget.label;
    final emptyLabel = widget.emptyLabel;
    final pinFirstColumn = widget.pinFirstColumn;
    final rowHeight = widget.rowHeight;
    final headerHeight = widget.headerHeight;
    final available = widget.available;
    final c = LumoScope.of(context).colours;
    final natural = columns.fold<double>(0, (sum, col) => sum + col.width);
    // Fits: grow every column by the same factor so there is no dead gap at
    // the inline end. Does not fit: keep the asked-for widths and scroll.
    final scale = available.isFinite && available > natural && natural > 0 ? available / natural : 1.0;
    final widths = [for (final col in columns) col.width * scale];
    final total = widths.fold<double>(0, (sum, w) => sum + w);

    final table = Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.table,
      label: label,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _GridRow(
            columns: columns,
            widths: widths,
            height: headerHeight,
            isHeader: true,
            cells: [for (final col in columns) LumoTableCell(col.header)],
          ),
          for (final row in rows)
            _GridRow(
              key: ValueKey<String>(row.id),
              columns: columns,
              widths: widths,
              height: rowHeight,
              isHeader: false,
              cells: row.cells,
            ),
        ],
      ),
    );

    // NOT a `LumoScrollArea`: that widget names its region, and the name is
    // already on the table node inside it — the reader would hear «تراکنش‌های
    // اخیر» twice. The scroller here is deliberately anonymous; the table it
    // carries is the thing with a name.
    final overflows = total > available + 0.5;
    Widget scroller = ClipRect(
      child: RawScrollbar(
        controller: _controller,
        thumbVisibility: overflows,
        thumbColor: overflows ? c.borderStrong : Colors.transparent,
        radius: const Radius.circular(LumoRadius.sm),
        thickness: 4,
        crossAxisMargin: 2,
        child: SingleChildScrollView(
          controller: _controller,
          scrollDirection: Axis.horizontal,
          // The drag is consumed here whether or not the content overflows, so
          // an inline drag on the table never reaches a page scroller above it.
          physics: const ClampingScrollPhysics(),
          child: SizedBox(width: total, child: table),
        ),
      ),
    );

    if (pinFirstColumn && columns.length > 1) {
      scroller = Stack(
        children: [
          scroller,
          // The frozen copy: silent (the scrolled original owns the
          // semantics) and transparent to the pointer (a drag begun over it
          // still belongs to the scroller underneath). `PositionedDirectional`
          // puts it at the reading start — right under fa-IR.
          PositionedDirectional(
            top: 0,
            start: 0,
            child: IgnorePointer(
              child: ExcludeSemantics(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: c.bg,
                    border: BorderDirectional(end: BorderSide(color: c.border)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _GridRow(columns: [columns.first], widths: [widths.first], height: headerHeight, isHeader: true, cells: [LumoTableCell(columns.first.header)]),
                      for (final row in rows)
                        _GridRow(columns: [columns.first], widths: [widths.first], height: rowHeight, isHeader: false, cells: [row.cells.first]),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        scroller,
        if (rows.isEmpty && emptyLabel != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(emptyLabel, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: c.fgMuted)),
          ),
      ],
    );
  }
}

class _GridRow extends StatelessWidget {
  const _GridRow({super.key, required this.columns, required this.widths, required this.height, required this.isHeader, required this.cells});

  final List<LumoTableColumn> columns;
  final List<double> widths;
  final double height;
  final bool isHeader;
  final List<LumoTableCell> cells;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.row,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: isHeader ? c.surfaceSunken : Colors.transparent,
          border: Border(bottom: BorderSide(color: c.border)),
        ),
        child: Row(
          children: [
            for (var i = 0; i < columns.length; i++)
              SizedBox(
                width: widths[i],
                child: _Cell(column: columns[i], cell: cells[i], isHeader: isHeader),
              ),
          ],
        ),
      ),
    );
  }
}

class _Cell extends StatelessWidget {
  const _Cell({required this.column, required this.cell, required this.isHeader});
  final LumoTableColumn column;
  final LumoTableCell cell;
  final bool isHeader;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final align = column.align ?? (column.isNumeric ? LumoTableAlign.end : LumoTableAlign.start);
    return Semantics(
      container: true,
      role: isHeader ? SemanticsRole.columnHeader : SemanticsRole.cell,
      label: cell.value,
      child: ExcludeSemantics(
        child: Padding(
          padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
          child: Align(
            alignment: switch (align) {
              LumoTableAlign.start => AlignmentDirectional.centerStart,
              LumoTableAlign.end => AlignmentDirectional.centerEnd,
              LumoTableAlign.center => AlignmentDirectional.center,
            },
            child: _island(
              column: column,
              // A header is a WORD; only data is a number. `isHeader` is why
              // «مبلغ» stays right-to-left while the money under it does not.
              isNumeric: column.isNumeric && !isHeader,
              child: cell.child ??
                  Text(
                    cell.value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: switch (align) {
                      LumoTableAlign.start => TextAlign.start,
                      LumoTableAlign.end => TextAlign.end,
                      LumoTableAlign.center => TextAlign.center,
                    },
                    style: TextStyle(
                      fontSize: isHeader ? 12 : 13,
                      fontWeight: isHeader ? FontWeight.w600 : FontWeight.w400,
                      color: isHeader ? c.fgMuted : c.fg,
                      height: 1.4,
                    ),
                  ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A numeric cell is its own direction context. Header cells are words and stay
/// in the paragraph's direction, so only data cells are wrapped.
Widget _island({required LumoTableColumn column, required Widget child, bool? isNumeric}) =>
    (isNumeric ?? column.isNumeric) ? Directionality(textDirection: TextDirection.ltr, child: child) : child;

/// The collapsed form: one card per row, each line a column name and its value.
/// The table roles survive — the data has not changed, only the layout — but
/// there is no header row, so each cell says which column it is from.
class _Stacked extends StatelessWidget {
  const _Stacked({required this.columns, required this.rows, required this.label, required this.emptyLabel});
  final List<LumoTableColumn> columns;
  final List<LumoTableRowData> rows;
  final String label;
  final String? emptyLabel;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    if (rows.isEmpty) {
      return Semantics(
        container: true,
        explicitChildNodes: true,
        label: label,
        child: emptyLabel == null
            ? const SizedBox.shrink()
            : Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(emptyLabel!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: c.fgMuted)),
              ),
      );
    }
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.table,
      label: label,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 8,
        children: [
          for (final row in rows)
            Semantics(
              key: ValueKey<String>(row.id),
              container: true,
              explicitChildNodes: true,
              role: SemanticsRole.row,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: c.surface,
                  border: Border.all(color: c.border),
                  borderRadius: BorderRadius.circular(LumoRadius.md),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 6,
                  children: [
                    for (var i = 0; i < columns.length; i++)
                      Semantics(
                        container: true,
                        role: SemanticsRole.cell,
                        // The column's name is the cell's NAME and the datum is
                        // its VALUE — the platform joins the two the way that
                        // language joins them, so no separator is invented here
                        // (the same reason `LumoDescriptionList` merges rather
                        // than concatenating). In the grid form the header row
                        // carries the name and a data cell announces its value
                        // alone; collapsed, there is no header row to carry it.
                        label: columns[i].header,
                        value: row.cells[i].value,
                        child: ExcludeSemantics(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            spacing: 12,
                            children: [
                              Flexible(child: Text(columns[i].header, style: TextStyle(fontSize: 12, color: c.fgMuted, height: 1.5))),
                              Flexible(
                                child: _island(
                                  column: columns[i],
                                  child: row.cells[i].child ??
                                      Text(row.cells[i].value, textAlign: TextAlign.end, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: c.fg, height: 1.5)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
