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
/// children, which would round the wrong corners under RTL.
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
            child: Stack(
              children: [
                // The pill: one widget, aligned by fraction along the inline axis
                // (−1 = reading start, +1 = reading end), so it slides and mirrors.
                Positioned.fill(
                  child: ExcludeSemantics(
                    child: AnimatedAlign(
                      duration: const Duration(milliseconds: 150),
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
                Row(
                  children: [
                    for (final s in widget.segments)
                      Expanded(
                        child: _Segment(
                          segment: s,
                          selected: s.id == _value,
                          disabled: widget.isDisabled || s.isDisabled,
                          fontSize: sm ? 12 : 14,
                          onTap: () => _select(s.id),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  const _Segment({required this.segment, required this.selected, required this.disabled, required this.fontSize, required this.onTap});
  final LumoSegment segment;
  final bool selected;
  final bool disabled;
  final double fontSize;
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
            padding: EdgeInsetsDirectional.symmetric(horizontal: fontSize < 14 ? 12 : 16),
            child: ExcludeSemantics(
              child: IconTheme(
                data: IconThemeData(size: 16, color: fg),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  spacing: 8,
                  children: [
                    if (segment.icon != null) segment.icon!,
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
