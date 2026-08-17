import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The axis a button group is laid along — the web's `Orientation`. Horizontal
/// is the INLINE axis and mirrors; vertical is the block axis and does not.
enum LumoButtonGroupOrientation { horizontal, vertical }

/// A row of related buttons joined into one control —
/// `packages/ui/src/button-group.tsx`.
///
///     LumoButtonGroup(label: 'عملیات سند', children: [
///       LumoButton(variant: LumoButtonVariant.outline, …, child: Text('رونوشت')),
///       LumoIconButton(label: 'حذف', variant: LumoButtonVariant.outline, …),
///     ])
///
/// `label` is REQUIRED for the web's reason: an unnamed `role="group"` is
/// announced as bare "group". The children keep their own names, roles and
/// states — the group is a named container with explicit child nodes above
/// them, never a name in front of an unnamed button.
///
/// THE WHOLE TRAP IS THE CORNERS. A `LumoButton` draws its own
/// `LumoRadius.md` on all four; joining them means squaring the corners at each
/// SEAM and keeping the two at the group's outer ends. The web squares them
/// with logical utilities (`rounded-s-none` / `rounded-e-none`) and its
/// docblock records why: upstream's `rounded-l-none` rounds the WRONG corner in
/// Persian. Here the same fact is a `BorderRadiusDirectional.horizontal(start:)`
/// / `(end:)` on each slot's clip — which resolves to the right/left pair under
/// fa-IR and the left/right pair under en-US, and this file never learns which.
/// A VERTICAL group stacks along the block axis, so its ends are
/// `BorderRadius.vertical(top:)` / `(bottom:)`: physical on purpose, because the
/// block axis does not mirror — the same exception the web file writes down.
///
/// Neighbouring `outline` children meet border to border, and that meeting IS
/// the group's inner rule. `solid` children have no border of their own, so put
/// a `LumoButtonGroupSeparator` between them — exactly what the web's
/// `ButtonGroupSeparator` is for.
class LumoButtonGroup extends StatelessWidget {
  const LumoButtonGroup({super.key, required this.label, required this.children, this.orientation = LumoButtonGroupOrientation.horizontal});

  /// Announced name of the group. Required.
  final String label;
  final List<Widget> children;
  final LumoButtonGroupOrientation orientation;

  /// The clip each slot wears: rounded at the group's OUTER ends, square at every seam.
  static BorderRadiusGeometry slotRadius({required int index, required int count, required LumoButtonGroupOrientation orientation}) {
    const r = Radius.circular(LumoRadius.md);
    if (count <= 1) return const BorderRadius.all(r);
    final first = index == 0, last = index == count - 1;
    if (orientation == LumoButtonGroupOrientation.horizontal) {
      // `start`/`end` — the inline axis. Which physical corners these are is `Directionality`'s answer, not ours.
      if (first) return const BorderRadiusDirectional.horizontal(start: r);
      if (last) return const BorderRadiusDirectional.horizontal(end: r);
    } else {
      // The block axis: top is top in every script, so the physical form is the honest one here.
      if (first) return const BorderRadius.vertical(top: r);
      if (last) return const BorderRadius.vertical(bottom: r);
    }
    return BorderRadius.zero;
  }

  @override
  Widget build(BuildContext context) {
    final horizontal = orientation == LumoButtonGroupOrientation.horizontal;
    final slots = <Widget>[
      for (var i = 0; i < children.length; i++)
        ClipRRect(
          clipBehavior: Clip.antiAlias,
          borderRadius: slotRadius(index: i, count: children.length, orientation: orientation),
          child: children[i],
        ),
    ];
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      // The slots share the group's cross extent, so a taller child does not leave
      // its neighbours short and the seam stays a straight line.
      child: horizontal
          ? IntrinsicHeight(child: Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: slots))
          : IntrinsicWidth(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: slots)),
    );
  }
}

/// Non-interactive copy inside a group — a unit, a prefix, a count. The web's
/// `ButtonGroupText`, styled as a `Button`'s peer so the seam is invisible. The
/// child carries its own words; there is nothing for this widget to name.
class LumoButtonGroupText extends StatelessWidget {
  const LumoButtonGroupText({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Container(
      constraints: const BoxConstraints(minHeight: LumoControl.md),
      padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
      decoration: BoxDecoration(color: c.surfaceSunken, border: Border.all(color: c.borderControl)),
      alignment: Alignment.center,
      child: DefaultTextStyle.merge(
        style: TextStyle(fontSize: 14, color: c.fgMuted),
        child: child,
      ),
    );
  }
}

/// A hairline between two SOLID buttons, which have no border of their own —
/// the web's `ButtonGroupSeparator`. `borderControl`, not `border`: it reads as
/// part of a control's boundary (WCAG 1.4.11). Decoration: excluded from
/// semantics.
class LumoButtonGroupSeparator extends StatelessWidget {
  const LumoButtonGroupSeparator({super.key, this.orientation = LumoButtonGroupOrientation.horizontal});

  /// The enclosing group's axis; the rule is drawn across it.
  final LumoButtonGroupOrientation orientation;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return ExcludeSemantics(
      child: orientation == LumoButtonGroupOrientation.horizontal ? SizedBox(width: 1, child: ColoredBox(color: c.borderControl)) : SizedBox(height: 1, child: ColoredBox(color: c.borderControl)),
    );
  }
}
