import 'package:flutter/material.dart';
import 'button.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A modal dialog with Lumo's contract on Material's `showDialog`: `label` and
/// `closeLabel` REQUIRED (an ✕ is not a name), the description read after the
/// name, ✕ at the inline END (top-left in Persian, by `Directionality`), the
/// card wearing the tokens. Flutter's dialogs are IMPERATIVE (a Future you await)
/// where React Native's engine is declarative — a genuine difference the
/// comparison records; `LumoDialogTrigger` gives the declarative shape.
///
/// **The card scrolls at `maxHeight`**, a deliberate port of the web body's
/// `max-h-[85dvh] overflow-y-auto`: without it a dialog whose body is longer
/// than the screen overflows instead of scrolling. The ✕'s 44×44 hit area is
/// `LumoIconButton`'s own — it is not spelled again here.
///
/// The actions sit in an `OverflowBar`, not a `Row`: a `Row` of two real Persian
/// verbs overflows a 320dp screen by 278px (measured). `OverflowBar` is what
/// Flutter's own `AlertDialog` uses, and it says the same thing as the web's
/// `flex-col-reverse … sm:flex-row` — a row while the verbs fit, a column when
/// they do not.
Future<T?> showLumoDialog<T>(BuildContext context, {required String label, required String closeLabel, String? description, required List<Widget> Function(BuildContext) actions, Widget? body}) {
  final scope = LumoScope.of(context);
  final c = scope.colours;
  // «Reduce motion» is the platform's answer, not a parameter of ours: the
  // transition collapses to zero and the route simply IS open on the next
  // frame. The house spelling — see `disclosure.dart`, `carousel.dart`.
  final motion = !MediaQuery.disableAnimationsOf(context);
  // `showGeneralDialog`, not Material's `showDialog`: the latter falls back to
  // `MaterialLocalizations.modalBarrierDismissLabel` («Dismiss», in English) for
  // any barrier it is not given a name for, and names its own route. Ours are
  // named by `closeLabel`. Same route the sheet and the alert dialog use.
  return showGeneralDialog<T>(
    context: context,
    barrierColor: c.scrim,
    barrierDismissible: true,
    barrierLabel: closeLabel,
    transitionDuration: motion ? const Duration(milliseconds: 180) : Duration.zero,
    transitionBuilder: (ctx, animation, secondary, child) => FadeTransition(
      opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
      child: child,
    ),
    // The route is built ABOVE the caller's LumoScope: re-provide it (with the direction).
    // The surface is painted HERE, not by `Dialog`: Material's own elevation
    // computes its own shadow, and Lumo's `shadow-modal` is a two-layer token
    // with a separate DARK ramp (a black shadow at the light scheme's alpha is
    // arithmetically close to a no-op on a dark page). So `Dialog` is made
    // transparent and kept only for its route sizing and inset padding.
    pageBuilder: (ctx, animation, secondary) => scope.wrap(
      Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        shape: const RoundedRectangleBorder(),
        // Material's Dialog already scopes the route; the label names it for
        // the reader (Flutter's route announcement reads `namesRoute` labels).
        // The name is NOT repeated here: the visible title below carries
        // `namesRoute` itself, so the string exists ONCE in the tree — the rule
        // sheet.dart states and this file used to break (a `label` here plus a
        // `Text(label)` child made the reader say the title twice).
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(LumoRadius.lg),
            border: Border.all(color: c.border),
            boxShadow: LumoShadow.modal(scope.brightness),
          ),
          child: Semantics(
            explicitChildNodes: true,
            child: Builder(
              builder: (cardCtx) => ConstrainedBox(
                // `max-h-[85dvh]`, the web's own cap.
                constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(cardCtx).height * 0.85),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Semantics(
                              namesRoute: true,
                              header: true,
                              child: Text(
                                label,
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.4, color: c.fg),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          LumoIconButton(
                            label: closeLabel,
                            size: LumoButtonSize.sm,
                            onPressed: () => Navigator.of(cardCtx).pop(),
                            child: Icon(Icons.close, size: 16, color: c.fgMuted),
                          ),
                        ],
                      ),
                      if (description != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Text(description, style: TextStyle(fontSize: 14, color: c.fgMuted)),
                        ),
                      if (body != null) Padding(padding: const EdgeInsets.only(top: 12), child: body),
                      Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: OverflowBar(alignment: MainAxisAlignment.end, overflowAlignment: OverflowBarAlignment.end, spacing: 8, overflowSpacing: 8, children: actions(cardCtx)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

/// The declarative shape: a trigger whose press opens the dialog. `onOpenChange`
/// fires true on open and false when it closes (any way).
class LumoDialogTrigger extends StatelessWidget {
  const LumoDialogTrigger({
    super.key,
    required this.label,
    required this.closeLabel,
    required this.trigger,
    required this.actions,
    this.description,
    this.body,
    this.onOpenChange,
    this.isDisabled = false,
  });
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// Announced name of the close affordance. An icon is not a name.
  final String closeLabel;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// The dialog's content.
  final Widget? body;
  /// The actions, in reading order.
  final List<Widget> Function(BuildContext) actions;
  /// Called when the surface opens or closes, with the new state.
  final ValueChanged<bool>? onOpenChange;
  /// Whether the control is disabled.
  final bool isDisabled;

  /// Built with the press that opens the dialog.
  final Widget Function(VoidCallback? open) trigger;

  @override
  Widget build(BuildContext context) {
    return trigger(
      isDisabled
          ? null
          : () async {
              onOpenChange?.call(true);
              await showLumoDialog<void>(context, label: label, closeLabel: closeLabel, description: description, actions: actions, body: body);
              onOpenChange?.call(false);
            },
    );
  }
}
