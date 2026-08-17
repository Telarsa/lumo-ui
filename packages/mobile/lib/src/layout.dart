import 'package:flutter/material.dart';

/// The spacing step, named once — the web `stackVariants`' `gap` scale
/// (`gap-0/1/2/4/6/8` → 0, 4, 8, 16, 24, 32 logical pixels). A step, never a
/// number at the call site: `LumoGap.md` is the same distance in every screen
/// of every app on this library, and a `16` typed by hand is not.
enum LumoGap { none, xs, sm, md, lg, xl }

const _gapPx = <LumoGap, double>{
  LumoGap.none: 0,
  LumoGap.xs: 4,
  LumoGap.sm: 8,
  LumoGap.md: 16,
  LumoGap.lg: 24,
  LumoGap.xl: 32,
};

/// The step in logical pixels — for a widget that needs the number itself
/// (a `SliverList` separator, a `Wrap` built by hand).
double lumoGapOf(LumoGap gap) => _gapPx[gap]!;

/// The main axis of a [LumoStack]. `row` is the INLINE axis and mirrors: its
/// first child sits at the reading start (right under `fa-IR`). There is no
/// `rowReverse` — reversing an already-mirrored axis flips twice in Persian,
/// which is why the web's `stack.tsx` refuses `flex-row-reverse` too.
enum LumoStackDirection { row, column }

/// Cross-axis alignment — the web's `align` (`items-*`). Logical: `start` is
/// the reading start, so it mirrors with the locale and never names a side.
enum LumoAlign { start, center, end, stretch, baseline }

/// Main-axis distribution — the web's `justify` (`justify-*`). Needs room to
/// distribute: see [LumoStack.mainAxisSize].
enum LumoJustify { start, center, end, between, around, evenly }

/// A one-axis layout: a logical row that mirrors under RTL, or a column, with
/// a `gap` from the shared scale — the web `Stack` (`stack.tsx`).
///
/// This widget is thin on purpose, and it is not redundant: `gap`, `align` and
/// `justify` are where the spacing scale and the LOGICAL alignment vocabulary
/// get named ONCE. A hand-written `Row(children: [a, SizedBox(width: 12), b])`
/// re-decides the step at every call site, and a hand-written
/// `Alignment.centerLeft` is the silent RTL defect this library exists to
/// prevent. Flutter's own `Row`/`Column`/`Wrap` already resolve `start`/`end`
/// against the inherited `Directionality`, so nothing here needs a flag — the
/// value is the shared names, not new geometry.
///
/// `align: stretch` on a ROW is wrapped in an `IntrinsicHeight`, so `stretch`
/// means the same thing on both axes (CSS `align-items: stretch` stretches
/// children to the tallest item; a bare Flutter `Row` with
/// `CrossAxisAlignment.stretch` asserts when its height is unbounded). That is
/// one extra layout pass over the children — the price of the word meaning one
/// thing, stated rather than hidden.
///
/// `wrap: true` swaps the flex for a `Wrap` (which also mirrors), where
/// `stretch` and `baseline` have no meaning — a wrapped child is sized by
/// itself — and both fall back to `start`.
class LumoStack extends StatelessWidget {
  const LumoStack({
    super.key,
    required this.children,
    this.direction = LumoStackDirection.column,
    this.gap = LumoGap.sm,
    this.align = LumoAlign.stretch,
    this.justify = LumoJustify.start,
    this.wrap = false,
    this.mainAxisSize = MainAxisSize.min,
  });

  /// The children, in reading order.
  final List<Widget> children;
  /// Which way the stack runs.
  final LumoStackDirection direction;
  /// Space between the children.
  final LumoGap gap;
  /// How the children line up on the cross axis.
  final LumoAlign align;

  /// How the free space on the main axis is spread. Only visible when the
  /// stack HAS free space: leave [mainAxisSize] at `min` and there is none.
  final LumoJustify justify;

  /// Lets the line break instead of overflowing. See the docblock for what
  /// `align` can still mean once it does.
  final bool wrap;

  /// `min` (the default) hugs the children — the shape a sheet, a card body or
  /// a list row wants, and the one that is safe inside a scroll view. `max`
  /// fills the parent, which is what [justify] needs to have anything to do.
  final MainAxisSize mainAxisSize;

  @override
  Widget build(BuildContext context) {
    final space = _gapPx[gap]!;
    final axis = direction == LumoStackDirection.row ? Axis.horizontal : Axis.vertical;
    if (wrap) {
      return Wrap(
        direction: axis,
        spacing: space,
        runSpacing: space,
        alignment: _wrapMain(justify),
        runAlignment: _wrapMain(justify),
        // No `stretch`/`baseline` on a Wrap: a wrapped child is sized by itself.
        crossAxisAlignment: _wrapCross(align),
        children: children,
      );
    }
    final flex = Flex(
      direction: axis,
      spacing: space,
      mainAxisSize: mainAxisSize,
      mainAxisAlignment: _main(justify),
      crossAxisAlignment: _cross(align),
      textBaseline: align == LumoAlign.baseline ? TextBaseline.alphabetic : null,
      children: children,
    );
    // A row that stretches must first know how tall its tallest child is.
    return direction == LumoStackDirection.row && align == LumoAlign.stretch ? IntrinsicHeight(child: flex) : flex;
  }
}

MainAxisAlignment _main(LumoJustify justify) => switch (justify) {
      LumoJustify.start => MainAxisAlignment.start,
      LumoJustify.center => MainAxisAlignment.center,
      LumoJustify.end => MainAxisAlignment.end,
      LumoJustify.between => MainAxisAlignment.spaceBetween,
      LumoJustify.around => MainAxisAlignment.spaceAround,
      LumoJustify.evenly => MainAxisAlignment.spaceEvenly,
    };

CrossAxisAlignment _cross(LumoAlign align) => switch (align) {
      LumoAlign.start => CrossAxisAlignment.start,
      LumoAlign.center => CrossAxisAlignment.center,
      LumoAlign.end => CrossAxisAlignment.end,
      LumoAlign.stretch => CrossAxisAlignment.stretch,
      LumoAlign.baseline => CrossAxisAlignment.baseline,
    };

WrapAlignment _wrapMain(LumoJustify justify) => switch (justify) {
      LumoJustify.start => WrapAlignment.start,
      LumoJustify.center => WrapAlignment.center,
      LumoJustify.end => WrapAlignment.end,
      LumoJustify.between => WrapAlignment.spaceBetween,
      LumoJustify.around => WrapAlignment.spaceAround,
      LumoJustify.evenly => WrapAlignment.spaceEvenly,
    };

WrapCrossAlignment _wrapCross(LumoAlign align) => switch (align) {
      LumoAlign.center => WrapCrossAlignment.center,
      LumoAlign.end => WrapCrossAlignment.end,
      // `stretch` and `baseline` cannot be honoured by a Wrap; `start` is the
      // truthful answer, and saying so beats silently drawing something else.
      LumoAlign.start || LumoAlign.stretch || LumoAlign.baseline => WrapCrossAlignment.start,
    };

/// A fixed-column grid — the web `Grid` (`stack.tsx`), with the auto-fill
/// preset dropped: on a phone the column count is a design decision (two
/// tiles, three tiles), not something to derive from a width that is always
/// about 360.
///
/// Tracks run along the INLINE axis, so cell 1 is the reader's first cell in
/// both scripts — the `Row` mirrors itself and no cell is placed by a physical
/// offset. The last row is padded with empty cells so the columns stay put
/// (a three-column grid with four tiles keeps its third column empty, it does
/// not stretch the fourth tile across the row).
///
/// It lays out in ONE pass and scrolls with its parent, unlike `GridView`,
/// which brings its own viewport — a grid of four tiles inside a settings
/// screen is a layout, not a scrollable.
class LumoGrid extends StatelessWidget {
  const LumoGrid({super.key, required this.columns, required this.children, this.gap = LumoGap.md, this.align = LumoAlign.stretch})
      : assert(columns > 0, 'A grid has at least one column.');

  /// How many cells fit on one line.
  final int columns;
  /// The children, in reading order.
  final List<Widget> children;
  /// Space between the children.
  final LumoGap gap;

  /// How the cells of one line line up against each other. `stretch` (the
  /// default) gives every cell of a row the height of the tallest — cards in
  /// a grid whose bottoms do not line up look broken — at the cost of an
  /// `IntrinsicHeight` pass per row.
  final LumoAlign align;

  @override
  Widget build(BuildContext context) {
    final space = _gapPx[gap]!;
    final rows = <Widget>[];
    for (var start = 0; start < children.length; start += columns) {
      final line = <Widget>[
        for (var i = start; i < start + columns; i++)
          Expanded(child: i < children.length ? children[i] : const SizedBox.shrink()),
      ];
      final row = Row(spacing: space, crossAxisAlignment: _cross(align), children: line);
      rows.add(align == LumoAlign.stretch ? IntrinsicHeight(child: row) : row);
    }
    return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, spacing: space, children: rows);
  }
}

/// A box that keeps a fixed width-to-height ratio while its width flexes — the
/// web `AspectRatio` (`aspect-ratio.tsx`). A ratio is a DIMENSION, not a
/// direction: there is nothing here to mirror, which is exactly why it belongs
/// in a library whose other primitives all do.
///
/// The usual child is media, which should be `BoxFit.cover` and decorative
/// (`ExcludeSemantics`) unless it carries meaning of its own.
class LumoAspectRatio extends StatelessWidget {
  const LumoAspectRatio({super.key, required this.ratio, required this.child})
      : assert(ratio > 0, 'A ratio is width divided by height, and positive.');

  /// Width divided by height: `16 / 9`, `1`, `4 / 3`.
  final double ratio;
  /// The widget this one wraps.
  final Widget child;

  @override
  Widget build(BuildContext context) => AspectRatio(aspectRatio: ratio, child: child);
}
