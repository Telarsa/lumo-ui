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
Future<T?> showLumoDialog<T>(BuildContext context, {required String label, required String closeLabel, String? description, required List<Widget> Function(BuildContext) actions, Widget? body}) {
  final scope = LumoScope.of(context);
  final c = scope.colours;
  // `showGeneralDialog`, not Material's `showDialog`: the latter falls back to
  // `MaterialLocalizations.modalBarrierDismissLabel` («Dismiss», in English) for
  // any barrier it is not given a name for, and names its own route. Ours are
  // named by `closeLabel`. Same route the sheet and the alert dialog use.
  return showGeneralDialog<T>(
    context: context,
    barrierColor: c.scrim,
    barrierDismissible: true,
    barrierLabel: closeLabel,
    transitionDuration: const Duration(milliseconds: 180),
    transitionBuilder: (ctx, animation, secondary, child) => FadeTransition(
      opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
      child: child,
    ),
    // The route is built ABOVE the caller's LumoScope: re-provide it (with the direction).
    pageBuilder: (ctx, animation, secondary) => scope.wrap(Dialog(
        backgroundColor: c.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(LumoRadius.lg), side: BorderSide(color: c.border)),
        // Material's Dialog already scopes the route; the label names it for
        // the reader (Flutter's route announcement reads `namesRoute` labels).
        // The name is NOT repeated here: the visible title below carries
        // `namesRoute` itself, so the string exists ONCE in the tree — the rule
        // sheet.dart states and this file used to break (a `label` here plus a
        // `Text(label)` child made the reader say the title twice).
        child: Semantics(
          explicitChildNodes: true,
          child: Padding(
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
                        child: Text(label, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.4, color: c.fg)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    LumoIconButton(label: closeLabel, size: LumoButtonSize.sm, onPressed: () => Navigator.of(ctx).pop(), child: Icon(Icons.close, size: 16, color: c.fgMuted)),
                  ],
                ),
                if (description != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(description, style: TextStyle(fontSize: 14, color: c.fgMuted))),
                if (body != null) Padding(padding: const EdgeInsets.only(top: 12), child: body),
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Row(mainAxisAlignment: MainAxisAlignment.end, spacing: 8, children: actions(ctx)),
                ),
              ],
            ),
          ),
        ),
      )),
  );
}

/// The declarative shape: a trigger whose press opens the dialog. `onOpenChange`
/// fires true on open and false when it closes (any way).
class LumoDialogTrigger extends StatelessWidget {
  const LumoDialogTrigger({super.key, required this.label, required this.closeLabel, required this.trigger, required this.actions, this.description, this.body, this.onOpenChange, this.isDisabled = false});
  final String label;
  final String closeLabel;
  final String? description;
  final Widget? body;
  final List<Widget> Function(BuildContext) actions;
  final ValueChanged<bool>? onOpenChange;
  final bool isDisabled;
  /// Built with the press that opens the dialog.
  final Widget Function(VoidCallback? open) trigger;

  @override
  Widget build(BuildContext context) {
    return trigger(isDisabled
        ? null
        : () async {
            onOpenChange?.call(true);
            await showLumoDialog<void>(context, label: label, closeLabel: closeLabel, description: description, actions: actions, body: body);
            onOpenChange?.call(false);
          });
  }
}
