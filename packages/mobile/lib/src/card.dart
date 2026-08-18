import 'package:flutter/material.dart';
import 'scope.dart';
import 'styles.dart';
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
  const LumoCard({super.key, required this.child, this.variant = LumoCardVariant.outline, this.padding, this.onTap, this.label, this.isDisabled = false, this.style})
    : assert(onTap == null || label != null, 'A tappable card needs a `label` — its announced name.');
  /// The widget this one wraps.
  final Widget child;
  /// The visual variant.
  final LumoCardVariant variant;
  /// Padding inside the surface. Directional: start and end, never left and
  /// right. Null falls to `LumoStyles.card.padding`, and with neither, to 16 on
  /// all sides — the value this parameter used to default to. It became nullable
  /// so that a theme can move card padding at all: a parameter with a non-null
  /// default cannot tell "the caller wanted 16" from "the caller said nothing".
  final EdgeInsetsGeometry? padding;

  /// Makes the whole card a button.
  final VoidCallback? onTap;

  /// Announced name of the card when it is a button. Required with `onTap`.
  final String? label;
  /// Whether the control is disabled.
  final bool isDisabled;

  /// Appearance overrides for THIS card, merged over `LumoStyles.card`.
  /// APPEARANCE ONLY — no field of a style object can reach the announced
  /// `label`, the button role, or the direction.
  final LumoCardStyle? style;

  @override
  State<LumoCard> createState() => _LumoCardState();
}

class _LumoCardState extends State<LumoCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final s = LumoStyles.of(context).card.merge(widget.style);
    final radius = s.borderRadius ?? BorderRadius.circular(LumoRadius.lg);
    final sunken = widget.variant == LumoCardVariant.sunken;
    final decoration = BoxDecoration(
      // Pressed takes the "hover" fill, as the button does.
      color: _pressed ? (s.pressedBackground ?? c.surfaceHover) : (s.background?[widget.variant] ?? (sunken ? c.surfaceSunken : c.surface)),
      borderRadius: radius,
      border: sunken ? null : Border.all(color: s.borderColour ?? c.border, width: s.borderWidth ?? 1),
      // `shadow-raised` from the token, not a hand-picked alpha over `c.scrim`.
      // `scrim` is the MODAL BACKDROP's role, and one alpha spelled once was the
      // same in both schemes — on a dark page a black shadow at the light
      // scheme's alpha is arithmetically close to painting nothing, so an
      // elevated card was invisible exactly where elevation is the only thing
      // separating it from the ground. The token carries a separate dark ramp.
      boxShadow: widget.variant == LumoCardVariant.elevated ? (s.shadow ?? LumoShadow.raised(scope.brightness)) : null,
    );
    final body = Padding(
      padding: widget.padding ?? s.padding ?? const EdgeInsets.all(16),
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
        opacity: enabled ? 1 : (s.disabledOpacity ?? 0.5),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          // The tap is on the card's node above; the detector's own would form a second, nameless one.
          excludeFromSemantics: true,
          onTap: enabled ? widget.onTap : null,
          onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
          onTapUp: (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          child: AnimatedContainer(duration: motion ? (s.pressDuration ?? const Duration(milliseconds: 80)) : Duration.zero, decoration: decoration, child: body),
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
  const LumoCardHeader({super.key, required this.title, this.description, this.action, this.style});
  /// The visible title.
  final String title;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;

  /// The control that acts on the whole card, level with the title.
  final Widget? action;

  /// Appearance overrides for this header, merged over `LumoStyles.card`.
  final LumoCardStyle? style;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final s = LumoStyles.of(context).card.merge(style);
    return Padding(
      padding: EdgeInsets.only(bottom: s.headerGap ?? 12),
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
                    // MERGED, never replaced: a `TextStyle` that leaves
                    // `fontFamily` null must keep the app's face. Replacing is
                    // exactly the defect button.dart documents at length — 26
                    // strings across 11 slugs fell back to the platform face —
                    // and a style object is a new way to reintroduce it, so
                    // every text override in this library merges.
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4, color: c.fg).merge(s.titleTextStyle),
                  ),
                ),
                if (description != null)
                  Padding(
                    padding: EdgeInsets.only(top: s.headerDescriptionGap ?? 4),
                    child: Text(description!, style: TextStyle(fontSize: 14, color: c.fgMuted).merge(s.descriptionTextStyle)),
                  ),
              ],
            ),
          ),
          if (action != null) SizedBox(width: s.headerActionGap ?? 16),
          if (action != null) action!,
        ],
      ),
    );
  }
}

/// Actions, usually buttons, at the inline END (`MainAxisAlignment.end` resolves
/// against direction), above a hairline — `border-bs`, the block-start rule.
class LumoCardFooter extends StatelessWidget {
  const LumoCardFooter({super.key, required this.children, this.style});
  /// The children, in reading order.
  final List<Widget> children;

  /// Appearance overrides for this footer, merged over `LumoStyles.card`.
  final LumoCardStyle? style;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final s = LumoStyles.of(context).card.merge(style);
    final gap = s.footerGap ?? 12;
    final actionGap = s.footerActionGap ?? 8;
    return Container(
      margin: EdgeInsets.only(top: gap),
      padding: EdgeInsets.only(top: gap),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: s.footerRuleColour ?? c.border, width: s.borderWidth ?? 1)),
      ),
      child: Wrap(alignment: WrapAlignment.end, crossAxisAlignment: WrapCrossAlignment.center, spacing: actionGap, runSpacing: actionGap, children: children),
    );
  }
}
