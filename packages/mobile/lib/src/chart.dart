import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;

import 'scope.dart';
import 'tokens.g.dart';

/// # Charts
///
/// The mobile counterpart of `packages/ui/src/chart.tsx`, in the shape a phone
/// can hold: `LumoBarChart` (vertical and horizontal), `LumoLineChart` (plus
/// the compact `LumoSparkline`) and `LumoDonutChart`. The web wraps
/// `@tanstack/charts`; there is no equivalent on Flutter that meets this
/// library's contract, and the brief forbids a new pub dependency — so these
/// are `CustomPaint` plus real widgets, drawn on the scheme's own colours.
///
/// ## Why there is no `CustomPaint`-only path
///
/// **A chart is not an image with the numbers hidden in a canvas.** A painter
/// writes pixels; pixels carry no name, no value and no order, so a chart drawn
/// only into a canvas is, to a screen-reader user, a blank rectangle — and the
/// figures it was built to communicate are exactly the part that never arrives.
/// The accessibility model is therefore the deliverable, not a courtesy layer
/// over one:
///
///  * the chart is ONE named node (`label`, REQUIRED) carrying a `summary` as
///    its semantics value — the sentence a reader hears before the detail;
///  * **every data point is its own child node** announcing `«label: valueLabel»`,
///    laid out over the mark it describes, so a reader can walk the series in
///    reading order without seeing it, and a touch-explore lands on the point
///    under the finger;
///  * the painted marks are inside `ExcludeSemantics` — they are the picture,
///    never the record.
///
/// This is the same argument the web file makes when it keeps `<ChartData>` (a
/// real `<table>`) beside the plot and makes its props REQUIRED: an axis is not
/// the data. Here the table is the semantics tree. Consequently a mark is a
/// *widget* wherever a widget can draw it (bars are boxes, the donut legend is
/// rows), and the painter is used only where geometry genuinely needs one (the
/// line's polyline, the donut's arcs) — always beneath a matching row of real
/// semantics children.
///
/// ## Numbers
///
/// Nothing in this file formats a number. Every figure that reaches the screen
/// or the semantics tree is `LumoChartPoint.valueLabel` — a **pre-formatted
/// string the app supplies**, built with `formatNumber(n, locale)` or its own
/// unit/percent wording. A chart full of Latin digits in a Persian app is the
/// exact defect this library exists to prevent, and `double value` (the number
/// used only to compute a length) never reaches a reader. There is no numeric
/// value axis for the same reason: ticks Lumo invented would be figures the app
/// never approved.
///
/// ## Direction
///
/// A bar chart's CATEGORY axis starts at the reading start: under RTL the first
/// category is on the **RIGHT** and the axis runs right-to-left. Every
/// category-axis layout here is a plain `Row`, which mirrors from
/// `Directionality` alone; the line painter is told the direction and maps
/// `x = 0` to the right edge under RTL. The donut is deliberately NOT mirrored —
/// a radial sweep has no inline axis, and the web's `CHART_PIE_SWEEP` is
/// likewise direction-independent.
///
/// ## Colour
///
/// Five tones, from the scheme and nothing else: `accent`, `positive`,
/// `caution`, `critical`, `fgMuted` (`LumoChartTone.neutral`). There is no
/// sixth, and no generated rainbow: past five series a chart is **refused** at
/// construction (`assert`) rather than served invented colours that no theme
/// owns, fail contrast in one scheme, and mean nothing. A chart with more than
/// five series is a chart that should have been split, grouped into an
/// «other» bucket, or drawn as a `LumoBarChart` of one series per screen.
/// Colour is never the only carrier: every mark's figure is in the semantics
/// tree, and the point labels are drawn beside the marks.
///
/// ## Motion
///
/// Marks grow on FIRST PAINT (460 ms, the web's `CHART_MOTION_MARK_DURATION`,
/// `Curves.easeOutCubic`) — bars from the baseline, the line and the donut
/// revealed along the reading direction. Under `MediaQuery.disableAnimationsOf`
/// (the platform's «reduce motion») there is no animation AT ALL: the final
/// state is painted on frame one, which is the web's
/// `CHART_MOTION_REDUCED_MOTION_IS_TOTAL` restated in Dart.

/// The plot colours a Lumo chart may use — the scheme's, and only the scheme's.
///
/// `neutral` is `fgMuted`: the tone for a reference series, a comparison
/// baseline or the «other» bucket.
enum LumoChartTone { accent, positive, caution, critical, neutral }

/// The colour a tone resolves to in a scheme. Public so a caller drawing its
/// own legend beside a chart takes the same five colours from the same place.
Color lumoChartToneColour(LumoChartTone tone, LumoSchemeColours colours) => switch (tone) {
      LumoChartTone.accent => colours.accent,
      LumoChartTone.positive => colours.positive,
      LumoChartTone.caution => colours.caution,
      LumoChartTone.critical => colours.critical,
      LumoChartTone.neutral => colours.fgMuted,
    };

/// The order a multi-series chart assigns tones in, and — because the list has
/// five entries and there is no sixth colour in the scheme — the hard ceiling
/// on how many series or slices a Lumo chart draws.
const List<LumoChartTone> lumoChartSeriesTones = <LumoChartTone>[
  LumoChartTone.accent,
  LumoChartTone.positive,
  LumoChartTone.caution,
  LumoChartTone.critical,
  LumoChartTone.neutral,
];

/// One plotted figure.
///
/// `label` names the point (a day, a category, a province) and `valueLabel` is
/// the figure **already formatted by the app** — «۱٬۲۴۰», «۳۲٪», «۴ ساعت». The
/// two together are what a reader hears; `value` is the bare number, used only
/// to compute a bar's length or an arc's sweep, and is never rendered.
@immutable
class LumoChartPoint {
  const LumoChartPoint({required this.label, required this.value, required this.valueLabel, this.partValue, this.shareLabel, this.icon, this.tone})
      : assert(partValue == null || partValue >= 0, 'partValue is a portion of value; a negative portion has no bar to sit in.');

  /// The point's name — announced and (where there is room) drawn. REQUIRED.
  final String label;

  /// The magnitude. Geometry only: it is never shown and never announced.
  final double value;

  /// The figure as the app formatted it. REQUIRED — a bare number announces
  /// nothing, and `formatNumber` is the app's call, not the chart's.
  ///
  /// Where a bar carries a `partValue`, this ONE string carries both figures
  /// («۱۲۰ بازدید · ۱۴ سرنخ»): the app composes the sentence, because the word
  /// between two numbers is language, not layout.
  final String valueLabel;

  /// The part of `value` drawn SOLID inside the bar, with the rest of the bar
  /// left translucent — the stacked shape the Khroos analytics screen
  /// hand-rolled as `_MiniBars` (daily views, with the leads share filled in).
  /// Geometry only, exactly like `value`: the words live in `valueLabel`.
  final double? partValue;

  /// The same figure expressed as a share of the whole, ALREADY FORMATTED
  /// («۳۲٪»). Shown in a `LumoDonutChart`'s centre while this slice is
  /// selected, where the legend beside it keeps showing `valueLabel` — the
  /// Khroos `_MDonut` behaviour (count in the legend, share in the middle).
  /// Falls back to `valueLabel`.
  final String? shareLabel;

  /// Decoration beside the name on a horizontal bar (the funnel's stage icons).
  /// Excluded from semantics — an icon is not a name.
  final Widget? icon;

  /// Overrides the tone this point would take from `lumoChartSeriesTones`.
  final LumoChartTone? tone;

  /// What a reader hears for this point: «label: valueLabel».
  String get announcement => '$label: $valueLabel';
}

/// One line of a `LumoLineChart` — a named run of points with a tone.
@immutable
class LumoChartSeries {
  const LumoChartSeries({required this.label, required this.points, this.tone});

  /// The series' name, announced as the group node above its points. REQUIRED.
  final String label;
  /// The points of this series, in x order.
  final List<LumoChartPoint> points;
  /// The semantic tone the colour carries.
  final LumoChartTone? tone;
}

/// The first-paint growth, and the one place «reduce motion» is honoured.
///
/// `t` runs 0 → 1 once, on the first frame the widget is laid out in; under
/// `MediaQuery.disableAnimationsOf` the controller is set to 1 BEFORE the first
/// build, so the finished chart is what frame one paints — no animation runs,
/// which is what «total» means (the web's `CHART_MOTION_REDUCED_MOTION_IS_TOTAL`).
class _Grow extends StatefulWidget {
  const _Grow({required this.builder});
  final Widget Function(BuildContext context, double t) builder;

  @override
  State<_Grow> createState() => _GrowState();
}

class _GrowState extends State<_Grow> with SingleTickerProviderStateMixin {
  // 460 ms: the web's CHART_MOTION_MARK_DURATION, so the two platforms' charts
  // settle at the same moment.
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 460));
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _c.value = 1;
    } else {
      _c.forward();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _c,
        builder: (context, _) => widget.builder(context, Curves.easeOutCubic.transform(_c.value)),
      );
}

/// The named container every chart in this file wears: ONE node carrying the
/// chart's name and its summary, with `explicitChildNodes` so the per-point
/// nodes stay reachable underneath instead of being merged into the name.
///
/// `SemanticsRole.list` + `listItem` on the points, because that is the
/// structure a reader is actually offered — an ordered set of named figures,
/// the same thing the web serves as a `<table>`. Flutter 3.35 has no `chart`,
/// `table` or `graphics-object` role that survives its own debug validator
/// (`SemanticsRole.table` and friends are `_unimplemented` and throw), and a
/// role that crashes in debug is not a role.
class _ChartFrame extends StatelessWidget {
  const _ChartFrame({required this.label, required this.summary, required this.emptyLabel, required this.isEmpty, required this.child});

  final String label;
  final String? summary;
  final String emptyLabel;
  final bool isEmpty;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: label,
      // The empty state IS the chart's value: a reader hears the name and then
      // why there is nothing to walk, from the same node.
      value: isEmpty ? emptyLabel : summary,
      child: isEmpty
          // The sentence is announced by the node above, so the drawn copy is
          // excluded — it is heard exactly once.
          ? ExcludeSemantics(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(emptyLabel, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, height: 1.6, color: c.fgMuted)),
              ),
            )
          : child,
    );
  }
}

/// One point's node: named «label: valueLabel», laid over the mark it
/// describes, with the drawn copy of the same strings excluded so each is
/// heard once.
class _PointNode extends StatelessWidget {
  const _PointNode({required this.point, required this.child, this.isSelected, this.onTap});

  final LumoChartPoint point;
  final Widget child;
  final bool? isSelected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        container: true,
        role: SemanticsRole.listItem,
        label: point.announcement,
        selected: isSelected,
        button: onTap != null,
        onTap: onTap,
        child: ExcludeSemantics(child: child),
      );
}

/// Which way a bar chart's bars run.
enum LumoBarChartOrientation {
  /// Bars stand on a baseline; the categories are the INLINE axis and therefore
  /// mirror — the first category is on the right under RTL.
  vertical,

  /// Bars run along the inline axis, one category per row; the categories are
  /// the BLOCK axis, which does not mirror, and each bar grows from the reading
  /// start. The shape the Khroos analytics screen hand-rolled as `_BarList`.
  horizontal,
}

/// A bar chart — the web's `barY` mark, as widgets.
///
/// Vertical is the Khroos `_MiniBars` shape (a daily series under a card
/// header); horizontal is its `_BarList` (a ranked list with the figure beside
/// the name). Both were hand-rolled in the app because the library had no
/// chart, and both are proof of what a real screen needed.
///
///     LumoBarChart(
///       label: 'بازدید روزانه',
///       summary: 'بیشترین بازدید در روز پنجشنبه',
///       emptyLabel: 'هنوز داده‌ای برای این بازه ثبت نشده است.',
///       data: [LumoChartPoint(label: 'شنبه', value: 120, valueLabel: '۱۲۰')],
///     )
///
/// Direction is the trap this widget is tested for: the bars live in a `Row`,
/// so under fa-IR the FIRST category is drawn at the RIGHT and the axis runs
/// right-to-left, with no flag and no physical offset anywhere in the file.
///
/// STACKED: a point with a `partValue` draws its whole translucent and the part
/// solid inside it — one hue at two strengths, never a second colour. That is
/// `_MiniBars` (daily views with the leads share filled in) and it is the one
/// shape the app needed that a single-value bar chart could not express.
///
/// Cramped: a vertical chart sheds its category labels before it truncates one
/// (`segmented_control.dart`'s `_fit()` house rule) — a day name measured wider
/// than its bar's share of the row is not ellipsized to «ش…», it is dropped,
/// and the names stay in the semantics tree where they were never at risk.
class LumoBarChart extends StatelessWidget {
  const LumoBarChart({
    super.key,
    required this.label,
    required this.data,
    required this.emptyLabel,
    this.summary,
    this.orientation = LumoBarChartOrientation.vertical,
    this.tone = LumoChartTone.accent,
    this.partTone,
    this.maxValue,
    this.plotHeight = 120,
    this.showValueLabels = false,
  }) : assert(maxValue == null || maxValue > 0, 'maxValue is the top of the scale; zero or less leaves every bar undefined.');

  /// The chart's announced name. REQUIRED — an unnamed chart announces nothing.
  final String label;

  /// The plotted points, in reading order.
  final List<LumoChartPoint> data;

  /// What a reader is told when there is nothing to plot. REQUIRED.
  final String emptyLabel;

  /// One sentence about what the chart shows, announced as the chart node's
  /// value right after its name («بیشترین بازدید در روز پنجشنبه»).
  final String? summary;
  /// Which axis the control runs along.
  final LumoBarChartOrientation orientation;

  /// The tone every bar takes, unless a point names its own.
  final LumoChartTone tone;

  /// The tone of the SOLID part inside a bar that has a `partValue`. Defaults
  /// to the bar's own tone, so the stack is one hue at two strengths — never a
  /// second colour, which is how a stacked bar quietly becomes a rainbow.
  final LumoChartTone? partTone;

  /// The top of the scale. Defaults to the largest `value` in `data`.
  final double? maxValue;

  /// Height of the bar area (vertical only), in logical pixels.
  final double plotHeight;

  /// Draw each point's `valueLabel` above its bar (vertical) — horizontal
  /// always shows it, because a ranked row has room for it.
  final bool showValueLabels;

  double get _max {
    if (maxValue != null) return maxValue!;
    var m = 0.0;
    for (final p in data) {
      m = math.max(m, p.value);
    }
    // A series of zeroes still has a scale; every bar is simply empty.
    return m <= 0 ? 1 : m;
  }

  /// Do the category names fit under their bars? The house rule: shed the
  /// decoration (the drawn names), never the words. Measured in the inherited
  /// face so Persian metrics count, not Latin ones.
  bool _labelsFit(BuildContext context, double maxWidth) {
    if (!maxWidth.isFinite || data.isEmpty) return false;
    final per = maxWidth / data.length;
    final style = DefaultTextStyle.of(context).style.copyWith(fontSize: 10, fontWeight: FontWeight.w600);
    final direction = Directionality.of(context);
    for (final p in data) {
      final tp = TextPainter(text: TextSpan(text: p.label, style: style), textDirection: direction, maxLines: 1)..layout();
      if (tp.width + 4 > per) return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) => _ChartFrame(
        label: label,
        summary: summary,
        emptyLabel: emptyLabel,
        isEmpty: data.isEmpty,
        child: orientation == LumoBarChartOrientation.vertical ? _vertical(context) : _horizontal(context),
      );

  Widget _vertical(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final max = _max;
    return LayoutBuilder(
      builder: (context, constraints) {
        final labels = _labelsFit(context, constraints.maxWidth);
        return _Grow(
          builder: (context, t) => Row(
            spacing: 4,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (final p in data)
                Expanded(
                  child: _PointNode(
                    point: p,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (showValueLabels)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text(p.valueLabel, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: c.fgMuted, height: 1.2)),
                          ),
                        SizedBox(
                          height: plotHeight,
                          child: Align(
                            alignment: AlignmentDirectional.bottomCenter,
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 20),
                              child: Container(
                                width: double.infinity,
                                // A non-zero figure keeps at least a sliver of
                                // bar so the picture does not contradict the
                                // announced value; the sliver grows with `t`
                                // too, so «reduce motion» is still total.
                                height: math.max(p.value > 0 ? 2 * t : 0, (p.value / max).clamp(0, 1) * plotHeight * t),
                                clipBehavior: Clip.antiAlias,
                                decoration: BoxDecoration(
                                  // With a part, the WHOLE goes translucent
                                  // and the part is drawn solid inside it —
                                  // one hue, one of them a subset of the other,
                                  // rather than a second colour off the scheme.
                                  color: p.partValue == null ? lumoChartToneColour(p.tone ?? tone, c) : lumoChartToneColour(p.tone ?? tone, c).withValues(alpha: 0.28),
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(LumoRadius.sm)),
                                ),
                                child: p.partValue == null || p.value <= 0
                                    ? null
                                    : Align(
                                        alignment: AlignmentDirectional.bottomCenter,
                                        child: FractionallySizedBox(
                                          heightFactor: (p.partValue! / p.value).clamp(0, 1),
                                          widthFactor: 1,
                                          child: ColoredBox(color: lumoChartToneColour(partTone ?? p.tone ?? tone, c)),
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ),
                        if (labels)
                          Padding(
                            padding: const EdgeInsets.only(top: 5),
                            child: Text(p.label, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: c.fgMuted, height: 1.2)),
                          ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _horizontal(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final max = _max;
    return _Grow(
      builder: (context, t) => Column(
        spacing: 12,
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final p in data)
            _PointNode(
              point: p,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      // The funnel's stage icon — decoration at the inline start.
                      if (p.icon != null)
                        Padding(
                          padding: const EdgeInsetsDirectional.only(end: 8),
                          child: IconTheme.merge(data: IconThemeData(size: 14, color: c.fgMuted), child: p.icon!),
                        ),
                      Expanded(child: Text(p.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: c.fg))),
                      Padding(
                        padding: const EdgeInsetsDirectional.only(start: 10),
                        child: Text(p.valueLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: c.fgMuted)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(LumoRadius.full),
                    child: SizedBox(
                      height: 8,
                      child: ColoredBox(
                        color: c.surfaceSunken,
                        // The fill grows from the inline START — right under
                        // fa-IR, left under en-US, from `AlignmentDirectional`.
                        child: Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: FractionallySizedBox(
                            widthFactor: ((p.value / max) * t).clamp(0, 1),
                            heightFactor: 1,
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                color: p.partValue == null ? lumoChartToneColour(p.tone ?? tone, c) : lumoChartToneColour(p.tone ?? tone, c).withValues(alpha: 0.28),
                                borderRadius: BorderRadius.circular(LumoRadius.full),
                              ),
                              // The stacked part, from the same reading start.
                              child: p.partValue == null || p.value <= 0
                                  ? null
                                  : Align(
                                      alignment: AlignmentDirectional.centerStart,
                                      child: FractionallySizedBox(
                                        widthFactor: (p.partValue! / p.value).clamp(0, 1),
                                        heightFactor: 1,
                                        child: DecoratedBox(decoration: BoxDecoration(color: lumoChartToneColour(partTone ?? p.tone ?? tone, c), borderRadius: BorderRadius.circular(LumoRadius.full))),
                                      ),
                                    ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// A line chart — the web's `lineY`/`areaY` marks.
///
/// The polyline is the one mark widgets cannot draw, so it is painted; ON TOP
/// of it sits a `Row` of one transparent, named slot per point, which is what a
/// reader actually walks and what a touch-explore lands on. The `Row` mirrors
/// itself and the painter is handed the same `TextDirection`, so the drawn line
/// and the announced order agree in both directions: under RTL the first point
/// is at the RIGHT.
///
/// Up to five series (`lumoChartSeriesTones`); a sixth is refused at
/// construction rather than given a colour the theme does not own.
class LumoLineChart extends StatelessWidget {
  const LumoLineChart({
    super.key,
    required this.label,
    required this.series,
    required this.emptyLabel,
    this.summary,
    this.plotHeight = 140,
    this.isArea = false,
    this.showCategoryLabels = true,
  });

  /// The chart's announced name. REQUIRED.
  final String label;

  /// The lines. At most five — see the assert.
  final List<LumoChartSeries> series;

  /// What a reader is told when there is nothing to plot. REQUIRED.
  final String emptyLabel;

  /// One sentence about what the chart shows; announced as the chart's value.
  final String? summary;

  /// Height of the plot area, in logical pixels.
  final double plotHeight;

  /// Fill the area under each line (the web's `areaY`).
  final bool isArea;

  /// Draw the first series' point labels under the plot. They are announced
  /// either way; this is the drawn axis, and it is dropped when it will not fit.
  final bool showCategoryLabels;

  bool get _isEmpty => series.isEmpty || series.every((s) => s.points.isEmpty);

  double get _max {
    var m = 0.0;
    for (final s in series) {
      for (final p in s.points) {
        m = math.max(m, p.value);
      }
    }
    return m <= 0 ? 1 : m;
  }

  @override
  Widget build(BuildContext context) {
    // In build(), not the const constructor: `List.length` is not a constant
    // expression — see the note on LumoDonutChart.build.
    assert(series.length <= 5,
        'A Lumo chart paints from the scheme, which has five plot tones and no sixth. Split the chart, or fold the tail into one «other» series — inventing a colour is refused.');
    assert(series.every((s) => s.points.isNotEmpty) || series.isEmpty, 'A named series with no points draws nothing and announces nothing; leave it out of the list instead.');
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final max = _max;
    final tones = [for (var i = 0; i < series.length; i++) series[i].tone ?? lumoChartSeriesTones[i]];
    final longest = _isEmpty ? const <LumoChartPoint>[] : series.reduce((a, b) => a.points.length >= b.points.length ? a : b).points;

    return _ChartFrame(
      label: label,
      summary: summary,
      emptyLabel: emptyLabel,
      isEmpty: _isEmpty,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final labels = showCategoryLabels && _labelsFit(context, constraints.maxWidth, longest);
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                height: plotHeight,
                child: _Grow(
                  builder: (context, t) => Stack(
                    children: [
                      // The picture. Excluded: pixels are not a record.
                      Positioned.fill(
                        child: ExcludeSemantics(
                          child: CustomPaint(
                            painter: _LinePainter(
                              series: series,
                              colours: [for (final tone in tones) lumoChartToneColour(tone, c)],
                              max: max,
                              t: t,
                              direction: scope.direction,
                              isArea: isArea,
                              baseline: c.border,
                            ),
                          ),
                        ),
                      ),
                      // The record. One named, hit-testable slot per point, in
                      // reading order — the `Row` mirrors, the painter mirrors,
                      // and the two stay over each other.
                      Positioned.fill(child: _pointNodes(context)),
                    ],
                  ),
                ),
              ),
              if (labels)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: ExcludeSemantics(
                    child: Row(
                      children: [
                        for (final p in longest)
                          Expanded(child: Text(p.label, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: c.fgMuted, height: 1.2))),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  /// One series: the points are direct children of the chart's list node.
  /// Several: each series becomes a NAMED group with its own points under it,
  /// so «کدام خط؟» is answered before the figures are.
  Widget _pointNodes(BuildContext context) {
    if (series.length == 1) return _slots(series.first);
    return Column(
      children: [
        for (final s in series)
          Expanded(
            child: Semantics(
              container: true,
              explicitChildNodes: true,
              role: SemanticsRole.listItem,
              label: s.label,
              // The group is a listItem of the chart AND a list of its points:
              // `listItem` requires a `list` parent, and this is how a nested
              // series keeps both halves valid.
              child: Semantics(container: true, explicitChildNodes: true, role: SemanticsRole.list, child: _slots(s)),
            ),
          ),
      ],
    );
  }

  Widget _slots(LumoChartSeries s) => Row(
        children: [
          for (final p in s.points) Expanded(child: _PointNode(point: p, child: const SizedBox.expand())),
        ],
      );

  bool _labelsFit(BuildContext context, double maxWidth, List<LumoChartPoint> points) {
    if (!maxWidth.isFinite || points.isEmpty) return false;
    final per = maxWidth / points.length;
    final style = DefaultTextStyle.of(context).style.copyWith(fontSize: 10, fontWeight: FontWeight.w600);
    final direction = Directionality.of(context);
    for (final p in points) {
      final tp = TextPainter(text: TextSpan(text: p.label, style: style), textDirection: direction, maxLines: 1)..layout();
      if (tp.width + 4 > per) return false;
    }
    return true;
  }
}

/// A sparkline — one series, no axis, no labels, the height of a line of text.
///
/// The compact form of `LumoLineChart`, for a trend beside a figure in a stat
/// tile (the shape the Khroos analytics header wanted and drew as a strip of
/// bars because there was nothing to call). It is compact in PIXELS only: every
/// point is still its own named node, because a chart small enough to ignore is
/// not a chart small enough to leave out of the semantics tree.
class LumoSparkline extends StatelessWidget {
  const LumoSparkline({
    super.key,
    required this.label,
    required this.data,
    required this.emptyLabel,
    this.summary,
    this.tone = LumoChartTone.accent,
    this.plotHeight = 32,
    this.isArea = true,
  });

  /// The trend's announced name. REQUIRED.
  final String label;
  /// The points to plot, in x order.
  final List<LumoChartPoint> data;

  /// What a reader is told when there is nothing to plot. REQUIRED.
  final String emptyLabel;
  /// A sentence describing the shape for a reader who cannot see it. A chart without one is decoration.
  final String? summary;
  /// The semantic tone the colour carries.
  final LumoChartTone tone;
  /// Height of the plot, in logical pixels.
  final double plotHeight;
  /// Whether the area under the line is filled.
  final bool isArea;

  @override
  Widget build(BuildContext context) => LumoLineChart(
        label: label,
        summary: summary,
        emptyLabel: emptyLabel,
        plotHeight: plotHeight,
        isArea: isArea,
        showCategoryLabels: false,
        series: data.isEmpty ? const <LumoChartSeries>[] : [LumoChartSeries(label: label, points: data, tone: tone)],
      );
}

/// The polyline, its dots and (optionally) the area under it.
///
/// Direction is a constructor argument, not a guess: `x = 0` is the reading
/// START, which is the RIGHT edge under RTL. The growth animation is a clip
/// that opens from the same edge, so the line is drawn in the order it is read.
class _LinePainter extends CustomPainter {
  const _LinePainter({required this.series, required this.colours, required this.max, required this.t, required this.direction, required this.isArea, required this.baseline});

  final List<LumoChartSeries> series;
  final List<Color> colours;
  final double max;
  final double t;
  final TextDirection direction;
  final bool isArea;
  final Color baseline;

  static const double _stroke = 2;
  static const double _dot = 2.5;

  @override
  void paint(Canvas canvas, Size size) {
    // Inset so a stroke or a dot at the extremes is not half clipped away.
    final inset = math.max(_stroke, _dot) + 1;
    final w = math.max(size.width - inset * 2, 0.0);
    final h = math.max(size.height - inset * 2, 0.0);

    canvas.drawLine(
      Offset(0, size.height - 0.5),
      Offset(size.width, size.height - 0.5),
      Paint()
        ..color = baseline
        ..strokeWidth = 1,
    );

    if (t <= 0 || w <= 0 || h <= 0) return;
    canvas.save();
    // The reveal opens from the reading start: right→left under RTL.
    canvas.clipRect(direction == TextDirection.rtl
        ? Rect.fromLTRB(size.width * (1 - t), 0, size.width, size.height)
        : Rect.fromLTRB(0, 0, size.width * t, size.height));

    for (var s = 0; s < series.length; s++) {
      final points = series[s].points;
      if (points.isEmpty) continue;
      final colour = colours[s];
      final n = points.length;
      Offset at(int i) {
        final fraction = n == 1 ? 0.5 : i / (n - 1);
        final x = direction == TextDirection.rtl ? inset + w * (1 - fraction) : inset + w * fraction;
        final y = inset + h * (1 - (points[i].value / max).clamp(0, 1));
        return Offset(x, y);
      }

      final path = Path()..moveTo(at(0).dx, at(0).dy);
      for (var i = 1; i < n; i++) {
        path.lineTo(at(i).dx, at(i).dy);
      }

      if (isArea) {
        final area = Path.from(path)
          ..lineTo(at(n - 1).dx, size.height)
          ..lineTo(at(0).dx, size.height)
          ..close();
        canvas.drawPath(area, Paint()..color = colour.withValues(alpha: 0.12));
      }

      canvas.drawPath(
        path,
        Paint()
          ..color = colour
          ..style = PaintingStyle.stroke
          ..strokeWidth = _stroke
          ..strokeJoin = StrokeJoin.round
          ..strokeCap = StrokeCap.round,
      );
      // Dots only where they are legible; a 30-point series is a line.
      if (n <= 14) {
        for (var i = 0; i < n; i++) {
          canvas.drawCircle(at(i), _dot, Paint()..color = colour);
        }
      }
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_LinePainter old) =>
      old.t != t || old.direction != direction || old.max != max || old.series != series || old.isArea != isArea || old.baseline != baseline || old.colours != colours;
}

/// A donut chart — the web's pie, which `chart.tsx` does not port.
///
/// The ring is painted and EXCLUDED; the legend beside it is the series, one
/// named node per slice, and is therefore not optional: it is the only form of
/// this chart a reader who cannot see it receives. That is the Khroos `_MDonut`
/// shape (a ring with a tappable legend and a total in the middle) with the
/// accessibility half no longer left to the app.
///
/// The sweep starts at twelve o'clock and runs clockwise in BOTH directions. A
/// ring has no inline axis to mirror — the same reason the web's
/// `CHART_PIE_SWEEP` carries no direction — and the reading order a reader is
/// actually offered is the legend's, which does mirror.
///
/// At most five slices; a sixth is refused rather than coloured by invention.
/// Selection is optional and CONTROLLED (`selectedIndex` + `onSelected`, the
/// web's `onSelectDatum`): tapping a legend row selects its slice, tapping the
/// selected row clears it, and the centre shows that slice's own figure.
class LumoDonutChart extends StatelessWidget {
  const LumoDonutChart({
    super.key,
    required this.label,
    required this.data,
    required this.emptyLabel,
    this.summary,
    this.centreLabel,
    this.centreValueLabel,
    this.selectedIndex,
    this.onSelected,
    this.diameter = 120,
    this.thickness = 16,
  });

  /// The chart's announced name. REQUIRED.
  final String label;

  /// The slices, in reading order — at most five.
  final List<LumoChartPoint> data;

  /// What a reader is told when there is nothing to plot. REQUIRED.
  final String emptyLabel;

  /// One sentence about what the chart shows; announced as the chart's value.
  final String? summary;

  /// The word under the figure in the middle («سرنخ»). Drawn only.
  final String? centreLabel;

  /// The figure in the middle, ALREADY FORMATTED («۱۲۴»). Replaced by the
  /// selected slice's own `valueLabel` while a slice is selected.
  final String? centreValueLabel;

  /// The selected slice (controlled), or `null` for none.
  final int? selectedIndex;

  /// Called with the tapped slice, or `null` when the selected one is tapped
  /// again. Omitting it makes the legend static rather than a set of buttons.
  final ValueChanged<int?>? onSelected;
  /// Outside diameter of the ring, in logical pixels.
  final double diameter;
  /// Thickness of the ring, in logical pixels.
  final double thickness;

  double get _total {
    var sum = 0.0;
    for (final p in data) {
      sum += math.max(p.value, 0);
    }
    return sum;
  }

  @override
  Widget build(BuildContext context) {
    // Checked HERE, not in the const constructor: `List.length` is not a
    // constant expression, so an assert that reads it makes `const
    // LumoDonutChart(…)` a COMPILE error at every call site — valid arguments
    // included — which is worse than no check, because it fails closed on
    // correct code and never runs on the incorrect kind. `segmented_control.dart`
    // learned this first; `color_input.dart` and `select.dart` already do it this way.
    assert(data.length <= 5,
        'A Lumo chart paints from the scheme, which has five plot tones and no sixth. Fold the tail into one «other» slice — inventing a colour is refused.');
    assert(selectedIndex == null || (selectedIndex! >= 0 && selectedIndex! < data.length), 'selectedIndex must name a slice in data.');
    final c = LumoScope.of(context).colours;
    final total = _total;
    final colours = [for (var i = 0; i < data.length; i++) lumoChartToneColour(data[i].tone ?? lumoChartSeriesTones[i], c)];
    final active = selectedIndex == null ? null : data[selectedIndex!];

    return _ChartFrame(
      label: label,
      summary: summary,
      emptyLabel: emptyLabel,
      isEmpty: data.isEmpty || total <= 0,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final ring = SizedBox(
            width: diameter,
            height: diameter,
            child: _Grow(
              builder: (context, t) => Stack(
                alignment: Alignment.center,
                children: [
                  Positioned.fill(
                    child: ExcludeSemantics(
                      child: CustomPaint(
                        painter: _DonutPainter(
                          fractions: [for (final p in data) math.max(p.value, 0) / total],
                          colours: colours,
                          track: c.surfaceSunken,
                          selected: selectedIndex,
                          thickness: thickness,
                          t: t,
                        ),
                      ),
                    ),
                  ),
                  if (centreValueLabel != null || active != null)
                    ExcludeSemantics(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // A selected slice shows ITS OWN figure: its share
                            // where the app gave one («۳۲٪»), otherwise the
                            // same figure the legend carries.
                            Text(active == null ? centreValueLabel! : (active.shareLabel ?? active.valueLabel), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, height: 1.2, color: active == null ? c.fg : colours[selectedIndex!])),
                            if (active != null || centreLabel != null)
                              Text(active?.label ?? centreLabel!, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: TextStyle(fontSize: 10, height: 1.4, color: c.fgMuted)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );

          final legend = Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var i = 0; i < data.length; i++) _legendRow(context, i, colours[i]),
            ],
          );

          // Cramped: the legend drops UNDER the ring rather than squeezing the
          // names into an ellipsis — decoration (the side-by-side layout) goes
          // before the words do.
          final side = constraints.maxWidth.isFinite && constraints.maxWidth < diameter + 150;
          return side
              ? Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [Center(child: ring), const SizedBox(height: 12), legend])
              : Row(crossAxisAlignment: CrossAxisAlignment.center, children: [ring, const SizedBox(width: 16), Expanded(child: legend)]);
        },
      ),
    );
  }

  Widget _legendRow(BuildContext context, int index, Color colour) {
    final c = LumoScope.of(context).colours;
    final p = data[index];
    final selected = selectedIndex == index;
    return _PointNode(
      point: p,
      isSelected: onSelected == null ? null : selected,
      onTap: onSelected == null ? null : () => onSelected!(selected ? null : index),
      child: InkWell(
        onTap: onSelected == null ? null : () => onSelected!(selected ? null : index),
        borderRadius: BorderRadius.circular(LumoRadius.sm),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(color: selected ? c.surfaceHover : Colors.transparent, borderRadius: BorderRadius.circular(LumoRadius.sm)),
          child: Row(
            children: [
              // The swatch repeats what the row already says in words: colour
              // is never the only carrier (WCAG 1.4.1).
              // `h-2 w-2 rounded-[2px]` on the web: a legend swatch is below the
              // radius ramp on purpose — the smallest Lumo step (6) on an 8px
              // chip is a circle, and a circle reads as a status dot, not a
              // series key. The web states the exception with an arbitrary
              // value; this states it with a number and this comment. It had
              // drifted to 10×10 with a 3px corner, which is neither.
              Container(width: 8, height: 8, decoration: BoxDecoration(color: colour, borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 8),
              Expanded(child: Text(p.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.fg))),
              Padding(
                padding: const EdgeInsetsDirectional.only(start: 8),
                child: Text(p.valueLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: c.fgMuted)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  const _DonutPainter({required this.fractions, required this.colours, required this.track, required this.selected, required this.thickness, required this.t});

  final List<double> fractions;
  final List<Color> colours;
  final Color track;
  final int? selected;
  final double thickness;
  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    final centre = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) - thickness) / 2;
    if (radius <= 0) return;
    canvas.drawCircle(
      centre,
      radius,
      Paint()
        ..color = track
        ..style = PaintingStyle.stroke
        ..strokeWidth = thickness,
    );
    // Twelve o'clock, clockwise, in both directions — a ring has no inline axis.
    var start = -math.pi / 2;
    for (var i = 0; i < fractions.length; i++) {
      final sweep = fractions[i] * 2 * math.pi * t;
      if (sweep > 0) {
        canvas.drawArc(
          Rect.fromCircle(center: centre, radius: radius),
          start,
          sweep,
          false,
          Paint()
            ..color = selected == null || selected == i ? colours[i] : colours[i].withValues(alpha: 0.35)
            ..style = PaintingStyle.stroke
            ..strokeWidth = selected == i ? thickness + 3 : thickness,
        );
      }
      start += fractions[i] * 2 * math.pi * t;
    }
  }

  @override
  bool shouldRepaint(_DonutPainter old) =>
      old.t != t || old.selected != selected || old.fractions != fractions || old.colours != colours || old.track != track || old.thickness != thickness;
}
