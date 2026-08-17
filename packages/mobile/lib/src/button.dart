import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

enum LumoButtonVariant { solid, outline, ghost, critical }

enum LumoButtonSize { sm, md, lg }

const _height = {LumoButtonSize.sm: LumoControl.sm, LumoButtonSize.md: LumoControl.md, LumoButtonSize.lg: LumoControl.lg};
const _padding = {LumoButtonSize.sm: 12.0, LumoButtonSize.md: 16.0, LumoButtonSize.lg: 24.0};
const _font = {LumoButtonSize.sm: 14.0, LumoButtonSize.md: 14.0, LumoButtonSize.lg: 16.0};

/// The primary action — the web button's contract on Material's button: four
/// variants, three sizes on the shared control scale, disabled announced,
/// pressed takes the "hover" fill, focus ring for keyboard/switch access. The
/// child is a Widget (Flutter has no `LumoNode`; a raw number in a `Text` is
/// the app's — Dart cannot forbid it by type, `formatNumber` is the rule).
///
/// **`sm` (29) and `md` (36) sit BELOW the 44 px touch floor, deliberately.**
/// The web says the same out loud — `button.variants.ts` annotates only `lg`
/// with "meets the 44px touch-target floor" — and the reason it is safe here is
/// that a text button is WIDE: measured in a 360 dp column, `md` is 360×36 and
/// `sm` is 360×29, so the finger has the whole line to land on and only the
/// short axis is tight. That reasoning fails the moment the button is SQUARE,
/// which is why `LumoIconButton` below grows its hit area and this one does
/// not. Reach for `lg` when a text button is narrow and stands alone.
class LumoButton extends StatelessWidget {
  const LumoButton({super.key, required this.child, this.onPressed, this.variant = LumoButtonVariant.solid, this.size = LumoButtonSize.md, this.isDisabled = false});
  final Widget child;
  final VoidCallback? onPressed;
  final LumoButtonVariant variant;
  final LumoButtonSize size;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    Color bg(Set<WidgetState> s) {
      final active = s.contains(WidgetState.pressed) || s.contains(WidgetState.hovered);
      switch (variant) {
        case LumoButtonVariant.solid:
          return active ? c.accentHover : c.accent;
        case LumoButtonVariant.outline:
          return active ? c.surfaceHover : c.surface;
        case LumoButtonVariant.ghost:
          return active ? c.surfaceHover : Colors.transparent;
        case LumoButtonVariant.critical:
          return c.critical;
      }
    }

    Color fg() {
      switch (variant) {
        case LumoButtonVariant.solid:
          return c.accentFg;
        case LumoButtonVariant.critical:
          return c.bg;
        default:
          return c.fg;
      }
    }

    final style = ButtonStyle(
      minimumSize: WidgetStatePropertyAll(Size(0, _height[size]!)),
      maximumSize: WidgetStatePropertyAll(Size(double.infinity, _height[size]!)),
      padding: WidgetStatePropertyAll(EdgeInsetsDirectional.symmetric(horizontal: _padding[size]!)),
      backgroundColor: WidgetStateProperty.resolveWith(bg),
      foregroundColor: WidgetStatePropertyAll(fg()),
      overlayColor: const WidgetStatePropertyAll(Colors.transparent),
      textStyle: WidgetStatePropertyAll(TextStyle(fontSize: _font[size], fontWeight: FontWeight.w500)),
      shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(LumoRadius.md))),
      side: WidgetStatePropertyAll(BorderSide(color: variant == LumoButtonVariant.outline ? c.borderControl : Colors.transparent)),
      elevation: const WidgetStatePropertyAll(0),
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: FilledButton(onPressed: isDisabled ? null : onPressed, style: style, child: child),
    );
  }
}

/// A button whose only content is an icon: `label` is REQUIRED — an icon is not
/// a name. Announced through Semantics and shown as a tooltip.
///
/// **The hit area is at least [LumoControl.lg] (44) square; the DRAWN button
/// keeps its size step.** An icon button is the one place the shared control
/// scale is small on BOTH axes — measured at `sm` it was 29×29 and at `md`
/// 36×36, so nothing rescues the miss the way a full-width text button's length
/// does. The web's `size: "icon"` is `h-control-md w-control-md`, i.e. exactly
/// the 36×36 square, and a pointer hits it fine; a thumb does not. So the
/// painted box is unchanged (no visual drift — the fill, border and radius are
/// still 29 or 36) and a transparent, semantics-free MARGIN around it forwards
/// its taps to the same callback. Verified by test: a tap on the GLYPH resolves
/// once, in the button (which keeps its pressed fill); a tap in the MARGIN
/// resolves once, in the margin; a disabled button answers neither.
///
/// The node is DECLARED here and the drawn button is `ExcludeSemantics`'d —
/// the same shape `toggle.dart`, `link.dart` and `item.dart` use. Merging the
/// Material button's own node instead left its 36×36 node alive underneath the
/// 44×44 one: harmless to a reader (it is `isMergedIntoParent` and never
/// reaches the platform) but indistinguishable from a real undersized target to
/// anything that walks the tree, `test/tap_target_floor_test.dart` included.
/// One control, one node, one size.
class LumoIconButton extends StatelessWidget {
  const LumoIconButton({super.key, required this.label, required this.child, this.onPressed, this.variant = LumoButtonVariant.ghost, this.size = LumoButtonSize.md, this.isDisabled = false});
  final String label;
  final Widget child;
  final VoidCallback? onPressed;
  final LumoButtonVariant variant;
  final LumoButtonSize size;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final side = _height[size]!;
    final target = side > LumoControl.lg ? side : LumoControl.lg;
    // ONE node: it names, carries the role and state, and acts.
    return Semantics(
      container: true,
      button: true,
      enabled: !isDisabled,
      label: label,
      onTap: isDisabled ? null : onPressed,
      // The Tooltip shows the name on long-press; its own semantics are excluded so the name is announced ONCE.
      child: Tooltip(
        message: label,
        excludeFromSemantics: true,
        // `Focus` above the detector, because a GestureDetector cannot take
        // focus: the 44 px rescue margin below was added for the finger and
        // silently cost the button its focusability, so it was reachable by
        // touch and NOT by a switch or a keyboard. The real button beneath is
        // semantically excluded, so its own focus node cannot stand in.
        // Same shape as `chip.dart`'s `_TapBand`.
        child: Focus(
          canRequestFocus: !isDisabled && onPressed != null,
          child: GestureDetector(
            // The transparent margin is the RESCUE for a near miss: the arena
            // hands a tap ON the glyph to the button beneath (which keeps its
            // pressed fill) and a tap in the margin to this one, so a hit is
            // never counted twice.
            behavior: HitTestBehavior.opaque,
            excludeFromSemantics: true,
            onTap: isDisabled ? null : onPressed,
            child: SizedBox(
              width: target,
              height: target,
              child: Center(
                child: ExcludeSemantics(
                  child: SizedBox(
                    width: side,
                    height: side,
                    child: LumoButton(variant: variant, size: size, isDisabled: isDisabled, onPressed: onPressed, child: child),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
