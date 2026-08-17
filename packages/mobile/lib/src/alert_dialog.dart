import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'button.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A dialog that interrupts with a DECISION and offers exactly two ways out —
/// the web `AlertDialog`. Every announced string is required: `label` (the
/// question's name), `description` (the CONSEQUENCE, not just the verb),
/// `confirmLabel` and `cancelLabel` — both real verbs («حذف», not «بله»).
/// Resolves to `true` when the reader confirms, `false` when they cancel or the
/// route is popped any other way (a system back gesture), so a caller can
/// `if (await showLumoAlertDialog(...))` and never see a null.
///
/// **No ✕, and no `closeLabel`.** Confirmed in the web source: `alert-dialog.tsx`
/// states «No ✕ and no `closeLabel`: both verbs are required», and it defaults
/// `isDismissable` OFF on the overlay. The mobile route follows: the scrim is
/// not dismissible either. An alert dialog exists to force a choice, and a ✕ is
/// a third, unnamed answer to a question that has two.
///
/// **The route.** The scope re-provided with `LumoScopeData.wrap` exactly as
/// `dialog.dart` does — a route is built ABOVE the widget that opened it, so
/// neither the colours nor the `Directionality` reach it otherwise. Where this
/// differs from `dialog.dart`: it is a `showGeneralDialog` (`RawDialogRoute`),
/// not Material's `showDialog`, because `DialogRoute` falls back to
/// `MaterialLocalizations.modalBarrierDismissLabel` («Dismiss», English) when
/// no `barrierLabel` is given — and an alert dialog has no dismiss string to
/// give it, since it has no dismiss. The transition is a fade plus a scale,
/// both direction-invariant.
///
/// **Focus lands on CANCEL.** Source order is cancel-then-confirm (the safe
/// verb first in traversal, the web's own footer order), and the route asks its
/// focus scope for the first focusable child, which is that cancel button:
/// nothing destructive is ever one blind «enter» away. `MainAxisAlignment.end`
/// still puts the confirming verb at the READING end — left under fa-IR — with
/// no positional code.
///
/// Semantics: the popup is a `SemanticsRole.alertDialog`; ONE node carries the
/// name (`namesRoute` + `header`, the string in the tree exactly once — the
/// title text is not repeated in a wrapper label); the description is the next
/// node; `isDestructive` makes the confirm button `critical` (the web's
/// `tone: "critical"`), colour on top of the verb, never instead of it.
///
/// Web props not carried: `tone` as an enum (mobile takes the boolean
/// `isDestructive` the brief specifies — `accent` and `critical` were the only
/// two values), `onConfirm` (the `Future<bool>` IS the answer), and `className`.
Future<bool> showLumoAlertDialog(
  BuildContext context, {
  required String label,
  required String description,
  required String confirmLabel,
  required String cancelLabel,
  bool isDestructive = false,
}) async {
  final scope = LumoScope.of(context);
  // «Reduce motion» is the platform's answer, not a parameter of ours: the
  // transition collapses to zero and the dialog simply IS there on the next
  // frame. The house spelling — see `disclosure.dart`, `carousel.dart`.
  final motion = !MediaQuery.disableAnimationsOf(context);
  final result = await showGeneralDialog<bool>(
    context: context,
    barrierColor: scope.colours.scrim,
    // A decision is not dismissible: no barrier tap, therefore no barrier
    // string to announce (and none of Material's English one).
    barrierDismissible: false,
    transitionDuration: motion ? const Duration(milliseconds: 150) : Duration.zero,
    transitionBuilder: (ctx, animation, secondary, child) => FadeTransition(
      opacity: animation,
      // Scale is centre-out: nothing to mirror.
      child: ScaleTransition(
        scale: Tween(begin: 0.95, end: 1.0).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
        child: child,
      ),
    ),
    pageBuilder: (ctx, animation, secondary) =>
        scope.wrap(_LumoAlertDialogPage(label: label, description: description, confirmLabel: confirmLabel, cancelLabel: cancelLabel, isDestructive: isDestructive)),
  );
  // Popped by the system back gesture = no decision = the safe answer.
  return result ?? false;
}

class _LumoAlertDialogPage extends StatefulWidget {
  const _LumoAlertDialogPage({required this.label, required this.description, required this.confirmLabel, required this.cancelLabel, required this.isDestructive});
  final String label;
  final String description;
  final String confirmLabel;
  final String cancelLabel;
  final bool isDestructive;

  @override
  State<_LumoAlertDialogPage> createState() => _LumoAlertDialogPageState();
}

class _LumoAlertDialogPageState extends State<_LumoAlertDialogPage> {
  @override
  void initState() {
    super.initState();
    // After the first frame the route's focus scope holds primary focus and its
    // children exist: `nextFocus` moves to the first focusable in traversal
    // order — the cancel button, which is first in source order.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) FocusScope.of(context).nextFocus();
    });
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(24),
          // `shadow-modal`: the alert dialog's own separation from the page.
          // tokens.css argues the scrim cannot carry it on the dark scheme, so
          // the border and this shadow do — and the token holds a separate dark
          // ramp, where a light-scheme alpha would paint almost nothing.
          child: DecoratedBox(
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(LumoRadius.lg), boxShadow: LumoShadow.modal(scope.brightness)),
            child: Material(
              color: c.surface,
              clipBehavior: Clip.antiAlias,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(LumoRadius.lg),
                side: BorderSide(color: c.border),
              ),
              child: Semantics(
                container: true,
                explicitChildNodes: true,
                role: SemanticsRole.alertDialog,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // One node names the route AND is the header — the label exists once in the tree.
                      Semantics(
                        namesRoute: true,
                        header: true,
                        child: Text(
                          widget.label,
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.4, color: c.fg),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(widget.description, style: TextStyle(fontSize: 14, height: 1.6, color: c.fgMuted)),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(top: 20),
                        // Cancel first in source order (focus and traversal), confirm at the reading end.
                        // An `OverflowBar`, not a `Row`: two real Persian verbs
                        // overflow a 320dp screen by 246px (measured). This is
                        // the web footer's own rule —
                        // `flex-col-reverse gap-2 sm:flex-row sm:justify-end`:
                        // a row while the verbs fit, a REVERSED column when they
                        // do not, so the confirming verb stays nearest the thumb.
                        // `VerticalDirection.up` is `flex-col-reverse`.
                        child: OverflowBar(
                          alignment: MainAxisAlignment.end,
                          overflowAlignment: OverflowBarAlignment.end,
                          overflowDirection: VerticalDirection.up,
                          spacing: 8,
                          overflowSpacing: 8,
                          children: [
                            LumoButton(variant: LumoButtonVariant.outline, onPressed: () => Navigator.of(context).pop(false), child: Text(widget.cancelLabel)),
                            LumoButton(
                              variant: widget.isDestructive ? LumoButtonVariant.critical : LumoButtonVariant.solid,
                              onPressed: () => Navigator.of(context).pop(true),
                              child: Text(widget.confirmLabel),
                            ),
                          ],
                        ),
                      ),
                    ],
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

/// The declarative shape, as `LumoDialogTrigger` is for `showLumoDialog`: a
/// trigger whose press asks the question. `onConfirm` runs only on the
/// confirming verb, `onCancel` on the declining one (and on a system back —
/// there is no third answer); `onOpenChange` fires true on open and false when
/// the dialog closes, whichever way.
class LumoAlertDialogTrigger extends StatelessWidget {
  const LumoAlertDialogTrigger({
    super.key,
    required this.label,
    required this.description,
    required this.confirmLabel,
    required this.cancelLabel,
    required this.trigger,
    this.onConfirm,
    this.onCancel,
    this.isDestructive = false,
    this.isDisabled = false,
    this.onOpenChange,
  });

  /// Announced name of the dialog — the question. Required.
  final String label;

  /// The consequence, in the reader's language. Required.
  final String description;

  /// The confirming verb — «حذف», not «بله». Required.
  final String confirmLabel;

  /// The declining verb. Required.
  final String cancelLabel;

  /// Renders the confirm button in the destructive variant.
  final bool isDestructive;
  final bool isDisabled;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;
  final ValueChanged<bool>? onOpenChange;

  /// Built with the press that asks the question; `null` when disabled.
  final Widget Function(VoidCallback? ask) trigger;

  @override
  Widget build(BuildContext context) {
    return trigger(
      isDisabled
          ? null
          : () async {
              onOpenChange?.call(true);
              final confirmed = await showLumoAlertDialog(context, label: label, description: description, confirmLabel: confirmLabel, cancelLabel: cancelLabel, isDestructive: isDestructive);
              onOpenChange?.call(false);
              if (confirmed) {
                onConfirm?.call();
              } else {
                onCancel?.call();
              }
            },
    );
  }
}
