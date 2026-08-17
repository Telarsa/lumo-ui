import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'button.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// Where a popover sits relative to its anchor. LOGICAL only — `start`/`end`
/// mirror under RTL, `top`/`bottom` are the block axis and do not — the same
/// closed union as the web's `LumoPlacement`, without the inline sides (a
/// phone has no room beside a control). No spelling names a physical edge.
enum LumoPlacement { bottomStart, bottom, bottomEnd, topStart, top, topEnd }

/// A positioned overlay: a surface anchored to a control, closed by a tap
/// outside (transparent barrier), named by the REQUIRED `label` (the web names
/// its `role="dialog"` popup by the trigger; Flutter's route announcement reads
/// a `namesRoute` label, so the name is passed). Placement defaults to
/// `bottomStart` and flips to the top when the room below is short. `showClose`
/// adds an ✕ at the inline END named by `closeLabel` — REQUIRED then (asserted),
/// and it also names the barrier so the dismiss gesture has a name.
///
/// Not Material's `showMenu`: its route layout picks a side by free space, not
/// by direction, and its items cannot wear the tokens or the checked state.
/// This is Lumo's own `PopupRoute` — the surface every anchored family
/// (`LumoMenuTrigger`) reuses, as the web's `popoverVariants` is one surface
/// under seven panels. `anchor` is the trigger's render box.
Future<T?> showLumoPopover<T>(BuildContext context, {required RenderBox anchor, required String label, required WidgetBuilder content, bool showClose = false, String? closeLabel, LumoPlacement placement = LumoPlacement.bottomStart, bool padded = true}) {
  assert(!showClose || closeLabel != null, 'A popover with an ✕ needs a closeLabel — an ✕ is not a name.');
  final scope = LumoScope.of(context);
  final navigator = Navigator.of(context);
  final overlay = navigator.overlay!.context.findRenderObject()!;
  final anchorRect = MatrixUtils.transformRect(anchor.getTransformTo(overlay), Offset.zero & anchor.size);
  return navigator.push(
    _LumoPopoverRoute<T>(
      scope: scope,
      anchorRect: anchorRect,
      placement: placement,
      closeLabel: closeLabel,
      // The route is built ABOVE the caller's LumoScope: re-provided in buildPage.
      builder: (ctx) => _LumoPopoverSurface(label: label, closeLabel: showClose ? closeLabel : null, padded: padded, child: content(ctx)),
    ),
  );
}

class _LumoPopoverSurface extends StatelessWidget {
  const _LumoPopoverSurface({required this.label, required this.closeLabel, required this.padded, required this.child});
  final String label;
  final String? closeLabel;
  final bool padded;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      label: label,
      namesRoute: true,
      container: true,
      explicitChildNodes: true,
      child: Material(
        color: c.surface,
        elevation: 4,
        shadowColor: c.scrim,
        surfaceTintColor: Colors.transparent,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(LumoRadius.md),
          side: BorderSide(color: c.border),
        ),
        // IntrinsicWidth: the surface shrink-wraps its content (an Align or a
        // max-size Row would take the whole screen width) while the ✕ row still
        // stretches to the surface's edge so `end` means the inline end.
        child: IntrinsicWidth(
          child: Padding(
            padding: padded ? const EdgeInsets.all(16) : EdgeInsets.zero,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (closeLabel != null)
                  // A Row so the ✕ takes the inline END by Directionality; the block nudge is symmetric.
                  Padding(
                    padding: padded ? const EdgeInsets.only(bottom: 4) : const EdgeInsets.all(4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        LumoIconButton(
                          label: closeLabel!,
                          size: LumoButtonSize.sm,
                          onPressed: () => Navigator.of(context).pop(),
                          child: Icon(Icons.close, size: 16, color: c.fgMuted),
                        ),
                      ],
                    ),
                  ),
                Flexible(child: child),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The route: transparent barrier that closes on tap, a fade + block-axis
/// slide, the caller's scope re-provided, the surface positioned by
/// `_LumoAnchoredLayout`. Named by the barrier only when there is a name for
/// it (`closeLabel`); an unnamed dismiss node is never announced (Material's
/// own popup-menu route leaves its barrier nameless too).
class _LumoPopoverRoute<T> extends PopupRoute<T> {
  _LumoPopoverRoute({required this.scope, required this.anchorRect, required this.placement, required this.builder, required this.closeLabel});
  final LumoScopeData scope;
  final Rect anchorRect;
  final LumoPlacement placement;
  final WidgetBuilder builder;
  final String? closeLabel;

  @override
  Color? get barrierColor => Colors.transparent;
  @override
  bool get barrierDismissible => true;
  @override
  String? get barrierLabel => closeLabel;
  @override
  bool get semanticsDismissible => closeLabel != null;
  @override
  Duration get transitionDuration => const Duration(milliseconds: 150);

  @override
  Widget buildPage(BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation) {
    return scope.wrap(
      Builder(
        builder: (ctx) {
          final padding = MediaQuery.paddingOf(ctx);
          return CustomSingleChildLayout(
            delegate: _LumoAnchoredLayout(anchor: anchorRect, placement: placement, direction: Directionality.of(ctx), safe: padding),
            child: builder(ctx),
          );
        },
      ),
    );
  }

  @override
  Widget buildTransitions(BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation, Widget child) {
    final curved = CurvedAnimation(parent: animation, curve: Curves.easeOut);
    // Block-axis offset only (as the web's `data-side` translate): does not mirror.
    final dy = placement.name.startsWith('top') ? 0.02 : -0.02;
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween(begin: Offset(0, dy), end: Offset.zero).animate(curved),
        child: child,
      ),
    );
  }
}

/// Positions the surface: inline alignment from `placement` × `direction`
/// (`start` = the anchor's left edge in LTR, its right edge in RTL); block side
/// from `placement`, flipped when the preferred side lacks the room and the
/// other has more; clamped inside the safe area with an 8px margin.
class _LumoAnchoredLayout extends SingleChildLayoutDelegate {
  const _LumoAnchoredLayout({required this.anchor, required this.placement, required this.direction, required this.safe});
  final Rect anchor;
  final LumoPlacement placement;
  final TextDirection direction;
  final EdgeInsets safe;
  static const _gap = 4.0;
  static const _margin = 8.0;

  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) {
    final below = constraints.maxHeight - safe.bottom - anchor.bottom - _gap - _margin;
    final above = anchor.top - safe.top - _gap - _margin;
    return BoxConstraints(maxWidth: math.max(0, constraints.maxWidth - safe.horizontal - 2 * _margin), maxHeight: math.max(0, math.max(below, above)));
  }

  @override
  Offset getPositionForChild(Size size, Size childSize) {
    final preferTop = placement == LumoPlacement.topStart || placement == LumoPlacement.top || placement == LumoPlacement.topEnd;
    final below = size.height - safe.bottom - anchor.bottom - _gap - _margin;
    final above = anchor.top - safe.top - _gap - _margin;
    final fitsBelow = childSize.height <= below, fitsAbove = childSize.height <= above;
    final onTop = preferTop ? (fitsAbove || above >= below) : (!fitsBelow && above > below);
    final y = onTop ? anchor.top - _gap - childSize.height : anchor.bottom + _gap;
    final rtl = direction == TextDirection.rtl;
    final atStart = placement == LumoPlacement.bottomStart || placement == LumoPlacement.topStart;
    final atEnd = placement == LumoPlacement.bottomEnd || placement == LumoPlacement.topEnd;
    // `start` aligns the surface's start edge with the anchor's start edge — which edge that is, the direction decides.
    final alignLeft = (atStart && !rtl) || (atEnd && rtl);
    final alignRight = (atStart && rtl) || (atEnd && !rtl);
    final x = alignLeft
        ? anchor.left
        : alignRight
        ? anchor.right - childSize.width
        : anchor.center.dx - childSize.width / 2;
    final minX = safe.left + _margin, maxX = size.width - safe.right - _margin - childSize.width;
    final minY = safe.top + _margin, maxY = size.height - safe.bottom - _margin - childSize.height;
    return Offset(x.clamp(math.min(minX, maxX), math.max(minX, maxX)), y.clamp(math.min(minY, maxY), math.max(minY, maxY)));
  }

  @override
  bool shouldRelayout(_LumoAnchoredLayout old) => old.anchor != anchor || old.placement != placement || old.direction != direction || old.safe != safe;
}

/// The declarative shape: a trigger whose press opens the popover, anchored to
/// the trigger itself. `label` REQUIRED (the popover's announced name);
/// `closeLabel` REQUIRED when `showClose` (asserted). `onOpenChange` fires true
/// on open and false when it closes (any way). No `isOpen`/`defaultOpen`:
/// Flutter's overlays are routes you push, not state you render — the same
/// divergence `LumoDialogTrigger` records.
class LumoPopoverTrigger extends StatelessWidget {
  const LumoPopoverTrigger({super.key, required this.label, required this.trigger, required this.content, this.showClose = false, this.closeLabel, this.placement = LumoPlacement.bottomStart, this.padded = true, this.onOpenChange, this.isDisabled = false}) : assert(!showClose || closeLabel != null, 'A popover with an ✕ needs a closeLabel — an ✕ is not a name.');
  final String label;
  final String? closeLabel;
  final bool showClose;
  final LumoPlacement placement;
  final bool padded;
  final WidgetBuilder content;
  final ValueChanged<bool>? onOpenChange;
  final bool isDisabled;

  /// Built with the press that opens the popover.
  final Widget Function(VoidCallback? open) trigger;

  @override
  Widget build(BuildContext context) {
    // The Builder's render object IS the trigger's box — the anchor.
    return Builder(
      builder: (ctx) => trigger(
        isDisabled
            ? null
            : () async {
                onOpenChange?.call(true);
                await showLumoPopover<void>(ctx, anchor: ctx.findRenderObject()! as RenderBox, label: label, content: content, showClose: showClose, closeLabel: closeLabel, placement: placement, padded: padded);
                onOpenChange?.call(false);
              },
      ),
    );
  }
}
