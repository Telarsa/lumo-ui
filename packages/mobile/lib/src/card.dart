import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The frame treatment. `sunken` (a filled card on `surfaceSunken`) stands where
/// the web has `plain`: on mobile a bare card inside a bordered container reads
/// as no card at all, and a sunken fill is the mobile idiom for that slot.
/// `outline` is the web's `outlined`, spelled the way every other mobile
/// variant enum in this package spells it (`LumoBadgeVariant.outline`,
/// `LumoButtonVariant.outline`, `LumoAlertVariant.outline`) — same treatment,
/// one letter, and consistency inside the package wins over the web's spelling.
enum LumoCardVariant { outline, elevated, sunken }

/// A surface with a header, a body and a footer — the web `Card` with its
/// parts. Static unless `onTap` is given; then the whole card is ONE button
/// named by `label` (REQUIRED with `onTap` — the constructor asserts it: a
/// tappable surface with no name announces as "button" and nothing else). The
/// content stays reachable as child nodes under that name, so the reader hears
/// the name once, "button", then the content. `padding` defaults to 16 all round;
/// `LumoCardHeader`/`LumoCardFooter` only add block-axis rhythm inside it.
/// Elevation is a shadow cast straight down (block axis) — nothing to mirror.
///
/// The press fill cross-fades over 80ms — a mobile addition (the web `Card` is
/// not pressable and has no transition), so it obeys the platform's «reduce
/// motion» the way the rest of the library does: the duration collapses to
/// `Duration.zero` under `MediaQuery.disableAnimationsOf`, the spelling
/// `disclosure.dart` uses.
class LumoCard extends StatefulWidget {
  const LumoCard({super.key, required this.child, this.variant = LumoCardVariant.outline, this.padding = const EdgeInsets.all(16), this.onTap, this.label, this.isDisabled = false})
    : assert(onTap == null || label != null, 'A tappable card needs a `label` — its announced name.');
  final Widget child;
  final LumoCardVariant variant;
  final EdgeInsetsGeometry padding;

  /// Makes the whole card a button.
  final VoidCallback? onTap;

  /// Announced name of the card when it is a button. Required with `onTap`.
  final String? label;
  final bool isDisabled;

  @override
  State<LumoCard> createState() => _LumoCardState();
}

class _LumoCardState extends State<LumoCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final radius = BorderRadius.circular(LumoRadius.lg);
    final sunken = widget.variant == LumoCardVariant.sunken;
    final decoration = BoxDecoration(
      // Pressed takes the "hover" fill, as the button does.
      color: _pressed ? c.surfaceHover : (sunken ? c.surfaceSunken : c.surface),
      borderRadius: radius,
      border: sunken ? null : Border.all(color: c.border),
      // `shadow-raised` from the token, not a hand-picked alpha over `c.scrim`.
      // `scrim` is the MODAL BACKDROP's role, and one alpha spelled once was the
      // same in both schemes — on a dark page a black shadow at the light
      // scheme's alpha is arithmetically close to painting nothing, so an
      // elevated card was invisible exactly where elevation is the only thing
      // separating it from the ground. The token carries a separate dark ramp.
      boxShadow: widget.variant == LumoCardVariant.elevated ? LumoShadow.raised(scope.brightness) : null,
    );
    final body = Padding(
      padding: widget.padding,
      child: DefaultTextStyle.merge(
        style: TextStyle(color: c.fg),
        child: widget.child,
      ),
    );
    if (widget.onTap == null) {
      return DecoratedBox(decoration: decoration, child: body);
    }
    final enabled = !widget.isDisabled;
    // «Reduce motion» is the platform's answer, not a parameter of ours.
    final motion = !MediaQuery.disableAnimationsOf(context);
    // The card's node carries the name and the tap itself; a GestureDetector, not
    // an InkWell — an InkWell's focus node forms one child node that swallows
    // the whole content, including a nested button's name. With
    // `explicitChildNodes` the content (a header, a nested icon button) stays
    // reachable as its own nodes UNDER the card: the reader hears the name,
    // "button", then the content.
    return Semantics(
      container: true,
      explicitChildNodes: true,
      button: true,
      enabled: enabled,
      label: widget.label,
      onTap: enabled ? widget.onTap : null,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          // The tap is on the card's node above; the detector's own would form a second, nameless one.
          excludeFromSemantics: true,
          onTap: enabled ? widget.onTap : null,
          onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
          onTapUp: (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          child: AnimatedContainer(duration: motion ? const Duration(milliseconds: 80) : Duration.zero, decoration: decoration, child: body),
        ),
      ),
    );
  }
}

/// Title (REQUIRED, a header for the reader), description, and an `action`
/// opposite the title at the inline END — a `Row`, so it lands on the left in
/// Persian with no positional value. `pbe-0` on the web: the header adds only
/// bottom rhythm inside the card's own padding.
class LumoCardHeader extends StatelessWidget {
  const LumoCardHeader({super.key, required this.title, this.description, this.action});
  final String title;
  final String? description;

  /// The control that acts on the whole card, level with the title.
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Semantics(
                  header: true,
                  child: Text(
                    title,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4, color: c.fg),
                  ),
                ),
                if (description != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(description!, style: TextStyle(fontSize: 14, color: c.fgMuted)),
                  ),
              ],
            ),
          ),
          if (action != null) const SizedBox(width: 16),
          if (action != null) action!,
        ],
      ),
    );
  }
}

/// Actions, usually buttons, at the inline END (`MainAxisAlignment.end` resolves
/// against direction), above a hairline — `border-bs`, the block-start rule.
class LumoCardFooter extends StatelessWidget {
  const LumoCardFooter({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.only(top: 12),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: c.border)),
      ),
      child: Wrap(alignment: WrapAlignment.end, crossAxisAlignment: WrapCrossAlignment.center, spacing: 8, runSpacing: 8, children: children),
    );
  }
}
