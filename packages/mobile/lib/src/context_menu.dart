import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show HapticFeedback;
import 'menu.dart';

/// A LONG-PRESS menu on a surface, anchored at the point the finger landed —
/// `packages/ui/src/context-menu.tsx`, whose gesture is a right-click.
///
///     LumoContextMenu(
///       label: 'گزینه‌های سند',
///       items: const [LumoMenuItem(label: 'رونوشت'), LumoMenuSeparator(), LumoMenuItem(label: 'حذف', isDestructive: true)],
///       child: LumoCard(child: …),
///     )
///
/// `label` is REQUIRED and for a sharper reason than elsewhere: no trigger
/// BUTTON names a long-press menu, so the name has nowhere else to come from —
/// the web file says the same about its `aria-label`.
///
/// Entries are `menu.dart`'s own — `LumoMenuItem`, `LumoMenuCheckboxItem`,
/// `LumoMenuSeparator`, `LumoMenuSection` — and the menu is rendered by
/// `LumoMenuTrigger` itself, not by a copy of it: the web fuses `MenuPopover`
/// and `Menu` for the same reason, and a second menu body would be a second
/// place for the checked state and the destructive tone to drift.
///
/// HOW IT ANCHORS AT THE PRESS POINT. `showLumoPopover` positions against a
/// `RenderBox`, so the press point is given one: a zero-size anchor placed at
/// the recorded offset for the life of the menu. `Offset` and `Rect` have no
/// logical form — a pointer lands at a physical point, not at a reading edge —
/// but everything downstream is logical: the surface hangs from the anchor at
/// `bottomStart`, which is the point's right in Persian and its left in
/// English, and flips above when the room below is short.
///
/// A context menu is a SHORTCUT surface: every action in it must also exist
/// somewhere visible, the rule the web file states, and doubly so here — a
/// long press is invisible. The gesture is left in the semantics tree (not
/// excluded) so the surface carries a `longPress` action a screen reader can
/// perform and announce.
class LumoContextMenu extends StatefulWidget {
  const LumoContextMenu({super.key, required this.label, required this.items, required this.child, this.onOpenChange, this.isDisabled = false});

  /// Announced name of the menu. Required.
  final String label;
  final List<LumoMenuEntry> items;

  /// The surface a long press opens the menu on.
  final Widget child;

  /// Fires true when the menu opens and false when it closes, any way.
  final ValueChanged<bool>? onOpenChange;
  final bool isDisabled;

  @override
  State<LumoContextMenu> createState() => _LumoContextMenuState();
}

class _LumoContextMenuState extends State<LumoContextMenu> {
  /// Where the finger landed, in this widget's own coordinates. Null = closed.
  Offset? _at;

  /// The open callback `LumoMenuTrigger` hands out, captured for the frame after the press.
  VoidCallback? _open;
  bool _wantOpen = false;

  void _onLongPress(LongPressStartDetails details) {
    setState(() {
      _at = details.localPosition;
      _wantOpen = true;
    });
    // The anchor does not exist until the frame that follows this setState;
    // `showLumoPopover` needs its render box, so the open waits for it.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_wantOpen) return;
      _wantOpen = false;
      HapticFeedback.selectionClick();
      _open?.call();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        GestureDetector(
          behavior: HitTestBehavior.deferToChild,
          // Left in the semantics tree on purpose: this is what publishes a
          // `longPress` action, the only way a reader can reach the menu.
          onLongPressStart: widget.isDisabled ? null : _onLongPress,
          child: widget.child,
        ),
        if (_at != null)
          // `Positioned.fromRect`, not `Positioned(left:)`: a pointer's landing
          // point is a physical coordinate and there is no logical form of it.
          // Everything the menu does with this anchor IS logical.
          Positioned.fromRect(
            rect: _at! & Size.zero,
            child: LumoMenuTrigger(
              label: widget.label,
              items: widget.items,
              onOpenChange: (isOpen) {
                widget.onOpenChange?.call(isOpen);
                if (!isOpen && mounted) {
                  setState(() {
                    _at = null;
                    _open = null;
                  });
                }
              },
              trigger: (open) {
                _open = open;
                return const SizedBox.shrink();
              },
            ),
          ),
      ],
    );
  }
}
