import 'package:flutter/material.dart';
import 'button.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A bottom sheet — the mobile form of the web `drawer` (a modal that slides in
/// from an edge). On a phone the edge is the BOTTOM: the block axis, which does
/// not mirror, so the drawer's `side: start | end` has no counterpart here.
/// `label` and `closeLabel` REQUIRED (an ✕ is not a name); the title names the
/// route (`namesRoute`) and is a header; ✕ at the inline END (top-left in
/// Persian, by `Directionality`); the drag handle is decoration and excluded.
///
/// NOT on Material's `showModalBottomSheet`: its route names itself with
/// `MaterialLocalizations.dialogLabel` («Dialog») on Android — an English
/// default no parameter reaches, exactly the defect Lumo exists to prevent
/// (its drag handle is likewise named by `modalBarrierDismissLabel`). The sheet
/// is therefore a `RawDialogRoute` (`showGeneralDialog`, the engine under
/// `showDialog`) with a bottom-anchored slide: no route label but ours.
///
/// The body scrolls inside the sheet (`Flexible` + `SingleChildScrollView`),
/// the sheet caps at 90% of the screen; a swipe down on the handle/header
/// dismisses when `isDismissible`.
Future<T?> showLumoSheet<T>(
  BuildContext context, {
  required String label,
  required String closeLabel,
  String? description,
  required WidgetBuilder body,
  List<Widget> Function(BuildContext)? actions,
  bool isDismissible = true,
}) => showLumoSheetRoute<T>(
  context,
  closeLabel: closeLabel,
  isDismissible: isDismissible,
  builder: (ctx) => _LumoSheetPage(label: label, closeLabel: closeLabel, description: description, body: body, actions: actions, isDismissible: isDismissible),
);

/// The bottom-sheet ROUTE without Lumo's sheet chrome — for a body that brings
/// its own header, like `LumoCalendarSheet`. Everything `showLumoSheet` gets
/// for free comes from here: a `showGeneralDialog` route rather than Material's
/// `showModalBottomSheet` (whose route names itself «Dialog» and its barrier
/// «Dismiss» from `MaterialLocalizations` on Android — English no parameter of
/// ours reaches), the block-axis slide, the scrim named by `closeLabel`, and
/// the caller's `LumoScope` re-provided inside the route.
Future<T?> showLumoSheetRoute<T>(BuildContext context, {required String closeLabel, required WidgetBuilder builder, bool isDismissible = true}) {
  final scope = LumoScope.of(context);
  final c = scope.colours;
  // «Reduce motion» is the platform's answer, not a parameter of ours: the
  // slide collapses to zero and the sheet simply IS at the bottom edge on the
  // next frame. The house spelling — see `disclosure.dart`, `carousel.dart`.
  final motion = !MediaQuery.disableAnimationsOf(context);
  return showGeneralDialog<T>(
    context: context,
    barrierColor: c.scrim,
    barrierDismissible: isDismissible,
    // The scrim's own announced name — a dismissible barrier must have one; the ✕ carries the same.
    barrierLabel: closeLabel,
    transitionDuration: motion ? const Duration(milliseconds: 250) : Duration.zero,
    transitionBuilder: (ctx, animation, secondary, child) => SlideTransition(
      // Block-axis travel only: (0, 1) → (0, 0) is direction-invariant.
      position: Tween(begin: const Offset(0, 1), end: Offset.zero).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
      child: child,
    ),
    // The route is built ABOVE the caller's LumoScope: re-provide it (with the direction).
    pageBuilder: (ctx, animation, secondary) => scope.wrap(builder(ctx)),
  );
}

class _LumoSheetPage extends StatelessWidget {
  const _LumoSheetPage({required this.label, required this.closeLabel, required this.description, required this.body, required this.actions, required this.isDismissible});
  final String label;
  final String closeLabel;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  final WidgetBuilder body;
  final List<Widget> Function(BuildContext)? actions;
  final bool isDismissible;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final maxHeight = MediaQuery.sizeOf(context).height * 0.9;
    return Align(
      alignment: Alignment.bottomCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight, maxWidth: 640),
        // `shadow-modal`: what separates the sheet from the page it covers.
        // tokens.css argues the scrim alone cannot do it on the dark scheme
        // (twenty-two points of alpha buy fifteen thousandths of contrast), so
        // the sheet's own border and this shadow are what carry the separation.
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(LumoRadius.lg)),
            boxShadow: LumoShadow.modal(scope.brightness),
          ),
          child: Material(
            color: c.surface,
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(LumoRadius.lg)),
              side: BorderSide(color: c.border),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    // The gesture is pointer-only: its semantics (scroll actions) would otherwise
                    // absorb the title and the ✕ into one merged node.
                    excludeFromSemantics: true,
                    // A quick swipe down on the handle/header dismisses — the sheet's own gesture, when dismissal is allowed.
                    onVerticalDragEnd: isDismissible
                        ? (d) {
                            if ((d.primaryVelocity ?? 0) > 300) Navigator.of(context).pop();
                          }
                        : null,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Decoration: excluded so nothing unnamed is announced.
                        ExcludeSemantics(
                          child: Center(
                            child: Container(
                              margin: const EdgeInsets.only(top: 8),
                              width: 32,
                              height: 4,
                              decoration: BoxDecoration(color: c.borderStrong, borderRadius: BorderRadius.circular(LumoRadius.full)),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsetsDirectional.only(start: 20, end: 12, top: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // One node names the route AND is the header — the label exists once in the tree.
                              Expanded(
                                child: Semantics(
                                  namesRoute: true,
                                  header: true,
                                  child: Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Text(
                                      label,
                                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.4, color: c.fg),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              LumoIconButton(
                                label: closeLabel,
                                size: LumoButtonSize.sm,
                                onPressed: () => Navigator.of(context).pop(),
                                child: Icon(Icons.close, size: 16, color: c.fgMuted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (description != null)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(start: 20, end: 20, top: 4),
                      child: Text(description!, style: TextStyle(fontSize: 14, color: c.fgMuted)),
                    ),
                  Flexible(
                    child: SingleChildScrollView(padding: const EdgeInsetsDirectional.only(start: 20, end: 20, top: 12, bottom: 12), child: body(context)),
                  ),
                  if (actions != null)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(start: 20, end: 20, top: 4, bottom: 16),
                      // An `OverflowBar`, not a `Row`: two real Persian verbs
                      // overflow a 320dp screen by 184px (measured). Flutter's
                      // own `AlertDialog` uses the same widget, and it says what
                      // the web footer says — a row while the verbs fit, a
                      // column when they do not.
                      child: OverflowBar(alignment: MainAxisAlignment.end, overflowAlignment: OverflowBarAlignment.end, spacing: 8, overflowSpacing: 8, children: actions!(context)),
                    )
                  else
                    const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The declarative shape: a trigger whose press opens the sheet. `onOpenChange`
/// fires true on open and false when it closes (any way).
class LumoSheetTrigger extends StatelessWidget {
  const LumoSheetTrigger({
    super.key,
    required this.label,
    required this.closeLabel,
    required this.trigger,
    required this.body,
    this.description,
    this.actions,
    this.onOpenChange,
    this.isDismissible = true,
    this.isDisabled = false,
  });
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// Announced name of the close affordance. An icon is not a name.
  final String closeLabel;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// Builds the sheet's content.
  final WidgetBuilder body;
  /// The actions, in reading order.
  final List<Widget> Function(BuildContext)? actions;
  /// Called when the surface opens or closes, with the new state.
  final ValueChanged<bool>? onOpenChange;
  /// Whether the sheet can be dismissed by the scrim or a drag.
  final bool isDismissible;
  /// Whether the control is disabled.
  final bool isDisabled;

  /// Built with the press that opens the sheet.
  final Widget Function(VoidCallback? open) trigger;

  @override
  Widget build(BuildContext context) {
    return trigger(
      isDisabled
          ? null
          : () async {
              onOpenChange?.call(true);
              await showLumoSheet<void>(context, label: label, closeLabel: closeLabel, description: description, body: body, actions: actions, isDismissible: isDismissible);
              onOpenChange?.call(false);
            },
    );
  }
}
