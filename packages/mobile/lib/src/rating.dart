import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'scope.dart';
import 'tokens.g.dart';

enum LumoRatingSize { sm, md, lg }

const _star = {LumoRatingSize.sm: 16.0, LumoRatingSize.md: 20.0, LumoRatingSize.lg: 24.0};

/// A star rating, read-only or interactive — the web `Rating`. The value is a
/// number and the stars are glyphs, so the announced strings cannot come from
/// the content: `label` REQUIRED (the rating's name, e.g. «امتیاز شما»),
/// `valueLabel` REQUIRED (the pre-formatted score the app built with
/// `formatNumber`, e.g. «۴٫۷ از ۵» — announced ONCE as the value), and, when
/// `onChanged` is set, `starLabel` REQUIRED (asserted): the name of one star
/// from its position, e.g. `(n) => '${formatNumber(n, locale)} ستاره'`.
///
/// Read-only: one `image` node — name + value; fractional values clip the fill
/// (4.5 fills four and a half) from the reading START. Interactive: a
/// `radioGroup` named by `label` carrying the value, one radio per star (checked
/// = the chosen one, as on the web). The stars are a `Row`: the first star sits
/// at the RIGHT under fa-IR and the fill runs in reading direction with no
/// mirroring code. Controlled (`value`) or uncontrolled (`defaultValue`).
///
/// **Touch, then fit.** An interactive star PAINTS the web's box (`size-4/5/6`
/// inside `p-0.5`, so 20/24/28) and SITS IN a `LumoControl.lg` (44) cell —
/// measured before, a md star was a 24x24 target and an lg one 28x28. A row of
/// 44s is wider than a phone once there are many stars, so the rating gives
/// ground in the order `segmented_control.dart`'s `_fit()` sets: the touch
/// padding first (the cell shrinks toward the painted star), and only when even
/// the bare stars will not fit does the row SCALE. A star has no words to
/// truncate, so scaling is the honest last resort — before this, ten `lg` stars
/// overflowed a 240 dp row by 40 px.
class LumoRating extends StatefulWidget {
  const LumoRating({super.key, required this.label, required this.valueLabel, this.value, this.defaultValue, this.max = 5, this.onChanged, this.starLabel, this.size = LumoRatingSize.md, this.isDisabled = false})
      : assert(onChanged == null || starLabel != null, 'An interactive rating needs `starLabel` — the announced name of each star.'),
        assert(max > 0, 'max must be at least 1.');
  /// Announced name of the rating. Required.
  final String label;
  /// The whole score as the app formatted it, e.g. «۴٫۷ از ۵». Announced once. Required.
  final String valueLabel;
  /// The score (controlled). Fractional values clip the fill when read-only.
  final double? value;
  /// The initially chosen score (uncontrolled, interactive).
  final double? defaultValue;
  /// How many stars.
  final int max;
  /// Called with the chosen score; makes the rating interactive.
  final ValueChanged<double>? onChanged;
  /// Announced name of one star from its 1-based position. Required with `onChanged`.
  final String Function(int position)? starLabel;
  final LumoRatingSize size;
  final bool isDisabled;

  @override
  State<LumoRating> createState() => _LumoRatingState();
}

class _LumoRatingState extends State<LumoRating> {
  late double _value = widget.value ?? widget.defaultValue ?? 0;

  double get _current => widget.value ?? _value;

  void _choose(int position) {
    if (widget.value == null) setState(() => _value = position.toDouble());
    widget.onChanged?.call(position.toDouble());
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final side = _star[widget.size]!;
    final interactive = widget.onChanged != null;
    final v = _current.clamp(0.0, widget.max.toDouble()).toDouble();

    // The painted star box: the glyph inside the web's `p-0.5`.
    final drawn = side + 4;

    Widget star(int position, double cell) {
      // How much of THIS star is filled: 1 below the value, a fraction on the boundary, 0 above.
      final fraction = (v - (position - 1)).clamp(0.0, 1.0);
      final glyph = Stack(
        children: [
          Icon(Icons.star_rounded, size: side, color: c.fgSubtle),
          // The fill, clipped from the reading START — `AlignmentDirectional`, so it opens from the right in Persian.
          ClipRect(child: Align(alignment: AlignmentDirectional.centerStart, widthFactor: fraction, heightFactor: 1, child: Icon(Icons.star_rounded, size: side, color: c.caution))),
        ],
      );
      if (!interactive) return Padding(padding: const EdgeInsets.all(2), child: glyph);
      return Semantics(
        inMutuallyExclusiveGroup: true,
        checked: v.round() == position,
        enabled: !widget.isDisabled,
        label: widget.starLabel!(position),
        child: InkWell(
          onTap: widget.isDisabled ? null : () => _choose(position),
          canRequestFocus: !widget.isDisabled,
          borderRadius: BorderRadius.circular(LumoRadius.sm),
          // Hit areas touch with no dead strip: the cell is the target, the star is what it paints.
          child: SizedBox(width: cell, height: cell, child: Center(child: ExcludeSemantics(child: glyph))),
        ),
      );
    }

    // The `LayoutBuilder` stays INSIDE the annotated node: hung above it, the
    // rating's own render object would belong to no semantics node of its own.
    final stars = LayoutBuilder(builder: (context, constraints) {
      // The touch cell: 44 where the row has room, never smaller than the star
      // it paints. Unbounded width means there is nothing to fit into.
      final cell = !interactive
          ? drawn
          : (constraints.maxWidth.isFinite ? math.max(drawn, math.min(LumoControl.lg, constraints.maxWidth / widget.max)) : LumoControl.lg);
      final row = Row(mainAxisSize: MainAxisSize.min, children: [for (var p = 1; p <= widget.max; p++) star(p, cell)]);
      // Last resort, after the cell has already given up its padding: scale.
      // `scaleDown` is a no-op whenever the row already fits.
      return FittedBox(fit: BoxFit.scaleDown, alignment: AlignmentDirectional.centerStart, child: row);
    });
    if (!interactive) {
      // A picture of a number: announced once as name + value, the stars decoration.
      return Semantics(image: true, label: widget.label, value: widget.valueLabel, child: ExcludeSemantics(child: stars));
    }
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.radioGroup,
      label: widget.label,
      value: widget.valueLabel,
      enabled: !widget.isDisabled,
      child: Opacity(opacity: widget.isDisabled ? 0.5 : 1, child: stars),
    );
  }
}
