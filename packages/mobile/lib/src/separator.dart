import 'package:flutter/material.dart';
import 'scope.dart';

enum LumoSeparatorOrientation { horizontal, vertical }

/// A divider between two groups of content — the web `Separator`. Decorative
/// (excluded from semantics) unless `label` is given, in which case it is
/// announced as a named group boundary. `border`, not `borderControl`: a
/// decorative rule has no 3:1 requirement. Horizontal fills the width; vertical
/// fills the height its parent gives it (`IntrinsicHeight`/`stretch` a `Row`).
/// Width and height are physical dimensions, not directions — nothing to mirror.
class LumoSeparator extends StatelessWidget {
  const LumoSeparator({super.key, this.orientation = LumoSeparatorOrientation.horizontal, this.label});
  /// Which axis the control runs along.
  final LumoSeparatorOrientation orientation;
  /// A name for the boundary, if the separator carries meaning. Optional: decorative otherwise.
  final String? label;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final rule = orientation == LumoSeparatorOrientation.horizontal
        ? SizedBox(height: 1, width: double.infinity, child: ColoredBox(color: c.border))
        : SizedBox(width: 1, height: double.infinity, child: ColoredBox(color: c.border));
    return label == null ? ExcludeSemantics(child: rule) : Semantics(container: true, label: label, child: rule);
  }
}
