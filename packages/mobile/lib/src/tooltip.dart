import 'dart:async';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The block side a tooltip prefers. Block axis only — it does not mirror; a
/// phone has no room beside a control for the web's inline placements.
enum LumoTooltipPlacement { top, bottom }

/// A description shown on long-press (touch) or hover (pointer), on Material's
/// `Tooltip` wearing the tokens: the INVERTED surface (`bg` text on `fg`), as
/// the web tooltip in both schemes. `message` REQUIRED. A tooltip is a
/// DESCRIPTION, never a name: Flutter's semantics has a dedicated `tooltip`
/// field, read after the child's own name (the web's `aria-describedby`) — so
/// an icon-only child still needs its own `label` (`LumoIconButton`), and this
/// tooltip is NOT excluded from semantics (`LumoIconButton` excludes its own,
/// where the message would only repeat the name).
///
/// **Motion is the one thing this file cannot honour.** Material's `Tooltip`
/// fades the tip in and out over durations it holds privately (`waitDuration`,
/// `showDuration` and `exitDuration` are the only `Duration`s it accepts, and
/// all three are DELAYS, not the fade), and it never reads
/// `MediaQuery.disableAnimationsOf` itself — so under «reduce motion» the tip
/// still fades over ~150ms. No parameter of ours reaches it; the alternative is
/// re-implementing an overlay tooltip, which would lose Material's dismissal
/// and positioning. Recorded here rather than papered over. Everything else in
/// this library collapses its duration to zero (`disclosure.dart`,
/// `carousel.dart`, `dialog.dart`, `sheet.dart`, `popover.dart`).
///
/// The long-press is Lumo's own recognizer (Material's `triggerMode` is
/// `manual`): `LumoIconButton` already carries a `Tooltip` that shows its label
/// on long-press, and nested tooltips both race for the same gesture — the
/// inner one wins a tie. This recognizer fires 100ms before Material's
/// `kLongPressTimeout`, so the more specific description wins; the tip then
/// stays 1.5s after the finger lifts (Material's own `showDuration`) or until
/// the next touch anywhere. `delay` is the web's `delay` (hover
/// `waitDuration`); `isDisabled` renders the child alone. No `closeDelay` /
/// `shouldCloseOnPress`: Material has no knob with the same meaning, so none is
/// spelled as if it were.
class LumoTooltip extends StatefulWidget {
  const LumoTooltip({
    super.key,
    required this.message,
    required this.child,
    this.placement = LumoTooltipPlacement.top,
    this.delay,
    this.isDisabled = false,
  });
  final String message;
  final Widget child;
  final LumoTooltipPlacement placement;
  final Duration? delay;
  final bool isDisabled;

  @override
  State<LumoTooltip> createState() => _LumoTooltipState();
}

class _LumoTooltipState extends State<LumoTooltip> {
  final _tip = GlobalKey<TooltipState>();
  Timer? _hide;
  static const _press = Duration(milliseconds: 400);
  static const _linger = Duration(milliseconds: 1500);

  void _show() {
    _hide?.cancel();
    _tip.currentState?.ensureTooltipVisible();
  }

  void _release() {
    _hide?.cancel();
    _hide = Timer(_linger, Tooltip.dismissAllToolTips);
  }

  @override
  void dispose() {
    _hide?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isDisabled) return widget.child;
    final scope = LumoScope.of(context);
    final c = scope.colours;
    return RawGestureDetector(
      // The gesture is pointer-only; the reader gets the message through the semantic `tooltip`.
      excludeFromSemantics: true,
      gestures: {
        LongPressGestureRecognizer:
            GestureRecognizerFactoryWithHandlers<LongPressGestureRecognizer>(
              () => LongPressGestureRecognizer(
                duration: _press,
                debugOwner: this,
              ),
              (r) {
                r.onLongPress = _show;
                r.onLongPressEnd = (_) => _release();
                r.onLongPressCancel = _release;
              },
            ),
      },
      // One node with the child: a Lumo button is its own merge boundary, so
      // the semantic `tooltip` must be merged from ABOVE, or it lands on a
      // parent node the reader never pairs with the button.
      child: MergeSemantics(
        child: Tooltip(
          key: _tip,
          message: widget.message,
          excludeFromSemantics: false,
          triggerMode: TooltipTriggerMode.manual,
          preferBelow: widget.placement == LumoTooltipPlacement.bottom,
          waitDuration: widget.delay,
          verticalOffset: 20,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          margin: const EdgeInsets.symmetric(horizontal: 8),
          constraints: const BoxConstraints(maxWidth: 320),
          decoration: BoxDecoration(
            color: c.fg,
            borderRadius: BorderRadius.circular(LumoRadius.md),
            // `shadow-overlay` — the web tooltip carries it, and an inverted
            // surface has no border to separate it from the page otherwise.
            // From the token, not hand-picked: it holds a separate DARK ramp,
            // where a shadow at the light scheme's alpha paints almost nothing.
            boxShadow: LumoShadow.overlay(scope.brightness),
          ),
          textStyle: TextStyle(fontSize: 12, height: 1.6, color: c.bg),
          // The tip is an OverlayPortal child of this widget: it inherits this
          // Directionality, so Persian text runs right-to-left inside it.
          child: widget.child,
        ),
      ),
    );
  }
}
