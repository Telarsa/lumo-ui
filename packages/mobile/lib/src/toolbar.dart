import 'package:flutter/material.dart';
import 'scope.dart';

/// The axis a toolbar lays its controls along — the web's `Orientation`.
/// Horizontal is the INLINE axis and mirrors; vertical is the block axis and
/// does not.
enum LumoToolbarOrientation { horizontal, vertical }

/// What a toolbar does when its controls do not fit.
enum LumoToolbarOverflow {
  /// The row scrolls along its own axis. The axis direction follows
  /// `Directionality`, so a Persian toolbar starts scrolled at the RIGHT.
  scroll,

  /// The controls flow onto further lines, in reading order.
  wrap,
}

/// A group of related controls — `packages/ui/src/toolbar.tsx`.
///
///     LumoToolbar(label: 'قالب‌بندی متن', children: [
///       LumoToggle(label: 'پررنگ', …),
///       LumoToolbarSeparator(),
///       LumoIconButton(label: 'پیوند', …),
///     ])
///
/// `label` is REQUIRED for the same reason as on the web: a toolbar is ONE
/// named group and an unnamed one announces as bare "toolbar". (Flutter's
/// `SemanticsRole` has no `toolbar` member in 3.35, so the group is a named
/// semantics container with explicit child nodes — the controls keep their own
/// names and roles under it.)
///
/// The web component's other job — a roving tabindex, with `ToolbarItem` as the
/// registry that Base UI's composite needs — has no counterpart here and is
/// DELIBERATELY not carried: Flutter's focus traversal already walks the
/// children in tree order, which is reading order, and mirrors with the
/// `Directionality` the `Row` reads. There is nothing for a child to enrol in,
/// so there is no `LumoToolbarItem`.
///
/// A cramped toolbar sheds nothing and truncates nothing: with more controls
/// than room it SCROLLS (`LumoToolbarOverflow.scroll`, the default) or flows
/// onto another line (`wrap`). Both keep every control reachable, which is the
/// house rule (`segmented_control.dart` `_fit()`) applied to a container whose
/// children are opaque widgets it may not restyle. The pattern is forui's and
/// Material's: a control strip that runs off the edge is a scroll view, not an
/// ellipsis.
class LumoToolbar extends StatelessWidget {
  const LumoToolbar({super.key, required this.label, required this.children, this.orientation = LumoToolbarOrientation.horizontal, this.overflow = LumoToolbarOverflow.scroll, this.spacing = 4});

  /// Announced name of the group. Required.
  final String label;
  /// The children, in reading order.
  final List<Widget> children;
  /// Which axis the control runs along.
  final LumoToolbarOrientation orientation;
  /// What happens to items that do not fit.
  final LumoToolbarOverflow overflow;

  /// The gap between controls, on the toolbar's own axis.
  final double spacing;

  @override
  Widget build(BuildContext context) {
    final horizontal = orientation == LumoToolbarOrientation.horizontal;
    return _LumoToolbarScope(
      orientation: orientation,
      child: Semantics(
        container: true,
        explicitChildNodes: true,
        label: label,
        child: LayoutBuilder(
          builder: (context, constraints) {
            if (overflow == LumoToolbarOverflow.wrap) {
              return Wrap(
                // `Wrap` reads `Directionality` for its own run direction: the first
                // control lands at the reading start without this file saying which edge that is.
                direction: horizontal ? Axis.horizontal : Axis.vertical,
                spacing: spacing,
                runSpacing: spacing,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: children,
              );
            }
            final strip = horizontal
                ? Row(mainAxisSize: MainAxisSize.min, spacing: spacing, children: children)
                : Column(mainAxisSize: MainAxisSize.min, spacing: spacing, children: children);
            // The strip is given the toolbar's full extent as a MINIMUM, so it fills
            // the space when it fits (and shows no scroll) and overflows into the
            // scroll view only when it does not. `SingleChildScrollView` takes its
            // axis direction from `Directionality` — nothing here names an edge.
            return SingleChildScrollView(
              scrollDirection: horizontal ? Axis.horizontal : Axis.vertical,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: horizontal && constraints.hasBoundedWidth ? constraints.maxWidth : 0,
                  minHeight: !horizontal && constraints.hasBoundedHeight ? constraints.maxHeight : 0,
                ),
                child: strip,
              ),
            );
          },
        ),
      ),
    );
  }
}

/// The hairline between two groups of controls — the web's `ToolbarSeparator`.
/// Decoration: excluded from semantics. Its own axis is the toolbar's
/// PERPENDICULAR, derived from the enclosing `LumoToolbar` exactly as the web
/// derives `aria-orientation` from the engine's `data-orientation`; pass
/// `orientation` only when the separator stands outside a toolbar.
class LumoToolbarSeparator extends StatelessWidget {
  const LumoToolbarSeparator({super.key, this.orientation});

  /// The enclosing toolbar's axis, when there is no toolbar to read it from.
  final LumoToolbarOrientation? orientation;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final axis = orientation ?? _LumoToolbarScope.of(context) ?? LumoToolbarOrientation.horizontal;
    return ExcludeSemantics(
      child: axis == LumoToolbarOrientation.horizontal
          ? Container(width: 1, height: 24, margin: const EdgeInsetsDirectional.symmetric(horizontal: 2), color: c.border)
          : Container(height: 1, margin: const EdgeInsets.symmetric(vertical: 2), color: c.border),
    );
  }
}

/// Publishes the toolbar's axis to its separators.
class _LumoToolbarScope extends InheritedWidget {
  const _LumoToolbarScope({required this.orientation, required super.child});
  final LumoToolbarOrientation orientation;

  static LumoToolbarOrientation? of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<_LumoToolbarScope>()?.orientation;

  @override
  bool updateShouldNotify(_LumoToolbarScope old) => old.orientation != orientation;
}
