import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show CustomSemanticsAction, SemanticsRole;
import 'format.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// One card on a [LumoKanban].
class LumoKanbanCard {
  const LumoKanbanCard({required this.id, required this.label, this.description, this.child});

  /// Stable identity across moves. Not announced.
  final String id;

  /// The card's announced name, and — unless [child] is given — its drawn first
  /// line, e.g. «تعمیر پکیج — نشتی مبدل». REQUIRED.
  final String label;

  /// A second drawn line, e.g. «خانم موسوی · سعادت‌آباد». Read after the name.
  final String? description;

  /// Replaces the drawn `label`/`description` block — the Khroos job card's
  /// pills, its «هزینه و سود» panel and its advance button all live here. The
  /// name is still announced from the card's own node, so a `child` that
  /// repeats [label] is announced twice.
  final Widget? child;
}

/// One column of a [LumoKanban]: a name, and the cards in it. The count is NOT
/// a parameter — it is `cards.length` through `formatNumber(n, locale)`, so it
/// cannot drift from the cards and cannot arrive in Latin digits.
class LumoKanbanColumn {
  const LumoKanbanColumn({required this.id, required this.label, required this.cards, this.emptyLabel});

  /// Stable identity. Not announced.
  final String id;

  /// The column's announced and drawn name, e.g. «در حال انجام». REQUIRED.
  final String label;

  final List<LumoKanbanCard> cards;

  /// Shown in the column when it holds nothing, e.g. «کاری در «در انتظار» نیست».
  /// Optional; per column, because the sentence names the column.
  final String? emptyLabel;
}

/// A board of columns whose cards move between them — the web `Kanban`.
///
/// **The Khroos board is the reference.** `jobs_board_screen.dart` is a real
/// four-column job board (در انتظار / در حال انجام / تکمیل‌شده / پرداخت‌شده) and
/// it does NOT draw four columns: a phone is 390 px wide, so the app hand-rolled
/// a column SWITCHER and showed one column at a time, plus a per-card "advance
/// to the next status" button. Two things follow, and both are in this API:
///
///  1. The board scrolls horizontally and a column is [columnWidth] wide, but
///     never wider than the viewport less [peek] — so the next column always
///     shows an edge. A board that fills the screen exactly looks like a list
///     and nobody scrolls it; the peek is the affordance.
///  2. The Khroos advance button is a MOVE, and every card here has that move
///     as a named semantic action — one per other column, named by
///     [moveToColumnLabel]. Same reasoning as `LumoSortable`: a drag is not
///     available to a screen-reader user, so a board that only drags is a board
///     they cannot use. `kanban.tsx` reaches the same place through the
///     keyboard; a phone has no keyboard, so the action IS the route.
///
/// **The drag** is a LONG PRESS then a move (see `_Card`: a plain pan loses the
/// gesture arena to the board's own horizontal scroller), and it hit-tests LIVE
/// rects — nearest column by inline distance, then the card whose midpoint was
/// crossed — rather than reasoning about index order. `kanban.tsx` records why
/// in one line: rects need no `isRtl` branch, and dnd-kit's signed deltas do.
/// Nothing in this file asks the direction a question; `PositionedDirectional`, `EdgeInsetsDirectional` and the `Row`'s
/// own mirroring put the first column at the reading start on their own.
///
/// **Not carried from the web:** moving a COLUMN (the web's `onColumnsChange`
/// accepts a reordered column list; reordering columns by finger on a phone
/// fights the board's own horizontal scroll), and the announcement strings
/// `pickedUp`/`dropped`/`cancelled` — those narrate a keyboard pick-up-and-move
/// model that does not exist here, where a move is one atomic named action.
class LumoKanban extends StatefulWidget {
  const LumoKanban({
    super.key,
    required this.label,
    required this.columns,
    required this.moveToColumnLabel,
    required this.onCardMoved,
    this.columnWidth = 264,
    this.peek = 32,
    this.isDisabled = false,
    this.controller,
  });

  /// Announced name of the board, e.g. «وضعیت کارها». REQUIRED.
  final String label;

  /// The columns, in reading order: the first sits at the reading START —
  /// right under fa-IR.
  final List<LumoKanbanColumn> columns;

  /// Names the "move this card to that column" action for a destination
  /// column's name, e.g. `(c) => 'انتقال به «$c»'`. REQUIRED, and a FUNCTION
  /// rather than a two-part template, because Persian word order is not English
  /// with the words swapped.
  final String Function(String columnLabel) moveToColumnLabel;

  /// Called with the card, the column it lands in, and its index there. Both
  /// routes — the named action and the drag — come through here.
  final void Function(String cardId, String toColumnId, int toIndex) onCardMoved;

  /// A column's width, capped at the viewport less [peek].
  final double columnWidth;

  /// How much of the next column stays visible. See the docblock.
  final double peek;

  final bool isDisabled;

  final ScrollController? controller;

  /// Moves one card, returning a whole new board — the web's exported
  /// `moveCard`, same semantics: `toIndex` is CLAMPED, which is what makes an
  /// empty destination column ordinary, and the caller's list is never mutated.
  static List<LumoKanbanColumn> moveCard(List<LumoKanbanColumn> columns, String cardId, String toColumnId, int toIndex) {
    LumoKanbanCard? card;
    final stripped = [
      for (final column in columns)
        LumoKanbanColumn(
          id: column.id,
          label: column.label,
          emptyLabel: column.emptyLabel,
          cards: [
            for (final c in column.cards)
              if (c.id == cardId) ...[] else c,
          ],
        ),
    ];
    for (final column in columns) {
      for (final c in column.cards) {
        if (c.id == cardId) card = c;
      }
    }
    if (card == null) return stripped;
    return [
      for (final column in stripped)
        if (column.id != toColumnId)
          column
        else
          LumoKanbanColumn(
            id: column.id,
            label: column.label,
            emptyLabel: column.emptyLabel,
            cards: List<LumoKanbanCard>.of(column.cards)..insert(toIndex.clamp(0, column.cards.length), card),
          ),
    ];
  }

  @override
  State<LumoKanban> createState() => _LumoKanbanState();
}

class _LumoKanbanState extends State<LumoKanban> {
  String? _heldId;
  final Map<String, GlobalKey> _columnKeys = {};
  final Map<String, GlobalKey> _cardKeys = {};

  GlobalKey _columnKey(String id) => _columnKeys.putIfAbsent(id, GlobalKey.new);
  GlobalKey _cardKey(String id) => _cardKeys.putIfAbsent(id, GlobalKey.new);

  ({int column, int index})? _locate(String cardId) {
    for (var i = 0; i < widget.columns.length; i++) {
      final index = widget.columns[i].cards.indexWhere((c) => c.id == cardId);
      if (index != -1) return (column: i, index: index);
    }
    return null;
  }

  /// The nearest column to a point on the inline axis. "Nearest" rather than
  /// "contains": the gaps and padding between columns are positions a finger
  /// genuinely occupies mid-drag.
  int? _columnAt(Offset point) {
    var best = -1;
    var nearest = double.infinity;
    for (var i = 0; i < widget.columns.length; i++) {
      final box = _columnKeys[widget.columns[i].id]?.currentContext?.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) continue;
      final origin = box.localToGlobal(Offset.zero).dx;
      final end = origin + box.size.width;
      final distance = point.dx < origin ? origin - point.dx : (point.dx > end ? point.dx - end : 0.0);
      if (distance < nearest) {
        nearest = distance;
        best = i;
      }
    }
    return best == -1 ? null : best;
  }

  /// Which slot in a column the point falls into: the first card whose midpoint
  /// is below it, or the end. An empty column yields 0.
  int _slotIn(LumoKanbanColumn column, Offset point) {
    for (var i = 0; i < column.cards.length; i++) {
      final box = _cardKeys[column.cards[i].id]?.currentContext?.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) continue;
      final middle = box.localToGlobal(Offset.zero).dy + box.size.height / 2;
      if (point.dy < middle) return i;
    }
    return column.cards.length;
  }

  void _onDragUpdate(String cardId, Offset point) {
    final at = _locate(cardId);
    final target = _columnAt(point);
    if (at == null || target == null) return;
    final column = widget.columns[target];
    final slot = _slotIn(column, point);
    // The dragged card is still in its own column, so an insertion point past
    // it is one too far; crossing into another column needs no correction.
    final toIndex = at.column == target && slot > at.index ? slot - 1 : slot;
    if (at.column == target && at.index == toIndex) return;
    widget.onCardMoved(cardId, column.id, toIndex);
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    return LayoutBuilder(builder: (context, constraints) {
      final available = constraints.maxWidth;
      // Cap the column so the next one always peeks; a board that fills the
      // screen exactly reads as a list and never gets scrolled.
      final width = available.isFinite ? widget.columnWidth.clamp(120.0, (available - widget.peek).clamp(120.0, widget.columnWidth)) : widget.columnWidth;
      final bounded = constraints.maxHeight.isFinite;
      return Semantics(
        container: true,
        explicitChildNodes: true,
        label: widget.label,
        enabled: !widget.isDisabled,
        // `ClipRect` + the scroller's own physics: an inline drag on the board
        // is consumed here and never reaches a page scroller above it.
        child: ClipRect(
          child: SingleChildScrollView(
            controller: widget.controller,
            scrollDirection: Axis.horizontal,
            physics: const ClampingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              // `Row` mirrors itself: the first column is at the reading start,
              // which is the RIGHT under fa-IR, with no positional value here.
              crossAxisAlignment: bounded ? CrossAxisAlignment.stretch : CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              spacing: 12,
              children: [
                for (var i = 0; i < widget.columns.length; i++)
                  SizedBox(
                    width: width.toDouble(),
                    child: _Column(
                      key: ValueKey<String>(widget.columns[i].id),
                      measureKey: _columnKey(widget.columns[i].id),
                      column: widget.columns[i],
                      others: [for (final o in widget.columns) if (o.id != widget.columns[i].id) o],
                      locale: scope.locale,
                      colours: c,
                      bounded: bounded,
                      heldId: _heldId,
                      disabled: widget.isDisabled,
                      cardKey: _cardKey,
                      moveToColumnLabel: widget.moveToColumnLabel,
                      onCardMoved: widget.onCardMoved,
                      onDragStart: (id) => setState(() => _heldId = id),
                      onDragUpdate: _onDragUpdate,
                      onDragEnd: () => setState(() => _heldId = null),
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    });
  }
}

class _Column extends StatelessWidget {
  const _Column({
    super.key,
    required this.measureKey,
    required this.column,
    required this.others,
    required this.locale,
    required this.colours,
    required this.bounded,
    required this.heldId,
    required this.disabled,
    required this.cardKey,
    required this.moveToColumnLabel,
    required this.onCardMoved,
    required this.onDragStart,
    required this.onDragUpdate,
    required this.onDragEnd,
  });

  final GlobalKey measureKey;
  final LumoKanbanColumn column;
  final List<LumoKanbanColumn> others;
  final String locale;
  final LumoSchemeColours colours;
  final bool bounded;
  final String? heldId;
  final bool disabled;
  final GlobalKey Function(String id) cardKey;
  final String Function(String columnLabel) moveToColumnLabel;
  final void Function(String cardId, String toColumnId, int toIndex) onCardMoved;
  final ValueChanged<String> onDragStart;
  final void Function(String cardId, Offset point) onDragUpdate;
  final VoidCallback onDragEnd;

  @override
  Widget build(BuildContext context) {
    final c = colours;
    final cards = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 8,
      children: [
        for (final card in column.cards)
          _Card(
            key: ValueKey<String>(card.id),
            measureKey: cardKey(card.id),
            card: card,
            others: others,
            colours: c,
            held: heldId == card.id,
            disabled: disabled,
            moveToColumnLabel: moveToColumnLabel,
            onCardMoved: onCardMoved,
            onDragStart: () => onDragStart(card.id),
            onDragUpdate: (point) => onDragUpdate(card.id, point),
            onDragEnd: onDragEnd,
          ),
        if (column.cards.isEmpty && column.emptyLabel != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 8),
            child: Text(column.emptyLabel!, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: c.fgMuted, height: 1.6)),
          ),
      ],
    );

    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: column.label,
      // The count is the column's VALUE, so it is heard with the name and the
      // drawn badge stays silent. Through `formatNumber`: a bare `length` is a
      // Latin digit in a Persian sentence.
      value: formatNumber(column.cards.length, locale),
      child: Container(
        key: measureKey,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: c.surfaceSunken, borderRadius: BorderRadius.circular(LumoRadius.lg)),
        child: Column(
          mainAxisSize: bounded ? MainAxisSize.max : MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ExcludeSemantics(
              child: Padding(
                padding: const EdgeInsetsDirectional.only(start: 2, end: 2, bottom: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(column.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: c.fg))),
                    const SizedBox(width: 8),
                    Text(formatNumber(column.cards.length, locale), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.fgSubtle)),
                  ],
                ),
              ),
            ),
            // Bounded: the column owns the leftover height and its cards
            // scroll inside it. Unbounded: the board is as tall as its tallest
            // column, which is what a page-scrolled board wants.
            if (bounded) Expanded(child: SingleChildScrollView(child: cards)) else cards,
          ],
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({
    super.key,
    required this.measureKey,
    required this.card,
    required this.others,
    required this.colours,
    required this.held,
    required this.disabled,
    required this.moveToColumnLabel,
    required this.onCardMoved,
    required this.onDragStart,
    required this.onDragUpdate,
    required this.onDragEnd,
  });

  final GlobalKey measureKey;
  final LumoKanbanCard card;
  final List<LumoKanbanColumn> others;
  final LumoSchemeColours colours;
  final bool held;
  final bool disabled;
  final String Function(String columnLabel) moveToColumnLabel;
  final void Function(String cardId, String toColumnId, int toIndex) onCardMoved;
  final VoidCallback onDragStart;
  final ValueChanged<Offset> onDragUpdate;
  final VoidCallback onDragEnd;

  @override
  Widget build(BuildContext context) {
    final c = colours;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: card.label,
      enabled: !disabled,
      // One named action per OTHER column — the accessible counterpart of the
      // drag, and of the Khroos board's «تکمیل‌شده ←» advance button. The card
      // lands at the END of its new column, the one destination that needs no
      // second question.
      customSemanticsActions: disabled
          ? null
          : {
              for (final column in others)
                CustomSemanticsAction(label: moveToColumnLabel(column.label)): () => onCardMoved(card.id, column.id, column.cards.length),
            },
      child: Opacity(
        opacity: disabled ? 0.5 : 1,
        child: Container(
          key: measureKey,
          padding: const EdgeInsetsDirectional.fromSTEB(4, 10, 10, 10),
          decoration: BoxDecoration(
            color: held ? c.surfaceHover : c.surface,
            border: Border.all(color: held ? c.accent : c.border),
            borderRadius: BorderRadius.circular(LumoRadius.md),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 6,
            children: [
              ExcludeSemantics(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  // LONG-PRESS, not a plain pan. The board is itself a
                  // horizontal scroller, and a `PanGestureRecognizer` needs
                  // `kPanSlop` (36 px, any direction) while the scroller's
                  // horizontal recogniser accepts at `kTouchSlop` (18 px): the
                  // scroller reaches the arena first and every drag becomes a
                  // scroll. A long press declares the gesture before either
                  // slop is reached, which is the same resolution Flutter's own
                  // `ReorderableListView` picks for touch.
                  onLongPressStart: disabled ? null : (_) => onDragStart(),
                  onLongPressMoveUpdate: disabled ? null : (d) => onDragUpdate(d.globalPosition),
                  onLongPressEnd: disabled ? null : (_) => onDragEnd(),
                  onLongPressCancel: disabled ? null : onDragEnd,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    child: Icon(Icons.drag_indicator, size: 16, color: held ? c.accent : c.fgSubtle),
                  ),
                ),
              ),
              Expanded(
                child: card.child ??
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Announced from the card's own node above, so the
                        // drawn copy is silent — heard exactly once.
                        ExcludeSemantics(child: Text(card.label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, height: 1.5, color: c.fg))),
                        if (card.description != null)
                          Text(card.description!, style: TextStyle(fontSize: 11.5, color: c.fgMuted, height: 1.5)),
                      ],
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
