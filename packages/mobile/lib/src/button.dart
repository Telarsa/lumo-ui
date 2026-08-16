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
    return Semantics(
      label: label,
      button: true,
      enabled: !isDisabled,
      // The Tooltip shows the name on long-press; its own semantics are excluded so the name is announced ONCE.
      child: Tooltip(
        message: label,
        excludeFromSemantics: true,
        child: SizedBox(
          width: side,
          height: side,
          child: LumoButton(variant: variant, size: size, isDisabled: isDisabled, onPressed: onPressed, child: ExcludeSemantics(child: child)),
        ),
      ),
    );
  }
}
