import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

enum LumoSegmentedControlSize { sm, md }

/// One option of a segmented control: `id` REQUIRED (what the control reports),
/// `label` REQUIRED (the announced name — an icon is not a name; the web's
/// `aria-label` for an icon segment). `iconOnly` draws just the icon and keeps
/// the label for the reader.
class LumoSegment {
  const LumoSegment({required this.id, required this.label, this.icon, this.iconOnly = false, this.isDisabled = false}) : assert(!iconOnly || icon != null, 'An icon-only segment needs an icon.');
  final String id;
  final String label;
  final Widget? icon;
  final bool iconOnly;
  final bool isDisabled;
}

/// Two to four mutually exclusive options, shown all at once — the web
/// `SegmentedControl`: `label` REQUIRED (nothing else names the group; it is
/// announced, not drawn). Controlled (`value`) and uncontrolled
/// (`defaultValue`) like the web's `selectedKeys`/`defaultSelectedKeys` — a
/// radio group holds exactly one key, so Dart takes the String. The selected
/// segment is a `surface` pill on a `surfaceSunken` track that slides along
/// the INLINE axis (`AlignmentDirectional`: the first segment sits at the
/// reading start — right in Persian). Each segment is a button announced with
/// its selected state; the rounding lives on the TRACK, never on first/last
/// children, which would round the wrong corners under RTL. The pill's travel
/// collapses to nothing under `disableAnimations` — it is at the new segment on
/// the same frame.
///
/// **A segment FILLS the track's height.** The segment row is `Positioned.fill`
/// with `CrossAxisAlignment.stretch` for a measured reason: as a plain `Stack`
/// child the row was sized by its content and aligned `topStart`, so at `md`
/// each segment measured 175×20 inside a 32-tall control — the labels rode 6 px
/// high with 12 px of dead track under them, and two thirds of the pill was not
/// tappable. Both come from the same missing constraint.
class LumoSegmentedControl extends StatefulWidget {
  const LumoSegmentedControl({super.key, required this.label, required this.segments, this.value, this.defaultValue, this.onChanged, this.size = LumoSegmentedControlSize.md, this.isDisabled = false});
  final String label;
  final List<LumoSegment> segments;
  /// Controlled selection; `null` leaves the state to the widget (`defaultValue`).
  final String? value;
  final String? defaultValue;
  final ValueChanged<String>? onChanged;
  final LumoSegmentedControlSize size;
  final bool isDisabled;

  @override
  State<LumoSegmentedControl> createState() => _LumoSegmentedControlState();
}

class _LumoSegmentedControlState extends State<LumoSegmentedControl> {
  late String? _uncontrolled = widget.defaultValue;
  // An empty selection is unreachable by construction, as on the web: the first segment holds it.
  String get _value => widget.value ?? _uncontrolled ?? widget.segments.first.id;

  void _select(String next) {
    if (widget.value == null) setState(() => _uncontrolled = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    // Checked here, not in the const constructor: `length` is not a constant expression.
    assert(widget.segments.length >= 2, 'A segmented control shows at least two options.');
    final c = LumoScope.of(context).colours;
    final sm = widget.size == LumoSegmentedControlSize.sm;
    final height = sm ? 28.0 : 32.0;
    final n = widget.segments.length;
    final index = widget.segments.indexWhere((s) => s.id == _value).clamp(0, n - 1);
    // «Reduce motion» is the platform's answer, not a parameter of ours — the
    // same spelling as `disclosure.dart`: the pill does not travel, it arrives.
    final motion = !MediaQuery.disableAnimationsOf(context);
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      enabled: !widget.isDisabled,
      child: Opacity(
        opacity: widget.isDisabled ? 0.5 : 1,
        child: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: c.surfaceSunken, border: Border.all(color: c.border), borderRadius: BorderRadius.circular(LumoRadius.md)),
          child: SizedBox(
            height: height,
            child: LayoutBuilder(builder: (context, constraints) {
              // A segment sheds its padding BEFORE it truncates its label: a
              // control in a narrow row (a filter bar beside a search field)
              // must still read «نقشه», not «ن…». The label is measured in the
              // inherited face, so Persian metrics count, not Latin ones.
              final base = sm ? 12.0 : 16.0;
              final fit = _fit(context, constraints.maxWidth, base);
              return Stack(
              children: [
                // The pill: one widget, aligned by fraction along the inline axis
                // (−1 = reading start, +1 = reading end), so it slides and mirrors.
                Positioned.fill(
                  child: ExcludeSemantics(
                    child: AnimatedAlign(
                      duration: motion ? const Duration(milliseconds: 150) : Duration.zero,
                      curve: Curves.easeOut,
                      alignment: AlignmentDirectional(n == 1 ? 0 : -1 + 2 * index / (n - 1), 0),
                      child: FractionallySizedBox(
                        widthFactor: 1 / n,
                        heightFactor: 1,
                        child: DecoratedBox(decoration: BoxDecoration(color: c.surface, border: Border.all(color: c.border), borderRadius: BorderRadius.circular(LumoRadius.sm))),
                      ),
                    ),
                  ),
                ),
                // `Positioned.fill` + `stretch`: a segment is as tall as the
                // track, so its label is centred and its whole pill is the
                // touch target — see the docblock.
                Positioned.fill(
                  child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final s in widget.segments)
                      Expanded(
                        child: _Segment(
                          segment: s,
                          selected: s.id == _value,
                          disabled: widget.isDisabled || s.isDisabled,
                          fontSize: sm ? 12 : 14,
                          padding: fit.padding,
                          showIcon: fit.showIcon,
                          onTap: () => _select(s.id),
                        ),
                      ),
                  ],
                  ),
                ),
              ],
              );
            }),
          ),
        ),
      ),
    );
  }

  /// How a cramped control gives ground, in order: **padding first** (down to
  /// 4), **then the icon** — a label is the segment's name and meaning, an icon
  /// beside it is decoration, so the words are the last thing to go. Only when
  /// even a bare label will not fit does the text ellipsize, which at that width
  /// is the honest outcome. Returns the base padding when the width is
  /// unbounded — there is nothing to fit into.
  ({double padding, bool showIcon}) _fit(BuildContext context, double maxWidth, double base) {
    if (!maxWidth.isFinite) return (padding: base, showIcon: true);
    final n = widget.segments.length;
    final per = maxWidth / n;
    final style = DefaultTextStyle.of(context).style.copyWith(fontSize: widget.size == LumoSegmentedControlSize.sm ? 12 : 14, fontWeight: FontWeight.w500);
    var labels = 0.0; // the widest label on its own
    var withIcons = 0.0; // the widest label plus its icon and gap
    for (final s in widget.segments) {
      // An icon-only segment shows no label; it needs the icon and nothing else.
      if (s.iconOnly) {
        labels = math.max(labels, 16);
        withIcons = math.max(withIcons, 16);
        continue;
      }
      final tp = TextPainter(text: TextSpan(text: s.label, style: style), textDirection: Directionality.of(context), maxLines: 1)..layout();
      labels = math.max(labels, tp.width);
      withIcons = math.max(withIcons, tp.width + (s.icon == null ? 0 : 24));
    }
    // Half a pixel of slack: a label that fits exactly must not ellipsize.
    final showIcon = withIcons + 8 <= per - 0.5;
    final needed = showIcon ? withIcons : labels;
    return (padding: ((per - needed - 0.5) / 2).clamp(4.0, base), showIcon: showIcon);
  }
}

class _Segment extends StatelessWidget {
  const _Segment({required this.segment, required this.selected, required this.disabled, required this.fontSize, required this.padding, required this.showIcon, required this.onTap});
  final LumoSegment segment;
  final bool selected;
  final bool disabled;
  final double fontSize;
  /// Symmetric inline padding, computed by the control so every label fits.
  final double padding;
  /// False when the control had to drop icons to keep the labels whole.
  final bool showIcon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final fg = selected ? c.fg : c.fgMuted;
    return Semantics(
      button: true,
      selected: selected,
      enabled: !disabled,
      label: segment.label,
      child: Opacity(
        opacity: disabled ? 0.5 : 1,
        child: InkWell(
          onTap: disabled ? null : onTap,
          borderRadius: BorderRadius.circular(LumoRadius.sm),
          child: Padding(
            padding: EdgeInsetsDirectional.symmetric(horizontal: padding),
            child: ExcludeSemantics(
              child: IconTheme(
                data: IconThemeData(size: 16, color: fg),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  spacing: segment.icon == null || !(showIcon || segment.iconOnly) ? 0 : 8,
                  children: [
                    // An icon-only segment always keeps its icon — it is all it has.
                    if (segment.icon != null && (showIcon || segment.iconOnly)) segment.icon!,
                    if (!segment.iconOnly) Flexible(child: Text(segment.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: fontSize, fontWeight: FontWeight.w500, color: fg))),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
